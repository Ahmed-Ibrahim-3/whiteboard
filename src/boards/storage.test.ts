import { describe, expect, it } from 'vitest';
import { createBoard, loadBoard, parseBoard, saveBoard, STORAGE_KEY } from './storage';

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}

describe('local board persistence', () => {
  it('starts without a saved board', () => {
    expect(loadBoard(memoryStorage())).toBeNull();
  });

  it('retains stable element IDs, bound text, image data, and research on reload', () => {
    const storage = memoryStorage();
    const board = createBoard();
    board.title = 'Interview synthesis';
    board.canvas = JSON.stringify({
      elements: [
        { id: 'card-1', type: 'rectangle', version: 3, boundElements: [{ id: 'text-1', type: 'text' }] },
        { id: 'text-1', type: 'text', containerId: 'card-1', text: 'Finding' },
        { id: 'image-1', type: 'image', fileId: 'file-1' },
      ],
      appState: { viewBackgroundColor: '#fafbf9' },
      files: { 'file-1': { dataURL: 'data:image/png;base64,example' } },
    });
    board.research['card-1'] = { kind: 'observation', source: 'Interview 04', notes: 'Participant struggled to find the filter.' };
    const saved = saveBoard(board, storage);
    const reopened = loadBoard(storage)!;
    expect(reopened).toEqual(saved);
    expect(reopened.id).toBe(board.id);
    expect(JSON.parse(reopened.canvas!).elements.map((element: { id: string }) => element.id)).toEqual(['card-1', 'text-1', 'image-1']);
    expect(reopened.research['card-1'].source).toBe('Interview 04');
    expect(saved.updatedAt).not.toBeNull();
    expect(board.updatedAt).toBeNull();
  });

  it('rejects broken JSON, unsupported schemas, and malformed documents or metadata', () => {
    const board = createBoard();
    for (const value of [
      '{', 'null', '{}', JSON.stringify({ ...board, schemaVersion: 2 }),
      JSON.stringify({ ...board, canvas: '{}' }),
      JSON.stringify({ ...board, canvas: JSON.stringify({ elements: [null] }) }),
      JSON.stringify({ ...board, research: { x: { kind: 'important', source: '', notes: '' } } }),
    ]) expect(() => parseBoard(value)).toThrow();
  });

  it('reports storage failures and leaves the previous saved value intact', () => {
    const storage = memoryStorage();
    const board = createBoard();
    saveBoard(board, storage);
    const original = storage.getItem(STORAGE_KEY);
    expect(() => saveBoard({ ...board, title: 'Unsaved work' }, {
      setItem: () => { throw new Error('Quota exceeded'); },
    })).toThrow('Quota exceeded');
    expect(storage.getItem(STORAGE_KEY)).toBe(original);
    expect(() => loadBoard({ getItem: () => { throw new Error('Storage denied'); } })).toThrow('Storage denied');
  });
});
