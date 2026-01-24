#!/usr/bin/env tsx

/**
 * Generate Secure Secrets for Production
 * 
 * This script generates cryptographically secure random values for:
 * - JWT_SECRET (64 characters, base64)
 * - CRON_SECRET (32 characters, base64)
 * - INTERNAL_API_SECRET (32 characters, base64)
 * - PAYMENT_WEBHOOK_SECRET (32 characters, base64)
 * 
 * Usage:
 *   npm run generate:secrets
 *   # or
 *   tsx scripts/generate-secrets.ts
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface Secret {
  name: string;
  value: string;
  description: string;
  minLength: number;
}

// Secret byte lengths (base64 encoding will produce longer strings)
const SECRET_BYTES = {
  JWT: 48,      // Produces 64 base64 chars
  STANDARD: 24, // Produces 32 base64 chars
} as const;

/**
 * Generate a cryptographically secure random string in base64
 */
function generateSecureSecret(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('base64');
}

/**
 * Generate all required secrets
 */
function generateSecrets(): Secret[] {
  return [
    {
      name: 'JWT_SECRET',
      value: generateSecureSecret(SECRET_BYTES.JWT), // 48 bytes -> 64 base64 chars
      description: 'Secret key for JWT token signing (required)',
      minLength: 32,
    },
    {
      name: 'CRON_SECRET',
      value: generateSecureSecret(SECRET_BYTES.STANDARD), // 24 bytes -> 32 base64 chars
      description: 'Secret for securing cron endpoints (required)',
      minLength: 16,
    },
    {
      name: 'INTERNAL_API_SECRET',
      value: generateSecureSecret(SECRET_BYTES.STANDARD), // 24 bytes -> 32 base64 chars
      description: 'Secret for internal API calls (optional but recommended)',
      minLength: 16,
    },
    {
      name: 'PAYMENT_WEBHOOK_SECRET',
      value: generateSecureSecret(SECRET_BYTES.STANDARD), // 24 bytes -> 32 base64 chars
      description: 'Secret for payment webhook verification (optional but recommended)',
      minLength: 16,
    },
  ];
}

/**
 * Display secrets in a formatted way
 */
function displaySecrets(secrets: Secret[]) {
  console.log('\n' + '='.repeat(80));
  console.log('🔐 SECURE SECRETS GENERATED');
  console.log('='.repeat(80));
  console.log('\n⚠️  IMPORTANT: Never commit these values to version control!');
  console.log('   Store them securely in your environment variables or secrets manager.\n');
  
  secrets.forEach((secret, index) => {
    console.log(`\n${index + 1}. ${secret.name}`);
    console.log(`   ${secret.description}`);
    console.log(`   Length: ${secret.value.length} chars (min: ${secret.minLength})`);
    console.log(`   Value: ${secret.value}`);
  });
  
  console.log('\n' + '-'.repeat(80));
  console.log('📝 Add to your .env file:');
  console.log('-'.repeat(80));
  console.log('');
  
  secrets.forEach((secret) => {
    console.log(`${secret.name}=${secret.value}`);
  });
  
  console.log('\n' + '-'.repeat(80));
  console.log('🚀 Production Deployment:');
  console.log('-'.repeat(80));
  console.log('');
  console.log('For Vercel:');
  secrets.forEach((secret) => {
    console.log(`  vercel env add ${secret.name} production`);
  });
  
  console.log('\nFor Railway:');
  secrets.forEach((secret) => {
    console.log(`  railway variables set ${secret.name}=${secret.value}`);
  });
  
  console.log('\nFor Heroku:');
  secrets.forEach((secret) => {
    console.log(`  heroku config:set ${secret.name}=${secret.value}`);
  });
  
  console.log('\nFor AWS Secrets Manager:');
  console.log('  Store as JSON: ' + JSON.stringify(
    secrets.reduce((acc, s) => ({ ...acc, [s.name]: s.value }), {}),
    null,
    2
  ));
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Secrets generated successfully!');
  console.log('='.repeat(80) + '\n');
}

/**
 * Save secrets to a temporary file for easy copying
 */
function saveToFile(secrets: Secret[]) {
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(tmpDir, `secrets-${timestamp}.txt`);
  
  const content = [
    '# Generated Secrets - ' + new Date().toISOString(),
    '# WARNING: Never commit this file to version control!',
    '# Add these to your .env file or environment variables',
    '',
    ...secrets.map(s => `${s.name}=${s.value}`),
    '',
    '# Description:',
    ...secrets.map(s => `# ${s.name}: ${s.description}`),
  ].join('\n');
  
  fs.writeFileSync(filename, content, 'utf8');
  
  console.log(`\n💾 Secrets saved to: ${filename}`);
  console.log('   Remember to delete this file after copying the secrets!\n');
}

// Main execution
try {
  const secrets = generateSecrets();
  displaySecrets(secrets);
  saveToFile(secrets);
  
  console.log('🔒 Security Best Practices:');
  console.log('   1. Rotate secrets every 90 days minimum');
  console.log('   2. Use different secrets for each environment (dev, staging, prod)');
  console.log('   3. Never share secrets over email or chat');
  console.log('   4. Store production secrets in a secure vault (AWS Secrets Manager, etc.)');
  console.log('   5. Delete the temporary file after copying secrets');
  console.log('   6. Revoke and regenerate if secrets are ever exposed\n');
  
} catch (error) {
  console.error('❌ Error generating secrets:', error);
  process.exit(1);
}
