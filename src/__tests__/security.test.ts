/**
 * Unit Tests: Security & DDoS Protection
 * 
 * Tests for IP management, bot detection, and security features.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isSuspiciousUserAgent,
  getCloudflareInfo,
} from '@/lib/security';

describe('Security & DDoS Protection', () => {
  describe('Bot Detection', () => {
    it('should detect generic bots', () => {
      const botUserAgents = [
        'Mozilla/5.0 (compatible; Bot/1.0)',
        'curl/7.68.0',
        'wget/1.20.3',
        'python-requests/2.25.1',
        'Java/11.0.1',
        'Go-http-client/1.1',
        'axios/0.21.1',
        'okhttp/4.9.0',
        'HeadlessChrome/91.0.4472.124'
      ];

      botUserAgents.forEach(ua => {
        expect(isSuspiciousUserAgent(ua)).toBe(true);
      });
    });

    it('should allow legitimate browsers', () => {
      const legitimateUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      ];

      legitimateUserAgents.forEach(ua => {
        expect(isSuspiciousUserAgent(ua)).toBe(false);
      });
    });

    it('should allow known good bots', () => {
      const goodBots = [
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
        'Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)',
        'DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)',
        'Mozilla/5.0 (compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)',
        'Pingdom.com_bot_version_1.4'
      ];

      goodBots.forEach(ua => {
        expect(isSuspiciousUserAgent(ua)).toBe(false);
      });
    });

    it('should flag missing user agent', () => {
      expect(isSuspiciousUserAgent(null)).toBe(true);
      expect(isSuspiciousUserAgent('')).toBe(true);
    });

    it('should handle edge cases', () => {
      // JavaScript in user agent should be allowed
      expect(isSuspiciousUserAgent('Mozilla/5.0 JavaScript enabled')).toBe(false);
      
      // But plain Java should be flagged
      expect(isSuspiciousUserAgent('Java/1.8.0')).toBe(true);
    });
  });

  describe('Cloudflare Integration', () => {
    it('should detect Cloudflare headers', () => {
      const request = {
        headers: {
          get: (name: string) => {
            const headers: Record<string, string> = {
              'cf-connecting-ip': '192.168.1.1',
              'cf-ipcountry': 'US',
              'cf-ray': '1234567890abc-SFO',
              'cf-threat-score': '10'
            };
            return headers[name] || null;
          }
        }
      } as Request;

      const cfInfo = getCloudflareInfo(request);
      
      expect(cfInfo.isCloudflare).toBe(true);
      expect(cfInfo.realIp).toBe('192.168.1.1');
      expect(cfInfo.country).toBe('US');
      expect(cfInfo.isThreat).toBe(false);
    });

    it('should detect high threat scores', () => {
      const request = {
        headers: {
          get: (name: string) => {
            const headers: Record<string, string> = {
              'cf-connecting-ip': '10.0.0.1',
              'cf-threat-score': '75'
            };
            return headers[name] || null;
          }
        }
      } as Request;

      const cfInfo = getCloudflareInfo(request);
      
      expect(cfInfo.isCloudflare).toBe(true);
      expect(cfInfo.isThreat).toBe(true);
    });

    it('should handle non-Cloudflare requests', () => {
      const request = {
        headers: {
          get: () => null
        }
      } as Request;

      const cfInfo = getCloudflareInfo(request);
      
      expect(cfInfo.isCloudflare).toBe(false);
      expect(cfInfo.realIp).toBeUndefined();
      expect(cfInfo.country).toBeUndefined();
      expect(cfInfo.isThreat).toBeUndefined();
    });

    it('should detect CF-Ray header alone', () => {
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'cf-ray') return '1234567890abc-SFO';
            return null;
          }
        }
      } as Request;

      const cfInfo = getCloudflareInfo(request);
      
      expect(cfInfo.isCloudflare).toBe(true);
    });
  });

  describe('User Agent Patterns', () => {
    it('should detect scrapers', () => {
      const scrapers = [
        'Mozilla/5.0 (compatible; ScraperBot/1.0)',
        'Scraper/1.0',
        'Web Scraper/1.0'
      ];

      scrapers.forEach(ua => {
        expect(isSuspiciousUserAgent(ua)).toBe(true);
      });
    });

    it('should detect crawlers', () => {
      const crawlers = [
        'Mozilla/5.0 (compatible; MyCrawler/1.0)',
        'Crawler/1.0'
      ];

      crawlers.forEach(ua => {
        expect(isSuspiciousUserAgent(ua)).toBe(true);
      });
    });

    it('should detect spiders', () => {
      const spiders = [
        'Mozilla/5.0 (compatible; MySpider/1.0)',
        'Spider/1.0'
      ];

      spiders.forEach(ua => {
        expect(isSuspiciousUserAgent(ua)).toBe(true);
      });
    });

    it('should detect command line tools', () => {
      const tools = [
        'curl/7.68.0',
        'wget/1.20.3',
        'HTTPie/2.4.0'
      ];

      tools.forEach(ua => {
        expect(isSuspiciousUserAgent(ua)).toBe(true);
      });
    });

    it('should detect programming languages', () => {
      const languages = [
        'python-requests/2.25.1',
        'Python-urllib/3.9',
        'Java/11.0.1',
        'Go-http-client/1.1'
      ];

      languages.forEach(ua => {
        expect(isSuspiciousUserAgent(ua)).toBe(true);
      });
    });

    it('should detect HTTP client libraries', () => {
      const libraries = [
        'axios/0.21.1',
        'node-fetch/2.6.1',
        'okhttp/4.9.0',
        'libwww-perl/6.05'
      ];

      libraries.forEach(ua => {
        expect(isSuspiciousUserAgent(ua)).toBe(true);
      });
    });

    it('should detect automation tools', () => {
      const automation = [
        'PhantomJS/2.1.1',
        'HeadlessChrome/91.0.4472.124',
        'Selenium/3.141.59'
      ];

      automation.forEach(ua => {
        expect(isSuspiciousUserAgent(ua)).toBe(true);
      });
    });
  });

  describe('Security Headers', () => {
    it('should extract real IP from Cloudflare', () => {
      const request = {
        headers: {
          get: (name: string) => {
            const headers: Record<string, string> = {
              'cf-connecting-ip': '203.0.113.1',
              'x-forwarded-for': '10.0.0.1, 192.168.1.1'
            };
            return headers[name] || null;
          }
        }
      } as Request;

      const cfInfo = getCloudflareInfo(request);
      
      // Should prefer CF-Connecting-IP over X-Forwarded-For
      expect(cfInfo.realIp).toBe('203.0.113.1');
    });

    it('should handle missing country header', () => {
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'cf-connecting-ip') return '192.168.1.1';
            return null;
          }
        }
      } as Request;

      const cfInfo = getCloudflareInfo(request);
      
      expect(cfInfo.country).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string user agent', () => {
      expect(isSuspiciousUserAgent('')).toBe(true);
    });

    it('should handle very long user agents', () => {
      const longUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '.repeat(100);
      // Should not crash
      expect(() => isSuspiciousUserAgent(longUa)).not.toThrow();
    });

    it('should handle special characters in user agent', () => {
      const specialUa = 'Mozilla/5.0 (X11; Linux x86_64) <script>alert(1)</script>';
      // Should not crash
      expect(() => isSuspiciousUserAgent(specialUa)).not.toThrow();
    });

    it('should be case insensitive', () => {
      expect(isSuspiciousUserAgent('CURL/7.68.0')).toBe(true);
      expect(isSuspiciousUserAgent('Bot/1.0')).toBe(true);
      expect(isSuspiciousUserAgent('GOOGLEBOT/2.1')).toBe(false);
    });
  });

  describe('Browser Variations', () => {
    it('should allow all major browsers', () => {
      const browsers = [
        // Chrome
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Firefox
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        // Safari
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        // Edge
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        // Opera
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0'
      ];

      browsers.forEach(ua => {
        expect(isSuspiciousUserAgent(ua)).toBe(false);
      });
    });

    it('should allow mobile browsers', () => {
      const mobileBrowsers = [
        // iOS Safari
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        // Android Chrome
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
        // Samsung Internet
        'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36'
      ];

      mobileBrowsers.forEach(ua => {
        expect(isSuspiciousUserAgent(ua)).toBe(false);
      });
    });
  });
});
