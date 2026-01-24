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
  },
  quickActionsTitle: {
    en: "Quick Questions",
    am: "ፈጣን ጥያቄዎች",
    om: "Gaaffilee Saffisaa"
  }
};

// Quick action buttons for common questions
const quickActions = {
  en: [
    { label: "How to become a vendor?", query: "How do I become a vendor?" },
    { label: "Payment methods", query: "What payment methods do you accept?" },
    { label: "Track my order", query: "How can I track my order?" },
    { label: "Return policy", query: "What is your return policy?" },
    { label: "Shipping info", query: "Tell me about shipping" },
    { label: "AR Try-On", query: "How does AR try-on work?" }
  ],
  am: [
    { label: "እንዴት ሻጭ እሆናለሁ?", query: "እንዴት ሻጭ መሆን እችላለሁ?" },
    { label: "የክፍያ መንገዶች", query: "ምን የክፍያ መንገዶችን ይቀበላሉ?" },
    { label: "ትዕዛዝ መከታተል", query: "ትዕዛዝዬን እንዴት መከታተል እችላለሁ?" },
    { label: "የመመለሻ ፖሊሲ", query: "የመመለሻ ፖሊሲዎ ምንድነው?" },
    { label: "የማድረስ መረጃ", query: "ስለማድረስ ንገሩኝ" },
    { label: "AR ሙከራ", query: "AR ሙከራ እንዴት ይሰራል?" }
  ],
  om: [
    { label: "Akkamitti daldaltuu ta'a?", query: "Akkamitti daldaltuu ta'uu danda'a?" },
    { label: "Mala kaffaltii", query: "Mala kaffaltii maalii fudhattuu?" },
    { label: "Ajaja hordofuu", query: "Ajaja koo akkamitti hordofuu danda'a?" },
    { label: "Seera deebisuu", query: "Seera deebisuu keessan maali?" },
    { label: "Odeeffannoo ergaa", query: "Waa'ee ergaa natti himaa" },
    { label: "Yaalii AR", query: "Yaaliin AR akkamitti hojjeta?" }
  ]
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
  const [showQuickActions, setShowQuickActions] = useState(true);

  const send = async (customMessage?: string) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() || loading) return;
    
    const userMsg = { role: "user" as const, text: messageToSend };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    setShowQuickActions(false); // Hide quick actions after first message

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
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
        <Card className="w-96 mb-3 shadow-2xl border-2 border-primary/20 animate-in slide-in-from-bottom-5 duration-300">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-primary/5 to-primary/10 pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              {translations.title[language]}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                aria-label={translations.switchLanguageLabel[language]}
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setLanguage(getNextLanguage(language))}
              >
                <Languages className="h-4 w-4" />
              </Button>
              <Button 
                aria-label={translations.closeButtonLabel[language]}
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-background to-muted/20" aria-live="polite">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm">
                    <p className="font-medium text-primary mb-2">👋 {translations.welcomeMessage[language]}</p>
                  </div>
                  
                  {showQuickActions && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {translations.quickActionsTitle[language]}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {quickActions[language].map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => send(action.query)}
                            className="text-left text-xs p-3 bg-card hover:bg-primary/10 border border-border hover:border-primary/30 rounded-lg transition-all duration-200 hover:shadow-md group"
                          >
                            <span className="group-hover:text-primary transition-colors">
                              {action.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}>
                  <div className={
                    m.role === "user"
                      ? "inline-block max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary to-primary/90 text-primary-foreground text-sm shadow-md whitespace-pre-wrap"
                      : "inline-block max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-card border border-border text-sm shadow-sm whitespace-pre-wrap"
                  }>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start animate-in fade-in-0 slide-in-from-bottom-2">
                  <div className="inline-block px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="gap-2 border-t bg-muted/30 p-3">
            <Input
              aria-label={translations.inputLabel[language]}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={translations.inputPlaceholder[language]}
              disabled={loading}
              className="flex-1 bg-background border-border focus:border-primary transition-colors"
            />
            <Button 
              aria-label={translations.sendLabel[language]}
              onClick={() => send()} 
              className="bg-primary hover:bg-primary/90 transition-colors shadow-md" 
              disabled={loading || !input.trim()}
              size="icon"
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
        className="rounded-full bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-primary/20"
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        {translations.askButton[language]}
      </Button>
    </div>
  );
}
