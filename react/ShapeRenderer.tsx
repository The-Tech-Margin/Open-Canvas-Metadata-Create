/**
 * @module react/ShapeRenderer
 * Maps a BaseShape instance to Konva nodes, with built-in selection,
 * drag+snap, and context menu support.
 */

import React, { useEffect, useMemo, useRef } from "react";
import Konva from "konva";
import { Group } from "react-konva";
import { Html } from "react-konva-utils";
import type { BaseShape } from "../shapes/BaseShape";
import type {
  CanvasRenderContext,
  CanvasMode,
  CameraState,
  ThemeTokens,
} from "../core/types";
import { ContextMenu } from "../interactions/ContextMenu";
import { useCanvasContext } from "./CanvasProvider";

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
  /** All shapes on the canvas (for object snapping). */
  allShapes?: BaseShape[];
  /** Callback to delete a shape. */
  onShapeDelete?: (id: string) => void;
  /** Callback when a shape is double-clicked for editing. */
  onShapeEdit?: (id: string) => void;
}

/**
 * Renders a single shape as Konva nodes with built-in interaction wiring.
 *
 * - Click/tap to select (Shift/Cmd for multi-select)
 * - Drag with snap in edit mode
 * - Right-click context menu
 * - HTML overlay for interactive elements
 */
export const ShapeRenderer = React.memo(function ShapeRenderer({
  shape,
  theme,
  mode,
  camera,
  selected = false,
  allShapes,
  onShapeDelete,
  onShapeEdit,
}: ShapeRendererProps) {
  const groupRef = useRef<Konva.Group>(null);
  const {
    selectionManager,
    snapEngine,
    historyStack,
    contextMenu,
  } = useCanvasContext();

  const ctx: CanvasRenderContext = useMemo(
    () => ({ theme, mode, camera, selected }),
    [theme, mode, camera, selected],
  );

  // Render shape nodes imperatively into the Group
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    group.destroyChildren();
    const node = shape.render(ctx);
    if (node) {
      group.add(node);
    }
    group.getLayer()?.batchDraw();
  }, [shape, ctx]);

  // Selection: click/tap to select
  useEffect(() => {
    const group = groupRef.current;
    if (!group || !selectionManager) return;

    const handler = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true;
      const evt = e.evt as MouseEvent;
      if (evt.shiftKey || evt.metaKey || evt.ctrlKey) {
        selectionManager.addToSelection(shape.id);
      } else {
        selectionManager.select(shape.id);
      }
    };

    group.on("click tap", handler);
    return () => {
      group.off("click tap");
    };
  }, [shape.id, selectionManager]);

  // Drag: snap + history in edit mode
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const isDraggable = mode === "edit" && !shape.locked;
    group.draggable(isDraggable);

    if (!isDraggable) return;

    const prevX = shape.x;
    const prevY = shape.y;

    const onDragMove = () => {
      if (!snapEngine || !allShapes) return;
      const pos = group.position();
      const tempShape = Object.create(shape);
      tempShape.x = pos.x;
      tempShape.y = pos.y;
      const others = allShapes.filter((s) => s.id !== shape.id);
      const { snappedPoint } = snapEngine.snapToObjects(tempShape, others);
      group.position(snappedPoint);
    };

    const onDragEnd = () => {
      const finalPos = group.position();
      snapEngine?.clearGuides(
        group.getStage()?.findOne(".chromeLayer") as Konva.Layer ??
          (group.getLayer() as Konva.Layer),
      );

      const oldX = prevX;
      const oldY = prevY;
      const newX = finalPos.x;
      const newY = finalPos.y;

      if (oldX === newX && oldY === newY) return;

      shape.x = newX;
      shape.y = newY;

      if (historyStack) {
        // Don't use push() here because execute() would re-set position
        // and we've already moved. Manually add to stack.
        const shapeRef = shape;
        historyStack.push({
          description: `Move ${shape.type}`,
          execute: () => {
            shapeRef.x = newX;
            shapeRef.y = newY;
          },
          undo: () => {
            shapeRef.x = oldX;
            shapeRef.y = oldY;
          },
        });
      }

      // Call shape's onDragEnd hook (e.g. ZoneShape grid snap)
      const adjusted = shape.onDragEnd({ x: newX, y: newY });
      if (adjusted.x !== newX || adjusted.y !== newY) {
        shape.x = adjusted.x;
        shape.y = adjusted.y;
        group.position(adjusted);
      }
    };

    group.on("dragmove", onDragMove);
    group.on("dragend", onDragEnd);
    return () => {
      group.off("dragmove");
      group.off("dragend");
    };
  }, [shape, mode, snapEngine, historyStack, allShapes]);

  // Context menu on right-click
  useEffect(() => {
    const group = groupRef.current;
    if (!group || !contextMenu) return;

    const handler = (e: Konva.KonvaEventObject<PointerEvent | MouseEvent>) => {
      e.evt.preventDefault();
      e.cancelBubble = true;
      const stage = group.getStage();
      const pointer = stage?.getPointerPosition();
      if (!pointer) return;

      const items = ContextMenu.shapeItems(shape);
      // Wire the Delete action
      const deleteItem = items.find((i) => i.label === "Delete");
      if (deleteItem && onShapeDelete) {
        deleteItem.action = () => onShapeDelete(shape.id);
      }
      // Wire the Edit action
      const editItem = items.find((i) => i.label === "Edit");
      if (editItem && onShapeEdit) {
        editItem.action = () => onShapeEdit(shape.id);
      }
      contextMenu.show(pointer, items);
    };

    group.on("contextmenu", handler);
    return () => {
      group.off("contextmenu");
    };
  }, [shape, contextMenu, onShapeDelete, onShapeEdit]);

  // HTML overlay
  const overlay = useMemo(() => {
    if (shape.renderOverlay) {
      return shape.renderOverlay();
    }
    return null;
  }, [shape, mode]);

  return (
    <>
      <Group ref={groupRef} id={`shape-${shape.id}`} />
      {overlay && (
        <Group>
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
        </Group>
      )}
    </>
  );
});
