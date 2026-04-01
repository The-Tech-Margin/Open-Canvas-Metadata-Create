/**
 * @module __tests__/canvasInteractions
 * Tests for core interaction managers: SelectionManager, HistoryStack,
 * SnapEngine, and ContextMenu.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import Konva from 'konva';
import { HistoryStack } from '../core/HistoryStack';
import type { Command } from '../core/HistoryStack';
import { ContextMenu } from '../interactions/ContextMenu';
import { TextBlock } from '../shapes/TextBlock';
import { PhotoCard } from '../shapes/PhotoCard';
import { ZoneShape } from '../shapes/ZoneShape';
import { DEFAULT_TOKENS } from '../theme/tokens';

// ---------------------------------------------------------------------------
// HistoryStack
// ---------------------------------------------------------------------------

describe('HistoryStack', () => {
  let stack: HistoryStack;

  beforeEach(() => {
    stack = new HistoryStack(50);
  });

  it('push() executes the command immediately', () => {
    const fn = vi.fn();
    stack.push({ execute: fn, undo: vi.fn(), description: 'test' });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('canUndo is true after push', () => {
    expect(stack.canUndo()).toBe(false);
    stack.push({ execute: vi.fn(), undo: vi.fn(), description: 'a' });
    expect(stack.canUndo()).toBe(true);
  });

  it('undo() reverses the last command', () => {
    let value = 0;
    stack.push({
      execute: () => { value = 1; },
      undo: () => { value = 0; },
      description: 'set to 1',
    });
    expect(value).toBe(1);
    stack.undo();
    expect(value).toBe(0);
  });

  it('redo() re-executes after undo', () => {
    let value = 0;
    stack.push({
      execute: () => { value = 1; },
      undo: () => { value = 0; },
      description: 'set to 1',
    });
    stack.undo();
    expect(value).toBe(0);
    stack.redo();
    expect(value).toBe(1);
  });

  it('push after undo clears the redo stack', () => {
    stack.push({ execute: vi.fn(), undo: vi.fn(), description: 'a' });
    stack.push({ execute: vi.fn(), undo: vi.fn(), description: 'b' });
    stack.undo();
    expect(stack.canRedo()).toBe(true);
    stack.push({ execute: vi.fn(), undo: vi.fn(), description: 'c' });
    expect(stack.canRedo()).toBe(false);
  });

  it('respects maxSize', () => {
    const small = new HistoryStack(3);
    for (let i = 0; i < 5; i++) {
      small.push({ execute: vi.fn(), undo: vi.fn(), description: `cmd-${i}` });
    }
    expect(small.getHistory().length).toBe(3);
    expect(small.getHistory()[0]).toBe('cmd-2');
  });

  it('getHistory() returns descriptions in order', () => {
    stack.push({ execute: vi.fn(), undo: vi.fn(), description: 'first' });
    stack.push({ execute: vi.fn(), undo: vi.fn(), description: 'second' });
    expect(stack.getHistory()).toEqual(['first', 'second']);
  });

  it('clear() empties both stacks', () => {
    stack.push({ execute: vi.fn(), undo: vi.fn(), description: 'a' });
    stack.undo();
    expect(stack.canRedo()).toBe(true);
    stack.clear();
    expect(stack.canUndo()).toBe(false);
    expect(stack.canRedo()).toBe(false);
  });

  it('multiple undo/redo cycles work correctly', () => {
    let value = 0;
    stack.push({
      execute: () => { value += 10; },
      undo: () => { value -= 10; },
      description: 'add 10',
    });
    stack.push({
      execute: () => { value += 5; },
      undo: () => { value -= 5; },
      description: 'add 5',
    });
    expect(value).toBe(15);
    stack.undo();
    expect(value).toBe(10);
    stack.undo();
    expect(value).toBe(0);
    stack.redo();
    stack.redo();
    expect(value).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// ContextMenu
// ---------------------------------------------------------------------------

describe('ContextMenu', () => {
  let menu: ContextMenu;

  beforeEach(() => {
    // ContextMenu constructor takes Canvas but only stores it for future use
    // Pass a minimal stub
    menu = new ContextMenu({} as import('../core/Canvas').Canvas);
  });

  it('starts hidden', () => {
    expect(menu.visible).toBe(false);
    expect(menu.items).toEqual([]);
  });

  it('show() sets visible, position, and items', () => {
    const items = [{ label: 'Test', action: vi.fn() }];
    menu.show({ x: 100, y: 200 }, items);
    expect(menu.visible).toBe(true);
    expect(menu.position).toEqual({ x: 100, y: 200 });
    expect(menu.items).toEqual(items);
  });

  it('hide() clears state', () => {
    menu.show({ x: 10, y: 20 }, [{ label: 'A', action: vi.fn() }]);
    menu.hide();
    expect(menu.visible).toBe(false);
    expect(menu.items).toEqual([]);
  });

  it('fires onChange callback on show and hide', () => {
    const cb = vi.fn();
    menu.onChange = cb;
    menu.show({ x: 0, y: 0 }, [{ label: 'X', action: vi.fn() }]);
    expect(cb).toHaveBeenCalledTimes(1);
    menu.hide();
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('shapeItems() returns Edit, Lock, Delete', () => {
    const shape = new TextBlock({ data: { content: 'Hello' } });
    const items = ContextMenu.shapeItems(shape);
    expect(items.map((i) => i.label)).toEqual(['Edit', 'Lock', 'Delete']);
  });

  it('shapeItems() shows Unlock when shape is locked', () => {
    const shape = new TextBlock({ data: { content: 'Hello' }, locked: true });
    const items = ContextMenu.shapeItems(shape);
    expect(items[1].label).toBe('Unlock');
  });

  it('canvasItems() returns standard canvas actions', () => {
    const items = ContextMenu.canvasItems();
    const labels = items.map((i) => i.label);
    expect(labels).toContain('Add Shape');
    expect(labels).toContain('Reset View');
  });
});

// ---------------------------------------------------------------------------
// Shape serialization roundtrip (all types)
// ---------------------------------------------------------------------------

describe('Shape serialization roundtrip', () => {
  it('TextBlock roundtrip preserves data', () => {
    const shape = new TextBlock({
      x: 10, y: 20, width: 200, height: 100,
      data: { content: 'Test content', fontWeight: 'bold', textAlign: 'center' },
    });
    const json = shape.serialize();
    const clone = new TextBlock();
    clone.deserialize(json);
    expect(clone.data.content).toBe('Test content');
    expect(clone.data.fontWeight).toBe('bold');
    expect(clone.x).toBe(10);
  });

  it('PhotoCard roundtrip preserves cornerKey', () => {
    const shape = new PhotoCard({
      data: { imageUrl: 'test.jpg', cornerKey: 'context', nfLabel: true },
    });
    const json = shape.serialize();
    const clone = new PhotoCard();
    clone.deserialize(json);
    expect(clone.data.cornerKey).toBe('context');
    expect(clone.data.nfLabel).toBe(true);
  });

  it('ZoneShape roundtrip preserves label and color', () => {
    const shape = new ZoneShape({
      x: 0, y: 0, width: 600, height: 400,
      data: { label: 'backstory', color: '#3b82f6' },
    });
    const json = shape.serialize();
    const clone = new ZoneShape();
    clone.deserialize(json);
    expect(clone.data.label).toBe('backstory');
    expect(clone.data.color).toBe('#3b82f6');
  });
});

// ---------------------------------------------------------------------------
// Konva Group rendering
// ---------------------------------------------------------------------------

describe('Shape rendering produces Konva nodes', () => {
  const ctx = {
    theme: DEFAULT_TOKENS,
    mode: 'view' as const,
    camera: { x: 0, y: 0, zoom: 1 },
    selected: false,
  };

  it('TextBlock renders a Group with children', () => {
    const shape = new TextBlock({ data: { content: 'Render test' } });
    const group = shape.render(ctx);
    expect(group).toBeInstanceOf(Konva.Group);
    expect(group.getChildren().length).toBeGreaterThan(0);
  });

  it('PhotoCard renders a Group with children', () => {
    const shape = new PhotoCard({ data: { imageUrl: 'test.jpg', caption: 'Cap' } });
    const group = shape.render(ctx);
    expect(group).toBeInstanceOf(Konva.Group);
    expect(group.getChildren().length).toBeGreaterThan(0);
  });

  it('ZoneShape renders a Group with label text', () => {
    const shape = new ZoneShape({ data: { label: 'context' }, width: 600, height: 400 });
    const group = shape.render(ctx);
    expect(group).toBeInstanceOf(Konva.Group);
    expect(group.getChildren().length).toBeGreaterThan(0);
  });
});
