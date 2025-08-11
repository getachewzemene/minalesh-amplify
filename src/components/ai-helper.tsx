import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Languages } from "lucide-react";

const faqs = {
  en: [
    { q: "How to become a vendor?", a: "Create an account, then go to Dashboard to set up your store and list products." },
    { q: "Do you support AR try-on?", a: "Yes, sunglasses and caps support Try in AR on compatible devices." },
    { q: "Payment methods?", a: "We support card, mobile money, and cash-on-delivery in select cities." },
  ],
  am: [
    { q: "እንዴት ሻጭ ልሆን?", a: "መለያ ይፍጠሩ ከዚያ ወደ ዳሽቦርድ በመሄድ ሱቅዎን ያቋቁሙ እና ምርቶች ይጨምሩ።" },
    { q: "AR ሙከራ አለ?", a: "አዎን፣ መነኮሳት እና ከረጢቶች በተስማሚ መሣሪያዎች ላይ በ AR ማሳየት ይቻላል።" },
    { q: "የክፍያ መንገዶች?", a: "ካርድ፣ ሞባይል ገንዘብ እና በከተሞች ውስጥ ቅርብ የ COD አገልግሎት እንዲሁም ይከፈላሉ።" },
  ],
};

export function AIHelper() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "am">("en");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, text: input };
    const bank = faqs[lang];
    const found = bank.find(({ q }) => input.toLowerCase().includes(q.toLowerCase().split("?")[0]));
    const fallback =
      lang === "en"
        ? "I’m here to help! Try asking about vendor setup, AR try-on, or payments."
        : "ለመርዳት እዚህ ነኝ! ስለ ሻጭ ማዘጋጀት፣ AR ሙከራ ወይም ክፍያዎች ይጠይቁ።";
    const reply = { role: "assistant" as const, text: found ? found.a : fallback };
    setMessages((m) => [...m, userMsg, reply]);
    setInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <Card className="w-80 mb-3 shadow-card">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">AI Helper {lang === "am" ? "(አማርኛ)" : "(English)"}</CardTitle>
            <div className="flex items-center gap-2">
              <Button aria-label="Switch language" variant="outline" size="icon" onClick={() => setLang((l) => (l === "en" ? "am" : "en"))}>
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
                  {lang === "en"
                    ? "Ask me about becoming a vendor, AR try-on, or payments."
                    : "ስለ ሻጭ መሆን፣ AR ሙከራ ወይም ክፍያ ጠይቁ።"}
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <span className={
                    m.role === "user"
                      ? "inline-block px-3 py-2 rounded-lg bg-primary text-primary-foreground"
                      : "inline-block px-3 py-2 rounded-lg bg-muted"
                  }>
                    {m.text}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Input
              aria-label={lang === "en" ? "Type your question" : "ጥያቄዎን ይተይቡ"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={lang === "en" ? "Type your question..." : "ጥያቄ ያስገቡ..."}
            />
            <Button aria-label="Send" onClick={send} className="bg-primary hover:bg-primary/90">
              <Send className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      <Button
        aria-label={open ? (lang === "en" ? "Close AI helper" : "AI አጋዥን ዝጋ") : (lang === "en" ? "Open AI helper" : "AI አጋዥን ክፈት")}
        onClick={() => setOpen((o) => !o)}
        size="lg"
        className="rounded-full bg-primary hover:bg-primary/90 shadow-gold"
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        {lang === "en" ? "Ask AI" : "AI ጠይቅ"}
      </Button>
    </div>
  );
}
