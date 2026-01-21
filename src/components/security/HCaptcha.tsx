'use client';

/**
 * HCaptcha Component
 * 
 * Renders hCaptcha widget for bot verification.
 * Requires hCaptcha script to be loaded.
 */

import { useEffect, useRef, useState } from 'react';

interface HCaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: Error) => void;
  onExpire?: () => void;
  size?: 'normal' | 'compact';
  theme?: 'light' | 'dark';
}

declare global {
  interface Window {
    hcaptcha: any;
  }
}

export function HCaptcha({
  onVerify,
  onError,
  onExpire,
  size = 'normal',
  theme = 'light',
}: HCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [widgetId, setWidgetId] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  useEffect(() => {
    // Load hCaptcha script
    if (!document.getElementById('hcaptcha-script')) {
      const script = document.createElement('script');
      script.id = 'hcaptcha-script';
      script.src = 'https://js.hcaptcha.com/1/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else if (window.hcaptcha) {
      setIsLoaded(true);
    }

    return () => {
      // Cleanup
      if (widgetId !== null && window.hcaptcha) {
        try {
          window.hcaptcha.remove(widgetId);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [widgetId]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !siteKey) return;

    try {
      const id = window.hcaptcha.render(containerRef.current, {
        sitekey: siteKey,
        size,
        theme,
        callback: onVerify,
        'error-callback': (error: Error) => {
          onError?.(error);
        },
        'expired-callback': () => {
          onExpire?.();
        },
      });
      setWidgetId(id);
    } catch (error) {
      console.error('Failed to render hCaptcha:', error);
      onError?.(error as Error);
    }
  }, [isLoaded, siteKey, size, theme, onVerify, onError, onExpire]);

  if (!siteKey) {
    return (
      <div className="text-sm text-muted-foreground">
        CAPTCHA not configured
      </div>
    );
  }

  return <div ref={containerRef} />;
}

/**
 * Hook to use CAPTCHA in forms
 */
export function useCaptcha() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const handleVerify = (captchaToken: string) => {
    setToken(captchaToken);
    setError(null);
    setIsExpired(false);
  };

  const handleError = (captchaError: Error) => {
    setError(captchaError);
    setToken(null);
  };

  const handleExpire = () => {
    setIsExpired(true);
    setToken(null);
  };

  const reset = () => {
    setToken(null);
    setError(null);
    setIsExpired(false);
  };

  return {
    token,
    error,
    isExpired,
    handleVerify,
    handleError,
    handleExpire,
    reset,
  };
}
