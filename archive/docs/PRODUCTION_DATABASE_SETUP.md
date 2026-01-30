# Production Database Setup Guide

This guide covers the complete setup and configuration of PostgreSQL for the Minalesh marketplace in production environments.

## Table of Contents

1. [Database Provider Options](#database-provider-options)
2. [Connection Configuration](#connection-configuration)
3. [Connection Pooling](#connection-pooling)
4. [Security & SSL](#security--ssl)
5. [Migrations & Seeding](#migrations--seeding)
6. [Backup & Recovery](#backup--recovery)
7. [Monitoring & Performance](#monitoring--performance)
8. [Troubleshooting](#troubleshooting)

---

## Database Provider Options

### Recommended Providers

#### 1. Supabase (Recommended for Quick Setup)
**Pros:**
- Free tier with 500MB storage
- Built-in connection pooling (PgBouncer)
- Automatic backups
- PostgreSQL 15+
- Dashboard with query analytics
- Serverless-friendly

**Cons:**
- Limited control over PostgreSQL configuration
- Free tier has connection limits

**Best For:** MVP, beta releases, small to medium applications

#### 2. Neon (Recommended for Serverless)
**Pros:**
- Serverless PostgreSQL
- Automatic scaling
- Built-in connection pooling
- Branching for development
- Pay-per-use pricing
- Fast cold starts

**Cons:**
- Newer platform (less mature)
- Limited free tier

**Best For:** Serverless deployments, cost-optimization

#### 3. AWS RDS (Recommended for Enterprise)
**Pros:**
- Full PostgreSQL control
- High availability with Multi-AZ
- Automated backups and point-in-time recovery
- Performance Insights
- Scalable (vertical and horizontal)
- VPC isolation

**Cons:**
- More expensive
- Requires more configuration
- Need separate connection pooler (RDS Proxy)

**Best For:** Large-scale production, enterprise applications

#### 4. DigitalOcean Managed PostgreSQL
**Pros:**
- Simple pricing
- Good performance
- Automated backups
- Connection pooling available
- Read replicas

**Cons:**
- Limited regions
- Basic monitoring

**Best For:** Mid-sized applications, balanced cost/features

### Comparison Table

| Feature | Supabase | Neon | AWS RDS | DigitalOcean |
|---------|----------|------|---------|--------------|
| **Free Tier** | ✅ 500MB | ✅ 512MB | ❌ | ❌ |
| **Connection Pooling** | ✅ Built-in | ✅ Built-in | ⚠️ RDS Proxy | ✅ Built-in |
| **Auto Backups** | ✅ | ✅ | ✅ | ✅ |
| **Scaling** | Manual | Auto | Manual | Manual |
| **Setup Complexity** | Low | Low | High | Medium |
| **Serverless Friendly** | ✅ | ✅ | ⚠️ | ⚠️ |
| **Cost (2GB)** | $25/mo | Pay-per-use | $30-50/mo | $15/mo |

---

## Connection Configuration

### Database URL Format

The `DATABASE_URL` environment variable follows this format:

```bash
postgresql://[user]:[password]@[host]:[port]/[database]?[parameters]
```

### Provider-Specific URLs

#### Supabase
```bash
# Direct connection (for migrations)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# Pooled connection (for app runtime)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
```

**Getting Started:**
1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy the connection string
4. Use port `5432` for migrations, `6543` for pooled connections

#### Neon
```bash
DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require"
```

**Getting Started:**
1. Create project at [neon.tech](https://neon.tech)
2. Copy the connection string from dashboard
3. Connection pooling is automatic
4. Use the same URL for migrations and runtime

#### AWS RDS
```bash
# Without RDS Proxy
DATABASE_URL="postgresql://[user]:[password]@[endpoint].rds.amazonaws.com:5432/[dbname]?sslmode=require"

# With RDS Proxy (recommended for serverless)
DATABASE_URL="postgresql://[user]:[password]@[proxy-endpoint].rds.amazonaws.com:5432/[dbname]?sslmode=require"
```

**Getting Started:**
1. Create PostgreSQL instance in RDS console
2. Configure VPC and security groups
3. Enable automated backups
4. (Optional) Set up RDS Proxy for connection pooling
5. Download SSL certificate

#### DigitalOcean
```bash
# Direct connection
DATABASE_URL="postgresql://[user]:[password]@[host].db.ondigitalocean.com:25060/[dbname]?sslmode=require"

# Connection pool
DATABASE_URL="postgresql://[user]:[password]@[host].db.ondigitalocean.com:25061/[dbname]?sslmode=require"
```

**Getting Started:**
1. Create database cluster in DigitalOcean
2. Add trusted sources (your app IPs)
3. Copy connection string
4. Use port `25060` for direct, `25061` for pooled

---

## Connection Pooling

### Why Connection Pooling?

Serverless environments (Vercel, AWS Lambda) create new database connections for each request. PostgreSQL has a limited number of connections (typically 100-200), which can be exhausted quickly.

**Connection pooling solves this by:**
- Reusing existing connections
- Queuing requests when pool is full
- Preventing "too many connections" errors

### Configuration for Serverless

#### Option 1: Provider Built-in Pooling (Recommended)

**Supabase:**
```bash
# Use port 6543 with pgbouncer=true
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
```

**Neon:**
```bash
# Pooling is automatic, no special config needed
DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require"
```

#### Option 2: Prisma Data Proxy

```bash
# Sign up for Prisma Data Proxy
# Replace DATABASE_URL with Prisma connection string
DATABASE_URL="prisma://[endpoint].prisma-data.net/?api_key=[key]"
```

#### Option 3: External Pooler (PgBouncer)

Deploy your own PgBouncer instance:

```ini
# pgbouncer.ini
[databases]
minalesh = host=your-db-host port=5432 dbname=minalesh

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
reserve_pool_size = 5
reserve_pool_timeout = 3
server_lifetime = 1200
server_idle_timeout = 60
```

### Prisma Connection Pool Settings

Update your Prisma schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pool settings
  relationMode = "prisma"
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
  // Optimize for serverless
  binaryTargets = ["native", "rhel-openssl-1.0.x"]
}
```

In your application code:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    // Connection pool settings
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

export default prisma
```

---

## Security & SSL

### SSL/TLS Configuration

**Always use SSL in production:**

```bash
# Enforce SSL
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[dbname]?sslmode=require"

# Verify server certificate
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[dbname]?sslmode=verify-full&sslrootcert=/path/to/ca.crt"
```

### SSL Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `disable` | No SSL | ❌ Never use in production |
| `require` | SSL required, no verification | ✅ Most cloud providers |
| `verify-ca` | Verify certificate authority | ⚠️ If you have CA cert |
| `verify-full` | Verify CA and hostname | ✅ Maximum security |

### Password Security

**Generate secure passwords:**

```bash
# Generate 32-character password
openssl rand -base64 32

# Or use a password manager
# Recommended: 1Password, Bitwarden, LastPass
```

**Password requirements:**
- Minimum 20 characters
- Mix of uppercase, lowercase, numbers, symbols
- No dictionary words
- Rotate every 90 days

### Network Security

#### Supabase
- Disable "Allow all" IP access
- Add specific IP ranges in Settings → Database
- Use VPC peering for added security

#### AWS RDS
```bash
# Security group rules
Inbound:
  Type: PostgreSQL
  Port: 5432
  Source: [Your App Security Group or IP]
  
Outbound:
  Type: All
  Destination: 0.0.0.0/0
```

#### DigitalOcean
- Add trusted sources in database settings
- Use VPC if available in your region
- Enable firewall rules

### Environment Variable Security

**Never commit secrets to Git:**

```bash
# .gitignore (already configured)
.env
.env.local
.env.production
.env.*.local
```

**Use secret management in production:**

#### Vercel
```bash
# Set via Vercel dashboard or CLI
vercel env add DATABASE_URL production
```

#### AWS (Secrets Manager)
```typescript
import { SecretsManager } from '@aws-sdk/client-secrets-manager'

const client = new SecretsManager({ region: 'us-east-1' })
const secret = await client.getSecretValue({ SecretId: 'prod/database' })
const { DATABASE_URL } = JSON.parse(secret.SecretString)
```

#### Environment Variables Service
Consider using:
- Doppler
- Infisical
- HashiCorp Vault

---

## Migrations & Seeding

### Running Migrations in Production

**Important:** Always test migrations in staging first!

#### 1. Pre-Migration Checklist

- [ ] Backup database
- [ ] Test migration in staging
- [ ] Review migration SQL
- [ ] Schedule during low-traffic period
- [ ] Notify team

#### 2. Deploy Migrations

```bash
# Option 1: Manual deployment
npx prisma migrate deploy

# Option 2: As part of build process (package.json)
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}

# Option 3: Separate migration step
{
  "scripts": {
    "migrate:prod": "prisma migrate deploy",
    "build": "prisma generate && next build"
  }
}
```

#### 3. Post-Migration Verification

```bash
# Check migration status
npx prisma migrate status

# Verify data integrity
npx prisma db execute --file verify.sql
```

### Database Seeding

#### Production Seeding Strategy

**Seed in this order:**

1. **System Settings**
   ```bash
   npx tsx prisma/seeds/system-settings.ts
   ```

2. **Categories**
   ```bash
   npx tsx prisma/seeds/categories.ts
   ```

3. **Shipping Zones & Tax Rates**
   ```bash
   npx tsx prisma/seeds/shipping-tax.ts
   ```

4. **Admin User**
   ```bash
   npm run init:admin
   ```

5. **Feature Flags (Optional)**
   ```bash
   npx tsx prisma/seeds/feature-flags.ts
   ```

**DO NOT seed in production:**
- Demo products
- Test users
- Sample data

#### Creating Production Seed Scripts

```typescript
// prisma/seeds/production-seed.ts
import prisma from '../src/lib/prisma'

async function main() {
  console.log('🌱 Starting production database seeding...')
  
  // Check if already seeded
  const categoryCount = await prisma.category.count()
  if (categoryCount > 0) {
    console.log('⚠️  Database already seeded. Skipping...')
    return
  }
  
  // Seed categories
  await prisma.category.createMany({
    data: [
      { name: 'Electronics', slug: 'electronics' },
      // ... more categories
    ]
  })
  
  console.log('✅ Seeding completed successfully')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## Backup & Recovery

### Automated Backups

#### Supabase
- **Automatic:** Daily backups (7-day retention on free tier)
- **Manual:** Dashboard → Database → Backups → Create backup
- **PITR:** Point-in-time recovery on Pro plan

#### Neon
- **Automatic:** Continuous backups
- **Branches:** Create branch for testing
- **Restore:** Reset to any point in time

#### AWS RDS
```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier minalesh-prod \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
  
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier minalesh-prod \
  --db-snapshot-identifier minalesh-backup-$(date +%Y%m%d)
```

#### DigitalOcean
- **Automatic:** Daily backups (last 7 days)
- **Manual:** Via dashboard or API

### Manual Backup Scripts

```bash
#!/bin/bash
# backup.sh

# Set variables
BACKUP_DIR="/backups"
DB_NAME="minalesh"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp ${BACKUP_FILE}.gz s3://your-backup-bucket/

# Remove local backup after upload
rm ${BACKUP_FILE}.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Disaster Recovery Plan

**Recovery Time Objective (RTO):** < 1 hour  
**Recovery Point Objective (RPO):** < 24 hours

#### Recovery Steps

1. **Assess the situation**
   - What failed? (database corruption, accidental deletion, etc.)
   - When did it happen?
   - What data was affected?

2. **Stop application traffic**
   ```bash
   # Enable maintenance mode
   vercel env add MAINTENANCE_MODE true production
   ```

3. **Restore from backup**
   ```bash
   # Download backup
   aws s3 cp s3://backup-bucket/latest.sql.gz ./
   
   # Decompress
   gunzip latest.sql.gz
   
   # Restore
   psql $DATABASE_URL < latest.sql
   ```

4. **Verify data integrity**
   ```sql
   -- Check critical tables
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM products;
   SELECT COUNT(*) FROM orders;
   ```

5. **Resume application**
   ```bash
   vercel env rm MAINTENANCE_MODE production
   ```

6. **Post-incident review**
   - Document what happened
   - Update runbooks
   - Improve monitoring

---

## Monitoring & Performance

### Health Checks

#### Database Connection Health

```typescript
// app/api/health/db/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Get pool stats (if using PgBouncer)
    const poolStats = await prisma.$queryRaw`
      SHOW POOL_STATS
    `
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      poolStats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}
```

### Performance Monitoring

#### Key Metrics to Track

1. **Connection Pool Usage**
   ```sql
   -- PgBouncer stats
   SHOW POOLS;
   SHOW STATS;
   ```

2. **Slow Queries**
   ```sql
   -- Enable slow query logging (PostgreSQL)
   ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 second
   SELECT pg_reload_conf();
   ```

3. **Table Sizes**
   ```sql
   SELECT
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
   LIMIT 10;
   ```

4. **Index Usage**
   ```sql
   SELECT
     schemaname,
     tablename,
     indexname,
     idx_scan as index_scans
   FROM pg_stat_user_indexes
   WHERE idx_scan = 0
   ORDER BY schemaname, tablename;
   ```

#### Monitoring Tools

**Supabase:**
- Built-in dashboard with query performance
- Connection pool monitoring
- Slow query logs

**AWS RDS:**
- CloudWatch metrics
- Performance Insights
- Enhanced Monitoring

**External Tools:**
- Datadog
- New Relic
- Scout APM
- pganalyze

### Query Optimization

#### Enable Query Logging

```typescript
// In development
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
})

// In production (only errors and slow queries)
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' }
  ]
})

prisma.$on('query', (e) => {
  if (e.duration > 1000) { // Log queries slower than 1s
    console.log('Slow query:', e.query)
    console.log('Duration:', e.duration, 'ms')
  }
})
```

#### Common Optimizations

1. **Add Missing Indexes**
   ```sql
   -- Check for missing indexes
   CREATE INDEX CONCURRENTLY idx_products_vendor 
     ON products(vendor_id);
   
   CREATE INDEX CONCURRENTLY idx_orders_user 
     ON orders(user_id);
   ```

2. **Use Connection Pooling** (covered above)

3. **Optimize Queries**
   ```typescript
   // Bad: N+1 query
   const orders = await prisma.order.findMany()
   for (const order of orders) {
     const user = await prisma.user.findUnique({ 
       where: { id: order.userId } 
     })
   }
   
   // Good: Include related data
   const orders = await prisma.order.findMany({
     include: { user: true }
   })
   ```

### Alerting

Set up alerts for:
- High connection count (> 80% of max)
- Slow queries (> 2 seconds)
- Failed connections
- Disk space (> 80% full)
- High CPU usage (> 80%)
- Replication lag (if using replicas)

**Example Datadog Alert:**
```yaml
name: "High Database Connection Count"
query: "avg(last_5m):avg:postgresql.connections.active > 80"
message: "Database connection count is high. Check for connection leaks."
```

---

## Troubleshooting

### Common Issues

#### 1. "Too Many Connections"

**Symptoms:**
```
Error: P1001: Can't reach database server at `xxx`:`5432`
FATAL: remaining connection slots are reserved for non-replication superuser connections
```

**Solutions:**
- Enable connection pooling (see [Connection Pooling](#connection-pooling))
- Reduce connection limit in Prisma
- Check for connection leaks
- Scale database instance

#### 2. Slow Queries

**Diagnosis:**
```sql
-- Find slow running queries
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - pg_stat_activity.query_start > interval '5 seconds'
ORDER BY duration DESC;
```

**Solutions:**
- Add missing indexes
- Optimize query (use EXPLAIN ANALYZE)
- Add query timeout
- Consider caching

#### 3. Connection Timeout

**Symptoms:**
```
Error: P1001: Can't reach database server
```

**Solutions:**
- Check network connectivity
- Verify security group / firewall rules
- Check database status
- Verify credentials
- Ensure SSL is configured correctly

#### 4. Migration Failures

**Symptoms:**
```
Error: P3009: migrate found failed migrations
```

**Solutions:**
```bash
# Mark failed migration as rolled back
npx prisma migrate resolve --rolled-back [migration-name]

# Then try again
npx prisma migrate deploy
```

#### 5. SSL Certificate Errors

**Symptoms:**
```
Error: self signed certificate in certificate chain
```

**Solutions:**
```bash
# Option 1: Use sslmode=require instead of verify-full
DATABASE_URL="...?sslmode=require"

# Option 2: Download CA certificate
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
DATABASE_URL="...?sslmode=verify-full&sslrootcert=./global-bundle.pem"
```

### Database Maintenance

#### Vacuum and Analyze

```sql
-- Run weekly
VACUUM ANALYZE;

-- For specific tables
VACUUM ANALYZE products;
VACUUM ANALYZE orders;
```

#### Reindex

```sql
-- Rebuild indexes (run during low traffic)
REINDEX TABLE products;
REINDEX TABLE orders;
```

#### Update Statistics

```sql
-- Update query planner statistics
ANALYZE;
```

### Getting Help

**Resources:**
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Support](https://supabase.com/support)
- [Neon Discord](https://discord.gg/neon)

**Emergency Contacts:**
- Database Admin: [admin@minalesh.et]
- DevOps Team: [devops@minalesh.et]
- On-Call: [Pager Duty / Phone Number]

---

## Checklist

### Pre-Production

- [ ] Database provider selected and provisioned
- [ ] DATABASE_URL configured with SSL
- [ ] Connection pooling enabled
- [ ] Migrations tested in staging
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] Security review completed
- [ ] Load testing performed
- [ ] Disaster recovery plan documented
- [ ] Team trained on runbooks

### Post-Production

- [ ] Verify all migrations applied
- [ ] Seed production data
- [ ] Create admin user
- [ ] Configure automated backups
- [ ] Set up monitoring dashboards
- [ ] Test backup restoration
- [ ] Document connection strings (securely)
- [ ] Schedule regular maintenance

---

**Last Updated:** January 17, 2025  
**Maintained By:** DevOps Team  
**Review Schedule:** Quarterly
