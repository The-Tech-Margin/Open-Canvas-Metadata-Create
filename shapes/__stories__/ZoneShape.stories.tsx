import React, { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CanvasProvider } from '../../react/CanvasProvider';
import { CanvasView } from '../../react/CanvasView';
import { useShapes } from '../../react/hooks/useShapes';
import { ZoneShape } from '../ZoneShape';
import type { ZoneData } from '../ZoneShape';
import { PhotoCard } from '../PhotoCard';
import { TextBlock } from '../TextBlock';
import { lightTheme } from '../../theme/presets/light';
import { darkTheme } from '../../theme/presets/dark';
import { fourCornersTheme } from '../../theme/presets/fourCorners';
import type { ThemeTokens } from '../../core/types';

const themeMap: Record<string, ThemeTokens> = {
  fourCorners: fourCornersTheme,
  light: lightTheme,
  dark: darkTheme,
};

interface ZoneShapeStoryArgs extends ZoneData {
  theme: string;
  withChildren?: boolean;
}

function ZoneShapeCanvas({ theme, withChildren, ...data }: ZoneShapeStoryArgs) {
  const tokens = themeMap[theme] ?? fourCornersTheme;

  return (
    <CanvasProvider theme={tokens}>
      <CanvasView style={{ width: 700, height: 500 }}>
        <ZoneShapeInner data={data} withChildren={withChildren} />
      </CanvasView>
    </CanvasProvider>
  );
}

function ZoneShapeInner({
  data,
  withChildren,
}: {
  data: Partial<ZoneData>;
  withChildren?: boolean;
}) {
  const { add, clear } = useShapes();

  useEffect(() => {
    clear();
    const zone = new ZoneShape({
      x: 20,
      y: 20,
      data: {
        label: data.label || 'backstory',
        color: data.color,
        collapsed: data.collapsed,
      },
    });
    add(zone);

    if (withChildren) {
      const photo = new PhotoCard({
        x: 40,
        y: 60,
        data: {
          src: 'https://picsum.photos/200/150',
          alt: 'Child photo',
          caption: 'Inside the zone',
        },
      });
      add(photo);

      const text = new TextBlock({
        x: 40,
        y: 250,
        data: {
          content: 'A text block inside the zone container.',
        },
      });
      add(text);
    }
  }, [data, withChildren, add, clear]);

  return null;
}

const meta: Meta<ZoneShapeStoryArgs> = {
  title: 'Shapes/ZoneShape',
  component: ZoneShapeCanvas,
  argTypes: {
    label: { control: 'text', description: 'Zone label' },
    color: { control: 'color', description: 'Zone tint color' },
    collapsed: { control: 'boolean', description: 'Collapsed state' },
    withChildren: { control: 'boolean', description: 'Include child shapes' },
    theme: { control: false },
  },
};

export default meta;
type Story = StoryObj<ZoneShapeStoryArgs>;

export const Default: Story = {
  args: {
    label: 'backstory',
    theme: 'fourCorners',
  },
};

export const Colored: Story = {
  args: {
    label: 'related-imagery',
    color: '#a855f7',
    theme: 'fourCorners',
  },
};

export const Collapsed: Story = {
  args: {
    label: 'links',
    collapsed: true,
    theme: 'fourCorners',
  },
};

export const WithChildren: Story = {
  args: {
    label: 'backstory',
    withChildren: true,
    theme: 'fourCorners',
  },
};
