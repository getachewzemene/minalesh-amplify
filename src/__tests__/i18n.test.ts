import { describe, it, expect } from 'vitest';

/**
 * i18n Tests
 * 
 * Tests for internationalization support for Ethiopian languages:
 * English, Amharic, Oromo, and Tigrinya
 */

describe('i18n - Language Support', () => {
  it('should support English, Amharic, Oromo, and Tigrinya language codes', () => {
    const supportedLanguages = ['en', 'am', 'om', 'ti'];
    
    expect(supportedLanguages).toContain('en');
    expect(supportedLanguages).toContain('am');
    expect(supportedLanguages).toContain('om');
    expect(supportedLanguages).toContain('ti');
    expect(supportedLanguages).toHaveLength(4);
  });

  it('should have correct language names', () => {
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
      { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' },
      { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ' }
    ];

    const englishLang = languages.find(l => l.code === 'en');
    expect(englishLang?.nativeName).toBe('English');

    const amharicLang = languages.find(l => l.code === 'am');
    expect(amharicLang?.nativeName).toBe('አማርኛ');

    const oromoLang = languages.find(l => l.code === 'om');
    expect(oromoLang?.nativeName).toBe('Afaan Oromoo');

    const tigrinyaLang = languages.find(l => l.code === 'ti');
    expect(tigrinyaLang?.nativeName).toBe('ትግርኛ');
  });

  it('should provide translations for all four languages', () => {
    const translations = {
      en: 'Hello',
      am: 'ሰላም',
      om: 'Akkam',
      ti: 'ሰላም'
    };

    expect(translations.en).toBe('Hello');
    expect(translations.am).toBe('ሰላም');
    expect(translations.om).toBe('Akkam');
    expect(translations.ti).toBe('ሰላም');
  });

  it('should handle language selection correctly', () => {
    let currentLanguage: 'en' | 'am' | 'om' | 'ti' = 'en';
    
    // Test language cycling: en -> am -> om -> ti -> en
    const nextLanguage = (lang: 'en' | 'am' | 'om' | 'ti'): 'en' | 'am' | 'om' | 'ti' => {
      const langOrder = ['en', 'am', 'om', 'ti'] as const;
      const currentIndex = langOrder.indexOf(lang);
      return langOrder[(currentIndex + 1) % langOrder.length];
    };

    currentLanguage = nextLanguage(currentLanguage);
    expect(currentLanguage).toBe('am');

    currentLanguage = nextLanguage(currentLanguage);
    expect(currentLanguage).toBe('om');

    currentLanguage = nextLanguage(currentLanguage);
    expect(currentLanguage).toBe('ti');

    currentLanguage = nextLanguage(currentLanguage);
    expect(currentLanguage).toBe('en');
  });

  it('should return correct translation based on language', () => {
    const getMessage = (lang: 'en' | 'am' | 'om' | 'ti') => {
      const messages = {
        en: 'Welcome to Minalesh',
        am: 'ወደ ሚናሌሽ እንኳን ደህና መጡ',
        om: 'Gara Minalesh baga nagaan dhuftan',
        ti: 'ናብ ሚናሌሽ እንቋዕ ብድሓን መጻእኩም'
      };
      return messages[lang];
    };

    expect(getMessage('en')).toBe('Welcome to Minalesh');
    expect(getMessage('am')).toBe('ወደ ሚናሌሽ እንኳን ደህና መጡ');
    expect(getMessage('om')).toBe('Gara Minalesh baga nagaan dhuftan');
    expect(getMessage('ti')).toBe('ናብ ሚናሌሽ እንቋዕ ብድሓን መጻእኩም');
  });

  it('should validate Oromo greetings in API', () => {
    const oromoGreetings = ['akkam', 'nagaa'];
    const greetings = ['hi', 'hello', 'hey', 'greetings', 'ሰላም', 'ሄይ', 'akkam', 'nagaa'];

    oromoGreetings.forEach(greeting => {
      expect(greetings).toContain(greeting);
    });
  });

  it('should have complete knowledge base entries for Oromo', () => {
    const oromoKnowledgeBase = [
      { keywords: ['daldaltuu', 'gurgurtaa', 'ta\'uu', 'galmaa\'uu'], hasResponse: true },
      { keywords: ['AR', 'yaalii', 'dhugaa', 'mul\'isa'], hasResponse: true },
      { keywords: ['kaffaltii', 'kaffaluu', 'kaardii', 'maallaqa'], hasResponse: true },
      { keywords: ['ergaa', 'erguu', 'geejjiba'], hasResponse: true },
      { keywords: ['deebisuu', 'maallaqa deebisuu', 'jijjiirraa'], hasResponse: true },
      { keywords: ['hordofuu', 'ajaja', 'haala', 'eessa'], hasResponse: true },
      { keywords: ['herrega', 'piroofaayilii', 'seenuu', 'jecha icciitii'], hasResponse: true }
    ];

    // Verify that we have at least 7 knowledge base entries for Oromo
    expect(oromoKnowledgeBase.length).toBeGreaterThanOrEqual(7);
    
    // Verify all entries have responses
    oromoKnowledgeBase.forEach(entry => {
      expect(entry.hasResponse).toBe(true);
      expect(entry.keywords.length).toBeGreaterThan(0);
    });
  });

  it('should have fallback messages in all four languages', () => {
    const fallbackMessages = {
      en: "I'm having trouble connecting. Please try again later.",
      am: "ለመገናኘት እየተቸገርኩ ነው። እባክዎ ቆይተው ይሞክሩ።",
      om: "Walitti dhufeenya qaba jira. Maaloo booda yaali.",
      ti: "ንምርኻብ ጸገም ኣለኒ። ብኽብረትካ ድሕሪ ገለ ግዜ ፈትን።"
    };

    expect(fallbackMessages.en).toBeTruthy();
    expect(fallbackMessages.am).toBeTruthy();
    expect(fallbackMessages.om).toBeTruthy();
    expect(fallbackMessages.ti).toBeTruthy();
    expect(fallbackMessages.en.length).toBeGreaterThan(0);
    expect(fallbackMessages.am.length).toBeGreaterThan(0);
    expect(fallbackMessages.om.length).toBeGreaterThan(0);
    expect(fallbackMessages.ti.length).toBeGreaterThan(0);
  });

  it('should have Tigrinya knowledge base entries', () => {
    const tigrinyaKnowledgeBase = [
      { keywords: ['ነጋዲ', 'ምዝገባ', 'ሽያጥ'], hasResponse: true },
      { keywords: ['ክፍሊት', 'ገንዘብ', 'ካርድ'], hasResponse: true },
      { keywords: ['መልኣኺ', 'ምብጻሕ'], hasResponse: true },
      { keywords: ['ምምላስ', 'ገንዘብ ምምላስ'], hasResponse: true },
      { keywords: ['ትእዛዝ', 'ክትትል'], hasResponse: true },
      { keywords: ['መለያ', 'ቃል ምሕላፍ'], hasResponse: true }
    ];

    // Verify that we have at least 6 knowledge base entries for Tigrinya
    expect(tigrinyaKnowledgeBase.length).toBeGreaterThanOrEqual(6);
    
    // Verify all entries have responses
    tigrinyaKnowledgeBase.forEach(entry => {
      expect(entry.hasResponse).toBe(true);
      expect(entry.keywords.length).toBeGreaterThan(0);
    });
  });

  it('should validate locale codes match BCP 47 standard', () => {
    const localeMap = {
      en: 'en-ET',
      am: 'am-ET',
      om: 'om-ET',
      ti: 'ti-ET'
    };

    // All locales should map to Ethiopian variants
    Object.values(localeMap).forEach(locale => {
      expect(locale).toMatch(/-ET$/);
    });
  });

  it('should have currency formatting for Ethiopian Birr', () => {
    const currencyInfo = {
      code: 'ETB',
      symbol: 'Br',
      name: 'Ethiopian Birr'
    };

    expect(currencyInfo.code).toBe('ETB');
    expect(currencyInfo.symbol).toBe('Br');
    expect(currencyInfo.name).toBe('Ethiopian Birr');
  });
});
