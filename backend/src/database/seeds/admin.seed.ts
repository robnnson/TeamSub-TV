import { DataSource } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'signage',
    password: process.env.DB_PASSWORD || 'signage_password',
    database: process.env.DB_DATABASE || 'signage_cms',
    entities: [User],
  });

  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);

  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@teamsub.navy.mil' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    await dataSource.destroy();
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  const admin = userRepository.create({
    email: 'admin@teamsub.navy.mil',
    password: hashedPassword,
    role: UserRole.ADMIN,
  });

  await userRepository.save(admin);

  console.log('✅ Admin user created successfully!');
  console.log('Email: admin@teamsub.navy.mil');
  console.log('Password: Admin123!');
  console.log('⚠️  Please change this password after first login');

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Error seeding admin user:', error);
  process.exit(1);
});
