import { CaptureUpdateAction, newElementWith } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

type CancellationAPI = Pick<ExcalidrawImperativeAPI,
  'getAppState' | 'getSceneElementsIncludingDeleted' | 'updateScene' | 'setActiveTool' | 'resetCursor' | 'onChange'>;

/** Cancel creation, without changing deletion of completed elements or text. */
export function cancelPendingArrow(api: CancellationAPI): boolean {
  const state = api.getAppState();
  if (state.editingTextElement || state.openDialog) return false;
  const pendingIds = new Set([state.newElement, state.multiElement]
    .filter(element => element?.type === 'arrow')
    .map(element => element!.id));
  if (!pendingIds.size) return false;

  const elements = api.getSceneElementsIncludingDeleted().map(element => {
    if (pendingIds.has(element.id) && element.type === 'arrow') {
      return newElementWith(element, { isDeleted: true, startBinding: null, endBinding: null });
    }
    const boundElements = element.boundElements?.filter(bound => !pendingIds.has(bound.id));
    if (boundElements && boundElements.length !== element.boundElements?.length) {
      return newElementWith(element, { boundElements: boundElements.length ? boundElements : null });
    }
    return element;
  });

  // The SDK binds the PREVIOUS multiElement on tool changes. Switch tools only
  // after creation state has committed, or it can reattach the deleted arrow.
  const unsubscribe = api.onChange((_elements, nextState) => {
    if (nextState.newElement || nextState.multiElement) return;
    unsubscribe();
    api.setActiveTool({ type: 'selection' });
    api.resetCursor();
  });

  // Native deletion clears multiElement but can leave newElement active. Both
  // references and binding previews must be cleared before another pointer event.
  api.updateScene({ elements, appState: {
    newElement: null, multiElement: null, selectionElement: null,
    editingLinearElement: null, selectedLinearElement: null,
    selectedElementIds: {}, selectedGroupIds: {},
    startBoundElement: null, suggestedBindings: [],
    snapLines: [], originSnapOffset: null, cursorButton: 'up',
  }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
  return true;
}
