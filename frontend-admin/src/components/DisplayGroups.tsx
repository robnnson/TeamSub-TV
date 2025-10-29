import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { DisplayGroup, Display } from '../types';

export default function DisplayGroups() {
  const [groups, setGroups] = useState<DisplayGroup[]>([]);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DisplayGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    displayIds: [] as string[],
    layoutType: 'standard' as 'standard' | 'weather',
  });

  useEffect(() => {
    loadGroups();
    loadDisplays();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await api.getDisplayGroups();
      setGroups(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load display groups');
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

  const handleCreate = () => {
    setEditingGroup(null);
    setFormData({ name: '', description: '', displayIds: [], layoutType: 'standard' });
    setShowCreateModal(true);
  };

  const handleEdit = (group: DisplayGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      displayIds: group.displays.map(d => d.id),
      layoutType: group.layoutType || 'standard',
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await api.updateDisplayGroup(editingGroup.id, formData);
      } else {
        await api.createDisplayGroup(formData);
      }
      setShowCreateModal(false);
      loadGroups();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save display group');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this display group?')) return;

    try {
      await api.deleteDisplayGroup(id);
      loadGroups();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete display group');
    }
  };

  const toggleDisplay = (displayId: string) => {
    setFormData(prev => ({
      ...prev,
      displayIds: prev.displayIds.includes(displayId)
        ? prev.displayIds.filter(id => id !== displayId)
        : [...prev.displayIds, displayId]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading display groups...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Display Groups</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Group
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-4">No display groups yet</p>
          <button
            onClick={handleCreate}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first display group
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-xl font-semibold">{group.name}</h2>
                  {group.description && (
                    <p className="text-gray-600 mt-1">{group.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(group)}
                    className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t">
                <h3 className="font-medium text-sm text-gray-700 mb-2">
                  Displays ({group.displays.length})
                </h3>
                {group.displays.length === 0 ? (
                  <p className="text-gray-500 text-sm">No displays in this group</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {group.displays.map((display) => (
                      <span
                        key={display.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${
                            display.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        {display.name}
                        {display.location && ` - ${display.location}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingGroup ? 'Edit Display Group' : 'Create Display Group'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Layout Type
                  </label>
                  <select
                    value={formData.layoutType}
                    onChange={(e) => setFormData({ ...formData, layoutType: e.target.value as 'standard' | 'weather' })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="standard">Standard Layout</option>
                    <option value="weather">Weather-Focused Layout</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Individual displays can override group layout setting
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Displays
                  </label>
                  <div className="border rounded p-3 max-h-60 overflow-y-auto">
                    {displays.length === 0 ? (
                      <p className="text-gray-500 text-sm">No displays available</p>
                    ) : (
                      <div className="space-y-2">
                        {displays.map((display) => (
                          <label
                            key={display.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.displayIds.includes(display.id)}
                              onChange={() => toggleDisplay(display.id)}
                              className="rounded"
                            />
                            <span className="flex items-center gap-2 flex-1">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  display.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                              />
                              <span className="font-medium">{display.name}</span>
                              {display.location && (
                                <span className="text-gray-500 text-sm">- {display.location}</span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {editingGroup ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
