/**
 * @module shapes/PhotoCard
 * Image shape with metadata fields for photography.
 * Supports nonfiction photography labeling.
 */

import Konva from "konva";
import { BaseShape } from "./BaseShape";
import { ShapeRegistry } from "../core/ShapeRegistry";
import type {
  ShapeCategory,
  ShapeJSON,
  FieldDefinition,
  ValidationResult,
  CanvasRenderContext,
} from "../core/types";

/** Data payload for a PhotoCard shape. */
export interface PhotoCardData {
  /** Image URL or data URI. */
  src: string;
  /** Optional thumbnail URL for progressive loading. */
  thumbnailSrc?: string;
  /** Alt text for accessibility. */
  alt: string;
  /** Optional caption displayed below the image. */
  caption?: string;
  /** Photographer or agency credit. */
  credit?: string;
  /** Date the photograph was taken. */
  dateTaken?: string;
  /** Location where the photograph was taken. */
  location?: string;
  /** Whether the image carries a nonfiction photography label. */
  nfLabel?: boolean;
}

/**
 * A photo card shape that renders an image with optional caption,
 * credit, and nonfiction label badge.
 */
export class PhotoCard extends BaseShape<PhotoCardData> {
  readonly type = "photo-card";
  readonly label = "Photo";
  readonly icon = "image";
  readonly category: ShapeCategory = "media";

  constructor(props?: Partial<BaseShape<PhotoCardData>>) {
    super(props);
    this.width = this.width || 300;
    this.height = this.height || 225;
    this.data = {
      src: this.data.src ?? "",
      alt: this.data.alt ?? "",
      caption: this.data.caption,
      credit: this.data.credit,
      dateTaken: this.data.dateTaken,
      location: this.data.location,
      thumbnailSrc: this.data.thumbnailSrc,
      nfLabel: this.data.nfLabel,
    };
  }

  /** @inheritdoc */
  render(ctx: CanvasRenderContext): Konva.Group {
    const group = new Konva.Group({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      draggable: !this.locked,
    });

    // Card background
    const borderColor = ctx.selected
      ? ctx.theme.shapeSelectedBorder
      : ctx.theme.shapeBorder;

    group.add(
      new Konva.Rect({
        width: this.width,
        height: this.height,
        fill: ctx.theme.canvasBg,
        cornerRadius: ctx.theme.shapeBorderRadius,
        stroke: borderColor,
        strokeWidth: ctx.selected ? 2 : 1,
      }),
    );

    // Image area — clipped rectangle as placeholder
    const imgHeight = this.data.caption ? this.height - 30 : this.height;
    group.add(
      new Konva.Rect({
        width: this.width,
        height: imgHeight,
        cornerRadius: [
          ctx.theme.shapeBorderRadius,
          ctx.theme.shapeBorderRadius,
          this.data.caption ? 0 : ctx.theme.shapeBorderRadius,
          this.data.caption ? 0 : ctx.theme.shapeBorderRadius,
        ],
        fill: "#e2e8f0",
      }),
    );

    // Caption text
    if (this.data.caption) {
      group.add(
        new Konva.Text({
          y: imgHeight + 4,
          x: 8,
          width: this.width - 16,
          text: this.data.caption,
          fontSize: ctx.theme.fontSizeSmall,
          fontFamily: ctx.theme.fontFamily,
          fill: ctx.theme.textColor,
          ellipsis: true,
          wrap: "none",
        }),
      );
    }

    // NF badge
    if (this.data.nfLabel) {
      const badgeSize = 24;
      group.add(
        new Konva.Rect({
          x: 6,
          y: 6,
          width: badgeSize,
          height: badgeSize,
          fill: ctx.theme.accentPrimary,
          cornerRadius: 4,
        }),
      );
      group.add(
        new Konva.Text({
          x: 6,
          y: 6,
          width: badgeSize,
          height: badgeSize,
          text: "NF",
          fontSize: 11,
          fontFamily: ctx.theme.fontFamily,
          fontStyle: "bold",
          fill: "#ffffff",
          align: "center",
          verticalAlign: "middle",
        }),
      );
    }

    return group;
  }

  /** @inheritdoc */
  renderThumbnail(): Konva.Rect {
    return new Konva.Rect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      fill: "#e2e8f0",
      cornerRadius: 4,
    });
  }

  /** @inheritdoc */
  serialize(): ShapeJSON {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      locked: this.locked,
      data: { ...this.data } as unknown as Record<string, unknown>,
      metadata: { ...this.metadata },
    };
  }

  /** @inheritdoc */
  deserialize(json: ShapeJSON): void {
    this.id = json.id;
    this.x = json.x;
    this.y = json.y;
    this.width = json.width;
    this.height = json.height;
    this.rotation = json.rotation;
    this.locked = json.locked;
    this.data = json.data as unknown as PhotoCardData;
    this.metadata = json.metadata;
  }

  /** @inheritdoc */
  getEditableFields(): FieldDefinition[] {
    return [
      { key: "src", label: "Image", type: "image", required: true },
      { key: "alt", label: "Alt Text", type: "text", required: true },
      { key: "caption", label: "Caption", type: "textarea" },
      { key: "credit", label: "Credit", type: "text" },
      { key: "dateTaken", label: "Date Taken", type: "text" },
      { key: "location", label: "Location", type: "text" },
      {
        key: "nfLabel",
        label: "NF Label",
        type: "select",
        options: ["true", "false"],
      },
    ];
  }

  /** @inheritdoc */
  validate(): ValidationResult {
    const errors: string[] = [];
    if (!this.data.src) errors.push("Image source (src) is required.");
    if (!this.data.alt) errors.push("Alt text is required.");
    return { valid: errors.length === 0, errors };
  }

  /** @inheritdoc */
  toProtocol(): Record<string, unknown> {
    return {
      type: "photograph",
      src: this.data.src,
      alt: this.data.alt,
      caption: this.data.caption,
      credit: this.data.credit,
      dateTaken: this.data.dateTaken,
      location: this.data.location,
      nonfiction: this.data.nfLabel,
    };
  }
}

ShapeRegistry.register(PhotoCard);
