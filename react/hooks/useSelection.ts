/**
 * @module react/hooks/useSelection
 * Hook for reactive shape selection state.
 */

import { useState, useCallback, useEffect } from 'react';
import { useCanvasContext } from '../CanvasProvider';

/** Return type of the {@link useSelection} hook. */
export interface UseSelectionReturn {
  /** IDs of currently selected shapes. */
  selectedIds: string[];
  /** Select a single shape (clears other selections). */
  select: (id: string) => void;
  /** Add a shape to the current selection (multi-select). */
  addToSelection: (id: string) => void;
  /** Remove a shape from the current selection. */
  deselect: (id: string) => void;
  /** Clear all selections. */
  deselectAll: () => void;
  /** Check whether a shape is currently selected. */
  isSelected: (id: string) => boolean;
}

/**
 * Reactive selection state backed by the core SelectionManager.
 * Re-renders when the selection changes.
 * @returns Selection state and control methods.
 */
export function useSelection(): UseSelectionReturn {
  const { selectionManager } = useCanvasContext();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Subscribe to selection changes
  useEffect(() => {
    if (!selectionManager) return;
    selectionManager.onSelectionChange = (ids) => setSelectedIds(ids);
    return () => {
      selectionManager.onSelectionChange = undefined;
    };
  }, [selectionManager]);

  const select = useCallback(
    (id: string) => selectionManager?.select(id),
    [selectionManager],
  );

  const addToSelection = useCallback(
    (id: string) => selectionManager?.addToSelection(id),
    [selectionManager],
  );

  const deselect = useCallback(
    (id: string) => selectionManager?.deselect(id),
    [selectionManager],
  );

  const deselectAll = useCallback(
    () => selectionManager?.deselectAll(),
    [selectionManager],
  );

  const isSelected = useCallback(
    (id: string) => selectionManager?.isSelected(id) ?? false,
    [selectionManager],
  );

  return { selectedIds, select, addToSelection, deselect, deselectAll, isSelected };
}
