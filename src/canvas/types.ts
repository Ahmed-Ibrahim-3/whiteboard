/** Opaque editor document. Only CanvasAdapter interprets its contents. */
export type CanvasDocument = string;

export interface CanvasSelection {
  id: string;
  type: string;
}

export interface CanvasHandle {
  addTextCard(): void;
  fitToContent(): void;
}
