import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations, useMessages, useChatActions, Conversation } from "@/hooks/use-chat";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, ArrowLeft, ShoppingBag, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useProducts } from "@/hooks/use-products";
import { formatPriceFromCents } from "@/lib/utils";

const Chat = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { conversations, loading: convoLoading } = useConversations();
  const { sendMessage, markAsRead } = useChatActions();
  const { products } = useProducts();
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const { messages, loading: messagesLoading } = useMessages(selectedConversation?.id || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationIdFromUrl = searchParams.get("conversation");

  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0) {
      const conv = conversations.find(c => c.id === conversationIdFromUrl);
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  }, [conversationIdFromUrl, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && user) {
      markAsRead(selectedConversation.id, selectedConversation);
    }
  }, [selectedConversation, user, markAsRead]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-semibold mb-2">Entre para ver suas mensagens</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para conversar com vendedores
          </p>
          <Button onClick={() => navigate("/auth")} data-testid="button-login">
            Entrar
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageText.trim()) return;
    
    await sendMessage(selectedConversation.id, messageText, selectedConversation);
    setMessageText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getUnreadCount = (conv: Conversation) => {
    if (!user) return 0;
    return user.uid === conv.buyerId ? conv.unreadBuyer : conv.unreadSeller;
  };

  const getOtherParticipantName = (conv: Conversation) => {
    if (!user) return "";
    return user.uid === conv.buyerId ? conv.sellerName : conv.buyerName;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
          <Card className={`w-full md:w-80 flex-shrink-0 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg">Mensagens</h2>
            </div>
            
            <ScrollArea className="flex-1">
              {convoLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Carregando...
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">Sua caixa está vazia</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-[200px]">
                    Encontre um produto e fale diretamente com o vendedor
                  </p>
                  <Button 
                    onClick={() => navigate("/category/all")}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold"
                    data-testid="button-explore-products"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Explorar Produtos
                  </Button>
                  
                  {products.length > 0 && (
                    <div className="mt-6 w-full">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Produtos em destaque
                      </p>
                      <div className="space-y-2">
                        {products.slice(0, 3).map((product) => (
                          <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                            data-testid={`featured-product-${product.id}`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-xs font-medium truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{formatPriceFromCents(Number(product.price))}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => {
                    const unread = getUnreadCount(conv);
                    const isSelected = selectedConversation?.id === conv.id;
                    
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full p-3 text-left hover-elevate transition-colors ${
                          isSelected ? "bg-accent" : ""
                        }`}
                        data-testid={`conversation-item-${conv.id}`}
                      >
                        <div className="flex gap-3">
                          <Avatar className="w-12 h-12 flex-shrink-0">
                            <AvatarImage src={conv.productImage} alt={conv.productName} />
                            <AvatarFallback>
                              {conv.productName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium truncate">
                                {getOtherParticipantName(conv)}
                              </span>
                              {unread > 0 && (
                                <Badge variant="default" className="flex-shrink-0">
                                  {unread}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.productName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {conv.lastMessage || "Nenhuma mensagem"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>

          <Card className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConversation.productImage} alt={selectedConversation.productName} />
                    <AvatarFallback>
                      {selectedConversation.productName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                      {getOtherParticipantName(selectedConversation)}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedConversation.productName}
                    </p>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="text-center text-muted-foreground">
                      Carregando mensagens...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                      <p>Nenhuma mensagem ainda</p>
                      <p className="text-sm">Envie uma mensagem para iniciar a conversa</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOwn = msg.senderId === user.uid;
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                isOwn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                              data-testid={`message-${msg.id}`}
                            >
                              <p className="break-words">{msg.text}</p>
                              <p className={`text-xs mt-1 ${
                                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}>
                                {formatTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      className="flex-1"
                      data-testid="input-message"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      size="icon"
                      data-testid="button-send"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/30">
                <div className="text-center p-8">
                  <div className="w-24 h-24 rounded-full bg-background border-2 border-dashed border-muted-foreground/20 flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-10 h-10 opacity-30" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">Bem-vindo ao Chat VURO</h3>
                  <p className="text-sm max-w-[280px] mx-auto mb-4">
                    Selecione uma conversa ao lado ou explore nossos produtos para iniciar um novo chat
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span>Respostas rápidas e diretas</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Chat;
