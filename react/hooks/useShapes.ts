/**
 * @module react/hooks/useShapes
 * Hook for CRUD operations on shapes, synced with the Canvas engine
 * and optionally integrated with the HistoryStack for undo/redo.
 */

import { useState, useCallback } from 'react';
import type { BaseShape } from '../../shapes/BaseShape';
import { useCanvasContext } from '../CanvasProvider';

/** Return type of the {@link useShapes} hook. */
export interface UseShapesReturn {
  /** All shapes currently on the canvas. */
  shapes: BaseShape[];
  /** Add a shape to the canvas. */
  add: (shape: BaseShape) => void;
  /** Remove a shape by ID. */
  remove: (id: string) => void;
  /** Update a shape's properties by ID. */
  update: (id: string, props: Partial<BaseShape>) => void;
  /** Get a shape by ID. */
  get: (id: string) => BaseShape | undefined;
  /** Remove all shapes. */
  clear: () => void;
  /** Replace all shapes (e.g. when loading a document). */
  setShapes: (shapes: BaseShape[]) => void;
}

/**
 * Manage shapes on the canvas with add, remove, update, get, and clear operations.
 * Syncs with the Canvas engine and integrates with HistoryStack.
 * @returns Shape CRUD operations and the current shape list.
 */
export function useShapes(): UseShapesReturn {
  const { canvas, historyStack } = useCanvasContext();
  const [shapes, setShapesState] = useState<BaseShape[]>([]);

  const add = useCallback((shape: BaseShape) => {
    if (historyStack) {
      historyStack.push({
        description: `Add ${shape.type}`,
        execute: () => {
          setShapesState((prev) => {
            if (prev.some((s) => s.id === shape.id)) return prev;
            return [...prev, shape];
          });
          canvas?.addShape(shape);
        },
        undo: () => {
          setShapesState((prev) => prev.filter((s) => s.id !== shape.id));
          canvas?.removeShape(shape.id);
        },
      });
    } else {
      setShapesState((prev) => [...prev, shape]);
      canvas?.addShape(shape);
    }
  }, [canvas, historyStack]);

  const remove = useCallback((id: string) => {
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;

    if (historyStack) {
      historyStack.push({
        description: `Delete ${shape.type}`,
        execute: () => {
          setShapesState((prev) => prev.filter((s) => s.id !== id));
          canvas?.removeShape(id);
        },
        undo: () => {
          setShapesState((prev) => [...prev, shape]);
          canvas?.addShape(shape);
        },
      });
    } else {
      setShapesState((prev) => prev.filter((s) => s.id !== id));
      canvas?.removeShape(id);
    }
  }, [canvas, historyStack, shapes]);

  const update = useCallback((id: string, props: Partial<BaseShape>) => {
    setShapesState((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        Object.assign(s, props);
        return s;
      })
    );
  }, []);

  const get = useCallback(
    (id: string) => shapes.find((s) => s.id === id),
    [shapes]
  );

  const clear = useCallback(() => {
    for (const s of shapes) {
      canvas?.removeShape(s.id);
    }
    setShapesState([]);
    historyStack?.clear();
  }, [canvas, historyStack, shapes]);

  const setShapes = useCallback((newShapes: BaseShape[]) => {
    // Sync to canvas engine
    for (const s of shapes) {
      canvas?.removeShape(s.id);
    }
    for (const s of newShapes) {
      canvas?.addShape(s);
    }
    setShapesState(newShapes);
  }, [canvas, shapes]);

  return { shapes, add, remove, update, get, clear, setShapes };
}
