"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Bot, User, Lightbulb, RefreshCw, Sparkles, ChevronRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showError, showSuccess } from "@/components/ui/Toast";
import { collection, addDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import { chatbotApi } from "@/utils/api/chatbot";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  content: "Hi! I'm Hireall AI. I can help with resume optimization, interview prep, and salary negotiation. How can I help you today?",
  role: 'assistant',
  timestamp: new Date()
};

const SUGGESTED_QUESTIONS = [
  "Review my resume",
  "Salary negotiation tips",
  "Interview prep",
  "Tech career path"
];

const STORAGE_KEY = "hireall_chat_v1";

const sanitizeAssistantContent = (text: string): string => {
  if (!text) return "";
  const normalized = text.replace(/\r\n/g, "\n");
  const withoutMarkdown = normalized
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1");
  const withoutAsterisks = withoutMarkdown.replace(/\*/g, "");
  return withoutAsterisks.replace(/\n{3,}/g, "\n\n").trim();
};

export default function Chatbot() {
  const { user } = useFirebaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [askingForEmail, setAskingForEmail] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedChat = localStorage.getItem(STORAGE_KEY);
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        // Convert ISO strings back to Date objects
        const hydrated = parsed.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(hydrated);
        setConversationId(parsed.id);
        if (parsed.userEmail) setUserEmail(parsed.userEmail);
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (messages.length > 1 || conversationId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        messages,
        id: conversationId,
        userEmail
      }));
    }
  }, [messages, conversationId, userEmail]);

  const scrollToBottom = () => {
    if (!scrollAreaRef.current) return;
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (!viewport) return;
    setTimeout(() => {
      viewport.scrollTop = viewport.scrollHeight;
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, askingForEmail]);

  const saveMessageToFirebase = async (message: Message) => {
    if (!conversationId || (!user?.email && !userEmail)) return;
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        content: message.content,
        role: message.role,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving message to Firebase:', error);
    }
  };

  const createConversation = async (email: string) => {
    const newId = Date.now().toString();
    setConversationId(newId);
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'conversations'), {
        id: newId,
        userEmail: email,
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error creating conversation in FB", e);
    }
    return newId;
  };

  const sendMessage = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;

    // Check email requirement
    if (!user && !userEmail) {
      setAskingForEmail(true);
      setInputMessage(trimmed); // Hold the message
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: trimmed,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    let currentConversationId = conversationId;
    if (!currentConversationId) {
      currentConversationId = await createConversation(user?.email || userEmail);
    }

    await saveMessageToFirebase(userMessage);

    try {
      const data = await chatbotApi.sendMessage({
        message: trimmed,
        context: user ? `User is signed in with email: ${user.email}` : `User email: ${userEmail}`
      });

      const sanitized = sanitizeAssistantContent(data.response);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: sanitized,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
      await saveMessageToFirebase(assistantMsg);
    } catch (error) {
      console.error('Chatbot error:', error);
      showError('AI Unavailable', 'Having trouble connecting. Please try again.');
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        content: "Sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.",
        role: 'assistant',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setAskingForEmail(false);
      sendMessage(inputMessage);
    } else {
      showError("Invalid Email", "Please enter a valid email address.");
    }
  };

  const startNewChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setConversationId(null);
    localStorage.removeItem(STORAGE_KEY);
    showSuccess("Success", "Starting a fresh conversation.");
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setTimeout(() => textareaRef.current?.focus(), 150);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={toggleChat}
            size="icon"
            className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-white border-4 border-white dark:border-zinc-900"
          >
            {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed inset-x-4 bottom-4 z-50 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px]"
          >
            <div className="bg-card border border-border rounded-3xl shadow-2xl flex flex-col h-[calc(100vh-120px)] sm:h-[600px] overflow-hidden">
              {/* Premium Header */}
              <div className="bg-primary p-4 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Hireall Assistant</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-[10px] font-medium opacity-80">Online & Ready</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={startNewChat} className="h-8 w-8 text-white hover:bg-white/10" title="New Chat">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={toggleChat} className="h-8 w-8 text-white hover:bg-white/10">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Canvas */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 bg-zinc-50/30 dark:bg-zinc-900/10">
                <div className="p-4 space-y-6">
                  {messages.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}
                    >
                      <div className={cn(
                        "max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed",
                        m.role === 'user' 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-white dark:bg-zinc-800 border border-border rounded-tl-none"
                      )}>
                        {m.content}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 mx-1 font-medium">
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <div className="flex items-start gap-2">
                      <div className="p-2 bg-muted rounded-xl rounded-tl-none">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {askingForEmail && (
                    <motion.div 
                      key="email-request"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 bg-primary/5 border-2 border-primary/20 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center gap-2 text-primary">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm font-bold">Email Required</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Please provide your email to continue this session and save your progress.</p>
                      <form onSubmit={handleEmailSubmit} className="flex gap-2">
                        <input
                          autoFocus
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <Button type="submit" size="sm" className="rounded-xl h-8 text-xs">
                          Continue
                        </Button>
                      </form>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {/* Interaction Bar */}
              <div className="p-4 bg-background border-t">
                {/* Sticky Suggestions chips */}
                {messages.length < 5 && !isLoading && !askingForEmail && (
                  <div className="flex gap-2 overflow-x-auto pb-3 mb-1 no-scrollbar">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        className="whitespace-nowrap px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-1.5 flex-shrink-0"
                      >
                        <Sparkles className="h-3 w-3" />
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative group">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(inputMessage);
                      }
                    }}
                    placeholder="Ask about your career..."
                    className="min-h-[50px] max-h-32 pr-12 rounded-2xl resize-none border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus-visible:ring-primary focus-visible:border-primary transition-all"
                  />
                  <Button
                    onClick={() => sendMessage(inputMessage)}
                    disabled={!inputMessage.trim() || isLoading || askingForEmail}
                    size="icon"
                    className="absolute right-2 bottom-2 h-8 w-8 rounded-xl shadow-lg bg-primary text-white hover:scale-105"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">AI Expert Mode</span>
                  <span className="text-[10px] text-primary/60 font-medium">Powered by Hireall AI</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
