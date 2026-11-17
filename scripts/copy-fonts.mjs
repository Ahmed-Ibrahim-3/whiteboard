import { cp, mkdir } from 'node:fs/promises';

// Serve Excalidraw's fonts locally rather than relying on its runtime CDN.
await mkdir('public/excalidraw', { recursive: true });
await cp('node_modules/@excalidraw/excalidraw/dist/prod/fonts', 'public/excalidraw/fonts', { recursive: true });
