// @fourcorners/canvas — package entry point

// Core engine
export { Canvas } from "./core/Canvas";
export type { CanvasOptions } from "./core/Canvas";
export { ShapeRegistry } from "./core/ShapeRegistry";
export type {
  Point,
  Size,
  Rect,
  ShapeCategory,
  CanvasMode,
  CameraState,
  ShapeJSON,
  ZoneJSON,
  ConnectionJSON,
  CanvasDocument,
  FieldDefinition,
  ValidationResult,
  CanvasRenderContext,
  ThemeTokens,
} from "./core/types";

// Shapes
export { BaseShape } from "./shapes/BaseShape";
export { PhotoCard } from "./shapes/PhotoCard";
export type { PhotoCardData } from "./shapes/PhotoCard";
export { TextBlock } from "./shapes/TextBlock";
export type { TextBlockData } from "./shapes/TextBlock";
export { ZoneShape } from "./shapes/ZoneShape";
export type { ZoneData } from "./shapes/ZoneShape";

// Theme
export { DEFAULT_TOKENS } from "./theme/tokens";
export { ThemeProvider } from "./theme/ThemeProvider";
export { lightTheme } from "./theme/presets/light";
export { darkTheme } from "./theme/presets/dark";
export { fourCornersTheme } from "./theme/presets/fourCorners";
