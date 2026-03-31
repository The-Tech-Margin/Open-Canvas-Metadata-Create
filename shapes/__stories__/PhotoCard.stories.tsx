import React, { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CanvasProvider } from '../../react/CanvasProvider';
import { CanvasView } from '../../react/CanvasView';
import { useShapes } from '../../react/hooks/useShapes';
import { PhotoCard } from '../PhotoCard';
import type { PhotoCardData } from '../PhotoCard';
import { lightTheme } from '../../theme/presets/light';
import { darkTheme } from '../../theme/presets/dark';
import { fourCornersTheme } from '../../theme/presets/fourCorners';
import type { ThemeTokens } from '../../core/types';

const themeMap: Record<string, ThemeTokens> = {
  fourCorners: fourCornersTheme,
  light: lightTheme,
  dark: darkTheme,
};

interface PhotoCardStoryArgs extends PhotoCardData {
  theme: string;
}

function PhotoCardCanvas({ theme, ...data }: PhotoCardStoryArgs) {
  const tokens = themeMap[theme] ?? fourCornersTheme;

  return (
    <CanvasProvider theme={tokens}>
      <CanvasView style={{ width: 600, height: 400 }}>
        <PhotoCardInner data={data} />
      </CanvasView>
    </CanvasProvider>
  );
}

function PhotoCardInner({ data }: { data: Partial<PhotoCardData> }) {
  const { add, clear } = useShapes();

  useEffect(() => {
    clear();
    const card = new PhotoCard({
      x: 20,
      y: 20,
      data: {
        src: data.src || 'https://picsum.photos/300/225',
        alt: data.alt || 'Sample photograph',
        caption: data.caption,
        credit: data.credit,
        dateTaken: data.dateTaken,
        location: data.location,
        nfLabel: data.nfLabel,
      },
    });
    add(card);
  }, [data, add, clear]);

  return null;
}

const meta: Meta<PhotoCardStoryArgs> = {
  title: 'Shapes/PhotoCard',
  component: PhotoCardCanvas,
  argTypes: {
    src: { control: 'text', description: 'Image source URL' },
    alt: { control: 'text', description: 'Alt text' },
    caption: { control: 'text', description: 'Caption text' },
    credit: { control: 'text', description: 'Photographer credit' },
    dateTaken: { control: 'text', description: 'Date taken' },
    location: { control: 'text', description: 'Location' },
    nfLabel: { control: 'boolean', description: 'Nonfiction label' },
    theme: { control: false },
  },
};

export default meta;
type Story = StoryObj<PhotoCardStoryArgs>;

export const Default: Story = {
  args: {
    src: 'https://picsum.photos/300/225',
    alt: 'A sample photograph',
    caption: 'Street scene, downtown',
    credit: 'Jane Doe / Agency',
    theme: 'fourCorners',
  },
};

export const WithNFLabel: Story = {
  args: {
    ...Default.args,
    nfLabel: true,
  },
};

export const NoCaption: Story = {
  args: {
    src: 'https://picsum.photos/300/225',
    alt: 'Landscape without caption',
    theme: 'fourCorners',
  },
};
