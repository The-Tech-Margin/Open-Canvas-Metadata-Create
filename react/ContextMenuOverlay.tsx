/**
 * @module react/ContextMenuOverlay
 * DOM overlay for rendering context menus outside the Konva Stage.
 * Reads state from the core ContextMenu manager.
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import type { ContextMenu, ContextMenuItem } from "../interactions/ContextMenu";
import type { ThemeTokens, Point } from "../core/types";

/** Props for {@link ContextMenuOverlay}. */
export interface ContextMenuOverlayProps {
  /** The ContextMenu state manager. */
  contextMenu: ContextMenu;
  /** Theme tokens for styling. */
  theme: ThemeTokens;
}

interface MenuState {
  visible: boolean;
  position: Point;
  items: ContextMenuItem[];
}

/**
 * Renders a positioned context menu as a DOM overlay.
 * Closes on click-outside or Escape.
 */
export function ContextMenuOverlay({ contextMenu, theme }: ContextMenuOverlayProps) {
  const [state, setState] = useState<MenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    items: [],
  });
  const menuRef = useRef<HTMLDivElement>(null);

  // Subscribe to context menu state changes
  useEffect(() => {
    contextMenu.onChange = () => {
      setState({
        visible: contextMenu.visible,
        position: { ...contextMenu.position },
        items: [...contextMenu.items],
      });
    };
    return () => {
      contextMenu.onChange = undefined;
    };
  }, [contextMenu]);

  // Close on click outside or Escape
  useEffect(() => {
    if (!state.visible) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        contextMenu.hide();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") contextMenu.hide();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [state.visible, contextMenu]);

  const handleItemClick = useCallback(
    (item: ContextMenuItem) => {
      if (item.disabled) return;
      item.action();
      contextMenu.hide();
    },
    [contextMenu],
  );

  if (!state.visible || state.items.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        left: state.position.x,
        top: state.position.y,
        zIndex: 1000,
        minWidth: 160,
        background: theme.toolbarBg,
        border: `1px solid ${theme.toolbarBorder}`,
        borderRadius: `${theme.shapeBorderRadius}px`,
        boxShadow: theme.shapeShadow,
        padding: "4px 0",
        fontFamily: theme.fontFamily,
        fontSize: `${theme.fontSizeSmall}px`,
      }}
    >
      {state.items.map((item, i) => (
        <React.Fragment key={`${item.label}-${i}`}>
          {item.divider && i > 0 && (
            <div
              style={{
                height: 1,
                background: theme.toolbarBorder,
                margin: "4px 0",
              }}
            />
          )}
          <div
            onClick={() => handleItemClick(item)}
            style={{
              padding: "6px 12px",
              cursor: item.disabled ? "default" : "pointer",
              color: item.disabled ? theme.textSecondary : theme.textColor,
              opacity: item.disabled ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                (e.currentTarget as HTMLDivElement).style.background =
                  theme.selectionRectColor;
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "transparent";
            }}
          >
            {item.label}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
