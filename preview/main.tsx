import React, { useState, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer } from 'react-konva';
import { DEFAULT_TOKENS } from '../theme/tokens';
import { darkTheme } from '../theme/presets/dark';
import { fourCornersTheme } from '../theme/presets/fourCorners';
import { ShapeRenderer } from '../react/ShapeRenderer';
import { mapFourCornersToShapes } from '../test-data/mapFourCornersToShapes';
import { rockawayBeachFixture } from '../test-data/rockaway-beach-fixture';
import type { BaseShape } from '../shapes/BaseShape';
import type { CanvasMode, ThemeTokens, CameraState } from '../core/types';
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
// Viewport presets
// ---------------------------------------------------------------------------

const VIEWPORTS = {
  desktop: { width: 1280, height: 800, label: 'Desktop (1280x800)' },
  tablet: { width: 768, height: 1024, label: 'Tablet (768x1024)' },
  mobile: { width: 375, height: 812, label: 'Mobile (375x812)' },
} as const;

type ViewportKey = keyof typeof VIEWPORTS;

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App() {
  const [themeName, setThemeName] = useState<string>('light');
  const [mode, setMode] = useState<CanvasMode>('view');
  const [viewport, setViewport] = useState<ViewportKey>('desktop');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, zoom: 1 });

  const theme = THEMES[themeName] ?? DEFAULT_TOKENS;
  const vp = VIEWPORTS[viewport];

  // Build shapes from 4C fixture
  const shapes = useMemo(() => mapFourCornersToShapes(rockawayBeachFixture), []);

  const handleWheel = useCallback((e: { evt: WheelEvent }) => {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    setCamera((prev) => {
      const newZoom = Math.min(5, Math.max(0.1, prev.zoom * (direction > 0 ? scaleBy : 1 / scaleBy)));
      return { ...prev, zoom: newZoom };
    });
  }, []);

  const handleStageClick = useCallback((e: { target: { getStage: () => unknown }; currentTarget: unknown }) => {
    if (e.target === e.currentTarget || e.target.getStage() === e.target) {
      setSelectedId(null);
    }
  }, []);

  const handleShapeClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const resetCamera = useCallback(() => {
    setCamera({ x: 0, y: 0, zoom: 1 });
  }, []);

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
              onClick={() => setThemeName(t)}
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
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">Viewport</span>
          {(Object.keys(VIEWPORTS) as ViewportKey[]).map((v) => (
            <button
              key={v}
              className={`toolbar-btn ${viewport === v ? 'active' : ''}`}
              onClick={() => setViewport(v)}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">Zoom {Math.round(camera.zoom * 100)}%</span>
          <button className="toolbar-btn" onClick={() => setCamera((c) => ({ ...c, zoom: Math.min(5, c.zoom * 1.2) }))}>+</button>
          <button className="toolbar-btn" onClick={() => setCamera((c) => ({ ...c, zoom: Math.max(0.1, c.zoom / 1.2) }))}>-</button>
          <button className="toolbar-btn" onClick={resetCamera}>Reset</button>
        </div>
      </header>

      {/* Canvas */}
      <main className="canvas-container">
        <div
          className="canvas-frame"
          style={{
            width: vp.width,
            height: vp.height,
            background: theme.canvasBg,
            border: `1px solid ${theme.shapeBorder}`,
          }}
        >
          <Stage
            width={vp.width}
            height={vp.height}
            scaleX={camera.zoom}
            scaleY={camera.zoom}
            x={camera.x}
            y={camera.y}
            draggable={mode !== 'edit'}
            onWheel={handleWheel}
            onClick={handleStageClick}
            onTap={handleStageClick}
            onDragEnd={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                setCamera((prev) => ({ ...prev, x: stage.x(), y: stage.y() }));
              }
            }}
          >
            <Layer>
              {shapes.map((shape: BaseShape) => (
                <ShapeRendererWithClick
                  key={shape.id}
                  shape={shape}
                  theme={theme}
                  mode={mode}
                  camera={camera}
                  selected={selectedId === shape.id}
                  onClick={() => handleShapeClick(shape.id)}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </main>

      {/* Inspector */}
      <aside className="inspector">
        <h3>Shapes ({shapes.length})</h3>
        <ul className="shape-list">
          {shapes.map((shape: BaseShape) => (
            <li
              key={shape.id}
              className={`shape-item ${selectedId === shape.id ? 'selected' : ''}`}
              onClick={() => handleShapeClick(shape.id)}
            >
              <span className="shape-type">{shape.type}</span>
              <span className="shape-label">
                {(shape.data as Record<string, unknown>).label as string ??
                  (shape.data as Record<string, unknown>).title as string ??
                  (shape.data as Record<string, unknown>).caption as string ??
                  truncate((shape.data as Record<string, unknown>).content as string, 40) ??
                  shape.id.slice(0, 8)}
              </span>
            </li>
          ))}
        </ul>

        {selectedId && (
          <SelectedShapeDetail shape={shapes.find((s: BaseShape) => s.id === selectedId)} />
        )}
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ShapeRendererWithClick({
  shape,
  theme,
  mode,
  camera,
  selected,
  onClick,
}: {
  shape: BaseShape;
  theme: ThemeTokens;
  mode: CanvasMode;
  camera: CameraState;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <ShapeRenderer
      shape={shape}
      theme={theme}
      mode={mode}
      camera={camera}
      selected={selected}
    />
  );
}

function SelectedShapeDetail({ shape }: { shape?: BaseShape }) {
  if (!shape) return null;

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

function truncate(s: string | undefined, max: number): string | undefined {
  if (!s) return undefined;
  return s.length > max ? s.slice(0, max) + '...' : s;
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
