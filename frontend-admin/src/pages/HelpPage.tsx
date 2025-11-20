import { useState } from 'react';
import {
  Book,
  Monitor,
  Calendar,
  FileText,
  Users,
  Settings,
  Image,
  List,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function HelpPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Book className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Welcome to the TeamSub-TV Digital Signage Admin Portal! This guide will help you get started with managing your digital signage displays.
          </p>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Quick Start</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Create or upload content (images, videos, or text)</li>
            <li>Set up your displays and register them with the system</li>
            <li>Create schedules to assign content to displays</li>
            <li>Monitor your displays from the dashboard</li>
          </ol>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">First Steps</h4>
          <p className="text-gray-700 dark:text-gray-300">
            After logging in, you'll see the dashboard which provides an overview of your content, displays, and schedules. From here you can navigate to different sections using the sidebar menu.
          </p>
        </div>
      ),
    },
    {
      id: 'content-management',
      title: 'Content Management',
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Creating Content</h4>
          <p className="text-gray-700 dark:text-gray-300">
            The Content page allows you to manage all your digital signage content. You can upload images, videos, or create text-based content.
          </p>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Content Types</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Images:</strong> Upload JPG, PNG, or GIF files for static displays</li>
            <li><strong>Videos:</strong> Upload MP4 or WebM files for video content</li>
            <li><strong>Text:</strong> Create rich text content with formatting, lists, and links</li>
          </ul>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Quick Actions</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Click the calendar icon on any content to quickly schedule it</li>
            <li>Use the edit icon to modify content details</li>
            <li>Click the trash icon to delete content (this won't affect existing schedules)</li>
          </ul>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Best Practices</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Use descriptive titles for easy identification</li>
            <li>Set appropriate durations (5-10 seconds for images, actual length for videos)</li>
            <li>Tag content for better organization</li>
            <li>Set expiration dates for time-sensitive content</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'playlists',
      title: 'Playlists',
      icon: <List className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">What are Playlists?</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Playlists allow you to group multiple content items together and play them in sequence. This is ideal for creating rotating content displays.
          </p>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Creating a Playlist</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Navigate to the Playlists page</li>
            <li>Click "Create Playlist"</li>
            <li>Give your playlist a name and description</li>
            <li>Add content items to your playlist</li>
            <li>Drag and drop to reorder items</li>
            <li>Set custom durations for individual items if needed</li>
            <li>Enable loop to repeat the playlist continuously</li>
          </ol>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Preview Feature</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Click the play icon on any playlist to see a full-screen preview of how it will appear on displays. Use the controls to play/pause and navigate through items.
          </p>
        </div>
      ),
    },
    {
      id: 'displays',
      title: 'Display Management',
      icon: <Monitor className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Registering Displays</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Before you can show content on a display, you need to register it in the system.
          </p>

          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Navigate to the Displays page</li>
            <li>Click "Add Display"</li>
            <li>Enter a name and location for the display</li>
            <li>Copy the generated API key</li>
            <li>Configure the display client with this API key</li>
          </ol>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Display Groups</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Group multiple displays together to manage them as a single unit. This is useful for scheduling the same content across multiple locations.
          </p>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Display Status</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong className="text-green-600 dark:text-green-400">Online:</strong> Display is connected and active</li>
            <li><strong className="text-red-600 dark:text-red-400">Offline:</strong> Display hasn't connected recently</li>
          </ul>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Layout Types</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Standard:</strong> Full-screen content display</li>
            <li><strong>Weather:</strong> Content with weather information sidebar</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'scheduling',
      title: 'Scheduling Content',
      icon: <Calendar className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Creating Schedules</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Schedules determine what content appears on which displays and when.
          </p>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Schedule Options</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Target:</strong> Choose a specific display or display group</li>
            <li><strong>Content:</strong> Select individual content or a playlist</li>
            <li><strong>Start/End Time:</strong> Define when the schedule is active</li>
            <li><strong>Recurrence:</strong> Set up repeating schedules (daily, weekly, etc.)</li>
            <li><strong>Priority:</strong> Higher priority schedules override lower priority ones</li>
          </ul>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Quick Scheduling</h4>
          <p className="text-gray-700 dark:text-gray-300">
            From the Content page, click the calendar icon next to any content item to quickly create a schedule without navigating to the Schedules page.
          </p>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Priority System</h4>
          <p className="text-gray-700 dark:text-gray-300">
            When multiple schedules overlap, the one with the highest priority (1-10) will be displayed. This allows you to set default content with low priority and override it with special announcements at higher priority.
          </p>
        </div>
      ),
    },
    {
      id: 'user-management',
      title: 'User Management',
      icon: <Users className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">User Roles</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Admin:</strong> Full access to all features including user management</li>
            <li><strong>Standard:</strong> Can manage content, displays, and schedules but cannot manage users</li>
          </ul>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Creating Users</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Only admin users can create and manage other users. Navigate to the Users page to add new team members.
          </p>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Password Security</h4>
          <p className="text-gray-700 dark:text-gray-300">
            New users are required to change their password on first login. Users can change their password at any time from their profile settings.
          </p>
        </div>
      ),
    },
    {
      id: 'settings',
      title: 'System Settings',
      icon: <Settings className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">General Settings</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Configure system-wide settings that affect all displays and users.
          </p>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Status Settings</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>FPCON Status:</strong> Force Protection Condition level displayed on all screens</li>
            <li><strong>LAN Status:</strong> Local Area Network status indicator</li>
          </ul>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Weather Integration</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Configure OpenWeatherMap API credentials to enable weather information on displays using the weather layout.
          </p>

          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mt-4">Dark Mode</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Toggle between light and dark themes using the theme switcher in the sidebar. Your preference is saved automatically.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Help & Documentation</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Learn how to use the TeamSub-TV Digital Signage System
        </p>
      </div>

      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Book className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Need More Help?
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              If you can't find what you're looking for in this documentation, please contact your system administrator or check the Release Notes page for information about the latest features and changes.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {sections.map((section) => (
          <div key={section.id} className="card overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-blue-600 dark:text-blue-400">
                  {section.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {section.title}
                </h3>
              </div>
              {expandedSection === section.id ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSection === section.id && (
              <div className="p-6 pt-0 border-t border-gray-200 dark:border-gray-700">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card p-6 bg-gray-50 dark:bg-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Tips</h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <Image className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>Optimize images to 1920x1080 resolution for best display quality</span>
          </li>
          <li className="flex items-start gap-2">
            <Monitor className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>Check the dashboard regularly to ensure all displays are online</span>
          </li>
          <li className="flex items-start gap-2">
            <Calendar className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>Use priority levels to manage overlapping schedules effectively</span>
          </li>
          <li className="flex items-start gap-2">
            <List className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>Create playlists for rotating content instead of multiple schedules</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
