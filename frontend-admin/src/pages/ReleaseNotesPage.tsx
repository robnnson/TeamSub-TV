import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ReleaseNote } from '../types';
import { Plus, Edit2, Trash2, Calendar, Tag, AlertCircle } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function ReleaseNotesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<ReleaseNote | null>(null);
  const queryClient = useQueryClient();

  const { data: releaseNotes, isLoading } = useQuery({
    queryKey: ['releaseNotes'],
    queryFn: () => api.getReleaseNotes(),
  });

  const handleCreateNote = () => {
    setEditingNote(null);
    setShowModal(true);
  };

  const handleEditNote = (note: ReleaseNote) => {
    setEditingNote(note);
    setShowModal(true);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteReleaseNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releaseNotes'] });
    },
  });

  const handleDeleteNote = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this release note?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading release notes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Release Notes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage application release notes and version history
          </p>
        </div>
        <button onClick={handleCreateNote} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Release Note
        </button>
      </div>

      <div className="space-y-4">
        {releaseNotes && releaseNotes.length > 0 ? (
          releaseNotes.map((note) => (
            <div
              key={note.id}
              className="card p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {note.title}
                    </h3>
                    {note.isMajor && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-semibold rounded">
                        Major Release
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      <span className="font-medium">Version {note.version}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(note.releaseDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div
                    className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditNote(note)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Edit release note"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete release note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No release notes yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first release note to document version changes
            </p>
            <button onClick={handleCreateNote} className="btn-primary">
              Add Release Note
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <ReleaseNoteModal
          note={editingNote}
          onClose={() => {
            setShowModal(false);
            setEditingNote(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['releaseNotes'] });
            setShowModal(false);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
}

function ReleaseNoteModal({
  note,
  onClose,
  onSuccess,
}: {
  note: ReleaseNote | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [version, setVersion] = useState(note?.version || '');
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [releaseDate, setReleaseDate] = useState(
    note?.releaseDate ? new Date(note.releaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [isMajor, setIsMajor] = useState(note?.isMajor || false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const noteData = {
        version,
        title,
        content,
        releaseDate: new Date(releaseDate).toISOString(),
        isMajor,
      };

      if (note) {
        return api.updateReleaseNote(note.id, noteData);
      } else {
        return api.createReleaseNote(noteData);
      }
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to save release note');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!version.trim() || !title.trim() || !content.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    mutation.mutate();
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean'],
    ],
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {note ? 'Edit Release Note' : 'Add Release Note'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Version *
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="input w-full"
                placeholder="e.g., 1.2.0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Release Date *
              </label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="input w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
              placeholder="e.g., New Features and Bug Fixes"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isMajor}
                onChange={(e) => setIsMajor(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Mark as major release
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content *
            </label>
            <div className="bg-white dark:bg-gray-900 rounded-lg">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                className="dark:text-gray-100"
                placeholder="Describe the changes in this release..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : note ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
