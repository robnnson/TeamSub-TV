import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, X, Monitor, FileText, Circle } from 'lucide-react';
import { api } from '../lib/api';
import type { Schedule, Display, Content } from '../types';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getSchedules();
      setSchedules(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await api.deleteSchedule(id);
      await loadSchedules();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete schedule');
    }
  };

  const handleToggleActive = async (schedule: Schedule) => {
    try {
      await api.updateSchedule(schedule.id, { isActive: !schedule.isActive });
      await loadSchedules();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update schedule');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Schedule Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Schedule
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
      ) : schedules.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules yet</h3>
          <p className="text-gray-600 mb-4">Create your first schedule to automate content display.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Create Schedule
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recurrence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {schedule.display?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {schedule.display?.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          {schedule.contentIds && schedule.contentIds.length > 0 ? (
                            <>
                              <div className="text-sm font-medium text-gray-900">
                                Playlist ({schedule.contentIds.length} items)
                              </div>
                              <div className="text-xs text-gray-500">
                                Multiple content items
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-900">
                              {schedule.content?.title || 'Unknown'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(schedule.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.endTime ? formatTime(schedule.endTime) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {schedule.recurrenceRule ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {schedule.recurrenceRule}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Once</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        schedule.priority >= 100 ? 'bg-red-100 text-red-800' :
                        schedule.priority >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(schedule)}
                        className="flex items-center gap-2"
                      >
                        <Circle
                          className={`w-3 h-3 fill-current ${
                            schedule.isActive ? 'text-green-500' : 'text-gray-400'
                          }`}
                        />
                        <span className={`text-xs font-medium ${
                          schedule.isActive ? 'text-green-800' : 'text-gray-600'
                        }`}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateScheduleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadSchedules();
          }}
        />
      )}
    </div>
  );
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  contentIds: string[];
  createdAt: string;
  updatedAt: string;
}

function CreateScheduleModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [displayId, setDisplayId] = useState('');
  const [contentId, setContentId] = useState('');
  const [contentIds, setContentIds] = useState<string[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [contentMode, setContentMode] = useState<'single' | 'adhoc' | 'playlist'>('single');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState('');
  const [priority, setPriority] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [displaysData, contentData] = await Promise.all([
        api.getDisplays(),
        api.getContent(),
      ]);
      setDisplays(displaysData);
      setContent(contentData);

      // Load playlists from localStorage
      const storedPlaylists = localStorage.getItem('playlists');
      if (storedPlaylists) {
        setPlaylists(JSON.parse(storedPlaylists));
      }
    } catch (err: any) {
      setError('Failed to load displays and content');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: if recurring, end time is required
    if (recurrenceRule && !endTime) {
      setError('End time is required for recurring schedules');
      return;
    }

    // Validate content selection based on mode
    if (contentMode === 'single' && !contentId) {
      setError('Please select content');
      return;
    }

    if (contentMode === 'adhoc' && contentIds.length === 0) {
      setError('Please select at least one content item');
      return;
    }

    if (contentMode === 'playlist' && !selectedPlaylistId) {
      setError('Please select a playlist');
      return;
    }

    try {
      setCreating(true);
      setError('');

      // Determine which content to send based on mode
      let finalContentId: string | undefined;
      let finalContentIds: string[] | undefined;

      if (contentMode === 'single') {
        finalContentId = contentId;
      } else if (contentMode === 'adhoc') {
        finalContentIds = contentIds;
      } else if (contentMode === 'playlist') {
        const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);
        if (selectedPlaylist) {
          finalContentIds = selectedPlaylist.contentIds;
        }
      }

      await api.createSchedule({
        displayId,
        contentId: finalContentId,
        contentIds: finalContentIds,
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        recurrenceRule: recurrenceRule || undefined,
        priority,
        isActive,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create schedule');
    } finally {
      setCreating(false);
    }
  };

  // Get current datetime for min attribute
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Create Schedule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display *
                </label>
                <select
                  value={displayId}
                  onChange={(e) => setDisplayId(e.target.value)}
                  className="input w-full"
                  required
                >
                  <option value="">Select a display</option>
                  {displays.map((display) => (
                    <option key={display.id} value={display.id}>
                      {display.name} - {display.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content Type *
                </label>
                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={contentMode === 'single'}
                      onChange={() => {
                        setContentMode('single');
                        setContentIds([]);
                        setSelectedPlaylistId('');
                      }}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm text-gray-700">Single Content</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={contentMode === 'playlist'}
                      onChange={() => {
                        setContentMode('playlist');
                        setContentId('');
                        setContentIds([]);
                      }}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm text-gray-700">Saved Playlist</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={contentMode === 'adhoc'}
                      onChange={() => {
                        setContentMode('adhoc');
                        setContentId('');
                        setSelectedPlaylistId('');
                      }}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm text-gray-700">Ad-hoc Multi-Content</span>
                  </label>
                </div>

                {contentMode === 'single' && (
                  <select
                    value={contentId}
                    onChange={(e) => setContentId(e.target.value)}
                    className="input w-full"
                    required
                  >
                    <option value="">Select content</option>
                    {content.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} ({item.type})
                      </option>
                    ))}
                  </select>
                )}

                {contentMode === 'playlist' && (
                  <>
                    <select
                      value={selectedPlaylistId}
                      onChange={(e) => setSelectedPlaylistId(e.target.value)}
                      className="input w-full"
                      required
                    >
                      <option value="">Select a playlist</option>
                      {playlists.map((playlist) => (
                        <option key={playlist.id} value={playlist.id}>
                          {playlist.name} ({playlist.contentIds.length} items)
                        </option>
                      ))}
                    </select>
                    {playlists.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        No playlists found. Create one in the Playlists page first.
                      </p>
                    )}
                    {selectedPlaylistId && (
                      <p className="text-xs text-gray-500 mt-1">
                        {playlists.find(p => p.id === selectedPlaylistId)?.description}
                      </p>
                    )}
                  </>
                )}

                {contentMode === 'adhoc' && (
                  <>
                    <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                      {content.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={contentIds.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setContentIds([...contentIds, item.id]);
                              } else {
                                setContentIds(contentIds.filter(id => id !== item.id));
                              }
                            }}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            {item.title} ({item.type})
                          </span>
                        </label>
                      ))}
                    </div>
                    {contentIds.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {contentIds.length} item{contentIds.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min={minDateTime}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time {recurrenceRule ? '*' : '(Optional)'}
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime || minDateTime}
                  className="input w-full"
                  required={!!recurrenceRule}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {recurrenceRule ? 'Required for recurring schedules' : 'Leave empty for no end time'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recurrence Rule (Optional)
              </label>
              <select
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
                className="input w-full"
              >
                <option value="">No recurrence (one-time)</option>
                <option value="FREQ=DAILY">Daily</option>
                <option value="FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR">Weekdays</option>
                <option value="FREQ=WEEKLY">Weekly</option>
                <option value="FREQ=WEEKLY;BYDAY=MO">Every Monday</option>
                <option value="FREQ=WEEKLY;BYDAY=TU">Every Tuesday</option>
                <option value="FREQ=WEEKLY;BYDAY=WE">Every Wednesday</option>
                <option value="FREQ=WEEKLY;BYDAY=TH">Every Thursday</option>
                <option value="FREQ=WEEKLY;BYDAY=FR">Every Friday</option>
                <option value="FREQ=MONTHLY">Monthly</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Uses iCalendar RRULE format for recurring schedules
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  min="0"
                  max="999"
                  className="input w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher priority schedules override lower ones (0-999)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            {displays.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm">
                No displays registered. Please register a display first.
              </div>
            )}

            {content.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm">
                No content available. Please upload content first.
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
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
                disabled={creating || displays.length === 0 || content.length === 0}
              >
                {creating ? 'Creating...' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
