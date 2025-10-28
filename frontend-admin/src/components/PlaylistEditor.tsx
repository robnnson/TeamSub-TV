import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Clock, Image as ImageIcon, Video, FileText, Layers } from 'lucide-react';
import { api } from '../lib/api';
import type { Content, Playlist } from '../types';

interface PlaylistItem {
  contentId: string;
  durationOverride: number | null;
  content?: Content;
}

interface PlaylistEditorProps {
  playlist?: Playlist;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PlaylistEditor({ playlist, onClose, onSuccess }: PlaylistEditorProps) {
  const [name, setName] = useState(playlist?.name || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [loop, setLoop] = useState(playlist?.loop ?? true);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [availableContent, setAvailableContent] = useState<Content[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    if (playlist && availableContent.length > 0) {
      // Convert playlist items to our format
      const playlistItems = playlist.items.map(item => ({
        contentId: item.contentId,
        durationOverride: item.durationOverride,
        content: availableContent.find(c => c.id === item.contentId),
      }));
      setItems(playlistItems);
    }
  }, [playlist, availableContent]);

  const loadContent = async () => {
    try {
      const data = await api.getContent();
      setAvailableContent(data);
    } catch (err: any) {
      setError('Failed to load content');
      console.error('Error loading content:', err);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.contentId === active.id);
        const newIndex = items.findIndex(item => item.contentId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddContent = (content: Content) => {
    const newItem: PlaylistItem = {
      contentId: content.id,
      durationOverride: null,
      content,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (contentId: string) => {
    setItems(items.filter(item => item.contentId !== contentId));
  };

  const handleDurationChange = (contentId: string, duration: string) => {
    const durationValue = duration === '' ? null : parseInt(duration);
    setItems(items.map(item =>
      item.contentId === contentId
        ? { ...item, durationOverride: durationValue }
        : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError('Please add at least one content item to the playlist');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const playlistData = {
        name,
        description: description || undefined,
        loop,
        items: items.map(item => ({
          contentId: item.contentId,
          durationOverride: item.durationOverride ?? undefined,
        })),
      };

      if (playlist) {
        await api.updatePlaylist(playlist.id, playlistData);
      } else {
        await api.createPlaylist(playlistData);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save playlist');
    } finally {
      setSaving(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'text':
        return <FileText className="w-5 h-5" />;
      case 'slideshow':
        return <Layers className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTotalDuration = (): number => {
    return items.reduce((total, item) => {
      const duration = item.durationOverride ?? item.content?.duration ?? 10;
      return total + duration;
    }, 0);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const filteredAvailableContent = availableContent
    .filter(content => !items.some(item => item.contentId === content.id))
    .filter(content =>
      searchTerm === '' ||
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {playlist ? 'Edit Playlist' : 'Create Playlist'}
            </h2>
            {items.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {items.length} items • Total duration: {formatDuration(getTotalDuration())}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., Morning Announcements"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input w-full"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={loop}
                  onChange={(e) => setLoop(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Loop playlist continuously
                </span>
              </label>
              <span className="text-xs text-gray-500">
                {loop ? 'Playlist will restart after the last item' : 'Playlist will play once and stop'}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-6 pt-0">
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Available Content */}
              <div className="flex flex-col h-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Content
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input w-full mb-2"
                  placeholder="Search content..."
                />
                <div className="border border-gray-300 rounded-lg overflow-y-auto flex-1">
                  {filteredAvailableContent.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No content matches your search' : 'No content available'}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredAvailableContent.map((content) => (
                        <div
                          key={content.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                          onClick={() => handleAddContent(content)}
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 text-gray-400">
                            {getContentIcon(content.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{content.title}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                              <span className="capitalize">{content.type}</span>
                              <span>•</span>
                              <Clock className="w-3 h-3" />
                              <span>{content.duration}s</span>
                              {content.tags && content.tags.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{content.tags.slice(0, 2).join(', ')}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Playlist Items */}
              <div className="flex flex-col h-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Playlist Items ({items.length})
                </label>
                <div className="border border-gray-300 rounded-lg overflow-y-auto flex-1 p-2">
                  {items.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 text-center p-8">
                      <div>
                        <Layers className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No items yet</p>
                        <p className="text-sm mt-1">Click content on the left to add</p>
                      </div>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={items.map(item => item.contentId)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {items.map((item, index) => (
                            <SortableItem
                              key={item.contentId}
                              item={item}
                              index={index}
                              onRemove={handleRemoveItem}
                              onDurationChange={handleDurationChange}
                              getContentIcon={getContentIcon}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-6 mb-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end px-6 py-4 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || items.length === 0}
            >
              {saving ? 'Saving...' : playlist ? 'Update Playlist' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SortableItem({
  item,
  index,
  onRemove,
  onDurationChange,
  getContentIcon,
}: {
  item: PlaylistItem;
  index: number;
  onRemove: (contentId: string) => void;
  onDurationChange: (contentId: string, duration: string) => void;
  getContentIcon: (type: string) => JSX.Element;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.contentId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const content = item.content;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 hover:shadow-md transition-shadow"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <span className="text-sm text-gray-500 font-medium w-6">{index + 1}</span>

      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 text-gray-400">
        {content && getContentIcon(content.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate text-sm">
          {content?.title || 'Unknown'}
        </div>
        <div className="text-xs text-gray-500 capitalize">{content?.type}</div>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-400" />
        <input
          type="number"
          min="1"
          value={item.durationOverride ?? ''}
          onChange={(e) => onDurationChange(item.contentId, e.target.value)}
          placeholder={content?.duration?.toString() ?? '10'}
          className="input w-16 text-sm"
          title="Duration in seconds (leave empty to use default)"
        />
        <span className="text-xs text-gray-500">s</span>
      </div>

      <button
        type="button"
        onClick={() => onRemove(item.contentId)}
        className="text-red-500 hover:text-red-700 p-1"
        title="Remove from playlist"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
