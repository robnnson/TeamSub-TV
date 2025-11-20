# Production Deployment Guide

## Prerequisites

Your production server needs:
- Docker Engine (20.10+)
- Docker Compose (2.0+)
- OpenSSL
- Git
- Ports 80, 443, 3000, 3001, 8081 available (or configure custom ports)

## Deployment Steps

### 1. Prepare Your Production Server

SSH into your production server:
```bash
ssh user@your-production-server
```

### 2. Clone the Repository

```bash
cd /opt  # or your preferred location
git clone <your-repository-url> TeamSub-TV
cd TeamSub-TV
```

**Or** transfer the files using SCP/SFTP from your local machine:
```bash
# From your local Windows machine (in PowerShell/CMD)
scp -r C:\Repository\TeamSub-TV user@your-server:/opt/
```

### 3. Configure Environment Variables

The setup script will generate a `.env` file, but you should customize it for production:

```bash
# Run the setup script (it will generate .env)
chmod +x setup-linux.sh
./setup-linux.sh
```

Then edit the `.env` file for production settings:
```bash
nano .env
```

**Important Production Changes:**
```env
# Change to production
NODE_ENV=production

# Use strong database credentials (change these!)
DB_PASSWORD=<your-strong-password>

# Set your production domain
CORS_ORIGIN=https://your-domain.com

# Add your API keys
OPENWEATHER_API_KEY=9fcfc0149fef9015a6eaba1df22caf5b
WMATA_API_KEY=<your-wmata-key>
TOMTOM_API_KEY=<your-tomtom-key>
```

### 4. Update docker-compose.yml for Production (Optional)

If you want to use different ports or add SSL:

```bash
nano docker-compose.yml
```

Example changes for production:
- Map port 80 instead of 3001 for admin
- Map port 8080 instead of 8081 for display
- Add volume mounts for persistent media storage

### 5. Start the Services

```bash
# Pull latest images and start
docker-compose up -d --build

# View logs to ensure everything started correctly
docker-compose logs -f
```

### 6. Verify Deployment

Check that all containers are running:
```bash
docker-compose ps
```

You should see:
- ✅ signage-backend (healthy)
- ✅ signage-admin (running)
- ✅ signage-display (running)
- ✅ signage-postgres (healthy)
- ✅ signage-redis (healthy)

### 7. Access the Application

- **Admin Portal**: http://your-server-ip:3001
- **Display Client**: http://your-server-ip:8081
- **Backend API**: http://your-server-ip:3000

**Default Admin Login:**
- Email: `admin@teamsub.navy.mil`
- Password: `Admin123!`

**⚠️ IMPORTANT**: Change the default admin password immediately!

## Production SSL/HTTPS Setup (Recommended)

### Option 1: Using Nginx Reverse Proxy

Install Nginx on the host:
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

Configure Nginx:
```bash
sudo nano /etc/nginx/sites-available/teamsub-tv
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name display.your-domain.com;

    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and get SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/teamsub-tv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com -d display.your-domain.com
```

### Option 2: Using Traefik (Docker-based)

Add Traefik to docker-compose.yml - see Traefik documentation.

## Updating Production

When you have new code changes:

```bash
# Pull latest code
cd /opt/TeamSub-TV
git pull origin main

# Rebuild and restart containers
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs -f backend
```

## Backup Strategy

### Database Backup

```bash
# Backup PostgreSQL database
docker-compose exec postgres pg_dump -U signage signage_cms > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T postgres psql -U signage signage_cms < backup_20231120.sql
```

### Media Files Backup

```bash
# Backup uploaded media (if using volumes)
tar -czf media_backup_$(date +%Y%m%d).tar.gz media/
```

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend-admin
docker-compose logs -f frontend-display
```

### Check Container Health

```bash
docker-compose ps
docker stats
```

## Troubleshooting

### Containers won't start
```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check Docker daemon
sudo systemctl status docker
```

### Database connection issues
```bash
# Check if PostgreSQL is accepting connections
docker-compose exec postgres pg_isready -U signage

# Check environment variables
docker-compose exec backend env | grep DB_
```

### Permission issues
```bash
# Fix permissions on volumes
sudo chown -R 1000:1000 media/
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Generated new JWT secrets (done by setup script)
- [ ] Generated new encryption key (done by setup script)
- [ ] Changed database password from default
- [ ] Configured firewall (only expose necessary ports)
- [ ] Enabled HTTPS/SSL
- [ ] Regular backups configured
- [ ] Logs rotation configured
- [ ] Updated CORS_ORIGIN to production domain

## Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (if using Nginx)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Or allow application ports directly
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 3001/tcp  # Admin Portal
sudo ufw allow 8081/tcp  # Display Client

# Enable firewall
sudo ufw enable
```

## Performance Tuning

### For Production Workloads

Edit `docker-compose.yml` to add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          memory: 512M
```

### PostgreSQL Tuning

```bash
# Edit PostgreSQL config for better performance
docker-compose exec postgres psql -U signage -c "ALTER SYSTEM SET shared_buffers = '256MB';"
docker-compose exec postgres psql -U signage -c "ALTER SYSTEM SET effective_cache_size = '1GB';"
docker-compose restart postgres
```

## Quick Reference

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 3000 | REST API endpoints |
| Admin Portal | 3001 | Web interface for admins |
| Display Client | 8081 | Digital signage display |
| PostgreSQL | 5432 | Database (internal) |
| Redis | 6379 | Cache (internal) |

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review this guide
3. Check GitHub issues
4. Contact your system administrator

---

**Last Updated**: 2025-11-20
