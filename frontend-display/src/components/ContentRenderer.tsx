import { useEffect, useState } from 'react';
import type { Content } from '../types';

interface ContentRendererProps {
  content: Content;
  apiUrl: string;
  apiKey?: string;
  onComplete?: () => void;
}

export default function ContentRenderer({ content, apiUrl, apiKey, onComplete }: ContentRendererProps) {
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
      if (timer) {
        window.clearTimeout(timer);
        window.clearInterval(timer);
      }
    };
  }, [content, onComplete]);

  // Get the file URL using content ID endpoint with API key for authentication
  const getFileUrl = () => {
    const baseUrl = `${apiUrl}/content/${content.id}/file`;
    if (apiKey) {
      return `${baseUrl}?apiKey=${encodeURIComponent(apiKey)}`;
    }
    return baseUrl;
  };

  switch (content.type) {
    case 'image':
      return (
        <img
          src={getFileUrl()}
          alt={content.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      );

    case 'video':
      return (
        <video
          src={getFileUrl()}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          autoPlay
          muted
          onEnded={onComplete}
        />
      );

    case 'slideshow':
      // For slideshows, we'd need individual content IDs for each slide
      // This is a future enhancement - for now just show first slide
      const slides = (content.metadata?.slides as string[]) || [];
      return (
        <>
          {slides[currentSlideIndex] && (
            <img
              key={currentSlideIndex}
              src={getFileUrl()}
              alt={`${content.title} - Slide ${currentSlideIndex + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
