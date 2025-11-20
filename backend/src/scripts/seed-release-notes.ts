import { DataSource } from 'typeorm';
import { ReleaseNote } from '../release-notes/entities/release-note.entity';

const releaseNotes = [
  {
    version: '1.3.0',
    title: 'Release Notes & Help Documentation',
    content: `
<h3>New Features</h3>
<ul>
  <li><strong>Release Notes Management:</strong> Admin interface to create and manage release notes with version history tracking</li>
  <li><strong>Help Documentation:</strong> Comprehensive help system with guides for all major features</li>
  <li><strong>Rich Text Editor:</strong> Create beautifully formatted release notes with full HTML support</li>
  <li><strong>Major Release Tagging:</strong> Mark significant releases to highlight important updates</li>
</ul>

<h3>Improvements</h3>
<ul>
  <li>Added navigation links for easy access to release notes and help</li>
  <li>Improved sidebar organization with better feature grouping</li>
</ul>
    `,
    releaseDate: new Date('2025-01-19'),
    isMajor: false,
  },
  {
    version: '1.2.0',
    title: 'Dashboard Enhancements & Data Visualization',
    content: `
<h3>New Features</h3>
<ul>
  <li><strong>Data Visualization:</strong> Added pie charts for content distribution and bar charts for display status</li>
  <li><strong>Recent Activity Feed:</strong> Track the 5 most recently created content items</li>
  <li><strong>Enhanced Stats Cards:</strong> Improved visual design with better data presentation</li>
</ul>

<h3>Improvements</h3>
<ul>
  <li>Dashboard now provides at-a-glance insights into system usage</li>
  <li>Full dark mode support for all charts and visualizations</li>
  <li>Better color coding for different content types and display statuses</li>
</ul>
    `,
    releaseDate: new Date('2025-01-18'),
    isMajor: false,
  },
  {
    version: '1.1.0',
    title: 'Dark Mode & Theme Support',
    content: `
<h3>New Features</h3>
<ul>
  <li><strong>System-wide Dark Mode:</strong> Toggle between light and dark themes throughout the application</li>
  <li><strong>Theme Persistence:</strong> Your theme preference is saved automatically</li>
  <li><strong>System Preference Detection:</strong> Automatically uses your OS theme preference on first visit</li>
  <li><strong>Theme Toggle:</strong> Convenient theme switcher in the sidebar for quick access</li>
</ul>

<h3>Improvements</h3>
<ul>
  <li>Enhanced readability in both light and dark modes</li>
  <li>Smooth transitions between themes</li>
  <li>Comprehensive dark variants for all UI components</li>
</ul>
    `,
    releaseDate: new Date('2025-01-17'),
    isMajor: false,
  },
  {
    version: '1.0.0',
    title: 'Initial Release - TeamSub-TV Digital Signage Platform',
    content: `
<h3>Core Features</h3>
<ul>
  <li><strong>Content Management:</strong> Upload and manage images, videos, and create rich text content</li>
  <li><strong>Display Management:</strong> Register and monitor multiple digital signage displays</li>
  <li><strong>Display Groups:</strong> Organize displays into groups for easier management</li>
  <li><strong>Scheduling System:</strong> Advanced scheduling with recurrence rules and priority levels</li>
  <li><strong>Playlist Support:</strong> Create playlists with drag-and-drop reordering and preview mode</li>
  <li><strong>User Management:</strong> Admin and standard user roles with password security</li>
  <li><strong>Ticker Messages:</strong> Scrolling text messages across displays</li>
  <li><strong>Weather Integration:</strong> Weather-enabled layout with OpenWeatherMap support</li>
  <li><strong>Status Management:</strong> FPCON and LAN status indicators</li>
</ul>

<h3>Quick Actions</h3>
<ul>
  <li>One-click content scheduling from content list</li>
  <li>Quick schedule modal with display selection and time pickers</li>
  <li>Playlist preview with auto-play and navigation controls</li>
</ul>

<h3>Technical Highlights</h3>
<ul>
  <li>Built with React, TypeScript, and TailwindCSS</li>
  <li>NestJS backend with PostgreSQL database</li>
  <li>Real-time display status monitoring</li>
  <li>Secure authentication with JWT tokens</li>
  <li>Docker containerization for easy deployment</li>
</ul>
    `,
    releaseDate: new Date('2025-01-15'),
    isMajor: true,
  },
];

async function seedReleaseNotes() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'signage',
    password: process.env.DB_PASSWORD || 'signage_password',
    database: process.env.DB_DATABASE || 'signage_cms',
    entities: [ReleaseNote],
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const releaseNoteRepo = dataSource.getRepository(ReleaseNote);

    // Check if release notes already exist
    const existingNotes = await releaseNoteRepo.count();
    if (existingNotes > 0) {
      console.log(`Found ${existingNotes} existing release notes, skipping seed`);
      await dataSource.destroy();
      return;
    }

    // Insert release notes
    for (const noteData of releaseNotes) {
      const note = releaseNoteRepo.create(noteData);
      await releaseNoteRepo.save(note);
      console.log(`Created release note: ${noteData.version} - ${noteData.title}`);
    }

    console.log('Release notes seeded successfully');
    await dataSource.destroy();
  } catch (error) {
    console.error('Error seeding release notes:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seedReleaseNotes();
