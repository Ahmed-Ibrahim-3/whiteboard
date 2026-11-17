import type { CanvasDocument } from '../canvas/types';

export const STORAGE_KEY = 'research-whiteboard.board.v1';
export const researchKinds = ['source', 'observation', 'claim', 'question'] as const;
export type ResearchKind = typeof researchKinds[number];
export interface ResearchMetadata { kind: ResearchKind | ''; source: string; notes: string }
export const emptyMetadata: ResearchMetadata = { kind: '', source: '', notes: '' };

export interface Board {
  schemaVersion: 1;
  id: string;
  title: string;
  updatedAt: string | null;
  canvas: CanvasDocument | null;
  research: Record<string, ResearchMetadata>;
}

export function createBoard(): Board {
  return { schemaVersion: 1, id: crypto.randomUUID(), title: 'Untitled', updatedAt: null, canvas: null, research: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseBoard(raw: string): Board {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.id !== 'string' ||
    typeof value.title !== 'string' || !(value.updatedAt === null || typeof value.updatedAt === 'string') ||
    !(value.canvas === null || typeof value.canvas === 'string') || !isRecord(value.research)) {
    throw new Error('Unrecognised board format');
  }
  if (typeof value.canvas === 'string') {
    const scene: unknown = JSON.parse(value.canvas);
    if (!isRecord(scene) || !Array.isArray(scene.elements) ||
      !scene.elements.every(element => isRecord(element) && typeof element.id === 'string' && typeof element.type === 'string')) {
      throw new Error('Invalid canvas document');
    }
  }
  for (const metadata of Object.values(value.research)) {
    if (!isRecord(metadata) || typeof metadata.source !== 'string' || typeof metadata.notes !== 'string' ||
      !(metadata.kind === '' || researchKinds.some(kind => kind === metadata.kind))) {
      throw new Error('Invalid research metadata');
    }
  }
  return value as unknown as Board;
}

export function loadBoard(storage: Pick<Storage, 'getItem'>): Board | null {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === null ? null : parseBoard(raw);
}

// Write once: a quota/permission failure leaves the previous saved board intact.
export function saveBoard(board: Board, storage: Pick<Storage, 'setItem'>): Board {
  const saved = { ...board, updatedAt: new Date().toISOString() };
  storage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return saved;
}
