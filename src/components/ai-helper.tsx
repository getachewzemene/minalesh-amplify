'use client'

/**
 * AIHelper Component (Live Chat)
 * 
 * Provides AI-powered chat responses using the /api/chat endpoint.
 * Uses intelligent pattern matching for natural language understanding.
 * For production, consider integrating with OpenAI GPT, Anthropic Claude,
 * or Google Gemini for more advanced conversational AI capabilities.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Languages } from "lucide-react";
import { useLanguage, type Language } from "@/context/language-context";

// Translation strings for the AI Helper component
const translations = {
  title: {
    en: "AI Helper (English)",
    am: "AI Helper (አማርኛ)",
    om: "AI Helper (Afaan Oromoo)"
  },
  welcomeMessage: {
    en: "Ask me about becoming a vendor, AR try-on, payments, shipping, or any other questions!",
    am: "ስለ ሻጭ መሆን፣ AR ሙከራ፣ ክፍያ፣ ማድረስ ወይም ማንኛውም ሌላ ጥያቄዎች ጠይቁኝ!",
    om: "Waa'ee daldaltuu ta'uu, AR yaalii, kaffaltii, ergaa, ykn gaaffilee biroo na gaafadhu!"
  },
  inputLabel: {
    en: "Type your question",
    am: "ጥያቄዎን ይተይቡ",
    om: "Gaaffii kee barreessi"
  },
  inputPlaceholder: {
    en: "Type your question...",
    am: "ጥያቄ ያስገቡ...",
    om: "Gaaffii galchi..."
  },
  closeLabel: {
    en: "Close AI helper",
    am: "AI አጋዥን ዝጋ",
    om: "Gargaaraa AI cufi"
  },
  closeButtonLabel: {
    en: "Close",
    am: "ዝጋ",
    om: "Cufi"
  },
  switchLanguageLabel: {
    en: "Switch language",
    am: "ቋንቋ ቀይር",
    om: "Afaan jijjiiri"
  },
  openLabel: {
    en: "Open AI helper",
    am: "AI አጋዥን ክፈት",
    om: "Gargaaraa AI bani"
  },
  askButton: {
    en: "Ask AI",
    am: "AI ጠይቅ",
    om: "AI Gaafadhu"
  },
  sendLabel: {
    en: "Send",
    am: "ላክ",
    om: "Ergi"
  },
  fallbackError: {
    en: "I'm having trouble connecting. Please try again later.",
    am: "ለመገናኘት እየተቸገርኩ ነው። እባክዎ ቆይተው ይሞክሩ።",
    om: "Walitti dhufeenya qaba jira. Maaloo booda yaali."
  }
};

const getNextLanguage = (lang: Language): Language => {
  const languages: Language[] = ['en', 'am', 'om'];
  const currentIndex = languages.indexOf(lang);
  return languages[(currentIndex + 1) % languages.length];
};

export function AIHelper() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: "user" as const, text: input };
    setMessages((m) => [...m, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          language,
          history: messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = { role: "assistant" as const, text: data.response };
        setMessages((m) => [...m, reply]);
      } else {
        const reply = { role: "assistant" as const, text: translations.fallbackError[language] };
        setMessages((m) => [...m, reply]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const reply = { role: "assistant" as const, text: translations.fallbackError[language] };
      setMessages((m) => [...m, reply]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <Card className="w-80 mb-3 shadow-card">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">
              {translations.title[language]}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                aria-label={translations.switchLanguageLabel[language]}
                variant="outline" 
                size="icon" 
                onClick={() => setLanguage(getNextLanguage(language))}
              >
                <Languages className="h-4 w-4" />
              </Button>
              <Button 
                aria-label={translations.closeButtonLabel[language]}
                variant="ghost" 
                size="icon" 
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto" aria-live="polite">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {translations.welcomeMessage[language]}
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <span className={
                    m.role === "user"
                      ? "inline-block px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm whitespace-pre-wrap"
                      : "inline-block px-3 py-2 rounded-lg bg-muted text-sm whitespace-pre-wrap"
                  }>
                    {m.text}
                  </span>
                </div>
              ))}
              {loading && (
                <div className="text-left">
                  <span className="inline-block px-3 py-2 rounded-lg bg-muted text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Input
              aria-label={translations.inputLabel[language]}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={translations.inputPlaceholder[language]}
              disabled={loading}
            />
            <Button 
              aria-label={translations.sendLabel[language]}
              onClick={send} 
              className="bg-primary hover:bg-primary/90" 
              disabled={loading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      <Button
        aria-label={open ? translations.closeLabel[language] : translations.openLabel[language]}
        onClick={() => setOpen((o) => !o)}
        size="lg"
        className="rounded-full bg-primary hover:bg-primary/90 shadow-gold"
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        {translations.askButton[language]}
      </Button>
    </div>
  );
}
