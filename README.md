# Research board

A collaborative research canvas. Built with React, TypeScript, and the open-source Excalidraw editor.

## Run locally

Use Node.js 24 (see `.nvmrc`) and npm:

```sh
npm ci
npm run dev
```

Open the Local URL Vite prints, normally http://127.0.0.1:5173. Dependencies are already installed in the initial checkout. `npm ci` also copies Excalidraw's fonts into the ignored `public/excalidraw/` directory, so fonts load locally.

## Try it out

1. Give the board a title in the header.
2. Draw using the left tool rail. Use Space + drag to pan.
3. Click **Note**, then double-click its text to edit (or select the card and press Enter). Press Escape to finish.
4. Select the card's shape. In **Research**, choose a type and add a source and notes.
5. Click **Save board** (or Cmd/Ctrl+S). Reload the page and select the same shape: its research context returns. Expand **Element details** to inspect the stable ID.

Saving is explicit. The header shows unsaved changes and storage failures, and the browser warns before leaving with unsaved work. A single board is kept per browser origin; switching browser, hostname, or port uses different storage. This is a local prototype with no accounts or shared access. Images are stored as part of the local document and can exhaust browser storage. Multiple tabs do not synchronise and the last successful save wins. Clearing browser data removes the board.

**Canvas settings** includes search, image exports, drawing downloads, paper colours, grid, and object snapping. Research metadata is app-owned and is **not** included in drawing/image exports. The Clear canvas action asks for confirmation and can be undone within the current session; research entries are retained for undo. Undo history itself is not restored after reload.

## Drawing workspace

The canvas has a tool rail, shape picker, Style panel, settings panel, zoom controls, and empty state. **Style** changes selected elements, or the defaults for your next mark. A card's bound label follows its ink and opacity. Choose Clean, Sketch, or Loose for the drawing feel.

The highlighter uses a broad translucent freehand stroke with its own defaults; switching back to the pen restores the pen's settings. It adds visual emphasis and does not change research metadata. 

Shortcuts: 
* V select, 
* H pan, 
* P pen, 
* J highlight, 
* E erase, 
* R rectangle, 
* O ellipse, 
* D diamond, 
* L line, 
* A connector, 
* T text.

 Arrow keys move focus along the tool rail. Standard copy/paste, grouping, delete, text editing, and undo/redo stay with the engine.

#

`src/canvas/CanvasStudio.tsx` owns the controls and depends only on app-facing types in `types.ts`. `CanvasAdapter.tsx` translates those actions into Excalidraw's public API, reports view/selection state, and serializes documents without regenerating element IDs. Paper, grid, and snapping survive save/reload; transient UI state is excluded. Older saved boards remain supported.

`editor-chrome.css` contains the scoped integration selectors for the pinned Excalidraw 0.18.1 package. It hides the stock desktop/mobile toolbars while preserving text editing, context menus, search, and export dialogs. Native undo/redo controls are retained and restyled because the public imperative API exposes history clearing, but no methods to execute undo/redo. Check these selectors and both desktop/mobile layouts when upgrading Excalidraw.

## Verification

`npm test` runs persistence tests. `npm run build` runs TypeScript checks and creates the production bundle. The workspace redesign was also checked in the browser for card text editing, shape creation, connectors, selection styling and undo/redo, highlighter/pen defaults, save/reload, saved grid/snapping preferences, search, export dialog access, and mobile controls.


---

- [Excalidraw SDK installation](https://plus.excalidraw.com/docs/sdk/excalidraw/installation)
- [Excalidraw imperative API](https://plus.excalidraw.com/docs/sdk/excalidraw/api/props/excalidraw-api)
- [Excalidraw serialization utilities](https://plus.excalidraw.com/docs/sdk/excalidraw/api/utils)
- [Excalidraw source and MIT license](https://github.com/excalidraw/excalidraw)

