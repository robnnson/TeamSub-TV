import { useState, useEffect } from 'react';
import { List, Plus, Trash2, X, Edit, GripVertical } from 'lucide-react';
import { api } from '../lib/api';
import type { Content } from '../types';

interface Playlist {
  id: string;
  name: string;
  description: string;
  contentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      setError('');
      // For now, we'll store playlists in localStorage since we don't have a backend endpoint yet
      const stored = localStorage.getItem('playlists');
      if (stored) {
        setPlaylists(JSON.parse(stored));
      } else {
        setPlaylists([]);
      }
    } catch (err: any) {
      setError('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const updated = playlists.filter(p => p.id !== id);
      localStorage.setItem('playlists', JSON.stringify(updated));
      setPlaylists(updated);
    } catch (err: any) {
      alert('Failed to delete playlist');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Playlist Management</h1>
          <p className="text-gray-600 mt-1">Create and manage content playlists for your displays</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Playlist
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : playlists.length === 0 ? (
        <div className="card text-center py-12">
          <List className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No playlists yet</h3>
          <p className="text-gray-600 mb-4">Create your first playlist to organize multiple content items.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-900">{playlist.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingPlaylist(playlist)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit playlist"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {playlist.description && (
                <p className="text-sm text-gray-600 mb-3">{playlist.description}</p>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {playlist.contentIds.length} item{playlist.contentIds.length !== 1 ? 's' : ''}
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(playlist.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <PlaylistModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPlaylists();
          }}
        />
      )}

      {editingPlaylist && (
        <PlaylistModal
          playlist={editingPlaylist}
          onClose={() => setEditingPlaylist(null)}
          onSuccess={() => {
            setEditingPlaylist(null);
            loadPlaylists();
          }}
        />
      )}
    </div>
  );
}

function PlaylistModal({
  playlist,
  onClose,
  onSuccess,
}: {
  playlist?: Playlist;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(playlist?.name || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>(playlist?.contentIds || []);
  const [content, setContent] = useState<Content[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const data = await api.getContent();
      setContent(data);
    } catch (err: any) {
      setError('Failed to load content');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedContentIds.length === 0) {
      setError('Please select at least one content item');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const stored = localStorage.getItem('playlists');
      const playlists: Playlist[] = stored ? JSON.parse(stored) : [];

      if (playlist) {
        // Update existing
        const index = playlists.findIndex(p => p.id === playlist.id);
        if (index !== -1) {
          playlists[index] = {
            ...playlists[index],
            name,
            description,
            contentIds: selectedContentIds,
            updatedAt: new Date().toISOString(),
          };
        }
      } else {
        // Create new
        playlists.push({
          id: `playlist-${Date.now()}`,
          name,
          description,
          contentIds: selectedContentIds,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      localStorage.setItem('playlists', JSON.stringify(playlists));
      onSuccess();
    } catch (err: any) {
      setError('Failed to save playlist');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleContent = (contentId: string) => {
    if (selectedContentIds.includes(contentId)) {
      setSelectedContentIds(selectedContentIds.filter(id => id !== contentId));
    } else {
      setSelectedContentIds([...selectedContentIds, contentId]);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newIds = [...selectedContentIds];
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    setSelectedContentIds(newIds);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedContentIds.length - 1) return;
    const newIds = [...selectedContentIds];
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    setSelectedContentIds(newIds);
  };

  const selectedContent = selectedContentIds
    .map(id => content.find(c => c.id === id))
    .filter(Boolean) as Content[];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {playlist ? 'Edit Playlist' : 'Create Playlist'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input w-full"
                rows={2}
                placeholder="Optional description of this playlist"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Available Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Content
                </label>
                <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                  {content.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No content available
                    </div>
                  ) : (
                    content
                      .filter(item => !selectedContentIds.includes(item.id))
                      .map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handleToggleContent(item.id)}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                          <span className="text-sm text-gray-700 flex-1">
                            {item.title}
                          </span>
                          <span className="text-xs text-gray-500">{item.type}</span>
                        </label>
                      ))
                  )}
                </div>
              </div>

              {/* Selected Content (Ordered) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Playlist Items ({selectedContent.length})
                </label>
                <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                  {selectedContent.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No items selected
                    </div>
                  ) : (
                    selectedContent.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <GripVertical className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === selectedContent.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <GripVertical className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs text-gray-400 w-6">{index + 1}.</span>
                        <span className="text-sm text-gray-700 flex-1">{item.title}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleContent(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
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
                disabled={saving || selectedContentIds.length === 0}
              >
                {saving ? 'Saving...' : playlist ? 'Update Playlist' : 'Create Playlist'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
