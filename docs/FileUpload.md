# FileUpload Component Documentation

## Overview

A modern, accessible file upload component that supports drag-and-drop, click-to-upload, and provides comprehensive file validation with beautiful animations and state management.

## Design Specifications

### Visual Design

#### **Color Palette**
- **Primary**: `#00ADB5` (rgb(0, 173, 181)) - CTAs and active states
- **Secondary**: `#393E46` (rgb(57, 62, 70)) - Secondary elements
- **Dark**: `#222831` (rgb(34, 40, 49)) - Text and borders
- **Light**: `#EEEEEE` (rgb(238, 238, 238)) - Backgrounds

#### **Typography**
- **Font Family**: Inter, "Open Sans", system-ui, sans-serif
- **Heading**: 20px, font-weight: 700, line-height: 1.2
- **Body**: 14px, font-weight: 400, line-height: 1.5
- **Caption**: 12px, font-weight: 500, line-height: 1.4

#### **Spacing System**
- **Base unit**: 8px
- **Component padding**: 32px (default), 24px (compact), 16px (minimal)
- **Element gaps**: 16px between major elements, 8px between related items
- **Border radius**: 16px for main container, 12px for cards, 8px for buttons

#### **Dimensions**
- **Default**: min-height: 280px, padding: 32px
- **Compact**: min-height: 200px, padding: 24px  
- **Minimal**: min-height: 120px, padding: 16px
- **Icon size**: 64px container, 32px icon
- **Border width**: 2px for drag zone, 1px for cards

### Interaction States

#### **1. Default State**
- **Background**: Linear gradient from `#EEEEEE` to white
- **Border**: 2px dashed `#393E46`
- **Icon**: Upload icon in `#393E46` background
- **Text**: "Upload your files" in `#222831`
- **Hover**: Scale 1.01, border color `#00ADB5`, shadow

#### **2. Drag Over State**
- **Background**: Gradient from `#00ADB5/5` to `#00ADB5/10`
- **Border**: 2px solid `#00ADB5`
- **Scale**: 1.02 transform
- **Icon**: Cloud icon in `#00ADB5` background
- **Text**: "Drop files here" in `#00ADB5`

#### **3. Success State**
- **Background**: Gradient from green-50 to emerald-50
- **Border**: 2px solid green-500
- **Icon**: CheckCircle in green-500 background
- **Text**: "Upload successful!" in green-700
- **Duration**: Auto-clear after 3 seconds

#### **4. Error State**
- **Background**: Gradient from red-50 to pink-50
- **Border**: 2px solid red-500
- **Icon**: AlertCircle in red-500 background
- **Text**: Error message in red-700
- **Duration**: Auto-clear after 5 seconds

#### **5. Loading State**
- **Icon**: Spinning loader in `#00ADB5` background
- **Progress bar**: Gradient from `#00ADB5` to `#393E46`
- **Text**: "Uploading files..." with percentage

#### **6. Disabled State**
- **Opacity**: 50%
- **Cursor**: not-allowed
- **Background**: gray-50
- **Border**: gray-300

### Animation Specifications

#### **Timing Functions**
- **Default**: ease-out for natural feel
- **Hover**: 200ms duration for responsiveness
- **State changes**: 300ms for smooth transitions
- **Spring animations**: stiffness: 300, damping: 20

#### **Transform Effects**
- **Hover scale**: 1.01 (subtle lift)
- **Tap scale**: 0.99 (tactile feedback)
- **Drag over scale**: 1.02 (clear visual feedback)
- **Icon rotation**: -180° to 0° on mount

#### **Opacity Transitions**
- **Fade in**: 0 to 1 over 300ms
- **State changes**: 0.5 to 1 over 200ms
- **Error/Success**: 0 to 1 over 300ms with slide up

## Component API

### Props Interface

```typescript
interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "compact" | "minimal";
  showPreview?: boolean;
}
```

### Usage Examples

#### **Basic Usage**
```tsx
<FileUpload 
  onFileSelect={(files) => console.log(files)}
  acceptedTypes={['image/*', 'video/*']}
  maxFileSize={50 * 1024 * 1024} // 50MB
  maxFiles={5}
/>
```

#### **Image Upload Only**
```tsx
<FileUpload 
  onFileSelect={handleImageUpload}
  acceptedTypes={['image/jpeg', 'image/png', 'image/gif']}
  maxFileSize={10 * 1024 * 1024} // 10MB
  maxFiles={10}
  variant="compact"
/>
```

#### **Document Upload**
```tsx
<FileUpload 
  onFileSelect={handleDocuments}
  acceptedTypes={['.pdf', '.doc', '.docx']}
  maxFileSize={25 * 1024 * 1024} // 25MB
  maxFiles={1}
  variant="minimal"
  showPreview={false}
/>
```

## Accessibility Features

### **WCAG 2.1 AA Compliance**

#### **Keyboard Navigation**
- **Tab order**: Logical focus sequence
- **Enter/Space**: Activate file selection
- **Escape**: Cancel drag operation
- **Arrow keys**: Navigate file preview list

#### **Screen Reader Support**
- **ARIA labels**: Descriptive labels for all interactive elements
- **Role attributes**: Proper semantic roles
- **Live regions**: Status announcements for state changes
- **Alt text**: Meaningful descriptions for icons

#### **Color Contrast**
- **Text on light**: 4.5:1 minimum contrast ratio
- **Interactive elements**: 3:1 minimum for non-text
- **Error states**: High contrast red (#DC2626)
- **Success states**: High contrast green (#059669)

#### **Focus Management**
- **Visible focus**: 2px solid `#00ADB5` outline
- **Focus trap**: Within modal contexts
- **Focus restoration**: Return to trigger element

### **Responsive Design**

#### **Breakpoints**
- **Mobile**: < 768px - Single column, larger touch targets
- **Tablet**: 768px - 1024px - Optimized spacing
- **Desktop**: > 1024px - Full feature set

#### **Touch Targets**
- **Minimum size**: 44px × 44px for touch interfaces
- **Spacing**: 8px minimum between interactive elements
- **Gesture support**: Drag and drop on touch devices

## Error Handling

### **Validation Rules**

#### **File Size**
- **Check**: File size against maxFileSize prop
- **Message**: "File size must be less than {limit}"
- **Action**: Reject file, show error for 5 seconds

#### **File Type**
- **Check**: MIME type and extension validation
- **Message**: "File type not supported. Accepted: {types}"
- **Action**: Reject file, show error for 5 seconds

#### **File Count**
- **Check**: Number of files against maxFiles prop
- **Message**: "Maximum {limit} files allowed"
- **Action**: Reject excess files, show error

#### **Network Errors**
- **Timeout**: 30 second timeout for uploads
- **Connection**: Retry mechanism with exponential backoff
- **Server errors**: User-friendly error messages

### **Error Recovery**
- **Auto-clear**: Errors clear after 5 seconds
- **Manual dismiss**: Click to dismiss error messages
- **Retry mechanism**: Allow users to retry failed uploads
- **Graceful degradation**: Fallback to basic upload if drag-drop fails

## Performance Considerations

### **Optimization Strategies**

#### **File Processing**
- **Lazy loading**: Only process files when needed
- **Chunked uploads**: Large files uploaded in chunks
- **Compression**: Client-side image compression for web
- **Thumbnails**: Generate previews for images

#### **Memory Management**
- **File cleanup**: Release file references after upload
- **Preview limits**: Limit number of preview images
- **Garbage collection**: Proper cleanup of event listeners

#### **Network Efficiency**
- **Parallel uploads**: Multiple files uploaded concurrently
- **Progress tracking**: Real-time upload progress
- **Cancellation**: Allow users to cancel uploads
- **Resume capability**: Resume interrupted uploads

## Browser Support

### **Modern Browsers**
- **Chrome**: 90+ (full feature support)
- **Firefox**: 88+ (full feature support)
- **Safari**: 14+ (full feature support)
- **Edge**: 90+ (full feature support)

### **Feature Detection**
- **Drag and Drop API**: Graceful fallback to click-only
- **File API**: Required for file validation
- **FormData**: Required for upload functionality
- **Intersection Observer**: For performance optimizations

### **Polyfills**
- **File API**: For older browsers
- **Drag and Drop**: Touch device support
- **Intersection Observer**: Performance monitoring

## Security Considerations

### **Client-Side Validation**
- **File type checking**: MIME type and extension validation
- **Size limits**: Prevent oversized uploads
- **Content scanning**: Basic malware detection patterns

### **Server-Side Requirements**
- **Re-validation**: All client validations must be repeated server-side
- **Virus scanning**: Implement server-side malware detection
- **Content filtering**: Check for inappropriate content
- **Rate limiting**: Prevent abuse and spam

### **Data Privacy**
- **Local processing**: File previews generated locally
- **Secure transmission**: HTTPS required for uploads
- **Temporary storage**: Clear file data after processing
- **User consent**: Clear privacy policy for file handling

## Implementation Notes

### **Integration Steps**

1. **Install dependencies**: Ensure framer-motion is available
2. **Import component**: Add to your component library
3. **Configure props**: Set appropriate file restrictions
4. **Handle callbacks**: Implement onFileSelect handler
5. **Style integration**: Ensure CSS variables are defined
6. **Test thoroughly**: Validate all states and edge cases

### **Customization Options**

#### **Styling**
- **CSS variables**: Override color scheme
- **Custom classes**: Add additional styling
- **Theme integration**: Works with dark/light themes
- **Brand colors**: Easily customizable color palette

#### **Behavior**
- **Upload strategy**: Immediate vs batch uploads
- **Validation rules**: Custom validation functions
- **Progress tracking**: Custom progress indicators
- **Error handling**: Custom error message formatting

This comprehensive file upload component provides a modern, accessible, and performant solution that meets industry standards while being highly customizable for different use cases.