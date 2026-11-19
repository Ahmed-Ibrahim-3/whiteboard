import type { ReactNode } from 'react';

export type IconName = 'selection' | 'hand' | 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'ellipse' |
  'diamond' | 'line' | 'arrow' | 'text' | 'image' | 'note' | 'style' | 'settings' | 'fit' | 'search' | 'download' | 'close';

const paths: Record<IconName, ReactNode> = {
  selection: <path d="m5 3 14 9-7 1-3 7-4-17Z" />,
  hand: <><path d="M8 12V5a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v6c0 5-3 8-7 8-3 0-4-2-6-5l-3-4a1.5 1.5 0 0 1 2-2l2 1Z" /></>,
  pen: <><path d="m4 16-1 5 5-1L20 8l-4-4L4 16Z M13 7l4 4 M4 16l4 4" /><path d="m16 4 1-1a2 2 0 0 1 3 3l-1 1" /></>,
  highlighter: <><path d="m9 13 7-10 5 4-8 9-4-3Z M9 13l-3 3 5 3 2-3 M5 17l-2 4h6l2-2 M15 5l4 4" /><path d="M13 21h8" /></>,
  eraser: <><path d="m3 13 9-10a2 2 0 0 1 3 0l6 6a2 2 0 0 1 0 3l-8 9H9l-6-5a2 2 0 0 1 0-3Z M8 8l9 8 M13 21h9" /></>,
  rectangle: <rect x="4" y="4" width="16" height="16" rx="2" />,
  ellipse: <ellipse cx="12" cy="12" rx="9" ry="7" />,
  diamond: <path d="m12 2 10 10-10 10L2 12 12 2Z" />,
  line: <path d="M4 20 20 4" />,
  arrow: <path d="M4 20 20 4 M10 4h10v10" />,
  text: <path d="M4 5V3h16v2 M12 3v18 M8 21h8" />,
  image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 5-5 4 4 4-6 5 7" /></>,
  note: <><path d="M13 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8l-8 8Z M13 21v-6a2 2 0 0 1 2-2h6 M7 8h10 M7 12h3" /></>,
  style: <><path d="M4 6h4m4 0h8 M4 12h10m4 0h2 M4 18h4m4 0h8" /><circle cx="10" cy="6" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="10" cy="18" r="2" /></>,
  settings: <><path d="m10 3 1-1h2l1 3 3 1 3-1 1 3-2 2v4l2 2-1 3-3-1-3 1-1 3h-3l-1-3-3-1-3 1-1-3 2-2v-4L2 8l1-3 3 1 3-1 1-2Z" /><circle cx="12" cy="12" r="3" /></>,
  fit: <><path d="M8 3H3v5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5" /><rect x="8" y="8" width="8" height="8" rx="1" /></>,
  search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
  download: <path d="M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5" />,
  close: <path d="m6 6 12 12 M6 18 18 6" />,
};

export function CanvasIcon({ name }: { name: IconName }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
