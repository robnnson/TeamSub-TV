import { useState, useEffect } from 'react';
import { List, Plus, Trash2, Edit, Clock, Image as ImageIcon, Video, FileText, Play } from 'lucide-react';
import { api } from '../lib/api';
import type { Playlist } from '../types';
import PlaylistEditor from '../components/PlaylistEditor';
import PlaylistPreview from '../components/PlaylistPreview';

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [previewingPlaylist, setPreviewingPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getPlaylists();
      setPlaylists(data);
    } catch (err: any) {
      setError('Failed to load playlists');
      console.error('Error loading playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      await api.deletePlaylist(id);
      setPlaylists(playlists.filter(p => p.id !== id));
    } catch (err: any) {
      alert('Failed to delete playlist');
    }
  };

  const getTotalDuration = (playlist: Playlist): number => {
    return playlist.items.reduce((total, item) => {
      const duration = item.durationOverride ?? item.content?.duration ?? 10;
      return total + duration;
    }, 0);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
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
                    onClick={() => setPreviewingPlaylist(playlist)}
                    className="text-green-600 hover:text-green-900"
                    title="Preview playlist"
                  >
                    <Play className="w-4 h-4" />
                  </button>
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

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <List className="w-4 h-4" />
                  {playlist.items.length} item{playlist.items.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(getTotalDuration(playlist))}
                </span>
              </div>

              {playlist.items.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-xs text-gray-500 mb-2">Preview:</div>
                  <div className="flex gap-1 flex-wrap">
                    {playlist.items.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center"
                        title={item.content?.title}
                      >
                        {item.content?.type === 'image' && <ImageIcon className="w-5 h-5 text-gray-400" />}
                        {item.content?.type === 'video' && <Video className="w-5 h-5 text-gray-400" />}
                        {item.content?.type === 'text' && <FileText className="w-5 h-5 text-gray-400" />}
                      </div>
                    ))}
                    {playlist.items.length > 5 && (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                        +{playlist.items.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 mt-3">
                {new Date(playlist.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <PlaylistEditor
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPlaylists();
          }}
        />
      )}

      {editingPlaylist && (
        <PlaylistEditor
          playlist={editingPlaylist}
          onClose={() => setEditingPlaylist(null)}
          onSuccess={() => {
            setEditingPlaylist(null);
            loadPlaylists();
          }}
        />
      )}

      {previewingPlaylist && (
        <PlaylistPreview
          playlist={previewingPlaylist}
          onClose={() => setPreviewingPlaylist(null)}
        />
      )}
    </div>
  );
}
