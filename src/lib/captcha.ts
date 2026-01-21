/**
 * CAPTCHA Verification Module
 * 
 * Provides hCaptcha verification for bot protection.
 */

/**
 * Verify hCaptcha token
 */
export async function verifyCaptcha(token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const secretKey = process.env.HCAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn('HCAPTCHA_SECRET_KEY not configured, skipping verification');
    return { success: true }; // Allow in development/testing
  }

  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data['error-codes']?.join(', ') || 'CAPTCHA verification failed',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return {
      success: false,
      error: 'CAPTCHA verification service unavailable',
    };
  }
}

/**
 * Check if CAPTCHA is configured
 */
export function isCaptchaConfigured(): boolean {
  return !!(
    process.env.HCAPTCHA_SECRET_KEY &&
    process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY
  );
}
