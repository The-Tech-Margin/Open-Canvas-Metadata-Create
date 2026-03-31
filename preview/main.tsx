import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { DEFAULT_TOKENS } from '../theme/tokens';
import { darkTheme } from '../theme/presets/dark';
import { fourCornersTheme } from '../theme/presets/fourCorners';
import { mapFourCornersToShapes } from '../test-data/mapFourCornersToShapes';
import { rockawayBeachFixture } from '../test-data/rockaway-beach-fixture';
import type { BaseShape } from '../shapes/BaseShape';
import type { CanvasMode, ThemeTokens, CameraState, CanvasRenderContext } from '../core/types';
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
// Imperative shape layer — renders Konva nodes directly
// ---------------------------------------------------------------------------

function ShapeLayer({
  shapes,
  theme,
  mode,
  camera,
  selectedId,
  onShapeClick,
}: {
  shapes: BaseShape[];
  theme: ThemeTokens;
  mode: CanvasMode;
  camera: CameraState;
  selectedId: string | null;
  onShapeClick: (id: string) => void;
}) {
  const layerRef = useRef<Konva.Layer>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    // Clear previous nodes
    layer.destroyChildren();

    // Render each shape imperatively
    for (const shape of shapes) {
      const ctx: CanvasRenderContext = {
        theme,
        mode,
        camera,
        selected: shape.id === selectedId,
      };

      const node = shape.render(ctx);
      if (node) {
        // Add click handler for selection
        node.on('click tap', () => onShapeClick(shape.id));
        layer.add(node);
      }
    }

    layer.batchDraw();
  }, [shapes, theme, mode, camera, selectedId, onShapeClick]);

  return <Layer ref={layerRef} />;
}

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

  // Fit-to-content: calculate zoom to show all shapes
  const fitToContent = useCallback(() => {
    if (shapes.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of shapes) {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    }
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const padding = 40;
    const zoom = Math.min(
      (vp.width - padding * 2) / contentW,
      (vp.height - padding * 2) / contentH,
      2,
    );
    setCamera({
      x: -minX * zoom + padding,
      y: -minY * zoom + padding,
      zoom,
    });
  }, [shapes, vp]);

  // Auto-fit on first render and viewport change
  useEffect(() => {
    fitToContent();
  }, [fitToContent]);

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
          <button className="toolbar-btn" onClick={fitToContent}>Fit</button>
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
            draggable
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
            <ShapeLayer
              shapes={shapes}
              theme={theme}
              mode={mode}
              camera={camera}
              selectedId={selectedId}
              onShapeClick={handleShapeClick}
            />
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
                {shapeDisplayName(shape)}
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
