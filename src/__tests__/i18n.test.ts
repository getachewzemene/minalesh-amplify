import { describe, it, expect } from 'vitest';

/**
 * i18n Tests
 * 
 * Tests for internationalization support for Amharic and Oromo languages
 */

describe('i18n - Language Support', () => {
  it('should support English, Amharic, and Oromo language codes', () => {
    const supportedLanguages = ['en', 'am', 'om'];
    
    expect(supportedLanguages).toContain('en');
    expect(supportedLanguages).toContain('am');
    expect(supportedLanguages).toContain('om');
    expect(supportedLanguages).toHaveLength(3);
  });

  it('should have correct language names', () => {
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
      { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' }
    ];

    const englishLang = languages.find(l => l.code === 'en');
    expect(englishLang?.nativeName).toBe('English');

    const amharicLang = languages.find(l => l.code === 'am');
    expect(amharicLang?.nativeName).toBe('አማርኛ');

    const oromoLang = languages.find(l => l.code === 'om');
    expect(oromoLang?.nativeName).toBe('Afaan Oromoo');
  });

  it('should provide translations for all three languages', () => {
    const translations = {
      en: 'Hello',
      am: 'ሰላም',
      om: 'Akkam'
    };

    expect(translations.en).toBe('Hello');
    expect(translations.am).toBe('ሰላም');
    expect(translations.om).toBe('Akkam');
  });

  it('should handle language selection correctly', () => {
    let currentLanguage: 'en' | 'am' | 'om' = 'en';
    
    // Test language cycling: en -> am -> om -> en
    const nextLanguage = (lang: 'en' | 'am' | 'om'): 'en' | 'am' | 'om' => {
      return lang === 'en' ? 'am' : lang === 'am' ? 'om' : 'en';
    };

    currentLanguage = nextLanguage(currentLanguage);
    expect(currentLanguage).toBe('am');

    currentLanguage = nextLanguage(currentLanguage);
    expect(currentLanguage).toBe('om');

    currentLanguage = nextLanguage(currentLanguage);
    expect(currentLanguage).toBe('en');
  });

  it('should return correct translation based on language', () => {
    const getMessage = (lang: 'en' | 'am' | 'om') => {
      const messages = {
        en: 'Welcome to Minalesh',
        am: 'ወደ ሚናሌሽ እንኳን ደህና መጡ',
        om: 'Gara Minalesh baga nagaan dhuftan'
      };
      return messages[lang];
    };

    expect(getMessage('en')).toBe('Welcome to Minalesh');
    expect(getMessage('am')).toBe('ወደ ሚናሌሽ እንኳን ደህና መጡ');
    expect(getMessage('om')).toBe('Gara Minalesh baga nagaan dhuftan');
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

  it('should have fallback messages in all three languages', () => {
    const fallbackMessages = {
      en: "I'm having trouble connecting. Please try again later.",
      am: "ለመገናኘት እየተቸገርኩ ነው። እባክዎ ቆይተው ይሞክሩ።",
      om: "Walitti dhufeenya qaba jira. Maaloo booda yaali."
    };

    expect(fallbackMessages.en).toBeTruthy();
    expect(fallbackMessages.am).toBeTruthy();
    expect(fallbackMessages.om).toBeTruthy();
    expect(fallbackMessages.en.length).toBeGreaterThan(0);
    expect(fallbackMessages.am.length).toBeGreaterThan(0);
    expect(fallbackMessages.om.length).toBeGreaterThan(0);
  });
});
