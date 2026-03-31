# CLAUDE.md — Project Instructions for @fourcorners/canvas

## What this project is

A standalone, MIT-licensed canvas library built on Konva.js + react-konva. It powers both the creation and viewing of structured visual metadata. Designed for the Four Corners Protocol but reusable for any project needing visual creation + structured output.

This is a **library**, not an app. It will be consumed by the Four Corners Next.js app (`writing-with-light`) as a dependency. Keep it framework-agnostic in `core/`, `shapes/`, `media/`, `mobile/`, `theme/`, and `interactions/`. React-specific code lives only in `react/`.

## Architecture rules

### Type class system
- Every shape extends `BaseShape` (defined in `shapes/BaseShape.ts`)
- Shapes self-describe: type, label, icon, category, render, serialize, validate, editable fields
- New shape types = new files + `ShapeRegistry.register()`. Never modify the registry or base class to add a type.
- Shape categories: `'media' | 'text' | 'container' | 'annotation'`

### Rendering
- Spatial layout: Konva canvas (shapes, positions, z-order, transform handles)
- Interactive media: HTML overlay via `react-konva-utils` `<Html>` component, positioned in canvas coordinates
- Every shape with an HTML overlay MUST also implement a static fallback for `stage.toDataURL()` export
- Three Konva layers max: Background (grid, zones — not listening), Content (all shapes), Chrome (selection handles, snap guides, drag preview)

### Serialization
- Library serializes to `CanvasDocument` JSON (defined in `core/Serializer.ts`)
- Protocol mapping (e.g. Four Corners metadata) happens OUTSIDE this library, in the consuming app
- The `useBridge` hook connects canvas state to an external store

### Mode system
- `'edit'`: shapes draggable, palette visible, snap active, overlays editable
- `'view'`: shapes locked, pan/zoom only, overlays interactive (play audio, click links)
- `'present'`: shapes locked, guided navigation (auto-pan between zones), overlays interactive

## Code conventions

### TypeScript
- Strict mode. No `any` unless absolutely unavoidable (document why in a comment).
- All public API functions and types get JSDoc comments.
- Prefer `interface` over `type` for object shapes. Use `type` for unions and utility types.
- Export types from the module they belong to AND re-export from the package entry point.

### File naming
- PascalCase for classes and React components: `BaseShape.ts`, `CanvasView.tsx`
- camelCase for utility files and hooks: `useCanvas.ts`, `tokens.ts`
- `index.ts` in each directory re-exports the public API of that module

### Imports
- Use path aliases (`@core/`, `@shapes/`, etc.) within the library
- External imports: `konva`, `react-konva`, `react-konva-utils` only
- No other runtime dependencies. Ever. If you need a utility, write it.

### Styling
- All visual properties come from `ThemeTokens` (defined in `theme/tokens.ts`)
- No hardcoded hex values, pixel sizes, or font names in shape rendering code
- Shapes read tokens from `CanvasRenderContext` at render time
- The Four Corners preset maps existing `var(--fc-*)` CSS variables

### Testing
- Vitest for unit tests
- Test files: `__tests__/[module].test.ts`
- Every public class and hook needs tests
- Shape tests: construct, serialize, deserialize roundtrip, validate

## Directory structure

```
core/                     # Framework-agnostic engine
  Canvas.ts               # Stage manager, camera, viewport bounds
  ShapeRegistry.ts        # Type class registry (register, get, list)
  SnapEngine.ts           # Grid + object snapping
  SelectionManager.ts     # Single/multi select, transform handles
  HistoryStack.ts         # Undo/redo (command pattern)
  Serializer.ts           # CanvasDocument ↔ JSON
  types.ts                # All shared interfaces and types

shapes/                   # Built-in shape types
  BaseShape.ts            # Abstract base class
  PhotoCard.ts            # Image with metadata fields
  TextBlock.ts            # Rich text with styling
  VoiceNote.ts            # Audio recorder + waveform
  LinkCard.ts             # URL preview card
  VideoEmbed.ts           # Video player shape
  ZoneShape.ts            # Spatial grouping container

media/                    # Rich media sub-modules
  ImageLoader.ts          # Progressive loading pipeline
  AudioEngine.ts          # MediaRecorder wrapper, waveform generation
  VideoEngine.ts          # Video element sync with canvas position
  LinkPreview.ts          # URL metadata fetcher (Open Graph)

mobile/                   # Mobile optimization
  TouchManager.ts         # Gesture recognition
  ViewportOptimizer.ts    # Frustum culling, dynamic quality
  PerformanceMonitor.ts   # FPS tracking, auto-downgrade
  SafeAreaManager.ts      # iOS safe area + toolbar inset

theme/                    # Styling system
  ThemeProvider.ts        # CSS variable injection + theme context
  tokens.ts               # ThemeTokens interface + defaults
  presets/
    light.ts
    dark.ts
    fourCorners.ts        # Maps var(--fc-*) tokens

interactions/             # Pluggable interaction patterns
  DragDrop.ts             # Add shapes from external palette
  ContextMenu.ts          # Right-click / long-press actions
  DoubleTapEdit.ts        # Inline editing trigger
  GuidedCapture.ts        # Journalist workflow: step-by-step prompts

react/                    # React binding layer
  CanvasProvider.tsx      # React context wrapping core engine
  CanvasView.tsx          # Main component (edit + view modes)
  ShapeRenderer.tsx       # Maps shape types → Konva components
  HtmlOverlay.tsx         # DOM elements synced to canvas coords
  Toolbar.tsx             # Extensible toolbar component
  hooks/
    useCanvas.ts          # Access canvas engine from React
    useShapes.ts          # CRUD operations on shapes
    useCamera.ts          # Pan/zoom control
    useMode.ts            # Mode toggle (edit/view/present)
    useBridge.ts          # Sync canvas state ↔ external store
  index.ts

index.ts                  # Package entry: re-exports all public API
```

## Commit conventions

Use conventional commits:
- `feat(core): add ShapeRegistry with register/get/list`
- `feat(shapes): implement BaseShape abstract class`
- `feat(react): CanvasProvider with theme context`
- `fix(mobile): correct pinch-zoom origin calculation`
- `test(shapes): roundtrip serialization for PhotoCard`
- `docs: update README with quick start`
- `chore: configure tsup build`

Each commit should be a single logical unit. Don't combine unrelated changes.

## Build phases (2-day sprint)

### Day 1 — Foundation + Core Shapes
1. Core types and interfaces
2. BaseShape abstract class
3. ShapeRegistry
4. Canvas stage manager
5. ThemeTokens + ThemeProvider + FC preset
6. PhotoCard shape
7. TextBlock shape
8. ZoneShape
9. React bindings: CanvasProvider, CanvasView, ShapeRenderer
10. Basic hooks: useCanvas, useShapes, useCamera, useMode

### Day 2 — Rich Media + Interactions + Bridge
11. ImageLoader progressive pipeline
12. AudioEngine + VoiceNote shape
13. LinkPreview + LinkCard shape
14. VideoEngine + VideoEmbed shape
15. HTML overlay integration
16. TouchManager (mobile gestures)
17. ViewportOptimizer (frustum culling)
18. PerformanceMonitor
19. SnapEngine (grid + object)
20. SelectionManager + HistoryStack
21. GuidedCapture interaction
22. Serializer (CanvasDocument ↔ JSON)
23. useBridge hook
24. SafeAreaManager
25. Index exports, build verification

## Key iOS/mobile gotchas to remember

- `Konva.hitOnDragEnabled = true` for multi-touch
- iOS Safari: single `getUserMedia` stream shared between recorder and visualizer
- `env(safe-area-inset-bottom)` for toolbar positioning
- Minimum 44px touch targets (Apple HIG)
- `Konva.pixelRatio = 1` on mobile to save memory
- Move dragged shapes to Chrome layer temporarily to avoid full Content layer redraws

## What NOT to do

- Don't add runtime dependencies beyond konva, react-konva, react-konva-utils
- Don't put Four Corners–specific business logic in this library (that goes in the app's bridge)
- Don't hardcode colors, sizes, or fonts — everything through ThemeTokens
- Don't skip the HTML overlay static fallback on media shapes
- Don't put React imports in core/, shapes/, media/, mobile/, or theme/ (except theme/ThemeProvider which bridges to React context)
