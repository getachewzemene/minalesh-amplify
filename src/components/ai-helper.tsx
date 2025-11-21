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
import { useLanguage } from "@/context/language-context";

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
        const fallbackMessages = {
          en: "I'm having trouble connecting. Please try again later.",
          am: "ለመገናኘት እየተቸገርኩ ነው። እባክዎ ቆይተው ይሞክሩ።",
          om: "Walitti dhufeenya qaba jira. Maaloo booda yaali."
        };
        const reply = { role: "assistant" as const, text: fallbackMessages[language] };
        setMessages((m) => [...m, reply]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const fallbackMessages = {
        en: "I'm having trouble connecting. Please try again later.",
        am: "ለመገናኘት እየተቸገርኩ ነው። እባክዎ ቆይተው ይሞክሩ።",
        om: "Walitti dhufeenya qaba jira. Maaloo booda yaali."
      };
      const reply = { role: "assistant" as const, text: fallbackMessages[language] };
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
              AI Helper {language === "am" ? "(አማርኛ)" : language === "om" ? "(Afaan Oromoo)" : "(English)"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                aria-label="Switch language" 
                variant="outline" 
                size="icon" 
                onClick={() => {
                  const nextLang = language === "en" ? "am" : language === "am" ? "om" : "en";
                  setLanguage(nextLang);
                }}
              >
                <Languages className="h-4 w-4" />
              </Button>
              <Button aria-label="Close" variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto" aria-live="polite">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {language === "en"
                    ? "Ask me about becoming a vendor, AR try-on, payments, shipping, or any other questions!"
                    : language === "am"
                    ? "ስለ ሻጭ መሆን፣ AR ሙከራ፣ ክፍያ፣ ማድረስ ወይም ማንኛውም ሌላ ጥያቄዎች ጠይቁኝ!"
                    : "Waa'ee daldaltuu ta'uu, AR yaalii, kaffaltii, ergaa, ykn gaaffilee biroo na gaafadhu!"}
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
              aria-label={language === "en" ? "Type your question" : language === "am" ? "ጥያቄዎን ይተይቡ" : "Gaaffii kee barreessi"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={language === "en" ? "Type your question..." : language === "am" ? "ጥያቄ ያስገቡ..." : "Gaaffii galchi..."}
              disabled={loading}
            />
            <Button aria-label="Send" onClick={send} className="bg-primary hover:bg-primary/90" disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      <Button
        aria-label={
          open 
            ? (language === "en" ? "Close AI helper" : language === "am" ? "AI አጋዥን ዝጋ" : "Gargaaraa AI cufi")
            : (language === "en" ? "Open AI helper" : language === "am" ? "AI አጋዥን ክፈት" : "Gargaaraa AI bani")
        }
        onClick={() => setOpen((o) => !o)}
        size="lg"
        className="rounded-full bg-primary hover:bg-primary/90 shadow-gold"
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        {language === "en" ? "Ask AI" : language === "am" ? "AI ጠይቅ" : "AI Gaafadhu"}
      </Button>
    </div>
  );
}
