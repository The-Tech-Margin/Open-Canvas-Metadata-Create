import React, { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CanvasProvider } from '../../react/CanvasProvider';
import { CanvasView } from '../../react/CanvasView';
import { useShapes } from '../../react/hooks/useShapes';
import { TextBlock } from '../TextBlock';
import type { TextBlockData } from '../TextBlock';
import { lightTheme } from '../../theme/presets/light';
import { darkTheme } from '../../theme/presets/dark';
import { fourCornersTheme } from '../../theme/presets/fourCorners';
import type { ThemeTokens } from '../../core/types';

const themeMap: Record<string, ThemeTokens> = {
  fourCorners: fourCornersTheme,
  light: lightTheme,
  dark: darkTheme,
};

interface TextBlockStoryArgs extends TextBlockData {
  theme: string;
}

function TextBlockCanvas({ theme, ...data }: TextBlockStoryArgs) {
  const tokens = themeMap[theme] ?? fourCornersTheme;

  return (
    <CanvasProvider theme={tokens}>
      <CanvasView style={{ width: 600, height: 400 }}>
        <TextBlockInner data={data} />
      </CanvasView>
    </CanvasProvider>
  );
}

function TextBlockInner({ data }: { data: Partial<TextBlockData> }) {
  const { add, clear } = useShapes();

  useEffect(() => {
    clear();
    const block = new TextBlock({
      x: 20,
      y: 20,
      data: {
        content: data.content || 'Sample text content',
        fontSize: data.fontSize,
        fontStyle: data.fontStyle,
        align: data.align,
        backgroundColor: data.backgroundColor,
      },
    });
    add(block);
  }, [data, add, clear]);

  return null;
}

const meta: Meta<TextBlockStoryArgs> = {
  title: 'Shapes/TextBlock',
  component: TextBlockCanvas,
  argTypes: {
    content: { control: 'text', description: 'Text content' },
    fontSize: { control: 'number', description: 'Font size' },
    fontStyle: {
      control: 'select',
      options: ['normal', 'bold', 'italic'],
      description: 'Font style',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Text alignment',
    },
    backgroundColor: { control: 'color', description: 'Background color' },
    theme: { control: false },
  },
};

export default meta;
type Story = StoryObj<TextBlockStoryArgs>;

export const Default: Story = {
  args: {
    content: 'The photograph was taken during a peaceful protest in the city center on March 15, 2024.',
    theme: 'fourCorners',
  },
};

export const Bold: Story = {
  args: {
    ...Default.args,
    fontStyle: 'bold',
  },
};

export const WithBackground: Story = {
  args: {
    ...Default.args,
    backgroundColor: '#fef3c7',
  },
};

export const Centered: Story = {
  args: {
    ...Default.args,
    align: 'center',
  },
};
