import { useEffect, useState } from 'react';
import type { Content } from '../types';

interface ContentRendererProps {
  content: Content;
  apiUrl: string;
  onComplete?: () => void;
}

export default function ContentRenderer({ content, apiUrl, onComplete }: ContentRendererProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    let timer: number | undefined;

    if (content.type === 'image' || content.type === 'text') {
      // Auto-advance after duration
      timer = window.setTimeout(() => {
        onComplete?.();
      }, content.duration * 1000);
    } else if (content.type === 'slideshow' && content.metadata?.slides) {
      const slides = content.metadata.slides as string[];
      const slideInterval = (content.duration * 1000) / slides.length;

      timer = window.setInterval(() => {
        setCurrentSlideIndex((prev) => {
          const next = prev + 1;
          if (next >= slides.length) {
            onComplete?.();
            return prev;
          }
          return next;
        });
      }, slideInterval);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [content, onComplete]);

  const getContentUrl = (path: string) => {
    return `${apiUrl}${path}`;
  };

  switch (content.type) {
    case 'image':
      return (
        <img
          src={content.filePath ? getContentUrl(content.filePath) : ''}
          alt={content.title}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      );

    case 'video':
      return (
        <video
          src={content.filePath ? getContentUrl(content.filePath) : ''}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
          autoPlay
          muted
          onEnded={onComplete}
        />
      );

    case 'slideshow':
      const slides = (content.metadata?.slides as string[]) || [];
      return (
        <>
          {slides[currentSlideIndex] && (
            <img
              key={currentSlideIndex}
              src={getContentUrl(slides[currentSlideIndex])}
              alt={`${content.title} - Slide ${currentSlideIndex + 1}`}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          )}
        </>
      );

    case 'text':
      const bgColor = content.metadata?.backgroundColor || 'transparent';
      const textColor = content.metadata?.textColor || '#333333';
      const fontSize = content.metadata?.fontSize || '3rem';

      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bgColor,
            color: textColor,
            fontSize,
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          {content.textContent}
        </div>
      );

    default:
      return (
        <div style={{ color: '#999', fontSize: '1.5rem' }}>
          Unsupported content type: {content.type}
        </div>
      );
  }
}
