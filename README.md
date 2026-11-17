# Research Whiteboard

First local interaction spike for a collaborative research canvas. Built with React, TypeScript, Vite, and the open-source Excalidraw editor.

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

## Checks

```sh
npm test
npm run build
npm run preview
```

`npm test` checks the persistence round trip (IDs, bound text, image data, and research), invalid saved data, and storage failures. `npm run build` runs strict TypeScript checks and the production build. GitHub Actions runs the tests and build on pushes and pull requests. A manual browser check additionally covers editor embedding, card creation/editing, freehand drawing, saving, reopening, and restored research metadata.

## Structure and boundary

- `src/canvas/CanvasAdapter.tsx` owns Excalidraw rendering, API access, document serialization, selection translation, and shaped card insertion.
- `src/canvas/types.ts` defines the app-facing canvas handle, opaque document, and selected element identity. Other runtime modules do not import Excalidraw.
- `src/App.tsx` owns the board header, save status, and research side panel.
- `src/boards/storage.ts` owns a versioned board envelope and browser persistence. Research metadata is keyed by the original canvas element ID.

Excalidraw generates IDs once, and its serializer retains them. Restoring a board passes its original elements into `initialData`; it never regenerates their IDs. Only persistent document settings are saved; active selections, menus, remote collaborators, and text editing state are excluded. Each added text card is a bound rectangle/text pair; the panel attaches metadata to the rectangle.

The adapter is a replacement seam, not an editor-neutral document format: its opaque document still contains Excalidraw JSON. Replacing the editor will require a migration. Native text/shape manipulation and undo/redo stay with Excalidraw for this spike.

## Next small steps

1. Complete the single-user interaction spike: dedicated highlighter, tool polish, and broader interaction checks.
2. Add board creation/listing and a storage interface backed by the TypeScript API; then accounts, membership, PostgreSQL, and object storage.
3. Add an access-checked WebSocket room with typed element updates, acknowledgements, presence, and reconnect sync. Stable IDs are already retained, but editor versions are not yet authoritative server revisions. The proposed conflict rule is most recently server-accepted property edit wins. Remote updates must preserve local selection/text editing and stay out of local undo history; that behaviour needs a separate two-session spike.
4. Extend research relationships and activity history, then add containers, a demo account/board, and deployment instructions.

No server, database, WebSocket service, sharing flow, or deployment is included in this first step.

## References

- [Excalidraw SDK installation](https://plus.excalidraw.com/docs/sdk/excalidraw/installation)
- [Excalidraw imperative API](https://plus.excalidraw.com/docs/sdk/excalidraw/api/props/excalidraw-api)
- [Excalidraw serialization utilities](https://plus.excalidraw.com/docs/sdk/excalidraw/api/utils)
- [Excalidraw source and MIT license](https://github.com/excalidraw/excalidraw)

## Dependency notes

React 18.3.1 is used because Excalidraw 0.18.1 includes older Radix components whose peer ranges stop at React 18. Patch-compatible overrides update Nano ID 3 and Lodash ES. The final install still reports five transitive advisories (one high, two moderate, two low) in Excalidraw's Mermaid/Nano ID/KaTeX dependency chain. Review upstream releases before deployment; `npm audit fix --force` proposes changing the editor version and is not applied automatically. The build also reports large editor chunks; bundle optimisation is deferred until after the interaction spike.
