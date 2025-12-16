// Test file for FileUpload component
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import FileUpload from './FileUpload';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}));

describe('FileUpload Component', () => {
  const mockOnFileSelect = vi.fn();

  beforeEach(() => {
    mockOnFileSelect.mockClear();
  });

  it('renders default upload interface', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    expect(screen.getByText('Upload your files')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop files here, or click to browse')).toBeInTheDocument();
  });

  it('shows file specifications', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} maxFileSize={10 * 1024 * 1024} maxFiles={3} />);
    
    expect(screen.getByText('Maximum file size: 10.00 MB')).toBeInTheDocument();
    expect(screen.getByText('Maximum files: 3')).toBeInTheDocument();
  });

  it('handles click to upload', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const uploadZone = screen.getByRole('button', { name: /upload/i });
    fireEvent.click(uploadZone);
    
    // Should trigger file input click (tested via implementation)
  });

  it('validates file size', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 100 * 1024 * 1024 }); // 100MB
    
    render(<FileUpload onFileSelect={mockOnFileSelect} maxFileSize={50 * 1024 * 1024} />);
    
    const input = screen.getByLabelText('File upload input');
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/File size must be less than/)).toBeInTheDocument();
    });
  });

  it('validates file count', async () => {
    const files = Array.from({ length: 6 }, (_, i) => 
      new File(['test'], `test${i}.txt`, { type: 'text/plain' })
    );
    
    render(<FileUpload onFileSelect={mockOnFileSelect} maxFiles={5} />);
    
    const input = screen.getByLabelText('File upload input');
    fireEvent.change(input, { target: { files } });
    
    await waitFor(() => {
      expect(screen.getByText('Maximum 5 files allowed')).toBeInTheDocument();
    });
  });

  it('shows success state after valid file selection', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(<FileUpload onFileSelect={mockOnFileSelect} acceptedTypes={['image/*']} />);
    
    const input = screen.getByLabelText('File upload input');
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Upload successful!')).toBeInTheDocument();
      expect(mockOnFileSelect).toHaveBeenCalledWith([file]);
    });
  });

  it('handles drag and drop', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const uploadZone = screen.getByText('Upload your files').closest('div');
    
    // Simulate drag over
    fireEvent.dragOver(uploadZone!, {
      dataTransfer: { files: [] }
    });
    
    expect(screen.getByText('Drop files here')).toBeInTheDocument();
  });

  it('renders compact variant correctly', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} variant="compact" />);
    
    const uploadZone = screen.getByText('Upload your files').closest('div');
    expect(uploadZone).toHaveClass('min-h-[200px]');
  });

  it('renders minimal variant correctly', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} variant="minimal" />);
    
    const uploadZone = screen.getByText('Upload your files').closest('div');
    expect(uploadZone).toHaveClass('min-h-[120px]');
  });

  it('disables interaction when disabled prop is true', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} disabled />);
    
    const uploadZone = screen.getByText('Upload your files').closest('div');
    expect(uploadZone).toHaveClass('cursor-not-allowed');
  });
});