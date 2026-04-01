# @fourcorners/canvas

A visual canvas library for creating and viewing structured metadata around images. One library for both the creator and the viewer. Built on [Konva.js](https://konvajs.org/) + React.

**MIT licensed. Zero recurring cost. One runtime dependency.**

---

## What this is

A standalone, reusable canvas engine where every element on the canvas is a **type class** — a self-describing shape that knows how to render, serialize, validate, and map to an external data schema.

Built for the [Four Corners Protocol](https://writingwithlight.org) but designed to be schema-agnostic. The library handles spatial layout, interactions, and rich media. Your application handles the meaning.

## Architecture at a glance

```
core/           Framework-agnostic engine (canvas, registry, snap, history, serializer)
shapes/         Built-in shape types (PhotoCard, TextBlock, VoiceNote, LinkCard, VideoEmbed, Zone)
media/          Rich media modules (image loading, audio recording, video sync, link preview)
mobile/         Mobile optimization (touch gestures, viewport culling, perf monitor, safe area)
theme/          CSS-variable-based theming with presets
interactions/   Pluggable interaction patterns (drag-drop, context menu, guided capture)
react/          React bindings, hooks, and the main CanvasView component
```

## Key concepts

**Type classes, not config objects.** Each shape type is a class extending `BaseShape`. It declares its own rendering, serialization, validation, and editable fields. Register new types without touching library code.

**One canvas, two modes.** `edit` mode: shapes are draggable, palette visible, snap active. `view` mode: shapes locked, pan/zoom only, media interactive (play audio, click links). `present` mode: guided navigation through zones.

**Protocol bridge, not protocol lock-in.** The library serializes to its own JSON format. A bridge function in your app maps that to whatever schema you need (Four Corners metadata, IIIF, custom). The `useBridge` hook syncs canvas state with your external store (Zustand, Redux, etc.).

**HTML overlay pattern.** Spatial layout lives on the Konva canvas. Interactive media (audio players, video, link hover states) renders as DOM elements positioned over the canvas via `react-konva-utils`. Static fallbacks for export.

## Quick start

```bash
npm install @fourcorners/canvas konva react-konva react-konva-utils
```

```tsx
import { CanvasProvider, CanvasView, useShapes } from '@fourcorners/canvas/react';
import { fourCornersTheme } from '@fourcorners/canvas/theme';

function Editor({ shapes }) {
  return (
    <CanvasProvider theme={fourCornersTheme}>
      <CanvasView shapes={shapes} mode="edit" />
    </CanvasProvider>
  );
}
```

That's it. CanvasView includes all interactions out of the box.

## Built-in behaviors

CanvasView provides these interactions automatically:

| Behavior | Input | Mode |
|---|---|---|
| **Zoom** | Mouse wheel / pinch | All |
| **Pan** | Drag the canvas | All |
| **Select** | Click a shape | Edit |
| **Multi-select** | Shift/Cmd+click | Edit |
| **Drag shapes** | Drag a shape (with snap) | Edit |
| **Transform** | Resize/rotate handles | Edit |
| **Context menu** | Right-click / long-press | All |
| **Undo** | Cmd/Ctrl+Z | Edit |
| **Redo** | Cmd/Ctrl+Shift+Z | Edit |
| **Delete** | Delete/Backspace key | Edit |
| **Deselect** | Escape / click empty area | Edit |

### Hooks

```tsx
import {
  useCamera,      // { camera, setCamera, zoomIn, zoomOut, fitToContent, resetView }
  useSelection,   // { selectedIds, select, addToSelection, deselect, deselectAll, isSelected }
  useHistory,     // { undo, redo, canUndo, canRedo, push, history }
  useShapes,      // { shapes, add, remove, update, get, clear, setShapes }
  useMode,        // { mode, setMode }
  useBridge,      // { sync, load, isDirty, isSaving, lastSaved }
} from '@fourcorners/canvas/react';
```

### Opting out

Disable any built-in behavior with props:

```tsx
<CanvasView
  shapes={shapes}
  disableWheelZoom       // handle zoom yourself
  disableStageDrag       // handle panning yourself
  disableKeyboardShortcuts  // handle shortcuts yourself
/>
```

### Event callbacks

```tsx
<CanvasView
  shapes={shapes}
  onShapeDelete={(id) => removeShape(id)}  // Delete key or context menu
  onShapeEdit={(id) => openEditor(id)}     // Double-click / context menu Edit
/>
```

### Register a custom shape

```typescript
import { ShapeRegistry, BaseShape } from '@fourcorners/canvas';

class EvidenceMarker extends BaseShape<{ timestamp: Date; gpsCoords: LatLng }> {
  readonly type = 'evidence-marker';
  readonly label = 'Evidence Marker';
  readonly icon = 'map-pin';
  readonly category = 'annotation';
  // ... render, serialize, validate
}

ShapeRegistry.register(EvidenceMarker);
```

### Bridge to your data model

```tsx
import { useBridge } from '@fourcorners/canvas/react';

const { sync, load, isDirty } = useBridge({
  toExternal: canvasToFourCorners,
  fromExternal: fourCornersToCanvas,
  onSave: async (data) => await fetch('/api/save', { body: JSON.stringify(data) }),
  autoSave: true,
  debounceMs: 1000,
});
```

## Theme system

All visual properties are token-driven. No hardcoded hex values in shapes.

```tsx
<CanvasProvider theme={darkTheme}>
  <CanvasView shapes={shapes} mode="edit" />
</CanvasProvider>
```

The Four Corners preset maps `var(--fc-*)` tokens so the consuming app's CSS variables cascade through:

```css
/* In your app — these flow into all canvas shapes */
:root {
  --fc-bg: #0f172a;
  --fc-surface: #1e293b;
  --fc-text: #f1f5f9;
  --fc-accent: #3b82f6;
  --fc-placeholder: #334155;
  --fc-video-bg: #0f172a;
  --fc-badge-text: #ffffff;
  --fc-overlay-bg: rgba(0,0,0,0.6);
}
```

Available theme tokens: `canvasBg`, `shapeBorder`, `shapeSurface`, `shapePlaceholder`, `badgeText`, `videoBg`, `overlayBg`, `fontFamily`, `textColor`, `textSecondary`, `accentPrimary`, `toolbarBg`, and more. See `theme/tokens.ts` for the full interface.

## Mobile

Designed mobile-first:
- Gesture recognition (pinch-zoom, pan, long-press, double-tap)
- Viewport culling (only render visible shapes)
- Progressive image loading (thumbnail → full res)
- Auto performance downgrade (shadows off, pixelRatio reduction) when FPS drops
- iOS safe area support matching the `fc-view-controls` toolbar pattern

## Dependencies

| Package | License | Purpose |
|---------|---------|---------|
| `konva` | MIT | Canvas rendering engine |
| `react-konva` | MIT | React bindings for Konva |
| `react-konva-utils` | MIT | HTML overlay + portal components |

Peer dependencies: React 18+, ReactDOM 18+.

## Preview

An interactive preview page renders all shape types from real Four Corners metadata (Rockaway Beach photo story). Use it to explore themes, modes, viewports, and shape selection.

```bash
npm run preview      # Opens at http://localhost:4173
```

The preview includes:
- **Theme switcher** — light, dark, Four Corners presets
- **Mode toggle** — edit (draggable shapes), view (pan/zoom), present
- **Viewport presets** — desktop (1280x800), tablet (768x1024), mobile (375x812)
- **Zoom controls** — scroll-wheel zoom, fit-to-content, reset
- **Shape inspector** — click any shape to see its type, fields, validation, and metadata
- **Pan** — drag the canvas to pan in any mode

The preview data comes from `test-data/rockaway-beach.json`, mapped through `test-data/mapFourCornersToShapes.ts` which demonstrates the bridge pattern for converting Four Corners protocol metadata into canvas shapes.

## Build

```bash
npm run build        # Production build via tsup
npm run dev          # Watch mode
npm run typecheck    # Type checking only
npm run test         # Vitest (54 tests)
npm run preview      # Interactive preview page
npm run storybook    # Component development
```

## License

MIT
