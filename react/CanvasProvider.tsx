/**
 * @module react/CanvasProvider
 * React context provider wrapping the core Canvas engine
 * and all interaction managers.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { CanvasMode, ThemeTokens } from "../core/types";
import { Canvas } from "../core/Canvas";
import { SelectionManager } from "../core/SelectionManager";
import { SnapEngine } from "../core/SnapEngine";
import { HistoryStack } from "../core/HistoryStack";
import { ContextMenu } from "../interactions/ContextMenu";
import { DoubleTapEdit } from "../interactions/DoubleTapEdit";
import { fourCornersTheme } from "../theme/presets/fourCorners";

/** Value exposed by the canvas context. */
export interface CanvasContextValue {
  /** The core Canvas engine instance, or null before initialization. */
  canvas: Canvas | null;
  /** Current interaction mode. */
  mode: CanvasMode;
  /** Active theme tokens. */
  theme: ThemeTokens;
  /** Selection state manager. */
  selectionManager: SelectionManager | null;
  /** Grid + object snap engine. */
  snapEngine: SnapEngine | null;
  /** Undo/redo command stack. */
  historyStack: HistoryStack | null;
  /** Context menu state manager. */
  contextMenu: ContextMenu | null;
  /** Double-click/tap edit trigger. */
  doubleTapEdit: DoubleTapEdit | null;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

/** Props for {@link CanvasProvider}. */
export interface CanvasProviderProps {
  /** Theme tokens. Defaults to the Four Corners preset. */
  theme?: ThemeTokens;
  /** Initial canvas mode. Defaults to 'edit'. */
  mode?: CanvasMode;
  /** Child elements. */
  children: React.ReactNode;
}

/**
 * Provides the core Canvas engine and all interaction managers
 * to descendant components via React context.
 * Wrap your canvas UI tree with this provider.
 */
export function CanvasProvider({
  theme = fourCornersTheme,
  mode = "edit",
  children,
}: CanvasProviderProps) {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const managersRef = useRef<{
    selectionManager: SelectionManager;
    snapEngine: SnapEngine;
    historyStack: HistoryStack;
    contextMenu: ContextMenu;
    doubleTapEdit: DoubleTapEdit;
  } | null>(null);

  // Force re-render when managers are created
  const [, setReady] = useState(0);

  // Create / recreate Canvas + managers when theme changes
  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new Canvas({
      container: containerRef.current,
      width: containerRef.current.clientWidth || 800,
      height: containerRef.current.clientHeight || 600,
      theme,
    });

    instance.setMode(mode);

    const selMgr = new SelectionManager(instance);
    const snapEng = new SnapEngine(instance);
    const histStack = new HistoryStack(50);
    const ctxMenu = new ContextMenu(instance);
    const dblTap = new DoubleTapEdit(instance);

    managersRef.current = {
      selectionManager: selMgr,
      snapEngine: snapEng,
      historyStack: histStack,
      contextMenu: ctxMenu,
      doubleTapEdit: dblTap,
    };

    setCanvas(instance);
    setReady((n) => n + 1);

    return () => {
      dblTap.destroy();
      managersRef.current = null;
      instance.destroy();
    };
  }, [theme]);

  // Sync mode changes
  useEffect(() => {
    canvas?.setMode(mode);
  }, [canvas, mode]);

  const mgrs = managersRef.current;

  const value: CanvasContextValue = {
    canvas,
    mode,
    theme,
    selectionManager: mgrs?.selectionManager ?? null,
    snapEngine: mgrs?.snapEngine ?? null,
    historyStack: mgrs?.historyStack ?? null,
    contextMenu: mgrs?.contextMenu ?? null,
    doubleTapEdit: mgrs?.doubleTapEdit ?? null,
  };

  return (
    <CanvasContext.Provider value={value}>
      {/* Hidden container for Konva Stage mounting */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
        }}
      />
      {children}
    </CanvasContext.Provider>
  );
}

/**
 * Hook to access the canvas context.
 * @returns The canvas context value.
 * @throws If used outside of a CanvasProvider.
 * @internal Prefer the public useCanvas hook.
 */
export function useCanvasContext(): CanvasContextValue {
  const ctx = useContext(CanvasContext);
  if (!ctx) {
    throw new Error("useCanvasContext must be used within a <CanvasProvider>");
  }
  return ctx;
}
