import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { CanvasAdapter } from './CanvasAdapter';
import { CanvasIcon } from './CanvasIcon';
import type { IconName } from './CanvasIcon';
import { defaultCanvasView } from './types';
import type { CanvasDocument, CanvasHandle, CanvasSelection, CanvasTool, CanvasView } from './types';
import './studio.css';

interface Props {
  initialDocument: CanvasDocument | null;
  onChange(document: CanvasDocument): void;
  onSelectionChange(selection: CanvasSelection | null): void;
  onReady(): void;
}

type Popover = 'style' | 'settings' | 'shapes' | null;
const inks = [
  ['Forest', '#304d43'], ['Graphite', '#3e4149'], ['Blue', '#426b9f'],
  ['Rose', '#b86161'], ['Ochre', '#c29437'],
] as const;
const fills = [['None', 'transparent'], ['Sage', '#dce8d5'], ['Butter', '#f5e5a7'], ['Sky', '#dae8f2'], ['Blush', '#f1d9d2']] as const;
const papers = [['Warm paper', '#f7f6f2'], ['White paper', '#ffffff'], ['Sage paper', '#edf3ec']] as const;
const shapes = [
  { tool: 'rectangle', label: 'Rectangle', key: 'R' }, { tool: 'ellipse', label: 'Ellipse', key: 'O' },
  { tool: 'diamond', label: 'Diamond', key: 'D' }, { tool: 'line', label: 'Line', key: 'L' },
] as const;
const toolGroups = [
  [{ tool: 'selection', label: 'Select', key: 'V' }, { tool: 'hand', label: 'Pan', key: 'H' }],
  [{ tool: 'pen', label: 'Pen', key: 'P' }, { tool: 'highlighter', label: 'Highlight', key: 'J' }, { tool: 'eraser', label: 'Erase', key: 'E' }],
] as const;
const toolHints: Partial<Record<CanvasTool, string>> = {
  hand: 'Drag to explore your canvas',
  eraser: 'Brush over an element to erase it',
  text: 'Click to add text. Double-click existing text to edit.',
  arrow: 'Drag between elements to connect them. Backspace cancels.',
  rectangle: 'Drag to draw a rectangle.',
  ellipse: 'Drag to draw an ellipse.',
  diamond: 'Drag to draw a diamond.',
  line: 'Drag to draw a line.',
  image: 'Choose an image, then click to place it.',
};
export const CanvasStudio = forwardRef<CanvasHandle, Props>(function CanvasStudio(props, forwardedRef) {
  const engine = useRef<CanvasHandle | null>(null);
  const [view, setView] = useState(defaultCanvasView);
  const [ready, setReady] = useState(false);
  const [popover, setPopover] = useState<Popover>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const lastView = useRef('');
  const handleView = useCallback((next: CanvasView) => {
    // Pointer movement must not re-render the app-owned controls.
    const signature = JSON.stringify(next);
    if (signature !== lastView.current) { lastView.current = signature; setView(next); }
  }, []);
  const handleReady = useCallback(() => { setReady(true); props.onReady(); }, [props.onReady]);
  const bindHandle = useCallback((handle: CanvasHandle | null) => {
    engine.current = handle;
    if (typeof forwardedRef === 'function') forwardedRef(handle);
    else if (forwardedRef) forwardedRef.current = handle;
  }, [forwardedRef]);

  useEffect(() => {
    if (!popover) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest('[data-canvas-popover], [data-popover-trigger]')) {
        setPopover(null); setConfirmClear(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setPopover(null); setConfirmClear(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('pointerdown', onPointerDown); document.removeEventListener('keydown', onKeyDown); };
  }, [popover]);

  function togglePopover(next: Exclude<Popover, null>, button: HTMLButtonElement) {
    trigger.current = button;
    setConfirmClear(false);
    setPopover(current => current === next ? null : next);
  }
  function chooseTool(tool: CanvasTool) { engine.current?.setTool(tool); setPopover(null); }
  function toolButton(tool: CanvasTool, label: string, key: string) {
    return <button key={tool} className="studio-tool" aria-label={`${label} (${key})`} title={`${label} · ${key}`}
      aria-pressed={view.tool === tool} disabled={!ready} onClick={() => chooseTool(tool)}>
      <CanvasIcon name={tool} /><span>{label}</span>
    </button>;
  }
  const shape = shapes.find(item => item.tool === view.tool) ?? shapes[0];
  const isShape = shapes.some(item => item.tool === view.tool);
  const widthOptions = view.tool === 'highlighter' || view.style.strokeWidth > 4 ? [8, 16, 24] : [1, 2, 4];
  const toolHint = toolHints[view.tool] ?? 'Select a tool to start drawing';

  return <div className="canvas-studio">
    <div className="studio-heading">
    <span className="studio-heading-title">Canvas</span>
          <div className="studio-heading-actions">
        {view.selectedCount > 0 && <span className="selection-count">{view.selectedCount} selected</span>}
        <button className="studio-action" aria-label="Style" aria-expanded={popover === 'style'} aria-controls="canvas-style" data-popover-trigger
          disabled={!ready} onClick={event => togglePopover('style', event.currentTarget)}><CanvasIcon name="style" /><span>Style</span></button>
        <button className="studio-action" aria-label="Canvas settings" aria-expanded={popover === 'settings'} aria-controls="canvas-settings" data-popover-trigger
          disabled={!ready} onClick={event => togglePopover('settings', event.currentTarget)}><CanvasIcon name="settings" /><span>Canvas settings</span></button>
      </div>
    </div>
    <div className="studio-surface">
      <CanvasAdapter ref={bindHandle} {...props} onReady={handleReady} onViewChange={handleView} />
      <div className="studio-toolrail" role="toolbar" aria-label="Drawing tools" aria-orientation="vertical" onKeyDown={event => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
        const index = buttons.indexOf(event.target as HTMLButtonElement);
        if (index < 0) return;
        event.preventDefault(); event.stopPropagation();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next].focus();
      }}>
        {toolGroups.map((group, index) => <div className="studio-toolgroup" key={index}>{group.map(item => toolButton(item.tool, item.label, item.key))}</div>)}
        <div className="studio-toolgroup">
          <button className="studio-tool" aria-label="Shapes" title="Shapes" aria-pressed={isShape} aria-expanded={popover === 'shapes'}
            aria-controls="canvas-shapes" disabled={!ready} data-popover-trigger onClick={event => togglePopover('shapes', event.currentTarget)}>
            <CanvasIcon name={shape.tool} /><span>Shapes</span><span className="tool-caret" aria-hidden="true">›</span>
          </button>
          {toolButton('arrow', 'Connect', 'A')}
          {toolButton('text', 'Text', 'T')}
          <button className="studio-tool note-tool" aria-label="Sticky note" title="Add a sticky note" disabled={!ready} onClick={() => { engine.current?.addTextCard(); setPopover(null); }}><CanvasIcon name="note" /><span>Note</span></button>
          {toolButton('image', 'Image', '9')}
        </div>
      </div>
      {!view.hasElements && view.tool === 'selection' && <div className="studio-empty">
        <span className="empty-doodle" aria-hidden="true"><CanvasIcon name="pen" /><span className="doodle-dot" /></span>
        <span className="studio-kicker">A SPACE FOR POSSIBILITIES</span>
        <p>Use the toolbar to draw, add text, or create a note.</p>
        <button className="empty-note-button" disabled={!ready} onClick={() => engine.current?.addTextCard()}><CanvasIcon name="note" /> Add note</button>
      </div>}
      <div className="studio-bottom-hint"><span className="hint-dot" />{toolHint}<span className="pan-tip"><kbd>space</kbd> + drag to pan</span></div>
      <div className="studio-zoom" role="group" aria-label="Canvas navigation">
        <button aria-label="Zoom out" disabled={!ready || view.zoom <= 0.1} onClick={() => engine.current?.setZoom(view.zoom / 1.2)}>−</button>
        <button className="zoom-value" aria-label="Reset zoom to 100 percent" disabled={!ready} onClick={() => engine.current?.setZoom(1)}>{Math.round(view.zoom * 100)}%</button>
        <button aria-label="Zoom in" disabled={!ready || view.zoom >= 3} onClick={() => engine.current?.setZoom(view.zoom * 1.2)}>+</button>
        <span className="zoom-divider" /><button aria-label="Fit board" title="Fit board" disabled={!ready || !view.hasElements} onClick={() => engine.current?.fitToContent()}><CanvasIcon name="fit" /></button>
      </div>
      {popover === 'shapes' && <div className="studio-popover shape-popover" id="canvas-shapes" role="dialog" aria-label="Choose a shape" data-canvas-popover>
        <PopoverHeading title="Shapes" icon="rectangle" onClose={() => setPopover(null)} />
        <div className="shape-options">{shapes.map(item => <button key={item.tool} aria-pressed={view.tool === item.tool} onClick={() => chooseTool(item.tool)}><CanvasIcon name={item.tool} /><span>{item.label}</span><kbd>{item.key}</kbd></button>)}</div>
      </div>}
      {popover === 'style' && <div className="studio-popover style-popover" id="canvas-style" role="dialog" aria-label="Drawing style" data-canvas-popover>
        <PopoverHeading title="Style" icon="style" onClose={() => setPopover(null)} />
        <p className="popover-description">{view.selectedCount ? `Applies to ${view.selectedCount} selected ${view.selectedCount === 1 ? 'element' : 'elements'}` : ''}</p>
        <fieldset className="studio-fieldset"><legend>Ink</legend><div className="swatch-row">{inks.map(([name, color]) => <button key={color} className="studio-swatch" style={{ background: color }} aria-label={`${name} ink`} title={`${name} ink`} aria-pressed={view.style.strokeColor === color} onClick={() => engine.current?.setStyle({ strokeColor: color })} />)}
          <label className="custom-color" title="Custom ink color"><span>＋</span><input type="color" aria-label="Custom ink color" value={/^#[\da-f]{6}$/i.test(view.style.strokeColor) ? view.style.strokeColor : '#304d43'} onChange={event => engine.current?.setStyle({ strokeColor: event.target.value })} /></label>
        </div></fieldset>
        <fieldset className="studio-fieldset"><legend>Fill</legend><div className="swatch-row">{fills.map(([name, color]) => <button key={color} className={`studio-swatch ${color === 'transparent' ? 'no-fill' : ''}`} style={{ backgroundColor: color }} aria-label={`${name} fill`} title={`${name} fill`} aria-pressed={view.style.backgroundColor === color} onClick={() => engine.current?.setStyle({ backgroundColor: color })} />)}</div></fieldset>
        <fieldset className="studio-fieldset"><legend>Stroke weight</legend><div className="segment-control">{widthOptions.map((width, index) => <button key={width} aria-label={`Stroke weight ${width}`} aria-pressed={view.style.strokeWidth === width} onClick={() => engine.current?.setStyle({ strokeWidth: width })}><span className="stroke-sample" style={{ height: index + 1 + (index === 2 ? 1 : 0) }} /></button>)}</div></fieldset>
        <fieldset className="studio-fieldset"><legend>Feel</legend><div className="segment-control">{[['Clean', 0], ['Sketch', 1], ['Loose', 2]].map(([label, roughness]) => <button key={label} aria-pressed={view.style.roughness === roughness} onClick={() => engine.current?.setStyle({ roughness: Number(roughness) })}>{label}</button>)}</div></fieldset>
        <label className="opacity-label" htmlFor="drawing-opacity">Opacity <span>{view.style.opacity}%</span></label>
        <input id="drawing-opacity" className="studio-range" type="range" min="10" max="100" step="5" value={view.style.opacity} onChange={event => engine.current?.setStyle({ opacity: Number(event.target.value) })} />
      </div>}
      {popover === 'settings' && <div className="studio-popover settings-popover" id="canvas-settings" role="dialog" aria-label="Canvas settings" data-canvas-popover>
        <PopoverHeading title="Your workspace" icon="settings" onClose={() => setPopover(null)} />
        <fieldset className="studio-fieldset"><legend>Paper</legend><div className="paper-options">{papers.map(([name, color]) => <button key={color} style={{ background: color }} aria-label={name} title={name} aria-pressed={view.background.toLowerCase() === color} onClick={() => engine.current?.setCanvasOptions({ background: color })}><span aria-hidden="true">{view.background.toLowerCase() === color ? '✓' : ''}</span></button>)}</div></fieldset>
        <label className="setting-switch"><span>Show grid</span><input type="checkbox" role="switch" checked={view.grid} onChange={event => engine.current?.setCanvasOptions({ grid: event.target.checked })} /></label>
        <label className="setting-switch"><span>Snap to objects</span><input type="checkbox" role="switch" checked={view.snap} onChange={event => engine.current?.setCanvasOptions({ snap: event.target.checked })} /></label>
        <div className="settings-links">
          <button onClick={() => { engine.current?.search(); setPopover(null); }}><CanvasIcon name="search" />Search the canvas<kbd>⌘/Ctrl F</kbd></button>
          <button disabled={!view.hasElements} onClick={() => { engine.current?.exportImage(); setPopover(null); }}><CanvasIcon name="image" />Export an image<span aria-hidden="true">↗</span></button>
          <button disabled={!view.hasElements} onClick={() => engine.current?.downloadDrawing()}><CanvasIcon name="download" />Download drawing</button>
        </div>
        <p className="export-footnote">Drawing exports include the canvas. Save your board to keep its research context too.</p>
        <details className="studio-shortcuts"><summary>Keyboard shortcuts</summary><dl><div><dt>Select / Pan</dt><dd>V / H</dd></div><div><dt>Pen / Highlight</dt><dd>P / J</dd></div><div><dt>Rectangle / Arrow / Text</dt><dd>R / A / T</dd></div><div><dt>Erase</dt><dd>E</dd></div><div><dt>Undo / Redo</dt><dd>⌘/Ctrl Z / ⇧ Z</dd></div></dl></details>
        {confirmClear ? <div className="clear-confirm"><p>Clear all drawings? You can undo this.</p><div><button className="clear-action" onClick={() => { engine.current?.clear(); setConfirmClear(false); setPopover(null); }}>Clear drawings</button><button onClick={() => setConfirmClear(false)}>Keep them</button></div></div>
          : <button className="clear-action clear-trigger" disabled={!view.hasElements} onClick={() => setConfirmClear(true)}>Clear canvas…</button>}
      </div>}
    </div>
  </div>;
});

function PopoverHeading({ title, icon, onClose }: { title: string; icon: IconName; onClose(): void }) {
  return <div className="studio-popover-heading"><span><CanvasIcon name={icon} />{title}</span><button aria-label="Close panel" onClick={onClose}><CanvasIcon name="close" /></button></div>;
}
