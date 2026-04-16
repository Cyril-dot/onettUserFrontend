import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Trash2, ChevronDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import AiMessageBubble from "@/components/ai/AiMessageBubble";
import BuyerQuickActions from "@/components/ai/BuyerQuickActions";

interface Message {
  role: "user" | "ai";
  text: string;
  products?: any[];
  timestamp?: Date;
}

const WELCOME_MSG: Message = {
  role: "ai",
  text: "Hi! I'm Onett, your personal shopping assistant. I can help you find products, get fashion advice, discover deals, and stay on trend! 🛍️\n\nChoose from the options below or ask me anything:",
  timestamp: new Date(),
};

const AiAssistant = () => {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Show scroll-to-bottom button when user scrolls up
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 120);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const clearConversation = () => {
    setMessages([WELCOME_MSG]);
  };

  const sendMessage = async (
    e?: React.FormEvent,
    customPrompt?: string,
    apiCall?: () => Promise<any>
  ) => {
    e?.preventDefault();
    const messageText = customPrompt || input.trim();
    if (!messageText) return;

    if (!isAuthenticated) {
      toast.error("Please sign in to use the AI assistant");
      return;
    }

    if (!customPrompt) setInput("");

    setMessages((prev) => [
      ...prev,
      { role: "user", text: messageText, timestamp: new Date() },
    ]);
    setLoading(true);

    try {
      const res = apiCall
        ? await apiCall()
        : await aiApi.chat(messageText);

      const reply =
        res?.reply || res?.data?.reply || "I couldn't find a good answer.";
      const products = res?.products || res?.data?.products;

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: reply, products, timestamp: new Date() },
      ]);
    } catch (err: any) {
      const errorMsg = err?.message || "Something went wrong. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `Sorry, ${errorMsg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Navbar — hidden on mobile to save space, or you can keep it */}
      <div className="hidden sm:block">
        <Navbar />
      </div>

      {/* Mobile top bar */}
      <div className="flex sm:hidden items-center justify-between px-4 py-3 border-b border-border/50 bg-background/95 backdrop-blur-sm shrink-0 z-10">
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Onett</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              Shopping assistant
            </p>
          </div>
        </div>

        {messages.length > 1 ? (
          <button
            onClick={clearConversation}
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Desktop header */}
      <div className="hidden sm:flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/95 backdrop-blur-sm shrink-0 max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Onett</h1>
            <p className="text-xs text-muted-foreground">
              Your personal shopping assistant
            </p>
          </div>
        </div>

        {messages.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearConversation}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Clear chat
          </Button>
        )}
      </div>

      {/* Quick Actions — sticky below header */}
      <div className="shrink-0 px-3 sm:px-6 py-2 border-b border-border/40 bg-background/90 backdrop-blur-sm max-w-4xl w-full mx-auto">
        <BuyerQuickActions
          onAction={(prompt) => sendMessage(undefined, prompt)}
          disabled={loading}
        />
      </div>

      {/* Message list — scrollable middle area */}
      <div className="flex-1 overflow-y-auto relative" ref={scrollAreaRef}>
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-6">
          {messages.map((msg, i) => (
            <AiMessageBubble key={i} message={msg} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-2.5 items-end">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary animate-pulse" />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-card border border-border/50 px-4 py-3">
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Scroll-to-bottom FAB */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-4 sm:right-8 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-md text-primary-foreground transition-all hover:scale-105 active:scale-95"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Input bar — always pinned to bottom */}
      <div className="shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-sm px-3 sm:px-6 py-3 safe-area-pb max-w-4xl w-full mx-auto">
        <form
          onSubmit={sendMessage}
          className="flex gap-2 sm:gap-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Onett anything..."
            className="flex-1 h-11 sm:h-12 px-4 rounded-xl text-sm sm:text-base"
            disabled={loading}
            autoComplete="off"
            autoCorrect="off"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !input.trim()}
            className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AiAssistant;
