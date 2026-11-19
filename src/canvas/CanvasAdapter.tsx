import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  CaptureUpdateAction, convertToExcalidrawElements, Excalidraw, MainMenu,
  newElementWith, serializeAsJSON, WelcomeScreen,
} from '@excalidraw/excalidraw';
import type { AppState, ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import { defaultCanvasView } from './types';
import { cancelPendingArrow } from './cancelPendingArrow';
import type { CanvasDocument, CanvasHandle, CanvasSelection, CanvasStyle, CanvasTool, CanvasView } from './types';
import '@excalidraw/excalidraw/index.css';
import './editor-chrome.css';

interface Props {
  initialDocument: CanvasDocument | null;
  onChange(document: CanvasDocument): void;
  onSelectionChange(selection: CanvasSelection | null): void;
  onViewChange(view: CanvasView): void;
  onReady(): void;
}

function editorStyle(style: CanvasStyle) {
  return { currentItemStrokeColor: style.strokeColor, currentItemBackgroundColor: style.backgroundColor,
    currentItemStrokeWidth: style.strokeWidth, currentItemOpacity: style.opacity, currentItemRoughness: style.roughness };
}

const keyboardTools: Record<string, CanvasTool> = {
  v: 'selection', h: 'hand', p: 'pen', j: 'highlighter', e: 'eraser',
  r: 'rectangle', o: 'ellipse', d: 'diamond', l: 'line', a: 'arrow', t: 'text',
};

/** Excalidraw is the engine; the surrounding controls belong to the app. */
export const CanvasAdapter = forwardRef<CanvasHandle, Props>(function CanvasAdapter(
  { initialDocument, onChange, onSelectionChange, onViewChange, onReady }, ref,
) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const markerMode = useRef(false);
  const changingTool = useRef(false);
  const regularStyle = useRef({ ...defaultCanvasView.style });
  const markerStyle = useRef({ ...defaultCanvasView.style, strokeColor: '#e0b64d', strokeWidth: 16, opacity: 30 });
  const initialData = useMemo<ExcalidrawInitialDataState>(() => {
    const saved: ExcalidrawInitialDataState = initialDocument ? JSON.parse(initialDocument) : {};
    return { ...saved, appState: {
      ...editorStyle(defaultCanvasView.style), currentItemFontFamily: 2, currentItemFillStyle: 'solid',
      viewBackgroundColor: defaultCanvasView.background, ...saved.appState,
    } };
  }, [initialDocument]);

  const setTool = useCallback((tool: CanvasTool) => {
    if (!api) return;
    changingTool.current = true;
    markerMode.current = tool === 'highlighter';
    api.updateScene({ appState: {
      ...editorStyle(markerMode.current ? markerStyle.current : regularStyle.current),
      selectedElementIds: {},
    }, captureUpdate: CaptureUpdateAction.NEVER });
    api.setActiveTool({ type: tool === 'pen' || tool === 'highlighter' ? 'freedraw' : tool });
    changingTool.current = false;
  }, [api]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!api || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.repeat ||
        api.getAppState().editingTextElement || api.getAppState().openDialog ||
        (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]'))) return;
      if (event.key === 'Backspace' || event.key === 'Delete') {
        if (cancelPendingArrow(api)) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      const tool = keyboardTools[event.key.toLowerCase()];
      if (!tool) return;
      event.preventDefault();
      event.stopPropagation();
      setTool(tool);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [api, setTool]);

  useImperativeHandle(ref, () => ({
    setTool,
    addTextCard() {
      if (!api) return;
      setTool('selection');
      const state = api.getAppState();
      const x = state.width / 2 / state.zoom.value - state.scrollX - 130;
      const y = state.height / 2 / state.zoom.value - state.scrollY - 70;
      const card = convertToExcalidrawElements([{
        type: 'rectangle', x, y, width: 260, height: 140,
        backgroundColor: '#f5e5a7', fillStyle: 'solid', strokeColor: '#9a854f',
        strokeWidth: 1, roughness: 0, roundness: { type: 3 },
        label: { text: 'Start typing here...', fontSize: 20, fontFamily: 2 },
      }]);
      api.updateScene({
        elements: [...api.getSceneElementsIncludingDeleted(), ...card],
        appState: { selectedElementIds: { [card[0].id]: true } },
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
    },
    fitToContent() { api?.scrollToContent(undefined, { fitToContent: true, maxZoom: 1 }); },
    setStyle(patch) {
      if (!api) return;
      const state = api.getAppState();
      const style = markerMode.current ? markerStyle : regularStyle;
      style.current = { ...style.current, ...patch };
      const selected = new Set(Object.keys(state.selectedElementIds).filter(id => state.selectedElementIds[id]));
      const hasSelected = api.getSceneElements().some(element => selected.has(element.id) && !element.locked);
      api.updateScene({
        appState: editorStyle(style.current),
        ...(hasSelected ? { elements: api.getSceneElementsIncludingDeleted().map(element => {
          if (element.isDeleted || element.locked) return element;
          // A card's label follows its container's ink/opacity without inheriting
          // the container's fill or stroke weight.
          if (element.type === 'text' && element.containerId && selected.has(element.containerId) && !selected.has(element.id)) {
            const labelPatch = {
              ...(patch.strokeColor === undefined ? {} : { strokeColor: patch.strokeColor }),
              ...(patch.opacity === undefined ? {} : { opacity: patch.opacity }),
            };
            return Object.keys(labelPatch).length ? newElementWith(element, labelPatch) : element;
          }
          if (!selected.has(element.id)) return element;
          return newElementWith(element, patch);
        }) } : {}),
        captureUpdate: hasSelected ? CaptureUpdateAction.IMMEDIATELY : CaptureUpdateAction.NEVER,
      });
    },
    setZoom(value) {
      if (!api) return;
      const state = api.getAppState();
      const next = Math.min(3, Math.max(0.1, value)) as AppState['zoom']['value'];
      // Keep the centre of the viewport stationary while changing scale.
      api.updateScene({ appState: {
        zoom: { value: next },
        scrollX: state.scrollX + state.width / (2 * next) - state.width / (2 * state.zoom.value),
        scrollY: state.scrollY + state.height / (2 * next) - state.height / (2 * state.zoom.value),
      }, captureUpdate: CaptureUpdateAction.NEVER });
    },
    setCanvasOptions(options) {
      if (!api) return;
      const state = api.getAppState();
      api.updateScene({ appState: {
        gridModeEnabled: options.grid ?? state.gridModeEnabled,
        objectsSnapModeEnabled: options.snap ?? state.objectsSnapModeEnabled,
        viewBackgroundColor: options.background ?? state.viewBackgroundColor,
      }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
    },
    exportImage() { api?.updateScene({ appState: { openDialog: { name: 'imageExport' } } }); },
    downloadDrawing() {
      if (!api) return;
      const blob = new Blob([serializeAsJSON(api.getSceneElements(), api.getAppState(), api.getFiles(), 'local')], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'research-drawing.excalidraw';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    search() { api?.toggleSidebar({ name: 'default', tab: 'search', force: true }); },
    clear() {
      if (!api) return;
      api.updateScene({ elements: api.getSceneElementsIncludingDeleted().map(element => element.isDeleted ? element : newElementWith(element, { isDeleted: true })),
        appState: { selectedElementIds: {} }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
    },
  }), [api, setTool]);

  return <div className="research-engine"><Excalidraw
    initialData={initialData}
    excalidrawAPI={(editor) => { setApi(editor); onReady(); }}
    theme="light"
    onChange={(elements, appState, files) => {
      if (markerMode.current && !changingTool.current && appState.activeTool.type !== 'freedraw') {
        markerMode.current = false;
        api?.updateScene({ appState: editorStyle(regularStyle.current), captureUpdate: CaptureUpdateAction.NEVER });
      }
      const document = JSON.parse(serializeAsJSON(elements, {
        viewBackgroundColor: appState.viewBackgroundColor, gridSize: appState.gridSize,
        gridStep: appState.gridStep, gridModeEnabled: appState.gridModeEnabled,
      }, files, 'local'));
      // Excalidraw's export serializer omits this browser preference, even in
      // local mode. Our board document explicitly owns its persistence.
      document.appState.objectsSnapModeEnabled = appState.objectsSnapModeEnabled;
      onChange(JSON.stringify(document));
      const selected = elements.filter(element => !element.isDeleted && appState.selectedElementIds[element.id]);
      const targets = selected.filter(element => element.type !== 'text' || !element.containerId);
      onSelectionChange(targets.length === 1 ? { id: targets[0].id, type: targets[0].type } : null);
      const first = selected.find(element => !element.locked);
      const nativeTool = appState.activeTool.type;
      const tool: CanvasTool = nativeTool === 'freedraw' ? (markerMode.current ? 'highlighter' : 'pen')
        : ['selection', 'hand', 'eraser', 'rectangle', 'ellipse', 'diamond', 'line', 'arrow', 'text', 'image'].includes(nativeTool)
          ? nativeTool as CanvasTool : 'selection';
      onViewChange({
        tool, zoom: appState.zoom.value, selectedCount: targets.length,
        hasElements: elements.some(element => !element.isDeleted),
        grid: appState.gridModeEnabled, snap: appState.objectsSnapModeEnabled, background: appState.viewBackgroundColor,
        style: first ? { strokeColor: first.strokeColor, backgroundColor: first.backgroundColor,
          strokeWidth: first.strokeWidth, opacity: first.opacity, roughness: first.roughness }
          : { strokeColor: appState.currentItemStrokeColor, backgroundColor: appState.currentItemBackgroundColor,
            strokeWidth: appState.currentItemStrokeWidth, opacity: appState.currentItemOpacity, roughness: appState.currentItemRoughness },
      });
    }}
    UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, toggleTheme: false } }}
  >
    <MainMenu />
    <WelcomeScreen><></></WelcomeScreen>
  </Excalidraw></div>;
});
