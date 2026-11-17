# Research board

A collaborative research canvas. Built with React, TypeScript, and the open-source Excalidraw editor.

## Run locally

Use Node.js 24 (see `.nvmrc`) and npm:

```sh
npm ci
npm run dev
```

Open the Local URL Vite prints, normally http://127.0.0.1:5173. Dependencies are already installed in the initial checkout. `npm ci` also copies Excalidraw's fonts into the ignored `public/excalidraw/` directory, so fonts load locally.

## Try the first workflow

1. Give the board a title in the header.
2. Draw using the Excalidraw toolbar. Use Space + drag to pan.
3. Click **Text card**, then double-click its text to edit. Press Escape to finish.
4. Select the card's shape. In **Research**, choose a type and add a source and notes.
5. Click **Save board** (or Cmd/Ctrl+S). Reload the page and select the same shape: its research context returns. Expand **Element details** to inspect the stable ID.

Saving is explicit. The header shows unsaved changes and storage failures, and the browser warns before leaving with unsaved work. A single board is kept per browser origin; switching browser, hostname, or port uses different storage. This is a local prototype with no accounts or shared access. Images are stored as part of the local document and can exhaust browser storage. Multiple tabs do not synchronise and the last successful save wins. Clearing browser data removes the board.

The editor's menu includes scene/image exports. Research metadata is app-owned and is **not** included in Excalidraw's exports. The editor's Clear canvas action can be undone within the current session; research entries are retained for undo. Undo history itself is not restored after reload.


---

- [Excalidraw SDK installation](https://plus.excalidraw.com/docs/sdk/excalidraw/installation)
- [Excalidraw imperative API](https://plus.excalidraw.com/docs/sdk/excalidraw/api/props/excalidraw-api)
- [Excalidraw serialization utilities](https://plus.excalidraw.com/docs/sdk/excalidraw/api/utils)
- [Excalidraw source and MIT license](https://github.com/excalidraw/excalidraw)

