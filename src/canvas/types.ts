/** Opaque editor document. Only CanvasAdapter interprets its contents. */
export type CanvasDocument = string;

export interface CanvasSelection {
  id: string;
  type: string;
}

export type CanvasTool = 'selection' | 'hand' | 'pen' | 'highlighter' | 'eraser' |
  'rectangle' | 'ellipse' | 'diamond' | 'line' | 'arrow' | 'text' | 'image';

export interface CanvasStyle {
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: number;
  opacity: number;
  roughness: number;
}

export interface CanvasView {
  tool: CanvasTool;
  style: CanvasStyle;
  zoom: number;
  selectedCount: number;
  hasElements: boolean;
  grid: boolean;
  snap: boolean;
  background: string;
}

export const defaultCanvasView: CanvasView = {
  tool: 'selection',
  style: { strokeColor: '#304d43', backgroundColor: 'transparent', strokeWidth: 2, opacity: 100, roughness: 0 },
  zoom: 1, selectedCount: 0, hasElements: false, grid: false, snap: false, background: '#f7f6f2',
};

export interface CanvasHandle {
  addTextCard(): void;
  fitToContent(): void;
  setTool(tool: CanvasTool): void;
  setStyle(style: Partial<CanvasStyle>): void;
  setZoom(zoom: number): void;
  setCanvasOptions(options: Partial<Pick<CanvasView, 'grid' | 'snap' | 'background'>>): void;
  exportImage(): void;
  downloadDrawing(): void;
  search(): void;
  clear(): void;
}
