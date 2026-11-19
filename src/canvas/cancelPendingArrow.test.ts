import { describe, expect, it, vi } from 'vitest';
import type { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { cancelPendingArrow } from './cancelPendingArrow';

// Keep the unit test independent of the browser renderer. Element mutation is
// the SDK's responsibility; these tests cover cancellation and binding cleanup.
vi.mock('@excalidraw/excalidraw', () => ({
  CaptureUpdateAction: { IMMEDIATELY: 'IMMEDIATELY' },
  newElementWith: (element: object, updates: object) => ({ ...element, ...updates }),
}));

function element<T extends OrderedExcalidrawElement['type'] = 'arrow'>(id: string, type: T = 'arrow' as T, properties: object = {}): Extract<OrderedExcalidrawElement, { type: T }> {
  return { id, type, isDeleted: false, boundElements: null, ...properties } as Extract<OrderedExcalidrawElement, { type: T }>;
}
function editor(elements: OrderedExcalidrawElement[], state: Partial<AppState> = {}) {
  const unsubscribe = vi.fn();
  return {
    getAppState: () => ({ newElement: null, multiElement: null, editingTextElement: null, openDialog: null, ...state } as AppState),
    getSceneElementsIncludingDeleted: () => elements,
    updateScene: vi.fn(), setActiveTool: vi.fn(), resetCursor: vi.fn(),
    onChange: vi.fn<ExcalidrawImperativeAPI['onChange']>().mockReturnValue(unsubscribe), unsubscribe,
  };
}

describe('unfinished arrow cancellation', () => {
  it('deletes a newly started arrow and clears every creation reference', () => {
    const pending = element('pending');
    const api = editor([pending], { newElement: pending });
    expect(cancelPendingArrow(api)).toBe(true);
    expect(api.updateScene).toHaveBeenCalledWith(expect.objectContaining({
      elements: [expect.objectContaining({ id: 'pending', isDeleted: true, startBinding: null, endBinding: null })],
      appState: expect.objectContaining({
        newElement: null, multiElement: null, editingLinearElement: null, selectedLinearElement: null,
        selectedElementIds: {}, selectedGroupIds: {}, startBoundElement: null, suggestedBindings: [], cursorButton: 'up',
      }),
      captureUpdate: 'IMMEDIATELY',
    }));
    // Changing tools before the reset commits makes Excalidraw rebind its old
    // multiElement. The callback must wait until both references are cleared.
    expect(api.setActiveTool).not.toHaveBeenCalled();
    const onChange = api.onChange.mock.calls[0][0];
    onChange([], api.getAppState(), {});
    expect(api.setActiveTool).not.toHaveBeenCalled();
    onChange([], { ...api.getAppState(), newElement: null, multiElement: null }, {});
    expect(api.unsubscribe).toHaveBeenCalledOnce();
    expect(api.setActiveTool).toHaveBeenCalledWith({ type: 'selection' });
    expect(api.resetCursor).toHaveBeenCalledOnce();
    expect(pending.isDeleted).toBe(false);
  });

  it('cancels a multi-point arrow while preserving other elements and bindings', () => {
    const pending = element('pending');
    const completed = element('completed');
    const source = element('source', 'rectangle', { boundElements: [
      { id: 'pending', type: 'arrow' }, { id: 'completed', type: 'arrow' }, { id: 'label', type: 'text' },
    ] });
    const api = editor([source, pending, completed], { multiElement: pending as AppState['multiElement'] });
    expect(cancelPendingArrow(api)).toBe(true);
    const next = api.updateScene.mock.calls[0][0].elements as OrderedExcalidrawElement[];
    expect(next[0].boundElements).toEqual([{ id: 'completed', type: 'arrow' }, { id: 'label', type: 'text' }]);
    expect(next[1].isDeleted).toBe(true);
    expect(next[2]).toBe(completed);
    expect(source.boundElements).toHaveLength(3);
  });

  it('cleans up a stale reference even if its arrow was already deleted', () => {
    const pending = element('pending', 'arrow', { isDeleted: true });
    const api = editor([pending], { newElement: pending });
    expect(cancelPendingArrow(api)).toBe(true);
    expect(api.updateScene.mock.calls[0][0].appState.newElement).toBeNull();
    expect(api.updateScene.mock.calls[0][0].elements[0].isDeleted).toBe(true);
  });

  it('leaves ordinary deletion and existing arrow point editing to the editor', () => {
    const completed = element('completed');
    for (const state of [{}, { editingLinearElement: { elementId: 'completed' } }]) {
      const api = editor([completed], state as Partial<AppState>);
      expect(cancelPendingArrow(api)).toBe(false);
      expect(api.updateScene).not.toHaveBeenCalled();
      expect(api.setActiveTool).not.toHaveBeenCalled();
    }
  });

  it('does not cancel other tools, text editing, or open dialogs', () => {
    const arrow = element('pending');
    for (const state of [
      { newElement: element('line', 'line') },
      { newElement: arrow, editingTextElement: element('text', 'text') },
      { newElement: arrow, openDialog: { name: 'imageExport' } },
    ]) {
      const api = editor([arrow], state as Partial<AppState>);
      expect(cancelPendingArrow(api)).toBe(false);
      expect(api.updateScene).not.toHaveBeenCalled();
    }
  });
});
