import { useState, useEffect } from 'react';
import { FileText, Image, Video, List, Upload, Trash2, X, Edit, Search, Calendar } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../lib/api';
import type { Content, ContentType, Display } from '../types';

export default function ContentPage() {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContentType | ''>('');
  const [showArchived, setShowArchived] = useState(false);

  // Quick schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingContent, setSchedulingContent] = useState<Content | null>(null);
  const [displays, setDisplays] = useState<Display[]>([]);

  useEffect(() => {
    loadContent();
    loadDisplays();
  }, [searchTerm, typeFilter, showArchived]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getContent();
      setContent(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const loadDisplays = async () => {
    try {
      const data = await api.getDisplays();
      setDisplays(data);
    } catch (err: any) {
      console.error('Failed to load displays:', err);
    }
  };

  const handleScheduleContent = (content: Content) => {
    setSchedulingContent(content);
    setShowScheduleModal(true);
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      await api.deleteContent(id);
      await loadContent();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete content');
    }
  };

  const getContentIcon = (type: ContentType) => {
    switch (type) {
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'slideshow':
        return <List className="w-5 h-5" />;
      case 'text':
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: ContentType) => {
    switch (type) {
      case 'image':
        return 'text-blue-600';
      case 'video':
        return 'text-purple-600';
      case 'slideshow':
        return 'text-green-600';
      case 'text':
        return 'text-orange-600';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTextModal(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Create Text
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Media
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="min-w-[150px]">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ContentType | '')}
              className="input w-full"
            >
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="text">Text</option>
              <option value="slideshow">Slideshows</option>
            </select>
          </div>

          {/* Show Archived Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show Archived</span>
          </label>

          {/* Clear Filters */}
          {(searchTerm || typeFilter || showArchived) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setShowArchived(false);
              }}
              className="btn btn-secondary text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : content.length === 0 ? (
        <div className="card text-center py-12">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
          <p className="text-gray-600 mb-4">Get started by uploading your first media file or creating text content.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setShowTextModal(true)} className="btn btn-secondary">
              Create Text
            </button>
            <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
              Upload Media
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {content.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {item.thumbnailPath ? (
                          <img
                            src={`/api/content/${item.id}/thumbnail`}
                            alt={item.title}
                            className="w-12 h-8 object-cover rounded"
                            onError={(e) => {
                              // Fallback to icon if thumbnail fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <span className={`${item.thumbnailPath ? 'hidden' : ''} ${getTypeColor(item.type)}`}>
                          {getContentIcon(item.type)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.type === 'image' ? 'bg-blue-100 text-blue-800' :
                        item.type === 'video' ? 'bg-purple-100 text-purple-800' :
                        item.type === 'slideshow' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.duration}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleScheduleContent(item)}
                          className="text-green-600 hover:text-green-900"
                          title="Schedule to display"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingContent(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit content"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContent(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete content"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Content Modal */}
      {editingContent && (
        <EditModal
          content={editingContent}
          onClose={() => setEditingContent(null)}
          onSuccess={() => {
            setEditingContent(null);
            loadContent();
          }}
        />
      )}

      {/* Quick Schedule Modal */}
      {showScheduleModal && schedulingContent && (
        <QuickScheduleModal
          content={schedulingContent}
          displays={displays}
          onClose={() => {
            setShowScheduleModal(false);
            setSchedulingContent(null);
          }}
          onSuccess={() => {
            setShowScheduleModal(false);
            setSchedulingContent(null);
          }}
        />
      )}

      {/* Upload Media Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadContent();
          }}
        />
      )}

      {/* Create Text Modal */}
      {showTextModal && (
        <TextModal
          onClose={() => setShowTextModal(false)}
          onSuccess={() => {
            setShowTextModal(false);
            loadContent();
          }}
        />
      )}
    </div>
  );
}

function EditModal({ content, onClose, onSuccess }: { content: Content; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState(content.title);
  const [duration, setDuration] = useState(content.duration);
  const [textContent, setTextContent] = useState(content.textContent || '');
  const [backgroundColor, setBackgroundColor] = useState(content.metadata?.backgroundColor || '#FFFFFF');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUpdating(true);
      setError('');

      // Only update the fields that can be edited
      await api.updateContent(content.id, {
        title,
        duration,
        ...(content.type === 'text' && {
          textContent,
          metadata: { ...content.metadata, backgroundColor }
        }),
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update content');
    } finally {
      setUpdating(false);
    }
  };

  const colorPresets = [
    { name: 'White', value: '#FFFFFF' },
    { name: 'Light Blue', value: '#E3F2FD' },
    { name: 'Light Green', value: '#E8F5E9' },
    { name: 'Light Yellow', value: '#FFF9C4' },
    { name: 'Light Orange', value: '#FFE0B2' },
    { name: 'Light Red', value: '#FFEBEE' },
    { name: 'Light Purple', value: '#F3E5F5' },
    { name: 'Light Gray', value: '#F5F5F5' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl my-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Content</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (seconds)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min="1"
                className="input w-full"
                required
              />
            </div>

            {content.type === 'text' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <div className="flex gap-2 mb-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setBackgroundColor(preset.value)}
                        className={`w-10 h-10 rounded border-2 ${
                          backgroundColor === preset.value ? 'border-blue-500' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: preset.value }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="input flex-1"
                      placeholder="#FFFFFF"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose a preset or use custom color (for urgency: red/orange for important, yellow for caution)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Content
                  </label>
                  <div className="border border-gray-300 rounded">
                    <ReactQuill
                      theme="snow"
                      value={textContent}
                      onChange={setTextContent}
                      modules={quillModules}
                      style={{ height: '200px', marginBottom: '42px' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Use the toolbar to format text, change colors, and add structure
                  </p>
                </div>
              </>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-600">
              <strong>Type:</strong> {content.type}
              {content.filePath && (
                <>
                  <br />
                  <strong>File:</strong> {content.filePath.split('/').pop()}
                </>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [duration, setDuration] = useState(30);
  const [expiresAt, setExpiresAt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState<{ successful: number; failed: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    try {
      setUploading(true);
      setError('');
      setUploadResult(null);

      if (files.length === 1) {
        // Single file upload
        await api.uploadContent(files[0], files[0].name.replace(/\.[^/.]+$/, ''), duration);
        onSuccess();
      } else {
        // Multiple files - upload sequentially
        let successful = 0;
        let failed = 0;
        const failedFiles: string[] = [];

        for (const file of files) {
          try {
            await api.uploadContent(file, file.name.replace(/\.[^/.]+$/, ''), duration);
            successful++;
          } catch (err) {
            failed++;
            failedFiles.push(file.name);
          }
        }

        setUploadResult({ successful, failed });

        if (failed > 0) {
          setError(`${failed} file(s) failed to upload. ${failedFiles.join(', ')}`);
        }

        if (successful > 0) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload content');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Upload Media</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Files (Max 20 files, 500MB total)
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="input w-full"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted: Images (JPG, PNG, GIF) and Videos (MP4, WebM)
              </p>
            </div>

            {files.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Files ({files.length})
                </label>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {file.type.startsWith('image/') ? (
                          <Image className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        ) : (
                          <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        )}
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800 ml-2 flex-shrink-0"
                        disabled={uploading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (seconds)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min="1"
                className="input w-full"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                For images: how long to display. For videos: ignored (uses video length).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date (optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Content will be automatically archived after this date
              </p>
            </div>

            {uploadResult && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded text-sm">
                ✓ {uploadResult.successful} file(s) uploaded successfully
                {uploadResult.failed > 0 && `, ${uploadResult.failed} failed`}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={files.length === 0 || uploading}
              >
                {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [duration, setDuration] = useState(30);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setCreating(true);
      setError('');
      await api.createTextContent({
        title,
        textContent,
        duration,
        metadata: { backgroundColor }
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create text content');
    } finally {
      setCreating(false);
    }
  };

  const colorPresets = [
    { name: 'White', value: '#FFFFFF' },
    { name: 'Light Blue', value: '#E3F2FD' },
    { name: 'Light Green', value: '#E8F5E9' },
    { name: 'Light Yellow', value: '#FFF9C4' },
    { name: 'Light Orange', value: '#FFE0B2' },
    { name: 'Light Red', value: '#FFEBEE' },
    { name: 'Light Purple', value: '#F3E5F5' },
    { name: 'Light Gray', value: '#F5F5F5' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl my-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Create Text Content</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <div className="flex gap-2 mb-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setBackgroundColor(preset.value)}
                    className={`w-10 h-10 rounded border-2 ${
                      backgroundColor === preset.value ? 'border-blue-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="input flex-1"
                  placeholder="#FFFFFF"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Choose a preset or use custom color (for urgency: red/orange for important, yellow for caution)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Content
              </label>
              <div className="border border-gray-300 rounded">
                <ReactQuill
                  theme="snow"
                  value={textContent}
                  onChange={setTextContent}
                  modules={quillModules}
                  style={{ height: '200px', marginBottom: '42px' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use the toolbar to format text, change colors, and add structure
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (seconds)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min="1"
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date (optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Content will be automatically archived after this date
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Quick Schedule Modal Component
function QuickScheduleModal({
  content,
  displays,
  onClose,
  onSuccess,
}: {
  content: Content;
  displays: Display[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedDisplayId, setSelectedDisplayId] = useState('');
  const [startTime, setStartTime] = useState(() => {
    // Default to current time
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState(5);
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDisplayId) {
      alert('Please select a display');
      return;
    }

    try {
      setCreating(true);
      await api.createSchedule({
        displayId: selectedDisplayId,
        contentId: content.id,
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        priority,
        isActive: true,
      });

      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create schedule');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Quick Schedule</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            {/* Content Info */}
            <div className="bg-gray-50 rounded p-3">
              <p className="text-sm text-gray-600">Scheduling:</p>
              <p className="font-medium text-gray-900">{content.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {content.type} • {content.duration}s duration
              </p>
            </div>

            {/* Display Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display *
              </label>
              <select
                value={selectedDisplayId}
                onChange={(e) => setSelectedDisplayId(e.target.value)}
                className="input w-full"
                required
              >
                <option value="">Select a display...</option>
                {displays.map((display) => (
                  <option key={display.id} value={display.id}>
                    {display.name} ({display.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            {/* End Time (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for indefinite scheduling
              </p>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority: {priority}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Low (1)</span>
                <span>High (10)</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Scheduling...' : 'Schedule Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
