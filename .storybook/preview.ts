import type { Preview } from '@storybook/react';

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Canvas theme preset',
      defaultValue: 'fourCorners',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'fourCorners', title: 'Four Corners' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
