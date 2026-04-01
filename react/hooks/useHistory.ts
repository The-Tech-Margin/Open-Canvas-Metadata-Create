/**
 * @module react/hooks/useHistory
 * Hook for undo/redo backed by the core HistoryStack.
 */

import { useState, useCallback } from 'react';
import { useCanvasContext } from '../CanvasProvider';
import type { Command } from '../../core/HistoryStack';

/** Return type of the {@link useHistory} hook. */
export interface UseHistoryReturn {
  /** Undo the last command. */
  undo: () => void;
  /** Redo the last undone command. */
  redo: () => void;
  /** Whether there are commands to undo. */
  canUndo: boolean;
  /** Whether there are commands to redo. */
  canRedo: boolean;
  /** Execute and push a new command. */
  push: (command: Command) => void;
  /** Descriptions of all commands in the undo stack. */
  history: string[];
}

/**
 * Reactive undo/redo state backed by the core HistoryStack.
 * Re-renders after push, undo, or redo operations.
 * @returns History state and control methods.
 */
export function useHistory(): UseHistoryReturn {
  const { historyStack } = useCanvasContext();
  // Version counter forces re-derivation of canUndo/canRedo
  const [version, setVersion] = useState(0);

  const push = useCallback(
    (command: Command) => {
      historyStack?.push(command);
      setVersion((v) => v + 1);
    },
    [historyStack],
  );

  const undo = useCallback(() => {
    historyStack?.undo();
    setVersion((v) => v + 1);
  }, [historyStack]);

  const redo = useCallback(() => {
    historyStack?.redo();
    setVersion((v) => v + 1);
  }, [historyStack]);

  // Derived from historyStack, recomputed when version changes
  const canUndo = version >= 0 && (historyStack?.canUndo() ?? false);
  const canRedo = version >= 0 && (historyStack?.canRedo() ?? false);
  const history = version >= 0 ? (historyStack?.getHistory() ?? []) : [];

  return { undo, redo, canUndo, canRedo, push, history };
}
