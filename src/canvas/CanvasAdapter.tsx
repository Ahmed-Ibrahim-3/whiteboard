import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import {
  CaptureUpdateAction,
  convertToExcalidrawElements,
  Excalidraw,
  MainMenu,
  serializeAsJSON,
  WelcomeScreen,
} from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import type { CanvasDocument, CanvasHandle, CanvasSelection } from './types';
import '@excalidraw/excalidraw/index.css';

interface Props {
  initialDocument: CanvasDocument | null;
  onChange(document: CanvasDocument): void;
  onSelectionChange(selection: CanvasSelection | null): void;
  onReady(): void;
}

/** The only runtime module that knows about Excalidraw. Remount to load another board. */
export const CanvasAdapter = forwardRef<CanvasHandle, Props>(function CanvasAdapter(
  { initialDocument, onChange, onSelectionChange, onReady }, ref,
) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const initialData = useMemo<ExcalidrawInitialDataState>(() => initialDocument
    ? JSON.parse(initialDocument)
    : { elements: [], appState: { viewBackgroundColor: '#fafbf9' } }, [initialDocument]);

  useImperativeHandle(ref, () => ({
    addTextCard() {
      if (!api) return;
      const state = api.getAppState();
      const x = state.width / 2 / state.zoom.value - state.scrollX - 130;
      const y = state.height / 2 / state.zoom.value - state.scrollY - 70;
      const card = convertToExcalidrawElements([{
        type: 'rectangle', x, y, width: 260, height: 140,
        backgroundColor: '#fff3bf', fillStyle: 'solid', strokeColor: '#786534',
        strokeWidth: 1, roughness: 0,
        label: { text: 'A research idea', fontSize: 20, fontFamily: 2 },
      }]);
      api.updateScene({
        elements: [...api.getSceneElementsIncludingDeleted(), ...card],
        appState: { selectedElementIds: { [card[0].id]: true } },
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      api.setActiveTool({ type: 'selection' });
    },
    fitToContent() { api?.scrollToContent(undefined, { fitToContent: true }); },
  }), [api]);

  return <Excalidraw
    initialData={initialData}
    excalidrawAPI={(editor) => { setApi(editor); onReady(); }}
    theme="light"
    onChange={(elements, appState, files) => {
      // Persist document properties, not selection, open menus, or active text editing.
      onChange(serializeAsJSON(elements, {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
        gridStep: appState.gridStep,
        gridModeEnabled: appState.gridModeEnabled,
      }, files, 'local'));
      const selected = elements.filter(element => !element.isDeleted && appState.selectedElementIds[element.id]);
      // Bound text belongs to its shape when inspecting research metadata.
      const targets = selected.filter(element => element.type !== 'text' || !element.containerId);
      onSelectionChange(targets.length === 1 ? { id: targets[0].id, type: targets[0].type } : null);
    }}
    UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, toggleTheme: false } }}
  >
    <MainMenu>
      <MainMenu.DefaultItems.Export />
      <MainMenu.DefaultItems.SaveAsImage />
      <MainMenu.DefaultItems.SearchMenu />
      <MainMenu.DefaultItems.Help />
      <MainMenu.DefaultItems.ClearCanvas />
    </MainMenu>
    <WelcomeScreen>
      <WelcomeScreen.Center>
        <WelcomeScreen.Center.Heading>Give your ideas some room.</WelcomeScreen.Center.Heading>
        <WelcomeScreen.Center.Menu>
          <p className="canvas-welcome">Draw a connection, sketch a thought, or add your first text card.</p>
        </WelcomeScreen.Center.Menu>
      </WelcomeScreen.Center>
      <WelcomeScreen.Hints.ToolbarHint />
    </WelcomeScreen>
  </Excalidraw>;
});
