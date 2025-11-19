import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import type { Display } from '../types';

interface DisplayPreviewModalProps {
  display: Display;
  onClose: () => void;
}

export default function DisplayPreviewModal({ display, onClose }: DisplayPreviewModalProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [currentContent, setCurrentContent] = useState<any>(null);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getDisplayPreview(display.id);
      console.log('Preview data:', data);
      setPreviewData(data);
      setCurrentPlaylistIndex(0);
      setCurrentContent(data?.content || null);
    } catch (err: any) {
      console.error('Preview error:', err);
      setError(err.response?.data?.message || 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [display.id]);

  // Auto-advance playlist items
  useEffect(() => {
    if (!previewData?.playlist?.items || previewData.playlist.items.length === 0) {
      return;
    }

    const items = previewData.playlist.items;
    const currentItem = items[currentPlaylistIndex];
    const duration = (currentItem?.durationOverride || currentItem?.content?.duration || 10) * 1000;

    console.log(`Auto-advancing in ${duration}ms (item ${currentPlaylistIndex + 1}/${items.length})`);

    const timer = setTimeout(() => {
      const nextIndex = previewData.playlist.loop
        ? (currentPlaylistIndex + 1) % items.length
        : Math.min(currentPlaylistIndex + 1, items.length - 1);

      console.log(`Advancing to item ${nextIndex + 1}/${items.length}`);
      setCurrentPlaylistIndex(nextIndex);
      setCurrentContent(items[nextIndex]?.content || null);
    }, duration);

    return () => clearTimeout(timer);
  }, [previewData, currentPlaylistIndex]);

  const renderContent = (content: any) => {
    if (!content) {
      console.log('No content to render');
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">No content available</p>
        </div>
      );
    }

    console.log('Rendering content type:', content.type, content);
    const bgColor = content.metadata?.backgroundColor || '#FFFFFF';

    switch (content.type) {
      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <img
              src={`/api${content.filePath}`}
              alt={content.title}
              className="max-w-full max-h-full object-contain"
              onError={(e) => console.error('Image load error:', e)}
              onLoad={() => console.log('Image loaded successfully')}
            />
          </div>
        );

      case 'video':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <video
              src={`/api${content.filePath}`}
              className="max-w-full max-h-full"
              controls
              autoPlay
              loop
              muted
              onError={(e) => console.error('Video load error:', e)}
            />
          </div>
        );

      case 'text':
        const isHtml = content.textContent?.includes('<p>') || content.textContent?.includes('<h');
        return (
          <div
            className="w-full h-full flex items-center justify-center p-8"
            style={{ backgroundColor: bgColor }}
          >
            {isHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: content.textContent || '' }}
                className="text-3xl leading-relaxed text-center rich-text-content"
                style={{ maxWidth: '90%' }}
              />
            ) : (
              <div className="text-4xl text-center text-gray-800">
                {content.textContent}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-500">Unsupported content type: {content.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Display Preview</h2>
            <p className="text-sm text-gray-600">
              {display.name} {display.location && `- ${display.location}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadPreview}
              className="btn btn-secondary p-2"
              title="Refresh preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary p-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-red-600">
                <p className="text-lg font-semibold mb-2">Error</p>
                <p>{error}</p>
              </div>
            </div>
          ) : !previewData ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg font-semibold mb-2">No Content</p>
                <p>This display has no scheduled or default content</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full">
              {/* 16:9 aspect ratio container */}
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <div className="absolute inset-0 bg-white">
                  {renderContent(currentContent)}
                </div>
              </div>

              {/* Info Bar */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Content:</span>{' '}
                    <span className="text-gray-900">{currentContent?.title || 'Untitled'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Type:</span>{' '}
                    <span className="text-gray-900 capitalize">{currentContent?.type || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Duration:</span>{' '}
                    <span className="text-gray-900">{currentContent?.duration || 0}s</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Source:</span>{' '}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      previewData.source === 'schedule' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {previewData.source === 'schedule' ? 'Scheduled' : 'Default'}
                    </span>
                  </div>
                  {previewData.playlist && (
                    <div>
                      <span className="font-semibold text-gray-700">Playlist:</span>{' '}
                      <span className="text-gray-900">
                        {currentPlaylistIndex + 1} / {previewData.playlist.items.length}
                      </span>
                    </div>
                  )}
                </div>

                {previewData.source === 'schedule' && previewData.schedule && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-semibold">Schedule:</span>{' '}
                    Priority {previewData.schedule.priority}
                    {previewData.schedule.startTime && ` • Starts: ${new Date(previewData.schedule.startTime).toLocaleString()}`}
                    {previewData.schedule.endTime && ` • Ends: ${new Date(previewData.schedule.endTime).toLocaleString()}`}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            This preview shows what is currently displaying on the screen. Refresh to see updates.
          </p>
        </div>
      </div>
    </div>
  );
}
