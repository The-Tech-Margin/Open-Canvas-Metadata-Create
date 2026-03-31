# PROMPTS.md — Claude Code Prompt Sequence

Run these in order. Each prompt is self-contained. Copy-paste into Claude Code.

---

## DAY 1 — Foundation + Core Shapes

---

### Prompt 01: Core types and interfaces

```
Read CLAUDE.md for project conventions.

Create `core/types.ts` with all shared interfaces:

- `Point` (x, y)
- `Size` (width, height)
- `Rect` (x, y, width, height)
- `ShapeCategory` = 'media' | 'text' | 'container' | 'annotation'
- `CanvasMode` = 'edit' | 'view' | 'present'
- `CameraState` (x, y, zoom)
- `ShapeJSON` — serialized shape (id, type, x, y, width, height, rotation, locked, data, metadata)
- `ZoneJSON` — serialized zone (id, label, bounds: Rect, shapeIds: string[])
- `ConnectionJSON` — optional (id, fromShapeId, toShapeId, type)
- `CanvasDocument` — full serialized canvas (version, canvas config, shapes[], zones[], connections[])
- `FieldDefinition` — describes an editable field (key, label, type: 'text'|'number'|'url'|'textarea'|'image'|'audio'|'select', options?: string[], required?: boolean)
- `ValidationResult` (valid: boolean, errors: string[])
- `CanvasRenderContext` — passed to shape render methods (theme: ThemeTokens, mode: CanvasMode, camera: CameraState, selected: boolean)

Also create `core/index.ts` re-exporting everything from types.

Every interface gets JSDoc comments. Use `interface` not `type` for object shapes.
```

**Commit:** `feat(core): add shared types and interfaces`

---

### Prompt 02: BaseShape abstract class

```
Read CLAUDE.md and `core/types.ts`.

Create `shapes/BaseShape.ts`:

Abstract class `BaseShape<TData = Record<string, unknown>>` with:

Properties:
- abstract readonly type: string
- abstract readonly label: string
- abstract readonly icon: string
- abstract readonly category: ShapeCategory
- id: string (generate UUID in constructor)
- x, y, width, height, rotation: number (default 0 for rotation)
- locked: boolean (default false)
- data: TData
- metadata: Record<string, unknown> (default {})

Abstract methods:
- render(ctx: CanvasRenderContext): any (Konva node — use `any` here since Konva types vary, document why)
- renderThumbnail(): any
- serialize(): ShapeJSON
- deserialize(json: ShapeJSON): void
- getEditableFields(): FieldDefinition[]
- validate(): ValidationResult

Optional methods with default no-op implementations:
- renderOverlay?(): React.ReactNode (NOTE: import React type only, do not import react-dom)
- onSelect(): void
- onDeselect(): void
- onDoubleClick(): void
- onDragEnd(position: Point): Point (default returns position unchanged)
- toProtocol(): Record<string, unknown> (default returns empty object)

Helper method:
- protected generateId(): string — use crypto.randomUUID() with fallback to Math.random hex

Constructor takes Partial<BaseShape<TData>> for flexible instantiation.

Create `shapes/index.ts` re-exporting BaseShape.

Add JSDoc on the class and every abstract method.
```

**Commit:** `feat(shapes): implement BaseShape abstract class`

---

### Prompt 03: ShapeRegistry

```
Read CLAUDE.md, `core/types.ts`, `shapes/BaseShape.ts`.

Create `core/ShapeRegistry.ts`:

Singleton class `ShapeRegistry` with:

- private static registry: Map<string, typeof BaseShape>
- static register(ShapeClass: typeof BaseShape): void — stores by ShapeClass.prototype.type. Throw if type already registered.
- static get(type: string): typeof BaseShape | undefined
- static list(): Array<{ type: string; label: string; icon: string; category: ShapeCategory }>
- static create<T extends BaseShape>(type: string, props?: Partial<T>): T — instantiates from registry. Throw if type not found.
- static unregister(type: string): boolean — for testing. Returns true if removed.
- static clear(): void — for testing only.

Export from `core/index.ts`.

All methods get JSDoc.
```

**Commit:** `feat(core): add ShapeRegistry with register/get/list/create`

---

### Prompt 04: Theme tokens and presets

```
Read CLAUDE.md.

Create `theme/tokens.ts`:

Interface `ThemeTokens` with every property from the architecture doc:
- Surface: canvasBg, canvasDot, canvasDotSize (number), canvasGridSize (number)
- Shape chrome: shapeBorder, shapeBorderRadius (number — default 9), shapeShadow, shapeSelectedBorder, shapeHoverBorder
- Typography: fontFamily, fontSizeBase (number), fontSizeSmall (number), fontSizeLarge (number), textColor, textSecondary
- Accent: accentPrimary, accentSecondary, accentDanger
- Interactive: handleColor, handleSize (number), snapGuideColor, selectionRectColor
- Toolbar: toolbarBg, toolbarBorder, toolbarIconColor, toolbarIconActiveColor

Export `DEFAULT_TOKENS: ThemeTokens` with sensible light-mode defaults. shapeBorderRadius must be 9.

Create `theme/presets/light.ts` — export `lightTheme: ThemeTokens` (same as defaults).

Create `theme/presets/dark.ts` — export `darkTheme: ThemeTokens` with dark mode values.

Create `theme/presets/fourCorners.ts` — export `fourCornersTheme: ThemeTokens`. Use CSS variable references as string values where possible: e.g. `canvasBg: 'var(--fc-bg, #ffffff)'`, `accentPrimary: 'var(--fc-accent, #2563eb)'`, `shapeBorderRadius: 9`. This ensures the FC app's existing CSS variables cascade through.

Create `theme/ThemeProvider.ts`:
- Class `ThemeProvider` (framework-agnostic) that:
  - Accepts ThemeTokens
  - Has method `injectCSSVariables(container: HTMLElement)` that sets `--ock-*` CSS variables on the container for every token
  - Has method `getTokens(): ThemeTokens`
  - Has method `setTheme(tokens: ThemeTokens)` with an onChange callback

Create `theme/index.ts` re-exporting tokens, ThemeProvider, and all presets.
```

**Commit:** `feat(theme): add ThemeTokens, presets (light/dark/fourCorners), and ThemeProvider`

---

### Prompt 05: Canvas stage manager

```
Read CLAUDE.md, `core/types.ts`, `theme/tokens.ts`.

Create `core/Canvas.ts`:

Class `Canvas` managing the Konva stage lifecycle:

Constructor args: { container: HTMLElement | string, width: number, height: number, theme: ThemeTokens }

Properties:
- stage: Konva.Stage (create in constructor)
- backgroundLayer: Konva.Layer (grid dots, zone boundaries — listening: false)
- contentLayer: Konva.Layer (all shapes)
- chromeLayer: Konva.Layer (selection handles, snap guides — on top)
- camera: CameraState (x, y, zoom — default 0, 0, 1)
- mode: CanvasMode (default 'edit')
- theme: ThemeTokens

Methods:
- setCamera(camera: Partial<CameraState>): void — updates stage position/scale, redraws background grid
- setMode(mode: CanvasMode): void — toggles draggable on content layer shapes, updates listening
- setTheme(theme: ThemeTokens): void — updates theme, redraws background
- getViewport(): Rect — returns visible area in canvas coordinates accounting for camera
- toCenter(): void — resets camera to center of content bounds
- fitToContent(padding?: number): void — zoom to fit all shapes
- destroy(): void — cleanup stage and layers

Private methods:
- drawGrid(): void — renders dot grid on backgroundLayer using theme.canvasDot, canvasDotSize, canvasGridSize
- handleWheel(e: Konva.KonvaEventObject<WheelEvent>): void — zoom on scroll (clamp 0.1 to 5)

Set up wheel zoom handler in constructor. Use Konva best practice: scale stage around pointer position.

Export from `core/index.ts`.
```

**Commit:** `feat(core): add Canvas stage manager with camera, layers, and grid`

---

### Prompt 06: PhotoCard shape

```
Read CLAUDE.md, `shapes/BaseShape.ts`, `core/types.ts`, `theme/tokens.ts`.

Create `shapes/PhotoCard.ts`:

Class `PhotoCard extends BaseShape<PhotoCardData>`:

Interface `PhotoCardData`:
- src: string (image URL or data URI)
- thumbnailSrc?: string
- alt: string
- caption?: string
- credit?: string
- dateTaken?: string
- location?: string
- nfLabel?: boolean (nonfiction photography label)

type = 'photo-card', label = 'Photo', icon = 'image', category = 'media'

Default width: 300, height: 225

render(ctx): Returns a Konva.Group containing:
- Rect for card background (fill from theme.canvasBg, cornerRadius from theme.shapeBorderRadius, stroke from theme.shapeBorder or theme.shapeSelectedBorder if ctx.selected)
- Konva.Image for the photo (clipped to card bounds with cornerRadius)
- If caption exists: Konva.Text below image (font from theme, color from theme.textColor)
- If nfLabel: small "NF" badge in top-left corner (accent color from theme)

renderThumbnail(): simplified version — just the image rect, no text

serialize(): map all properties + data to ShapeJSON
deserialize(json): restore from ShapeJSON

getEditableFields(): returns FieldDefinition[] for src (image), alt (text), caption (textarea), credit (text), dateTaken (text), location (text), nfLabel (select with options ['true', 'false'])

validate(): valid if src is non-empty and alt is non-empty

toProtocol(): returns { type: 'photograph', src, alt, caption, credit, dateTaken, location, nonfiction: nfLabel }

Register with ShapeRegistry at bottom of file.

Update `shapes/index.ts` to re-export PhotoCard and PhotoCardData.
```

**Commit:** `feat(shapes): implement PhotoCard shape with NF label support`

---

### Prompt 07: TextBlock shape

```
Read CLAUDE.md, `shapes/BaseShape.ts`, `core/types.ts`.

Create `shapes/TextBlock.ts`:

Class `TextBlock extends BaseShape<TextBlockData>`:

Interface `TextBlockData`:
- content: string
- fontSize?: number (defaults to theme.fontSizeBase)
- fontStyle?: 'normal' | 'bold' | 'italic'
- align?: 'left' | 'center' | 'right'
- backgroundColor?: string (optional, for note-style blocks)

type = 'text-block', label = 'Text', icon = 'type', category = 'text'

Default width: 250, height: 100

render(ctx): Konva.Group with:
- Optional Rect background if backgroundColor set (cornerRadius from theme)
- Konva.Text with content, using theme fonts and colors
- If ctx.selected: dashed border rect

renderThumbnail(): just the text, smaller font

serialize/deserialize: standard roundtrip
getEditableFields(): content (textarea), fontSize (number), fontStyle (select), align (select), backgroundColor (text)
validate(): valid if content is non-empty

Register with ShapeRegistry. Update `shapes/index.ts`.
```

**Commit:** `feat(shapes): implement TextBlock shape`

---

### Prompt 08: ZoneShape

```
Read CLAUDE.md, `shapes/BaseShape.ts`, `core/types.ts`.

Create `shapes/ZoneShape.ts`:

Class `ZoneShape extends BaseShape<ZoneData>`:

Interface `ZoneData`:
- label: string (e.g. 'backstory', 'related-imagery', 'links', 'authorship', 'center')
- color?: string (zone tint color, defaults to transparent)
- collapsed?: boolean

type = 'zone', label = 'Zone', icon = 'square-dashed', category = 'container'

Default width: 400, height: 400

render(ctx): Konva.Group with:
- Rect with dashed stroke (color from data.color or theme.shapeBorder, dash: [8, 4])
- Subtle fill (zone color at 0.05 opacity)
- Konva.Text label in top-left (bold, theme.textSecondary color, small font)
- If collapsed: render as a smaller collapsed indicator with just the label

This shape is NOT draggable in edit mode by default (zones are layout containers).
Override onDragEnd to snap to grid.

serialize/deserialize: include label, color, collapsed in data
getEditableFields(): label (text), color (text — hex input), collapsed (select true/false)
validate(): valid if label is non-empty

toProtocol(): returns { type: 'zone', label: data.label, bounds: { x, y, width, height } }

Register with ShapeRegistry. Update `shapes/index.ts`.
```

**Commit:** `feat(shapes): implement ZoneShape container`

---

### Prompt 09: React bindings — CanvasProvider, CanvasView, ShapeRenderer

```
Read CLAUDE.md, all core/ files, all shapes/ files, `theme/`.

Create `react/CanvasProvider.tsx`:
- React context provider wrapping the core Canvas engine
- Props: { theme?: ThemeTokens (default fourCornersTheme), mode?: CanvasMode (default 'edit'), children: React.ReactNode }
- Creates Canvas instance in useEffect, stores in context
- Re-creates on theme change
- Context value: { canvas: Canvas | null, mode: CanvasMode, theme: ThemeTokens }

Create `react/CanvasView.tsx`:
- The main component. Renders a div container that the Konva Stage mounts into.
- Props: { mode?: CanvasMode, className?: string, style?: React.CSSProperties, onReady?: (canvas: Canvas) => void }
- Uses react-konva's Stage, Layer components
- Renders ShapeRenderer for each shape in the registry
- Handles resize (ResizeObserver on container div)

Create `react/ShapeRenderer.tsx`:
- Given a BaseShape instance, calls shape.render(ctx) and returns the Konva nodes
- Handles the HTML overlay: if shape.renderOverlay exists, wraps it in the Html component from react-konva-utils
- Passes CanvasRenderContext built from current theme, mode, camera, and selection state

Create `react/index.ts` re-exporting CanvasProvider, CanvasView, ShapeRenderer.

These are the minimal React bindings to get a canvas rendering shapes on screen.
```

**Commit:** `feat(react): add CanvasProvider, CanvasView, and ShapeRenderer`

---

### Prompt 10: React hooks — useCanvas, useShapes, useCamera, useMode

```
Read CLAUDE.md, `react/CanvasProvider.tsx`, `core/Canvas.ts`.

Create `react/hooks/useCanvas.ts`:
- Returns the Canvas instance from CanvasProvider context
- Throws if used outside provider

Create `react/hooks/useShapes.ts`:
- Hook for CRUD operations on shapes
- Returns: { shapes: BaseShape[], add(shape: BaseShape): void, remove(id: string): void, update(id: string, props: Partial<BaseShape>): void, get(id: string): BaseShape | undefined, clear(): void }
- Manages shapes in state, syncs with Canvas contentLayer
- add() also calls shape.render(ctx) and adds the Konva node to contentLayer

Create `react/hooks/useCamera.ts`:
- Returns: { camera: CameraState, setCamera(c: Partial<CameraState>): void, zoomIn(): void, zoomOut(): void, resetView(): void, fitToContent(): void }
- Wraps Canvas.setCamera with React state sync

Create `react/hooks/useMode.ts`:
- Returns: { mode: CanvasMode, setMode(m: CanvasMode): void }
- Wraps Canvas.setMode with React state

Create `react/hooks/index.ts` re-exporting all hooks.

Update `react/index.ts` to also export hooks.
```

**Commit:** `feat(react): add useCanvas, useShapes, useCamera, useMode hooks`

---

### Prompt 11: Package entry point and build verification

```
Create `index.ts` at project root:

Re-export everything from:
- core/index.ts (types, Canvas, ShapeRegistry, etc.)
- shapes/index.ts (BaseShape, PhotoCard, TextBlock, ZoneShape)
- theme/index.ts (ThemeTokens, presets, ThemeProvider)

Do NOT re-export react/ from root — that's a separate entry point (`react/index.ts` → `dist/react.mjs`).

Also create `react/index.ts` if not already done, exporting:
- CanvasProvider, CanvasView, ShapeRenderer
- All hooks

Run: npm install
Run: npm run typecheck
Run: npm run build

Fix any type errors. The build should produce dist/ with index.js, index.mjs, index.d.ts, react.js, react.mjs, react.d.ts, theme.js, theme.mjs, theme.d.ts.
```

**Commit:** `chore: wire up entry points and verify build`

---

## DAY 2 — Rich Media + Interactions + Bridge

---

### Prompt 12: ImageLoader

```
Read CLAUDE.md, `shapes/PhotoCard.ts`.

Create `media/ImageLoader.ts`:

Class `ImageLoader` with static methods:

- static async loadImage(src: string): Promise<HTMLImageElement> — returns a promise that resolves when the image loads
- static async loadProgressive(thumbnailSrc: string, fullSrc: string, onThumbnail: (img: HTMLImageElement) => void, onFull: (img: HTMLImageElement) => void): Promise<void> — loads thumbnail first, calls onThumbnail, then loads full, calls onFull
- static createPlaceholder(width: number, height: number, color?: string): HTMLCanvasElement — returns a canvas element with a colored rect and loading indicator (simple spinner drawn with canvas 2d)
- static shouldLoadFull(zoom: number, threshold?: number): boolean — returns true if zoom > threshold (default 0.5)

Create `media/index.ts` re-exporting ImageLoader.

No external dependencies. Uses native Image() constructor and Canvas 2D API.
```

**Commit:** `feat(media): add ImageLoader with progressive loading pipeline`

---

### Prompt 13: AudioEngine + VoiceNote shape

```
Read CLAUDE.md, `shapes/BaseShape.ts`, `media/ImageLoader.ts`.

Create `media/AudioEngine.ts`:

Class `AudioEngine`:
- private recorder: MediaRecorder | null
- private stream: MediaStream | null
- private chunks: Blob[]

Methods:
- async startRecording(): Promise<void> — getUserMedia, detect mime type (webm/opus → webm → mp4 → wav), create MediaRecorder, collect chunks
- stopRecording(): Promise<Blob> — stop recorder, return assembled blob
- isRecording(): boolean
- static detectMimeType(): string — priority: audio/webm;codecs=opus, audio/webm, audio/mp4, audio/wav
- static async generateWaveform(blob: Blob): Promise<Float32Array> — Web Audio API → AnalyserNode → normalized amplitude array
- destroy(): void — stop stream tracks, cleanup

Document the iOS Safari gotcha in comments: single getUserMedia stream shared between recorder and visualizer.

Create `shapes/VoiceNote.ts`:

Class `VoiceNote extends BaseShape<VoiceNoteData>`:

Interface VoiceNoteData:
- audioUrl?: string (blob URL or remote URL)
- waveform?: number[] (normalized amplitudes 0-1)
- duration?: number (seconds)
- recordedAt?: string (ISO date)

type = 'voice-note', label = 'Voice Note', icon = 'mic', category = 'media'

Default width: 280, height: 80

render(ctx): Konva.Group with:
- Rect background (theme colors, cornerRadius)
- If waveform data: render as a series of Konva.Line segments (the waveform visualization)
- If no waveform: Konva.Text placeholder "Record audio"
- Duration text in bottom-right if available

renderOverlay(): Returns a React element with a simple audio player (play/pause button + progress). This is the HTML overlay. Keep it minimal — a <div> with an <audio> element and a button.

Static fallback for export: the waveform visualization only (no interactive player).

serialize/deserialize, getEditableFields (audioUrl as text, recordedAt as text), validate (valid if audioUrl exists).

Register with ShapeRegistry. Update shapes/index.ts and media/index.ts.
```

**Commit:** `feat(media): add AudioEngine and VoiceNote shape with waveform`

---

### Prompt 14: LinkPreview + LinkCard shape

```
Read CLAUDE.md, `shapes/BaseShape.ts`.

Create `media/LinkPreview.ts`:

Class `LinkPreview`:
- static async fetch(url: string, apiEndpoint?: string): Promise<LinkPreviewData> — if apiEndpoint provided, POST to it (this is for server-side OG fetching via the app's /api/link-preview route). If not, return a basic preview with just the URL and domain extracted from the string.

Interface LinkPreviewData:
- url: string
- title?: string
- description?: string
- image?: string (OG image URL)
- favicon?: string
- domain: string (extracted from URL)

Create `shapes/LinkCard.ts`:

Class `LinkCard extends BaseShape<LinkCardData>`:

Interface LinkCardData extends LinkPreviewData (same fields)

type = 'link-card', label = 'Link', icon = 'link', category = 'media'

Default width: 300, height: 100

render(ctx): Konva.Group with:
- Rect card background (theme colors)
- If favicon loaded: small Konva.Image in left area
- Konva.Text for title (bold, clipped to width)
- Konva.Text for domain (secondary color, small font)
- If description: Konva.Text truncated to 2 lines

renderOverlay(): clickable link that opens URL in new tab. <a> element styled as transparent overlay.

serialize/deserialize, getEditableFields (url as url type, title as text, description as textarea)
validate(): valid if url is non-empty

Register with ShapeRegistry. Update shapes/index.ts and media/index.ts.
```

**Commit:** `feat(media): add LinkPreview fetcher and LinkCard shape`

---

### Prompt 15: VideoEngine + VideoEmbed shape

```
Read CLAUDE.md, `shapes/BaseShape.ts`.

Create `media/VideoEngine.ts`:

Class `VideoEngine`:
- static createVideoElement(src: string): HTMLVideoElement — creates video element with crossorigin, preload metadata
- static async getPosterFrame(video: HTMLVideoElement): Promise<HTMLCanvasElement> — seeks to 0, draws frame to canvas, returns it
- static syncToCanvas(video: HTMLVideoElement, konvaImage: any, animation: any): void — starts a Konva.Animation that redraws the konvaImage from the video element each frame. Stops when video pauses.

Create `shapes/VideoEmbed.ts`:

Class `VideoEmbed extends BaseShape<VideoData>`:

Interface VideoData:
- src: string (video URL)
- posterSrc?: string
- duration?: number
- muted?: boolean

type = 'video-embed', label = 'Video', icon = 'video', category = 'media'

Default width: 320, height: 180

render(ctx): Konva.Group with:
- Rect background
- If in edit mode: show poster frame as Konva.Image with a play icon overlay (Konva.RegularPolygon triangle)
- If in view mode: the HTML overlay handles playback

renderOverlay(): <video> element with native controls, sized to match shape bounds. Only rendered in view/present mode.

Static fallback: poster frame image.

Register, update exports.
```

**Commit:** `feat(media): add VideoEngine and VideoEmbed shape`

---

### Prompt 16: TouchManager

```
Read CLAUDE.md, `core/Canvas.ts`.

Create `mobile/TouchManager.ts`:

Class `TouchManager`:

Constructor: (stage: Konva.Stage, canvas: Canvas)

Listens to stage touch events and translates to higher-level gestures:

- Single finger drag → pan canvas (if no shape hit) or move shape (if shape hit)
- Two finger pinch → zoom (around midpoint of fingers)
- Long press (500ms threshold) → emits 'longpress' event with position
- Double tap (300ms threshold) → emits 'doubletap' event with target
- Two finger rotate → optional, disabled by default

Properties:
- enabled: boolean (default true)
- pinchZoomEnabled: boolean (default true)
- rotateEnabled: boolean (default false)

Methods:
- enable(): void
- disable(): void
- destroy(): void — remove all listeners

Implementation notes in comments:
- Set Konva.hitOnDragEnabled = true in constructor
- Track touch start positions for gesture detection
- Use touch identifier to track individual fingers
- Emit events via a simple EventEmitter pattern (implement a minimal one, no dependency)

Create `mobile/index.ts` re-exporting TouchManager.
```

**Commit:** `feat(mobile): add TouchManager with pinch-zoom, pan, long-press, double-tap`

---

### Prompt 17: ViewportOptimizer + PerformanceMonitor

```
Read CLAUDE.md, `core/Canvas.ts`, `core/types.ts`.

Create `mobile/ViewportOptimizer.ts`:

Class `ViewportOptimizer`:

Constructor: (canvas: Canvas, buffer?: number — default 200px)

Method `onCameraMove(viewport: Rect)`: iterates all shapes on contentLayer. For each:
- Calculate if shape bounds intersect viewport (expanded by buffer)
- Set konvaNode.visible(visible)
- Set konvaNode.listening(visible && mode === 'edit')

Method `getVisibleCount()`: returns number of currently visible shapes

This is the single biggest mobile performance win.

Create `mobile/PerformanceMonitor.ts`:

Class `PerformanceMonitor`:

Constructor: (canvas: Canvas, fpsThreshold?: number — default 24, durationMs?: number — default 500)

Uses Konva.Animation to track frame times. If average FPS drops below threshold for durationMs:
1. Disable shadows on all shapes (shape.shadowEnabled(false))
2. Set Konva.pixelRatio = 1
3. Enable caching on complex groups (group.cache())
4. Switch images to thumbnail resolution (emit event for ImageLoader to handle)

When FPS recovers above threshold + 6 for durationMs, reverse in order.

Methods:
- start(): void
- stop(): void
- getFPS(): number
- isDowngraded(): boolean

Update `mobile/index.ts` to export both.
```

**Commit:** `feat(mobile): add ViewportOptimizer and PerformanceMonitor`

---

### Prompt 18: SnapEngine

```
Read CLAUDE.md, `core/types.ts`, `core/Canvas.ts`.

Create `core/SnapEngine.ts`:

Class `SnapEngine`:

Constructor: (canvas: Canvas, gridSize?: number — from theme.canvasGridSize)

Two snap modes:

Grid snap:
- snapToGrid(point: Point): Point — rounds to nearest grid intersection

Object snap:
- snapToObjects(shape: BaseShape, allShapes: BaseShape[], threshold?: number — default 10): { snappedPoint: Point, guides: SnapGuide[] }
- Checks edges and centers of the dragged shape against edges and centers of all other shapes
- Returns the snapped position and an array of SnapGuide lines to render

Interface SnapGuide: { orientation: 'horizontal' | 'vertical', position: number, start: number, end: number }

Methods:
- setEnabled(enabled: boolean): void
- setGridSnap(enabled: boolean): void
- setObjectSnap(enabled: boolean): void
- renderGuides(guides: SnapGuide[], layer: Konva.Layer): void — draws dashed lines on the chrome layer using theme.snapGuideColor
- clearGuides(layer: Konva.Layer): void

Export from core/index.ts.
```

**Commit:** `feat(core): add SnapEngine with grid and object snapping`

---

### Prompt 19: SelectionManager + HistoryStack

```
Read CLAUDE.md, `core/types.ts`, `core/Canvas.ts`.

Create `core/SelectionManager.ts`:

Class `SelectionManager`:

Constructor: (canvas: Canvas)

Properties:
- selectedIds: Set<string>
- transformerNode: Konva.Transformer (create in constructor, add to chromeLayer)

Methods:
- select(id: string): void — single select, update transformer attachments
- addToSelection(id: string): void — multi-select (shift+click)
- deselect(id: string): void
- deselectAll(): void
- isSelected(id: string): boolean
- getSelectedShapes(): BaseShape[]
- onSelectionChange: callback ((ids: string[]) => void)

Transformer config: use theme.handleColor, theme.handleSize. Enable rotation handle only if all selected shapes allow it.

Create `core/HistoryStack.ts`:

Command pattern undo/redo:

Interface Command:
- execute(): void
- undo(): void
- description: string

Class `HistoryStack`:

Constructor: (maxSize?: number — default 50)

Methods:
- push(command: Command): void — executes command and adds to stack, clears redo stack
- undo(): void — pops last command, calls undo()
- redo(): void — re-executes from redo stack
- canUndo(): boolean
- canRedo(): boolean
- clear(): void
- getHistory(): string[] — returns descriptions

Export both from core/index.ts.
```

**Commit:** `feat(core): add SelectionManager and HistoryStack (undo/redo)`

---

### Prompt 20: GuidedCapture interaction

```
Read CLAUDE.md, `core/types.ts`, `shapes/`.

Create `interactions/GuidedCapture.ts`:

Interface `CaptureStep`:
- id: string
- type: 'add-photo' | 'record-voice' | 'add-text' | 'add-link' | 'add-video'
- prompt: string (shown to user)
- zone?: string (which zone the resulting shape lands in)
- required?: boolean
- completed?: boolean

Class `GuidedCapture`:

Constructor: (steps: CaptureStep[])

Properties:
- steps: CaptureStep[]
- currentStepIndex: number (default 0)

Methods:
- getCurrentStep(): CaptureStep | null
- completeStep(shapeId: string): void — marks current step completed, advances index
- skipStep(): void — advances without completing
- goToStep(index: number): void
- isComplete(): boolean
- getProgress(): { completed: number, total: number, percentage: number }
- reset(): void
- onStepChange: callback ((step: CaptureStep, index: number) => void)

Export preset step sequences:

WITNESS_STEPS: CaptureStep[] — citizen journalist flow:
1. add-photo, "Add your photograph", zone: 'center', required
2. record-voice, "Describe what you witnessed", zone: 'backstory'
3. add-text, "When and where was this taken?", zone: 'authorship', required
4. add-link, "Link to related coverage", zone: 'links'
5. add-photo, "Add any related images", zone: 'related-imagery'

DEADLINE_STEPS: CaptureStep[] — professional journalist (faster, fewer steps):
1. add-photo, "Main photograph", zone: 'center', required
2. add-text, "Caption and credit", zone: 'authorship', required
3. add-link, "Publication link", zone: 'links'

FIELDWORK_STEPS: CaptureStep[] — NGO:
1. add-photo, "Primary documentation image", zone: 'center', required
2. add-text, "Detailed caption with consent information", zone: 'authorship', required
3. record-voice, "Field notes and context", zone: 'backstory'
4. add-photo, "Related documentation", zone: 'related-imagery'
5. add-link, "Organization and project links", zone: 'links', required

Create `interactions/index.ts` re-exporting GuidedCapture and all step presets.
```

**Commit:** `feat(interactions): add GuidedCapture with persona-specific step presets`

---

### Prompt 21: Serializer

```
Read CLAUDE.md, `core/types.ts`, `core/ShapeRegistry.ts`.

Create `core/Serializer.ts`:

Class `Serializer`:

Static methods:

- static serialize(canvas: Canvas, shapes: BaseShape[]): CanvasDocument
  Builds the full CanvasDocument JSON:
  - version: '0.1.0'
  - canvas: { width, height, camera (from canvas), theme name, gridSize }
  - shapes: shapes.map(s => s.serialize())
  - zones: filter shapes by type 'zone', map to ZoneJSON (calculate which shape IDs fall within each zone's bounds)
  - connections: [] (empty for now, extensibility point)

- static deserialize(doc: CanvasDocument): { canvasConfig: {...}, shapes: BaseShape[] }
  Reconstructs shapes from JSON using ShapeRegistry.create() then shape.deserialize().
  Returns canvas config and shape instances (does NOT create a Canvas — that's the caller's job).

- static toJSON(doc: CanvasDocument): string — JSON.stringify with 2-space indent
- static fromJSON(json: string): CanvasDocument — JSON.parse with validation

- static validate(doc: CanvasDocument): ValidationResult
  Checks: version exists, shapes array exists, all shape types are registered, no duplicate IDs.

Export from core/index.ts.
```

**Commit:** `feat(core): add Serializer for CanvasDocument roundtrip`

---

### Prompt 22: useBridge hook

```
Read CLAUDE.md, `react/hooks/`, `core/Serializer.ts`.

Create `react/hooks/useBridge.ts`:

Interface `BridgeConfig<TExternal>`:
- toExternal: (doc: CanvasDocument) => TExternal — maps canvas state to your schema
- fromExternal: (data: TExternal) => CanvasDocument — maps your schema to canvas state
- onSave?: (data: TExternal) => void | Promise<void> — called on autosave
- autoSave?: boolean (default false)
- debounceMs?: number (default 1000)

Hook `useBridge<TExternal>(config: BridgeConfig<TExternal>)`:

Returns:
- sync(): void — manually trigger save (serialize canvas → toExternal → onSave)
- load(data: TExternal): void — fromExternal → deserialize → populate canvas
- isDirty: boolean — true if canvas has changed since last save
- isSaving: boolean — true during async onSave
- lastSaved: Date | null

Implementation:
- Uses useCanvas() and useShapes() internally
- If autoSave, sets up a debounced effect that calls sync() on shape changes
- Debounce: use a simple setTimeout/clearTimeout pattern, no lodash

This hook is the bridge between the library and the consuming app's data model.

Update react/hooks/index.ts and react/index.ts.
```

**Commit:** `feat(react): add useBridge hook for external store sync`

---

### Prompt 23: SafeAreaManager

```
Read CLAUDE.md, `mobile/`.

Create `mobile/SafeAreaManager.ts`:

Class `SafeAreaManager`:

Constructor: (container: HTMLElement)

Reads CSS environment variables:
- env(safe-area-inset-top)
- env(safe-area-inset-bottom)
- env(safe-area-inset-left)
- env(safe-area-inset-right)

Methods:
- getInsets(): { top: number, bottom: number, left: number, right: number }
  Reads computed values from a probe element. Returns 0 for non-iOS.
- getCanvasBounds(containerRect: DOMRect): Rect
  Returns adjusted bounds excluding safe area insets.
- getToolbarStyle(): React.CSSProperties
  Returns positioning styles matching the fc-view-controls pattern: position fixed, bottom with safe-area-inset-bottom padding.
- applyToContainer(container: HTMLElement): void
  Sets CSS custom properties --ock-safe-top, --ock-safe-bottom, etc. on the container.
- static getMinTouchTarget(): number
  Returns 44 (Apple HIG minimum).

Update mobile/index.ts.
```

**Commit:** `feat(mobile): add SafeAreaManager with iOS safe area support`

---

### Prompt 24: Remaining interactions (DragDrop, ContextMenu, DoubleTapEdit)

```
Read CLAUDE.md, `core/`, `interactions/GuidedCapture.ts`.

Create `interactions/DragDrop.ts`:

Class `DragDrop`:
- Constructor: (canvas: Canvas)
- Method enableExternalDrop(onDrop: (type: string, position: Point) => void): void
  Sets up dragover/drop listeners on the canvas container.
  Reads dataTransfer to get shape type, calculates canvas position from mouse/touch position accounting for camera transform.
- Method disable(): void

Create `interactions/ContextMenu.ts`:

Interface ContextMenuItem: { label: string, icon?: string, action: () => void, divider?: boolean, disabled?: boolean }

Class `ContextMenu`:
- Constructor: (canvas: Canvas)
- Method show(position: Point, items: ContextMenuItem[]): void
  Emits event with position and items. The React layer renders the actual menu.
  (This class is framework-agnostic; it just manages state.)
- Method hide(): void
- Property visible: boolean
- Property items: ContextMenuItem[]
- Property position: Point

Preset item builders:
- static shapeItems(shape: BaseShape): ContextMenuItem[] — Edit, Duplicate, Delete, Lock/Unlock
- static canvasItems(): ContextMenuItem[] — Add Shape submenu, Paste, Toggle Grid, Reset View

Create `interactions/DoubleTapEdit.ts`:

Class `DoubleTapEdit`:
- Constructor: (canvas: Canvas)
- Listens for dblclick on shapes. When triggered, emits 'edit' event with the shape.
- For TextBlock shapes: makes the text editable inline (Konva's text editing pattern — hide Konva.Text, show a positioned <textarea>)
- Method enable/disable

Update `interactions/index.ts`.
```

**Commit:** `feat(interactions): add DragDrop, ContextMenu, and DoubleTapEdit`

---

### Prompt 25: HtmlOverlay + Toolbar React components

```
Read CLAUDE.md, `react/`.

Create `react/HtmlOverlay.tsx`:

Component that wraps react-konva-utils Html component with additional features:
- Props: { shape: BaseShape, mode: CanvasMode, camera: CameraState, children: React.ReactNode }
- Positions children in canvas coordinates matching the shape's position
- Scales with camera zoom
- Only renders children if mode is 'view' or 'present' (in edit mode, shapes handle their own overlays)
- Applies pointer-events: none in edit mode, auto in view mode

Create `react/Toolbar.tsx`:

Extensible toolbar component:
- Props: { position?: 'top' | 'bottom' (default bottom), items: ToolbarItem[], className?: string }
- Interface ToolbarItem: { id: string, icon: string, label: string, action: () => void, active?: boolean, disabled?: boolean, group?: string }
- Renders a fixed toolbar with icon buttons
- Groups items with dividers
- Applies theme.toolbarBg, toolbarBorder, toolbarIconColor, toolbarIconActiveColor
- Bottom position includes safe-area-inset-bottom padding (reads --ock-safe-bottom CSS var)

Update react/index.ts.
```

**Commit:** `feat(react): add HtmlOverlay and Toolbar components`

---

### Prompt 26: Final exports, build, and verification

```
Read CLAUDE.md.

Update `index.ts` (root) to export:
- Everything from core/index.ts
- Everything from shapes/index.ts
- Everything from media/index.ts
- Everything from mobile/index.ts
- Everything from interactions/index.ts

Update `react/index.ts` to export:
- CanvasProvider, CanvasView, ShapeRenderer, HtmlOverlay, Toolbar
- All hooks

Update `theme/index.ts` to export:
- ThemeTokens, DEFAULT_TOKENS, ThemeProvider
- lightTheme, darkTheme, fourCornersTheme

Ensure every index.ts has proper named exports (no default exports in a library).

Run:
1. npm run typecheck — fix all errors
2. npm run build — verify dist/ output has all entry points
3. Verify dist/index.d.ts exports all public types

If there are circular dependency issues, refactor imports to go through index files.

Create a brief CHANGELOG.md:
## 0.1.0
- Initial release
- Core engine: Canvas, ShapeRegistry, SnapEngine, SelectionManager, HistoryStack, Serializer
- Shapes: PhotoCard, TextBlock, VoiceNote, LinkCard, VideoEmbed, ZoneShape
- Media: ImageLoader, AudioEngine, VideoEngine, LinkPreview
- Mobile: TouchManager, ViewportOptimizer, PerformanceMonitor, SafeAreaManager
- Theme: token system with light/dark/fourCorners presets
- Interactions: DragDrop, ContextMenu, DoubleTapEdit, GuidedCapture
- React: CanvasProvider, CanvasView, ShapeRenderer, HtmlOverlay, Toolbar
- Hooks: useCanvas, useShapes, useCamera, useMode, useBridge
```

**Commit:** `chore: finalize exports, verify build, add CHANGELOG`

---

## Post-build: Integration prompt (for the 4C app, not this library)

This prompt is for later — when integrating the library into the Writing with Light Next.js app.

```
We have published @fourcorners/canvas. Now integrate it into the Writing with Light app.

1. Install: npm install @fourcorners/canvas

2. Create `lib/canvas-bridge.ts`:
   - Function canvasToFourCorners(doc: CanvasDocument): maps zones to the four corners schema, extracts central image, NF label, all metadata
   - Function fourCornersToCanvas(metadata: FourCornersMetadata): reverse mapping

3. Create a new layout mode 'canvas' activated via the existing ?layout= URL param and setLayoutMode() store method.

4. In the canvas layout component:
   - <CanvasProvider theme={fourCornersTheme}>
   - <CanvasView mode={isEditing ? 'edit' : 'view'} />
   - useBridge({ store: useZustandStore, toExternal: canvasToFourCorners, fromExternal: fourCornersToCanvas, autoSave: true })

5. The bridge should keep useAutosave and useLocalPersistence untouched — useBridge syncs to the same Zustand store they already read from.

6. Style with existing var(--fc-*) CSS variables. The fourCorners theme preset handles the mapping.

7. Toolbar uses the existing fc-view-controls CSS class pattern with safe-area-inset-bottom.
```

*This integration prompt is reference only — run it when the library is published and ready.*
