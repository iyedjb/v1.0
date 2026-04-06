import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { formatPriceFromCents } from "@/lib/utils";
import vegaAvatar from "@assets/vega_avatar.png";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: string;
  image: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
}

export function AiAssistant() {
  const navigate = useNavigate();
  const { products: allProducts } = useProducts();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Oi! Sou a Vega, sua assistente da VURO! Posso te ajudar a encontrar o tenis perfeito. Me conta o que voce procura - marca, preco, estilo, ou tamanho!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, isMobile]);

  useEffect(() => {
    const handleOpenVega = (event: CustomEvent) => {
      const productInfo = event.detail;
      setIsOpen(true);
      if (productInfo?.name) {
        const productMessage = `Quero saber mais sobre o ${productInfo.name} da ${productInfo.brand || "VURO"} que custa ${productInfo.price}. O que voce pode me dizer sobre esse produto?`;
        setInput(productMessage);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 300);
      }
    };

    window.addEventListener("open-vega", handleOpenVega as EventListener);
    return () => {
      window.removeEventListener("open-vega", handleOpenVega as EventListener);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      // Enrich products with real images from frontend cache
      let enrichedProducts: Product[] = [];
      if (data.products && Array.isArray(data.products)) {
        enrichedProducts = data.products.map((p: any) => {
          const cachedProduct = allProducts.find(
            (cp) => String(cp.id) === String(p.id)
          );
          return {
            id: p.id,
            name: cachedProduct?.name || p.name,
            brand: cachedProduct?.brand || p.brand,
            price: String(cachedProduct?.price || p.price),
            image: cachedProduct?.image || p.image,
          };
        });
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "Desculpe, tive um problema. Tente novamente!",
        products: enrichedProducts,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Ops! Algo deu errado. Tente novamente em alguns segundos.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleProductClick = (productId: string) => {
    setIsOpen(false);
    navigate(`/product/${productId}`);
  };

  if (!isOpen) {
    return null;
  }

  const containerClass = isMobile
    ? "fixed inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-bottom duration-300"
    : "fixed bottom-20 right-4 z-50 w-[380px] h-[550px] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300";

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        {isMobile ? (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            data-testid="button-ai-assistant-close"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : null}
        <img
          src={vegaAvatar}
          alt="Vega"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Vega</h3>
          <p className="text-xs text-muted-foreground">Sua assistente VURO</p>
        </div>
        {!isMobile && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            data-testid="button-ai-assistant-close"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              {message.role === "assistant" && (
                <img
                  src={vegaAvatar}
                  alt=""
                  className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                />
              )}
              <div className="max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                {message.products && message.products.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="w-full flex items-center gap-3 p-3 bg-background rounded-xl border hover:border-primary hover:shadow-md transition-all group"
                        data-testid={`button-product-${product.id}`}
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-base text-primary font-bold mt-1">{formatPriceFromCents(Number(product.price))}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <img src={vegaAvatar} alt="" className="w-8 h-8 rounded-full mr-2" />
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Pensando...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Quero um Nike ate R$500..."
            disabled={isLoading}
            className="flex-1"
            data-testid="input-ai-message"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            data-testid="button-ai-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Powered by EduTok.Online
        </p>
      </div>
    </div>
  );
}
