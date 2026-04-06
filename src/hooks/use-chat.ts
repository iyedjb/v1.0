import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, push, set, get, serverTimestamp, update } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadBuyer: number;
  unreadSeller: number;
}

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const conversationsRef = ref(db, "conversations");
    
    const unsubscribe = onValue(conversationsRef, (snapshot) => {
      const data = snapshot.val();
      let convos: Conversation[] = [];
      
      if (data) {
        convos = Object.entries(data)
          .map(([key, value]: [string, any]) => ({
            ...value,
            id: key,
            buyerId: value.buyerId || "",
            sellerId: value.sellerId || "",
            lastMessageTime: value.lastMessageTime || 0
          }))
          .filter((conv) => 
            conv.buyerId === user.uid || conv.sellerId === user.uid
          )
          .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      }
      
      setConversations(convos);
      setLoading(false);
    }, (error) => {
      console.error("Error loading conversations:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { conversations, loading };
};

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const messagesRef = ref(db, `messages/${conversationId}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      let msgs: Message[] = [];
      
      if (data) {
        msgs = Object.entries(data)
          .map(([key, value]: [string, any]) => ({
            ...value,
            id: key,
          }))
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      }
      
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  return { messages, loading };
};

export const useChatActions = () => {
  const { user } = useAuth();

  const startConversation = useCallback(async (
    productId: string,
    productName: string,
    productImage: string,
    sellerId: string,
    sellerName: string
  ): Promise<string | null> => {
    if (!user) return null;

    const conversationsRef = ref(db, "conversations");
    const snapshot = await get(conversationsRef);
    const data = snapshot.val();
    
    if (data) {
      const existing = Object.entries(data).find(([, value]: [string, any]) => 
        value.productId === productId && 
        value.buyerId === user.uid && 
        value.sellerId === sellerId
      );
      
      if (existing) {
        return existing[0];
      }
    }

    const newConvRef = push(conversationsRef);
    const conversation: Omit<Conversation, 'id'> = {
      productId,
      productName,
      productImage,
      buyerId: user.uid,
      buyerName: user.displayName || user.email || "Comprador",
      sellerId,
      sellerName,
      lastMessage: "",
      lastMessageTime: Date.now(),
      unreadBuyer: 0,
      unreadSeller: 0,
    };

    await set(newConvRef, conversation);
    return newConvRef.key;
  }, [user]);

  const sendMessage = useCallback(async (
    conversationId: string,
    text: string,
    conversation: Conversation
  ): Promise<void> => {
    if (!user || !text.trim()) return;

    const messagesRef = ref(db, `messages/${conversationId}`);
    const newMessageRef = push(messagesRef);
    
    const message: Omit<Message, 'id'> = {
      senderId: user.uid,
      senderName: user.displayName || user.email || "Usuário",
      text: text.trim(),
      timestamp: Date.now(),
    };

    await set(newMessageRef, message);

    const isBuyer = user.uid === conversation.buyerId;
    const conversationRef = ref(db, `conversations/${conversationId}`);
    await update(conversationRef, {
      lastMessage: text.trim(),
      lastMessageTime: Date.now(),
      ...(isBuyer ? { unreadSeller: (conversation.unreadSeller || 0) + 1 } : { unreadBuyer: (conversation.unreadBuyer || 0) + 1 }),
    });
  }, [user]);

  const markAsRead = useCallback(async (
    conversationId: string,
    conversation: Conversation
  ): Promise<void> => {
    if (!user) return;

    const isBuyer = user.uid === conversation.buyerId;
    const conversationRef = ref(db, `conversations/${conversationId}`);
    
    await update(conversationRef, {
      ...(isBuyer ? { unreadBuyer: 0 } : { unreadSeller: 0 }),
    });
  }, [user]);

  return { startConversation, sendMessage, markAsRead };
};
