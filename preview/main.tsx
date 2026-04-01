import React, { useState, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_TOKENS } from '../theme/tokens';
import { darkTheme } from '../theme/presets/dark';
import { fourCornersTheme } from '../theme/presets/fourCorners';
import { mapFourCornersToShapes } from '../test-data/mapFourCornersToShapes';
import { rockawayBeachFixture } from '../test-data/rockaway-beach-fixture';
import type { BaseShape } from '../shapes/BaseShape';
import type { CanvasMode, ThemeTokens } from '../core/types';
import { CanvasProvider } from '../react/CanvasProvider';
import { CanvasView } from '../react/CanvasView';
import { useCamera } from '../react/hooks/useCamera';
import { useSelection } from '../react/hooks/useSelection';
import { useHistory } from '../react/hooks/useHistory';
import './styles.css';

// ---------------------------------------------------------------------------
// Theme presets
// ---------------------------------------------------------------------------

const THEMES: Record<string, ThemeTokens> = {
  light: DEFAULT_TOKENS,
  dark: darkTheme,
  fourCorners: fourCornersTheme,
};

// ---------------------------------------------------------------------------
// App shell — wraps everything in CanvasProvider
// ---------------------------------------------------------------------------

function App() {
  const [themeName, setThemeName] = useState<string>('light');
  const [mode, setMode] = useState<CanvasMode>('view');
  const theme = THEMES[themeName] ?? DEFAULT_TOKENS;

  // Build shapes from 4C fixture
  const shapes = useMemo(() => mapFourCornersToShapes(rockawayBeachFixture), []);

  return (
    <CanvasProvider theme={theme} mode={mode}>
      <PreviewUI
        shapes={shapes}
        themeName={themeName}
        mode={mode}
        onThemeChange={setThemeName}
        onModeChange={setMode}
      />
    </CanvasProvider>
  );
}

// ---------------------------------------------------------------------------
// Preview UI — uses hooks for camera, selection, history
// ---------------------------------------------------------------------------

function PreviewUI({
  shapes,
  themeName,
  mode,
  onThemeChange,
  onModeChange,
}: {
  shapes: BaseShape[];
  themeName: string;
  mode: CanvasMode;
  onThemeChange: (name: string) => void;
  onModeChange: (mode: CanvasMode) => void;
}) {
  const theme = THEMES[themeName] ?? DEFAULT_TOKENS;
  const { camera, zoomIn, zoomOut, fitToContent, resetView } = useCamera();
  const { selectedIds } = useSelection();
  const { undo, redo, canUndo, canRedo } = useHistory();

  const handleShapeDelete = useCallback(
    (id: string) => {
      // In a real app, this would call useShapes().remove(id)
      // For the preview, we just log it
      // eslint-disable-next-line no-console
      console.log('Delete shape:', id);
    },
    [],
  );

  const selectedShape = shapes.find((s) => selectedIds.includes(s.id));

  return (
    <div className={`preview-root theme-${themeName}`} style={{ background: theme.canvasBg }}>
      {/* Toolbar */}
      <header className="toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">Theme</span>
          {Object.keys(THEMES).map((t) => (
            <button
              key={t}
              className={`toolbar-btn ${themeName === t ? 'active' : ''}`}
              onClick={() => onThemeChange(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">Mode</span>
          {(['edit', 'view', 'present'] as CanvasMode[]).map((m) => (
            <button
              key={m}
              className={`toolbar-btn ${mode === m ? 'active' : ''}`}
              onClick={() => onModeChange(m)}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">Zoom {Math.round(camera.zoom * 100)}%</span>
          <button className="toolbar-btn" onClick={zoomIn}>+</button>
          <button className="toolbar-btn" onClick={zoomOut}>-</button>
          <button className="toolbar-btn" onClick={fitToContent}>Fit</button>
          <button className="toolbar-btn" onClick={resetView}>Reset</button>
        </div>

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={undo} disabled={!canUndo}>Undo</button>
          <button className="toolbar-btn" onClick={redo} disabled={!canRedo}>Redo</button>
        </div>
      </header>

      {/* Canvas — all interactions built in */}
      <main className="canvas-container">
        <CanvasView
          shapes={shapes}
          mode={mode}
          onShapeDelete={handleShapeDelete}
          style={{
            border: `1px solid ${theme.shapeBorder}`,
            borderRadius: 8,
          }}
        />
      </main>

      {/* Inspector */}
      <aside className="inspector">
        <h3>Shapes ({shapes.length})</h3>
        <ul className="shape-list">
          {shapes.map((shape: BaseShape) => (
            <li
              key={shape.id}
              className={`shape-item ${selectedIds.includes(shape.id) ? 'selected' : ''}`}
            >
              <span className="shape-type">{shape.type}</span>
              <span className="shape-label">
                {shapeDisplayName(shape)}
              </span>
            </li>
          ))}
        </ul>

        {selectedShape && (
          <SelectedShapeDetail shape={selectedShape} />
        )}
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SelectedShapeDetail({ shape }: { shape: BaseShape }) {
  const fields = shape.getEditableFields();
  const validation = shape.validate();

  return (
    <div className="detail-panel">
      <h4>{shape.label}</h4>
      <div className="detail-meta">
        <span>Type: {shape.type}</span>
        <span>Position: ({shape.x}, {shape.y})</span>
        <span>Size: {shape.width} x {shape.height}</span>
        <span>Valid: {validation.valid ? 'Yes' : 'No'}</span>
        {validation.errors.length > 0 && (
          <span className="detail-errors">
            {validation.errors.join(', ')}
          </span>
        )}
      </div>
      <h5>Fields</h5>
      <ul className="field-list">
        {fields.map((f) => (
          <li key={f.key}>
            <span className="field-key">{f.label}</span>
            <span className="field-type">{f.type}</span>
            <span className="field-value">
              {truncate(String((shape.data as Record<string, unknown>)[f.key] ?? ''), 60)}
            </span>
          </li>
        ))}
      </ul>
      {shape.metadata && Object.keys(shape.metadata).length > 0 && (
        <>
          <h5>Metadata</h5>
          <pre className="metadata-json">{JSON.stringify(shape.metadata, null, 2)}</pre>
        </>
      )}
    </div>
  );
}

function shapeDisplayName(shape: BaseShape): string {
  const d = shape.data as Record<string, unknown>;
  return (
    (d.label as string) ??
    (d.title as string) ??
    (d.caption as string) ??
    truncate(d.content as string, 40) ??
    shape.id.slice(0, 8)
  );
}

function truncate(s: string | undefined, max: number): string | undefined {
  if (!s) return undefined;
  return s.length > max ? s.slice(0, max) + '...' : s;
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
