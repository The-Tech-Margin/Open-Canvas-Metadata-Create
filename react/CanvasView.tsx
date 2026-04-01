/**
 * @module react/CanvasView
 * Batteries-included canvas component with built-in selection,
 * drag-to-pan, wheel zoom, keyboard shortcuts, touch gestures,
 * snap, undo/redo, and context menu.
 */

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import Konva from "konva";
import { Stage, Layer, Transformer } from "react-konva";
import type { CanvasMode } from "../core/types";
import type { BaseShape } from "../shapes/BaseShape";
import { ContextMenu } from "../interactions/ContextMenu";
import { useCanvasContext } from "./CanvasProvider";
import { useCamera } from "./hooks/useCamera";
import { useSelection } from "./hooks/useSelection";
import { ShapeRenderer } from "./ShapeRenderer";
import { ContextMenuOverlay } from "./ContextMenuOverlay";

/** Props for {@link CanvasView}. */
export interface CanvasViewProps {
  /** Override the mode from CanvasProvider. */
  mode?: CanvasMode;
  /** CSS class name for the container div. */
  className?: string;
  /** Inline styles for the container div. */
  style?: React.CSSProperties;
  /** Callback fired when the canvas engine is ready. */
  onReady?: (canvas: import("../core/Canvas").Canvas) => void;
  /** Child elements rendered inside the Stage (e.g. additional layers). */
  children?: React.ReactNode;
  /** Shapes to render automatically. */
  shapes?: BaseShape[];
  /** Disable built-in wheel zoom. */
  disableWheelZoom?: boolean;
  /** Disable built-in stage drag for panning. */
  disableStageDrag?: boolean;
  /** Disable built-in keyboard shortcuts. */
  disableKeyboardShortcuts?: boolean;
  /** Callback fired when a shape is deleted via keyboard or context menu. */
  onShapeDelete?: (id: string) => void;
  /** Callback fired when a shape is double-clicked for editing. */
  onShapeEdit?: (id: string) => void;
}

/**
 * The main canvas component. Renders a Konva Stage with built-in
 * interactions: wheel zoom, drag-to-pan, click-to-select, keyboard
 * shortcuts, and context menu.
 *
 * Pass `shapes` to render them automatically, or render ShapeRenderer
 * instances as children for full control.
 */
export function CanvasView({
  mode,
  className,
  style,
  onReady,
  children,
  shapes,
  disableWheelZoom,
  disableStageDrag,
  disableKeyboardShortcuts,
  onShapeDelete,
  onShapeEdit,
}: CanvasViewProps) {
  const {
    canvas,
    theme,
    mode: providerMode,
    historyStack,
    contextMenu,
  } = useCanvasContext();

  const currentMode = mode ?? providerMode;
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 600 });
  const { camera, setCamera } = useCamera();
  const { selectedIds, deselectAll } = useSelection();

  // Track shapes for snap engine
  const shapesRef = useRef<BaseShape[]>(shapes ?? []);
  shapesRef.current = shapes ?? [];

  // ResizeObserver to track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(el);
    if (el.clientWidth > 0 && el.clientHeight > 0) {
      setDimensions({ width: el.clientWidth, height: el.clientHeight });
    }

    return () => observer.disconnect();
  }, []);

  // Sync mode override
  useEffect(() => {
    if (canvas && mode) {
      canvas.setMode(mode);
    }
  }, [canvas, mode]);

  // Fire onReady callback
  useEffect(() => {
    if (canvas && onReady) {
      onReady(canvas);
    }
  }, [canvas, onReady]);

  // Update Transformer nodes when selection changes
  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;

    if (currentMode !== "edit" || selectedIds.length === 0) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    const nodes: Konva.Node[] = [];
    for (const id of selectedIds) {
      // Find the Group with matching name inside the stage
      const node = stage.findOne(`#shape-${id}`);
      if (node) nodes.push(node);
    }
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, currentMode]);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      if (disableWheelZoom) return;
      e.evt.preventDefault();
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.05;
      const oldZoom = camera.zoom;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newZoom = Math.min(
        Math.max(oldZoom * Math.pow(scaleBy, direction), 0.1),
        5,
      );

      const mousePointTo = {
        x: (pointer.x - camera.x) / oldZoom,
        y: (pointer.y - camera.y) / oldZoom,
      };

      setCamera({
        zoom: newZoom,
        x: pointer.x - mousePointTo.x * newZoom,
        y: pointer.y - mousePointTo.y * newZoom,
      });
    },
    [camera, setCamera, disableWheelZoom],
  );

  // Stage click/tap on empty area → deselect all
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const clickedOnEmpty =
        e.target === e.target.getStage();
      if (clickedOnEmpty) {
        deselectAll();
        contextMenu?.hide();
      }
    },
    [deselectAll, contextMenu],
  );

  // Stage drag end → update camera
  const handleStageDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const stage = e.target.getStage();
      if (stage && e.target === stage) {
        setCamera({ x: stage.x(), y: stage.y() });
      }
    },
    [setCamera],
  );

  // Context menu on right-click (canvas level)
  const handleContextMenu = useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      if (!contextMenu) return;
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (!pointer) return;

      if (e.target === stage) {
        contextMenu.show(pointer, ContextMenu.canvasItems());
      }
    },
    [contextMenu],
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (disableKeyboardShortcuts) return;
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        historyStack?.undo();
      } else if (isMeta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        historyStack?.redo();
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        if (selectedIds.length > 0 && onShapeDelete) {
          e.preventDefault();
          for (const id of selectedIds) {
            onShapeDelete(id);
          }
          deselectAll();
        }
      } else if (e.key === "Escape") {
        deselectAll();
        contextMenu?.hide();
      }
    };

    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [
    disableKeyboardShortcuts,
    historyStack,
    selectedIds,
    onShapeDelete,
    deselectAll,
    contextMenu,
  ]);

  // Build render context for shapes
  const renderCtx = useMemo(
    () => ({ theme, mode: currentMode, camera }),
    [theme, currentMode, camera],
  );

  return (
    <div
      ref={containerRef}
      className={className}
      tabIndex={0}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: theme.canvasBg,
        outline: "none",
        ...style,
      }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={camera.zoom}
        scaleY={camera.zoom}
        x={camera.x}
        y={camera.y}
        draggable={!disableStageDrag}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onDragEnd={handleStageDragEnd}
        onContextMenu={handleContextMenu}
      >
        <Layer>
          {shapes?.map((shape) => (
            <ShapeRenderer
              key={shape.id}
              shape={shape}
              theme={renderCtx.theme}
              mode={renderCtx.mode}
              camera={renderCtx.camera}
              selected={selectedIds.includes(shape.id)}
              allShapes={shapesRef.current}
              onShapeDelete={onShapeDelete}
              onShapeEdit={onShapeEdit}
            />
          ))}
          {children}
          {currentMode === "edit" && (
            <Transformer
              ref={transformerRef}
              anchorFill={theme.handleColor}
              anchorSize={theme.handleSize}
              borderStroke={theme.shapeSelectedBorder}
              borderDash={[4, 4]}
              rotateEnabled
            />
          )}
        </Layer>
      </Stage>

      {/* Context menu DOM overlay */}
      {contextMenu && (
        <ContextMenuOverlay contextMenu={contextMenu} theme={theme} />
      )}
    </div>
  );
}
