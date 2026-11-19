import { useCallback, useEffect, useRef, useState } from 'react';
import { CanvasStudio } from './canvas/CanvasStudio';
import type { CanvasDocument, CanvasHandle, CanvasSelection } from './canvas/types';
import { createBoard, emptyMetadata, loadBoard, researchKinds, saveBoard } from './boards/storage';
import type { Board, ResearchMetadata } from './boards/storage';

function readInitialBoard(): { board: Board; error: string | null } {
  try { return { board: loadBoard(window.localStorage) ?? createBoard(), error: null }; }
  catch { return { board: createBoard(), error: 'The saved board could not be opened. Your previous saved data has not been changed. Saving will replace it.' }; }
}

export function App() {
  const [initial] = useState(readInitialBoard);
  const [board, setBoard] = useState(initial.board);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(initial.error);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(() => window.matchMedia('(min-width: 900px)').matches);
  const [selection, setSelection] = useState<CanvasSelection | null>(null);
  const canvas = useRef<CanvasHandle>(null);
  const lastDocument = useRef<CanvasDocument | null>(null);
  const hasInitialChange = useRef(false);

  const handleChange = useCallback((document: CanvasDocument) => {
    if (lastDocument.current === document) return;
    lastDocument.current = document;
    setBoard(current => ({ ...current, canvas: document }));
    // Excalidraw normalises a restored scene on mount; that is not a user edit.
    if (hasInitialChange.current) setDirty(true);
    hasInitialChange.current = true;
  }, []);

  const handleSelection = useCallback((next: CanvasSelection | null) => {
    setSelection(current => current?.id === next?.id ? current : next);
  }, []);
  const handleReady = useCallback(() => setReady(true), []);

  const save = useCallback(() => {
    try {
      setBoard(saveBoard(board, window.localStorage));
      setDirty(false);
      setError(null);
    } catch { setError('Could not save in this browser. Storage may be full or unavailable. Your changes are still on the canvas.'); }
  }, [board]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    const keyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (ready) save();
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('keydown', keyDown);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('keydown', keyDown);
    };
  }, [dirty, ready, save]);

  const metadata = selection ? board.research[selection.id] ?? emptyMetadata : emptyMetadata;
  function updateMetadata(patch: Partial<ResearchMetadata>) {
    if (!selection) return;
    setBoard(current => ({ ...current, research: { ...current.research,
      [selection.id]: { ...(current.research[selection.id] ?? emptyMetadata), ...patch },
    } }));
    setDirty(true);
  }

  return <div className="app">
    <header className="app-header">
      <div className="brand" aria-label="Whiteboard"><span className="brand-symbol" aria-hidden="true">✳</span><span>Research<br /><b>Board</b></span></div>
      <div className="board-heading">
        <label className="sr-only" htmlFor="board-title">Board title</label>
        <input id="board-title" value={board.title} maxLength={120} onChange={event => {
          setBoard(current => ({ ...current, title: event.target.value })); setDirty(true);
        }} />
        <span className="save-state" role="status"><span className={dirty || error ? 'status-dot unsaved' : 'status-dot'} />
          {error ? 'Save needs attention' : dirty ? 'Unsaved changes' : board.updatedAt ? 'Saved in this browser' : 'Local board · not saved yet'}
        </span>
      </div>
      <div className="header-actions">
        <button className="secondary research-toggle" aria-expanded={panelOpen} onClick={() => setPanelOpen(value => !value)}>Research</button>
        <button className="primary" disabled={!ready} onClick={save}>Save board</button>
      </div>
    </header>
    {error && <div className="error-banner" role="alert">{error}</div>}
    <main className="workspace">
      <section className="canvas-area" aria-label="Research canvas">
        <div className="canvas-editor">
          <CanvasStudio ref={canvas} initialDocument={initial.board.canvas} onChange={handleChange}
            onSelectionChange={handleSelection} onReady={handleReady} />
        </div>
      </section>
      {panelOpen && <aside className="research-panel" aria-label="Element research">
        <div className="panel-heading"><h1>Research</h1><button className="close-button" aria-label="Close research panel" onClick={() => setPanelOpen(false)}>×</button></div>
        {selection ? <div className="metadata-form">
          <div className="selection-info"><span className="element-badge">{selection.type}</span></div>
          <label htmlFor="research-kind">Research type</label>
          <select id="research-kind" value={metadata.kind} onChange={event => updateMetadata({ kind: event.target.value as ResearchMetadata['kind'] })}>
            <option value="">No type</option>{researchKinds.map(kind => <option key={kind} value={kind}>{kind[0].toUpperCase() + kind.slice(1)}</option>)}
          </select>
          <label htmlFor="research-source">Source</label>
          <input id="research-source" placeholder="A URL, interview, or reference" value={metadata.source} onChange={event => updateMetadata({ source: event.target.value })} />
          <label htmlFor="research-notes">Notes</label>
          <textarea id="research-notes" rows={7} placeholder="Add notes about this element" value={metadata.notes} onChange={event => updateMetadata({ notes: event.target.value })} />
          <details className="element-details"><summary>Element details</summary><code>{selection.id}</code></details>
        </div> : <div className="panel-empty"><h2>Select an element</h2><p>Select one shape, card, or stroke to add a source, observation, claim, or question.</p><div className="research-legend">{researchKinds.map(kind => <span key={kind} className={`kind kind-${kind}`}>{kind}</span>)}</div></div>}
      </aside>}
    </main>
  </div>;
}
