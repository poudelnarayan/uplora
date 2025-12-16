// Storybook stories for FileUpload component
// This file demonstrates all the different states and variants

import type { Meta, StoryObj } from '@storybook/react';
import FileUpload from './FileUpload';

const meta: Meta<typeof FileUpload> = {
  title: 'UI/FileUpload',
  component: FileUpload,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A modern file upload component with drag-and-drop support, progress tracking, and comprehensive validation.'
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'minimal']
    },
    maxFileSize: {
      control: 'number'
    },
    maxFiles: {
      control: 'number'
    }
  }
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

// Default state
export const Default: Story = {
  args: {
    onFileSelect: (files) => console.log('Files selected:', files),
    acceptedTypes: ['image/*', 'video/*', '.pdf'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 5,
    showPreview: true
  }
};

// Compact variant
export const Compact: Story = {
  args: {
    ...Default.args,
    variant: 'compact'
  }
};

// Minimal variant
export const Minimal: Story = {
  args: {
    ...Default.args,
    variant: 'minimal',
    showPreview: false
  }
};

// Images only
export const ImagesOnly: Story = {
  args: {
    ...Default.args,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10
  }
};

// Single file upload
export const SingleFile: Story = {
  args: {
    ...Default.args,
    maxFiles: 1,
    acceptedTypes: ['.pdf', '.doc', '.docx']
  }
};

// Disabled state
export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true
  }
};

// Large files
export const LargeFiles: Story = {
  args: {
    ...Default.args,
    acceptedTypes: ['video/*'],
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxFiles: 3
  }
};