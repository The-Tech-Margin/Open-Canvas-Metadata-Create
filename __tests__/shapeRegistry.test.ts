/**
 * @module __tests__/shapeRegistry
 * Verifies all built-in shape types are registered and can be
 * instantiated via the ShapeRegistry.
 */

import { describe, it, expect } from 'vitest';
import { ShapeRegistry } from '../core/ShapeRegistry';

// Side-effect imports: each module registers its shape type.
import '../shapes/PhotoCard';
import '../shapes/TextBlock';
import '../shapes/ZoneShape';
import '../shapes/VoiceNote';
import '../shapes/LinkCard';
import '../shapes/VideoEmbed';

const EXPECTED_TYPES = [
  { type: 'photo-card', label: 'Photo Card', category: 'media' },
  { type: 'text-block', label: 'Text', category: 'text' },
  { type: 'zone', label: 'Zone', category: 'container' },
  { type: 'voice-note', label: 'Voice Note', category: 'media' },
  { type: 'link-card', label: 'Link', category: 'media' },
  { type: 'video-embed', label: 'Video', category: 'media' },
];

describe('ShapeRegistry', () => {
  it('has all 6 built-in types registered', () => {
    const registered = ShapeRegistry.list();
    expect(registered.length).toBeGreaterThanOrEqual(6);

    for (const expected of EXPECTED_TYPES) {
      const found = registered.find((r) => r.type === expected.type);
      expect(found).toBeDefined();
      expect(found!.label).toBe(expected.label);
      expect(found!.category).toBe(expected.category);
    }
  });

  it('creates instances via ShapeRegistry.create()', () => {
    for (const { type } of EXPECTED_TYPES) {
      const shape = ShapeRegistry.create(type);
      expect(shape).toBeDefined();
      expect(shape.type).toBe(type);
      expect(shape.id).toBeTruthy();
    }
  });

  it('creates instances with custom props', () => {
    const card = ShapeRegistry.create('photo-card', {
      x: 100,
      y: 200,
      width: 300,
      height: 400,
    });
    expect(card.x).toBe(100);
    expect(card.y).toBe(200);
    expect(card.width).toBe(300);
    expect(card.height).toBe(400);
  });

  it('throws for unknown type', () => {
    expect(() => ShapeRegistry.create('nonexistent')).toThrow(
      /not registered/,
    );
  });

  it('roundtrips via fromJSON', () => {
    for (const { type } of EXPECTED_TYPES) {
      const original = ShapeRegistry.create(type, {
        x: 10,
        y: 20,
      });
      const json = original.serialize();
      const restored = ShapeRegistry.fromJSON(json);
      expect(restored.type).toBe(type);
      expect(restored.x).toBe(10);
      expect(restored.y).toBe(20);
    }
  });
});
