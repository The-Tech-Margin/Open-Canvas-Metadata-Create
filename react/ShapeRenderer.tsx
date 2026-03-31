/**
 * @module react/ShapeRenderer
 * Maps a BaseShape instance to Konva nodes, with optional HTML overlay.
 */

import React, { useMemo } from "react";
import { Group } from "react-konva";
import { Html } from "react-konva-utils";
import type { BaseShape } from "../shapes/BaseShape";
import type {
  CanvasRenderContext,
  CanvasMode,
  CameraState,
  ThemeTokens,
} from "../core/types";

/** Props for {@link ShapeRenderer}. */
export interface ShapeRendererProps {
  /** The shape instance to render. */
  shape: BaseShape;
  /** Active theme tokens. */
  theme: ThemeTokens;
  /** Current canvas mode. */
  mode: CanvasMode;
  /** Current camera state. */
  camera: CameraState;
  /** Whether this shape is currently selected. */
  selected?: boolean;
}

/**
 * Renders a single shape as Konva nodes.
 * If the shape implements `renderOverlay()`, wraps the overlay
 * in an Html component from react-konva-utils positioned at the shape's location.
 */
export function ShapeRenderer({
  shape,
  theme,
  mode,
  camera,
  selected = false,
}: ShapeRendererProps) {
  const ctx: CanvasRenderContext = useMemo(
    () => ({ theme, mode, camera, selected }),
    [theme, mode, camera, selected],
  );

  const konvaNodes = useMemo(() => shape.render(ctx), [shape, ctx]);

  const overlay = useMemo(() => {
    if (shape.renderOverlay) {
      return shape.renderOverlay();
    }
    return null;
  }, [shape, mode]);

  return (
    <Group>
      {konvaNodes}
      {overlay && (
        <Html
          groupProps={{
            x: shape.x,
            y: shape.y,
          }}
          divProps={{
            style: {
              pointerEvents: mode === "edit" ? "none" : "auto",
            },
          }}
        >
          {overlay as React.ReactElement}
        </Html>
      )}
    </Group>
  );
}
