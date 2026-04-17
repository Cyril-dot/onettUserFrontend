import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { chatApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import MessageSkeleton from "@/components/MessageSkeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle, ShoppingBag, Tag, Package } from "lucide-react";
import { toast } from "sonner";

// ─── Parse PRODUCT_CARD:: content ────────────────────────────────────────────

function parseProductCard(content: string) {
  if (!content?.startsWith("PRODUCT_CARD::")) return null;
  const parts = content.replace("PRODUCT_CARD::", "").split("::");
  return {
    name:        parts[0] ?? "",
    price:       parts[1] ?? "",
    description: parts[2] ?? "",
    imageUrl:    parts[3] ?? "",
  };
}

// ─── Product Card Bubble ──────────────────────────────────────────────────────

const MsgProductCard = ({ content }: { content: string }) => {
  const card = parseProductCard(content);
  if (!card) return null;

  return (
    <div className="msg-product-card flex justify-center my-2">
      <div className="msg-product-card__inner w-full max-w-sm rounded-2xl overflow-hidden border border-orange-100 bg-white shadow-md">
        {card.imageUrl && (
          <div className="msg-product-card__img-wrap aspect-[4/3] w-full overflow-hidden bg-orange-50">
            <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="msg-product-card__details p-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="msg-product-card__name font-semibold text-sm text-gray-900 leading-tight">{card.name}</p>
            <span className="msg-product-card__price shrink-0 flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 rounded-full px-2 py-0.5">
              <Tag className="h-3 w-3" />
              {card.price}
            </span>
          </div>
          {card.description && (
            <p className="msg-product-card__desc text-xs text-gray-500 leading-relaxed line-clamp-3">
              {card.description}
            </p>
          )}
          <div className="msg-product-card__footer flex items-center gap-1 pt-1">
            <ShoppingBag className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-400">Product enquiry</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── System Message Bubble ────────────────────────────────────────────────────

const MsgSystemBubble = ({ content }: { content: string }) => (
  <div className="msg-system-bubble flex justify-center my-1">
    <div className="msg-system-bubble__inner max-w-[85%] rounded-xl bg-orange-50 border border-orange-100 px-4 py-2.5 text-xs text-orange-700 text-center whitespace-pre-wrap leading-relaxed">
      {content}
    </div>
  </div>
);

// ─── Conversation List Item ───────────────────────────────────────────────────

const MsgConvItem = ({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: any;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const lastMsg = conversation.lastMessage ?? "";
  const isProductCard = lastMsg.startsWith("PRODUCT_CARD::");
  const preview = isProductCard
    ? `🛍 ${parseProductCard(lastMsg)?.name ?? "Product enquiry"}`
    : lastMsg || "New conversation";

  return (
    <button
      onClick={onClick}
      className={`msg-conv-item w-full text-left px-4 py-3 border-b border-orange-50 transition-colors hover:bg-orange-50 ${
        isSelected ? "msg-conv-item--active bg-orange-50 border-l-2 border-l-orange-500" : ""
      }`}
    >
      <div className="msg-conv-item__row flex items-center justify-between gap-2">
        <div className="msg-conv-item__text min-w-0">
          <p className="msg-conv-item__name text-sm font-medium truncate text-gray-900">
            {conversation.storeName || conversation.customerName || "Conversation"}
          </p>
          {conversation.productName && (
            <p className="msg-conv-item__product text-xs text-orange-500 truncate">
              Re: {conversation.productName}
            </p>
          )}
          <p className="msg-conv-item__preview text-xs text-gray-400 truncate mt-0.5">{preview}</p>
        </div>
        {conversation.unreadCount > 0 && (
          <span className="msg-conv-item__badge shrink-0 inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-orange-500 text-xs text-white font-semibold">
            {conversation.unreadCount}
          </span>
        )}
      </div>
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MessagesPage = () => {
  const { isAuthenticated, isSeller } = useAuth();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchConvs = isSeller
      ? chatApi.getSellerConversations()
      : chatApi.getUserConversations();

    fetchConvs
      .then(data => setConversations(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load conversations"))
      .finally(() => setLoading(false));
  }, [isAuthenticated, isSeller]);

  // Auto-select from URL
  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId) openConversation(convId);
  }, [searchParams]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (id: string) => {
    setSelectedConvId(id);
    setMessages([]);
    try {
      const history = await chatApi.getChatHistory(id);
      setMessages(Array.isArray(history?.messages) ? history.messages : []);
      const senderTypeToMark: "USER" | "SELLER" = isSeller ? "USER" : "SELLER";
      chatApi.markAsRead(id, senderTypeToMark).catch(() => {});
    } catch {
      toast.error("Failed to load messages");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvId || sending) return;
    setSending(true);
    try {
      const msg = isSeller
        ? await chatApi.sellerSendMessage(selectedConvId, inputText.trim())
        : await chatApi.userSendMessage(selectedConvId, inputText.trim());

      setMessages(prev => [...prev, msg]);
      setInputText("");

      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConvId
            ? { ...c, lastMessage: inputText.trim(), lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const activeConversation = conversations.find(c => c.id === selectedConvId);

  if (loading) return <MessageSkeleton />;

  return (
    <div className="msg-page min-h-screen bg-white">
      <Navbar />
      <div className="msg-page__container container mx-auto px-4 py-6">
        <h1 className="msg-page__title text-2xl font-bold text-gray-900 mb-4">Messages</h1>

        <div className="msg-page__grid grid md:grid-cols-3 gap-4 h-[calc(100vh-160px)] max-h-[700px]">

          {/* Conversation List */}
          <div className="msg-conv-list rounded-xl bg-white border border-orange-100 shadow-sm overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="msg-conv-list__empty flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-4">
                <MessageCircle className="h-10 w-10 text-orange-200" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              conversations.map((c: any) => (
                <MsgConvItem
                  key={c.id}
                  conversation={c}
                  isSelected={selectedConvId === c.id}
                  onClick={() => openConversation(c.id)}
                />
              ))
            )}
          </div>

          {/* Chat Area */}
          <div className="msg-chat-area md:col-span-2 rounded-xl bg-white border border-orange-100 shadow-sm flex flex-col overflow-hidden">

            {/* Chat Header */}
            {activeConversation && (
              <div className="msg-chat-area__header flex items-center gap-3 px-4 py-3 border-b border-orange-100 shrink-0">
                <div className="msg-chat-area__header-icon flex h-9 w-9 items-center justify-center rounded-full bg-orange-100">
                  {activeConversation.chatType === "ORDER_SUPPORT" ? (
                    <Package className="h-4 w-4 text-orange-600" />
                  ) : (
                    <ShoppingBag className="h-4 w-4 text-orange-600" />
                  )}
                </div>
                <div className="msg-chat-area__header-info">
                  <p className="msg-chat-area__header-name text-sm font-semibold text-gray-900">
                    {activeConversation.storeName || activeConversation.customerName}
                  </p>
                  {activeConversation.productName && (
                    <p className="msg-chat-area__header-product text-xs text-gray-400 truncate">
                      Re: {activeConversation.productName}
                    </p>
                  )}
                  {activeConversation.chatType === "ORDER_SUPPORT" && (
                    <span className="msg-chat-area__support-tag text-[10px] text-orange-500 font-medium uppercase tracking-wide">
                      Order Support
                    </span>
                  )}
                </div>
              </div>
            )}

            {!selectedConvId ? (
              <div className="msg-chat-area__placeholder flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 p-4">
                <MessageCircle className="h-12 w-12 text-orange-200" />
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="msg-chat-area__messages flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.map((msg: any) => {
                    if (msg.isProductCard || msg.content?.startsWith("PRODUCT_CARD::")) {
                      return <MsgProductCard key={msg.id} content={msg.content} />;
                    }
                    if (msg.senderType === "SYSTEM" || msg.isAutomated) {
                      return <MsgSystemBubble key={msg.id} content={msg.content} />;
                    }

                    const isOwn = isSeller
                      ? msg.senderType === "SELLER"
                      : msg.senderType === "USER";

                    return (
                      <div key={msg.id} className={`msg-bubble-row flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className="msg-bubble-row__inner flex flex-col gap-0.5 max-w-[72%]">
                          {!isOwn && msg.senderName && (
                            <span className="msg-bubble-row__sender text-[10px] text-gray-400 px-1">
                              {msg.senderName}
                            </span>
                          )}
                          <div
                            className={`msg-bubble rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              isOwn
                                ? "msg-bubble--own bg-orange-500 text-white rounded-br-sm"
                                : "msg-bubble--other bg-orange-50 text-gray-800 rounded-bl-sm"
                            }`}
                          >
                            {msg.productImageUrl && (
                              <img
                                src={msg.productImageUrl}
                                alt="Product"
                                className="rounded-lg mb-2 w-full max-w-[180px] object-cover"
                              />
                            )}
                            <span className="whitespace-pre-wrap">{msg.content}</span>
                          </div>
                          <span className={`msg-bubble-row__time text-[10px] text-gray-400 px-1 ${isOwn ? "text-right" : ""}`}>
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={sendMessage}
                  className="msg-chat-area__input-row flex gap-2 p-3 border-t border-orange-100 shrink-0"
                >
                  <Input
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="msg-input flex-1 rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-100"
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="msg-send-btn rounded-xl shrink-0 bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={sending || !inputText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
