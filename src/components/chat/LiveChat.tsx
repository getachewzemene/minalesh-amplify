import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Minimize2, Maximize2, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent" | "bot";
  timestamp: Date;
  senderName?: string;
}

export function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState<"online" | "busy" | "offline">("online");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize chat with welcome message
      const welcomeMessage: Message = {
        id: "welcome",
        content: "Hi! Welcome to Minalesh support. How can I help you today?",
        sender: "bot",
        timestamp: new Date(),
        senderName: "Support Assistant"
      };
      setMessages([welcomeMessage]);
      setIsConnected(true);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
      senderName: profile?.display_name || "You"
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");

    // Simulate agent/bot response
    setTimeout(() => {
      const responses = [
        "Thank you for your message. I'm looking into this for you.",
        "I understand your concern. Let me check our records.",
        "That's a great question! Here's what I can tell you...",
        "I'll transfer you to a specialist who can better help with this.",
        "Let me get more information about your order."
      ];

      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        sender: agentStatus === "online" ? "agent" : "bot",
        timestamp: new Date(),
        senderName: agentStatus === "online" ? "Sarah (Support Agent)" : "Support Assistant"
      };

      setMessages(prev => [...prev, response]);
    }, 1000 + Math.random() * 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "offline":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const toggleChat = () => {
    if (!user) {
      toast.error("Please log in to access live chat");
      return;
    }
    setIsOpen(!isOpen);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-80 shadow-xl z-50 transition-all duration-200 ${
      isMinimized ? "h-16" : "h-96"
    }`}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(agentStatus)}`}></div>
            <span>Live Support</span>
            <Badge variant="secondary" className="text-xs">
              {isConnected ? "Connected" : "Connecting..."}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-80">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.sender !== "user" && (
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {message.sender === "bot" ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[80%] ${message.sender === "user" ? "order-1" : ""}`}>
                  <div
                    className={`p-2 rounded-lg text-sm ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {message.senderName} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {message.sender === "user" && (
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {profile?.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <Button
                onClick={sendMessage}
                size="icon"
                className="h-10 w-10"
                disabled={!inputMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {agentStatus === "online" ? "Agent typically responds in under 2 minutes" : "Bot is responding instantly"}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}