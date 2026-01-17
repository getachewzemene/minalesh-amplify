/**
 * Next.js Instrumentation
 * 
 * This file runs once when the application starts (both in development and production).
 * It's the perfect place to validate environment variables and perform startup checks.
 * 
 * Learn more: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side
  if (typeof window === 'undefined') {
    // Import and validate environment variables
    // This will throw an error if validation fails, preventing the app from starting
    const { env, getConfigSummary } = await import('./src/lib/env');
    
    console.log('✅ Environment variables validated successfully');
    
    // Log configuration summary in development
    if (env.NODE_ENV === 'development') {
      const summary = getConfigSummary();
      console.log('📋 Configuration Summary:', JSON.stringify(summary, null, 2));
    }
  }
}
