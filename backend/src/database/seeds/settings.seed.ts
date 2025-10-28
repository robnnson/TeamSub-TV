import { DataSource } from 'typeorm';
import { Setting } from '../../settings/entities/setting.entity';
import { createCipheriv, randomBytes } from 'crypto';

function encryptValue(text: string, key: string): { encrypted: string; iv: string } {
  const algorithm = 'aes-256-gcm';
  const keyBuffer = Buffer.from(key, 'hex');
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, keyBuffer, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted + authTag.toString('hex'),
    iv: iv.toString('hex'),
  };
}

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'signage',
    password: process.env.DB_PASSWORD || 'signage_password',
    database: process.env.DB_DATABASE || 'signage_cms',
    entities: [Setting],
  });

  await dataSource.initialize();

  const settingsRepository = dataSource.getRepository(Setting);
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    console.error('❌ ENCRYPTION_KEY not set in environment');
    await dataSource.destroy();
    process.exit(1);
  }

  // Define initial settings
  const settings = [
    // Status settings
    {
      key: 'fpcon_status',
      value: 'NORMAL',
      isEncrypted: false,
      description: 'Force Protection Condition status',
    },
    {
      key: 'lan_status',
      value: 'NORMAL',
      isEncrypted: false,
      description: 'Network LAN status',
    },

    // API Keys (encrypted)
    {
      key: 'api_key_openweather',
      value: process.env.OPENWEATHER_API_KEY || '9fcfc0149fef9015a6eaba1df22caf5b',
      isEncrypted: true,
      description: 'OpenWeatherMap API key',
    },
    {
      key: 'api_key_wmata',
      value: process.env.WMATA_API_KEY || 'd1df6a70755d42398beefaf6ee90a662',
      isEncrypted: true,
      description: 'WMATA Metro API key',
    },
    {
      key: 'api_key_tomtom',
      value: process.env.TOMTOM_API_KEY || '5mbANdobpExgtq28V5rxlSylvDx87ulH',
      isEncrypted: true,
      description: 'TomTom Routing API key',
    },

    // Display settings
    {
      key: 'banner_rotation_interval',
      value: '10000',
      isEncrypted: false,
      description: 'Banner rotation interval in milliseconds',
    },
    {
      key: 'content_rotation_interval',
      value: '10000',
      isEncrypted: false,
      description: 'Content rotation interval in milliseconds',
    },
    {
      key: 'weather_update_interval',
      value: '600000',
      isEncrypted: false,
      description: 'Weather update interval in milliseconds (10 min)',
    },
    {
      key: 'metro_update_interval',
      value: '30000',
      isEncrypted: false,
      description: 'Metro arrivals update interval in milliseconds (30 sec)',
    },
    {
      key: 'driving_update_interval',
      value: '300000',
      isEncrypted: false,
      description: 'Driving times update interval in milliseconds (5 min)',
    },

    // Metro settings
    {
      key: 'metro_station_code',
      value: 'F05',
      isEncrypted: false,
      description: 'WMATA station code (F05 = Navy Yard)',
    },
    {
      key: 'metro_walk_time',
      value: '14',
      isEncrypted: false,
      description: 'Walking time to metro station in minutes',
    },

    // Driving destinations (JSON)
    {
      key: 'driving_destinations',
      value: JSON.stringify([
        { name: 'Pentagon', lat: 38.868746, lon: -77.056708 },
        { name: 'Joint Base Anacostia-Bolling', lat: 38.835532, lon: -76.995000 },
        { name: 'Andrews AFB', lat: 38.810794, lon: -76.866222 },
        { name: 'Pax River', lat: 38.273144, lon: -76.453244 },
        { name: 'Reston, VA', lat: 38.958630, lon: -77.357002 },
      ]),
      isEncrypted: false,
      description: 'Driving destinations as JSON array',
    },
    {
      key: 'driving_origin',
      value: JSON.stringify({ lat: 38.87382041883797, lon: -76.9972499997064 }),
      isEncrypted: false,
      description: 'Driving origin coordinates (Navy Yard)',
    },

    // Ticker messages
    {
      key: 'ticker_messages',
      value: JSON.stringify([
        'Welcome to Team-Sub Navigator',
        'Stay informed with real-time transit updates and weather information',
        'Metro Arrivals Updated Every 30s',
        'For service alerts and schedule changes, check the transit information panel',
      ]),
      isEncrypted: false,
      description: 'Scrolling ticker messages as JSON array',
    },

    // Weather settings
    {
      key: 'weather_location',
      value: 'Washington,DC,US',
      isEncrypted: false,
      description: 'Weather location for OpenWeatherMap',
    },
    {
      key: 'weather_units',
      value: 'imperial',
      isEncrypted: false,
      description: 'Weather units (imperial/metric)',
    },
  ];

  console.log('🌱 Seeding settings...\n');

  for (const settingData of settings) {
    const existing = await settingsRepository.findOne({
      where: { key: settingData.key },
    });

    if (existing) {
      console.log(`⏭️  Skipping "${settingData.key}" (already exists)`);
      continue;
    }

    let value = settingData.value;
    let iv: string | null = null;

    if (settingData.isEncrypted) {
      const encrypted = encryptValue(settingData.value, encryptionKey);
      value = encrypted.encrypted;
      iv = encrypted.iv;
    }

    const setting = settingsRepository.create({
      key: settingData.key,
      value,
      isEncrypted: settingData.isEncrypted,
      iv,
      description: settingData.description,
    });

    await settingsRepository.save(setting);
    console.log(`✅ Created setting: ${settingData.key}`);
  }

  console.log('\n✅ Settings seeded successfully!');
  console.log('\n📋 Summary:');
  console.log('  - FPCON Status: NORMAL');
  console.log('  - LAN Status: NORMAL');
  console.log('  - 3 API keys (encrypted)');
  console.log('  - Display intervals configured');
  console.log('  - Metro station: Navy Yard (F05)');
  console.log('  - 5 driving destinations');
  console.log('  - Ticker messages configured');

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Error seeding settings:', error);
  process.exit(1);
});
