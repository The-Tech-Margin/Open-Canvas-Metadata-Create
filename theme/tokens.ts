/**
 * @module theme/tokens
 * ThemeTokens interface and default values.
 * All visual properties in shapes and UI components are read from these tokens.
 */

import type { ThemeTokens } from '../core/types';

export type { ThemeTokens };

/** Default light-mode theme tokens. */
export const DEFAULT_TOKENS: ThemeTokens = {
  // Surface
  canvasBg: '#ffffff',
  canvasDot: '#e2e8f0',
  canvasDotSize: 2,
  canvasGridSize: 20,

  // Shape chrome
  shapeBorder: '#cbd5e1',
  shapeBorderRadius: 9,
  shapeShadow: '0 1px 3px rgba(0,0,0,0.1)',
  shapeSelectedBorder: '#2563eb',
  shapeHoverBorder: '#93c5fd',

  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSizeBase: 14,
  fontSizeSmall: 12,
  fontSizeLarge: 18,
  textColor: '#1e293b',
  textSecondary: '#64748b',

  // Accent
  accentPrimary: '#2563eb',
  accentSecondary: '#7c3aed',
  accentDanger: '#ef4444',

  // Interactive
  handleColor: '#2563eb',
  handleSize: 8,
  snapGuideColor: '#f59e0b',
  selectionRectColor: 'rgba(37, 99, 235, 0.15)',

  // Toolbar
  toolbarBg: '#ffffff',
  toolbarBorder: '#e2e8f0',
  toolbarIconColor: '#64748b',
  toolbarIconActiveColor: '#2563eb',
};
