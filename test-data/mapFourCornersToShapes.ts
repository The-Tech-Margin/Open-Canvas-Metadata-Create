/**
 * @module test-data/mapFourCornersToShapes
 * Maps Four Corners protocol metadata to canvas shapes.
 *
 * This is example / test-data code showing how a consuming app would
 * convert 4C metadata into @fourcorners/canvas shapes.
 * In production the equivalent logic lives in the app's bridge layer.
 */

import type { FourCornersMetadata } from './rockaway-beach-fixture';
import { BaseShape } from '../shapes/BaseShape';
import { ZoneShape } from '../shapes/ZoneShape';
import { TextBlock } from '../shapes/TextBlock';
import { PhotoCard } from '../shapes/PhotoCard';
import { LinkCard } from '../shapes/LinkCard';

/** Layout constants for the Four Corners quadrant arrangement. */
const ZONE_W = 600;
const ZONE_H = 400;
const ZONE_GAP = 40;
const CENTER_SIZE = 320;

/** Zone origins (x, y) for each corner. */
const ZONE_POSITIONS = {
  backstory: { x: 0, y: 0 },
  context: { x: ZONE_W + ZONE_GAP, y: 0 },
  links: { x: 0, y: ZONE_H + ZONE_GAP },
  authorship: { x: ZONE_W + ZONE_GAP, y: ZONE_H + ZONE_GAP },
} as const;

/** Center position for the main image. */
const CENTER_X = ZONE_W / 2 + ZONE_GAP / 2 - CENTER_SIZE / 2 + ZONE_W / 2;
const CENTER_Y = ZONE_H / 2 + ZONE_GAP / 2 - CENTER_SIZE / 2 + ZONE_H / 2;

/**
 * Convert Four Corners metadata into an array of canvas shapes.
 *
 * Creates:
 * - 4 ZoneShapes (backstory, context, links, authorship)
 * - 1 TextBlock for the backstory narrative
 * - 1 PhotoCard per context image
 * - 1 LinkCard per link
 * - 1 TextBlock for creativeCommons
 * - 1 TextBlock for ethics summary
 * - 1 TextBlock for photo metadata / equipment
 * - 1 PhotoCard for the main image (center)
 *
 * @param metadata - Four Corners metadata document.
 * @returns Flat array of all shapes (zones + content).
 */
export function mapFourCornersToShapes(
  metadata: FourCornersMetadata,
): BaseShape[] {
  const shapes: BaseShape[] = [];

  // --- Zones ---
  for (const [label, pos] of Object.entries(ZONE_POSITIONS)) {
    shapes.push(
      new ZoneShape({
        x: pos.x,
        y: pos.y,
        width: ZONE_W,
        height: ZONE_H,
        data: { label, color: zoneColor(label) },
      }),
    );
  }

  // --- Backstory ---
  const bs = metadata.backStory;
  const bsContent = [
    bs.text,
    bs.author ? `\u2014 ${bs.author}` : '',
    bs.date ? `Date: ${bs.date}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  shapes.push(
    new TextBlock({
      x: ZONE_POSITIONS.backstory.x + 20,
      y: ZONE_POSITIONS.backstory.y + 30,
      width: ZONE_W - 40,
      height: ZONE_H - 60,
      data: {
        content: bsContent,
        fontWeight: 'normal',
        textAlign: 'left',
      },
      metadata: { corner: 'backstory' },
    }),
  );

  // --- Context images ---
  const ctxOrigin = ZONE_POSITIONS.context;
  const cols = 3;
  const cardW = 160;
  const cardH = 180;
  const padX = 20;
  const padY = 30;

  metadata.context.forEach((item, i) => {
    if (item.type !== 'image') return;
    const col = i % cols;
    const row = Math.floor(i / cols);

    shapes.push(
      new PhotoCard({
        x: ctxOrigin.x + padX + col * (cardW + 10),
        y: ctxOrigin.y + padY + row * (cardH + 10),
        width: cardW,
        height: cardH,
        data: {
          imageUrl: item.url || item.storage_url || '',
          caption: item.caption || item.filename,
          credit: item.credit ?? undefined,
          date: item.date ?? undefined,
          cornerKey: 'context',
        },
        metadata: { contextId: item.id, corner: 'context' },
      }),
    );
  });

  // --- Links ---
  const linksOrigin = ZONE_POSITIONS.links;
  const linkH = 80;

  metadata.links.forEach((link, i) => {
    let domain: string;
    try {
      domain = new URL(link.url).hostname;
    } catch {
      domain = link.url;
    }

    shapes.push(
      new LinkCard({
        x: linksOrigin.x + 20,
        y: linksOrigin.y + 30 + i * (linkH + 10),
        width: ZONE_W - 40,
        height: linkH,
        data: {
          url: link.url,
          title: link.title,
          domain,
        },
        metadata: { corner: 'links' },
      }),
    );
  });

  // --- Authorship zone content ---
  const authOrigin = ZONE_POSITIONS.authorship;
  let authY = authOrigin.y + 30;

  // Creative Commons
  const cc = metadata.creativeCommons;
  shapes.push(
    new TextBlock({
      x: authOrigin.x + 20,
      y: authY,
      width: ZONE_W - 40,
      height: 60,
      data: {
        content: `\u00A9 ${cc.copyright}\n${cc.description}`,
        fontWeight: 'normal',
        textAlign: 'left',
      },
      metadata: { corner: 'authorship', section: 'copyright' },
    }),
  );
  authY += 70;

  // Ethics summary
  const ethics = metadata._ext.ethics;
  const ethicsLines: string[] = [];
  if (ethics.noManipulation) ethicsLines.push('No manipulation');
  if (ethics.noStaging) ethicsLines.push('No staging');
  if (ethics.informedConsent) ethicsLines.push('Informed consent obtained');
  if (ethics.identityProtected) ethicsLines.push('Identity protected');
  if (ethics.aiAltered) ethicsLines.push('AI altered');
  if (ethics.customEthicsText) ethicsLines.push(ethics.customEthicsText);
  const ethicsText =
    ethicsLines.length > 0
      ? `Ethics: ${ethicsLines.join(', ')}`
      : 'Ethics: No declarations';

  shapes.push(
    new TextBlock({
      x: authOrigin.x + 20,
      y: authY,
      width: ZONE_W - 40,
      height: 50,
      data: {
        content: ethicsText,
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
      },
      metadata: { corner: 'authorship', section: 'ethics' },
    }),
  );
  authY += 60;

  // Photo metadata
  const pm = metadata._ext.photoMetadata;
  shapes.push(
    new TextBlock({
      x: authOrigin.x + 20,
      y: authY,
      width: ZONE_W - 40,
      height: 40,
      data: {
        content: `Camera: ${pm.equipment.cameraMake} ${pm.equipment.cameraModel}`,
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
      },
      metadata: { corner: 'authorship', section: 'equipment' },
    }),
  );

  // --- Main image (center) ---
  shapes.push(
    new PhotoCard({
      x: CENTER_X,
      y: CENTER_Y,
      width: CENTER_SIZE,
      height: CENTER_SIZE,
      data: {
        imageUrl: metadata._ext.mainImage,
        caption: cc.description,
        credit: cc.copyright,
        date: metadata.backStory.date,
        nfLabel: true,
      },
      metadata: { corner: 'center' },
    }),
  );

  return shapes;
}

/** Map corner labels to tint colors. */
function zoneColor(label: string): string {
  switch (label) {
    case 'backstory':
      return '#3b82f6';
    case 'context':
      return '#10b981';
    case 'links':
      return '#f59e0b';
    case 'authorship':
      return '#8b5cf6';
    default:
      return '#cbd5e1';
  }
}
