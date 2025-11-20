import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, RotateCw } from 'lucide-react';
import type { Playlist } from '../types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface PlaylistPreviewProps {
  playlist: Playlist;
  onClose: () => void;
}

export default function PlaylistPreview({ playlist, onClose }: PlaylistPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const currentItem = playlist.items[currentIndex];
  const content = currentItem?.content;
  const duration = currentItem?.durationOverride ?? content?.duration ?? 10;

  useEffect(() => {
    setTimeRemaining(duration);
  }, [currentIndex, duration]);

  useEffect(() => {
    if (!isPlaying || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-advance to next item
          handleNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);

  const handleNext = () => {
    if (currentIndex < playlist.items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (playlist.loop) {
      setCurrentIndex(0);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (playlist.loop) {
      setCurrentIndex(playlist.items.length - 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setTimeRemaining(playlist.items[0]?.durationOverride ?? playlist.items[0]?.content?.duration ?? 10);
  };

  const getTotalDuration = (): number => {
    return playlist.items.reduce((total, item) => {
      const dur = item.durationOverride ?? item.content?.duration ?? 10;
      return total + dur;
    }, 0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!content) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl mx-4 h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{playlist.name}</h3>
            <p className="text-sm text-gray-500">
              Item {currentIndex + 1} of {playlist.items.length} • Total: {formatTime(getTotalDuration())}
              {playlist.loop && ' • Looping'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Display */}
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-8 overflow-auto">
          {content.type === 'image' && content.filePath && (
            <img
              src={`/api/content/${content.id}/file`}
              alt={content.title}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {content.type === 'video' && content.filePath && (
            <video
              src={`/api/content/${content.id}/file`}
              className="max-w-full max-h-full"
              controls
              autoPlay={isPlaying}
            />
          )}

          {content.type === 'text' && content.textContent && (
            <div
              className="w-full h-full flex items-center justify-center p-8"
              style={{
                backgroundColor: content.metadata?.backgroundColor || '#FFFFFF',
                color: content.metadata?.textColor || '#000000',
              }}
            >
              <div className="text-content max-w-4xl">
                <ReactQuill
                  value={content.textContent}
                  readOnly={true}
                  theme="bubble"
                  modules={{ toolbar: false }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content Info Bar */}
        <div className="px-6 py-3 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{content.title}</h4>
              <p className="text-sm text-gray-500">
                {content.type} • {duration}s duration
                {currentItem?.durationOverride && ' (overridden)'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono text-gray-900">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(duration)} total
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-t bg-white flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleRestart}
              className="btn btn-secondary flex items-center gap-2"
              title="Restart playlist"
            >
              <RotateCw className="w-4 h-4" />
              Restart
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handlePrev}
              className="p-2 hover:bg-gray-100 rounded-full"
              disabled={currentIndex === 0 && !playlist.loop}
              title="Previous"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 rounded-full"
              disabled={currentIndex === playlist.items.length - 1 && !playlist.loop}
              title="Next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-full bg-primary-600 transition-all duration-1000 ease-linear"
            style={{
              width: `${((duration - timeRemaining) / duration) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
