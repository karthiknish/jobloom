"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Minimize2, Bot, User, History, Plus, Trash2, Lightbulb, Briefcase, Copy, ThumbsUp, ThumbsDown, Share2, Sparkles, Zap, Brain, Target, TrendingUp, Volume2, VolumeX, FileText, Users, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showError } from "@/components/ui/Toast";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  category?: 'general' | 'interview' | 'resume' | 'salary' | 'career' | 'networking';
  liked?: boolean;
  disliked?: boolean;
  typingAnimation?: boolean;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  content: "👋 Hi! I'm Hireall AI, your personal career assistant. I specialize in helping with job search strategies, interview preparation, resume optimization, salary negotiation, and career planning. Ask me anything about your professional journey!",
  role: 'assistant',
  timestamp: new Date()
};

const SUGGESTED_QUESTIONS = [
  { text: "How do I prepare for a software engineering interview?", category: "interview", icon: Brain },
  { text: "What should I include in my resume?", category: "resume", icon: FileText },
  { text: "How do I negotiate my salary?", category: "salary", icon: TrendingUp },
  { text: "How can I improve my LinkedIn profile?", category: "networking", icon: Users },
  { text: "What skills should I learn for a career in tech?", category: "career", icon: Target },
  { text: "How do I handle difficult interview questions?", category: "interview", icon: MessageCircle }
];

const CATEGORY_COLORS = {
  interview: 'bg-primary/10 text-primary border-primary/20',
  resume: 'bg-secondary/10 text-secondary border-secondary/20',
  salary: 'bg-accent/10 text-accent-foreground border-accent/20',
  networking: 'bg-muted text-muted-foreground border-border',
  career: 'bg-primary/5 text-primary border-primary/10',
  general: 'bg-muted text-muted-foreground border-border'
};

const CATEGORY_ICONS = {
  interview: Brain,
  resume: FileText,
  salary: TrendingUp,
  networking: Users,
  career: Target,
  general: Lightbulb
};

export default function Chatbot() {
  const { user } = useFirebaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[][]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // New enhanced features
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Message persistence keys
  const CHAT_HISTORY_KEY = 'hireall_chat_history';
  const CHAT_SESSIONS_KEY = 'hireall_chat_sessions';

  // Helper to scroll to bottom - simplified and more reliable
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!scrollAreaRef.current) return;

    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (!viewport) return;

    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      viewport.scrollTo({ 
        top: viewport.scrollHeight, 
        behavior 
      });
    });
  }, []);

  // Initialize component and load data
  useEffect(() => {
    let mounted = true;
    
    const initializeChat = async () => {
      try {
        // Load chat history
        const savedHistory = localStorage.getItem(CHAT_SESSIONS_KEY);
        const savedCurrent = localStorage.getItem(CHAT_HISTORY_KEY);

        if (savedHistory && mounted) {
          const parsedHistory = JSON.parse(savedHistory);
          const historyWithDates = parsedHistory.map((session: Message[]) =>
            session.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          );
          setChatHistory(historyWithDates);
        }

        if (savedCurrent && mounted) {
          const parsedCurrent = JSON.parse(savedCurrent);
          const currentWithDates = parsedCurrent.map((msg: Message) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(currentWithDates);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        if (mounted) {
          setIsLoaded(true);
        }
      }
    };

    initializeChat();

    return () => {
      mounted = false;
    };
  }, []);

  // Stop attention pulse after initial exposure or when chat opens
  useEffect(() => {
    if (!isLoaded) return;
    
    const timeout = setTimeout(() => setShouldPulse(false), 8000);
    return () => clearTimeout(timeout);
  }, [isLoaded]);

  useEffect(() => {
    if (isOpen) {
      setShouldPulse(false);
    }
  }, [isOpen]);

  // Detect user scroll position to toggle auto-scroll & button
  useEffect(() => {
    if (!isLoaded || !isOpen || isMinimized) return;
    
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (!viewport) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce scroll events to reduce performance impact
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const distanceFromBottom = viewport.scrollHeight - (viewport.scrollTop + viewport.clientHeight);
        const isAtBottom = distanceFromBottom < 50; // Increased threshold for better UX
        
        // Only update state if actually needed
        if (isAtBottom !== autoScroll) {
          setAutoScroll(isAtBottom);
        }
        if (isAtBottom !== !showScrollButton) {
          setShowScrollButton(!isAtBottom);
        }
      }, 16); // ~60fps
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout);
      viewport.removeEventListener('scroll', handleScroll);
    };
  }, [autoScroll, showScrollButton, isLoaded, isOpen, isMinimized]);

  // Auto-scroll only if user hasn't scrolled up
  useEffect(() => {
    if (!isLoaded || !autoScroll) return;
    
    // Use a single delayed scroll to ensure DOM is updated
    const scrollTimer = setTimeout(() => {
      scrollToBottom('instant');
    }, 50);

    return () => clearTimeout(scrollTimer);
  }, [messages, autoScroll, scrollToBottom, isLoaded]);

  // Re-enable auto-scroll when new chat session starts
  useEffect(() => {
    if (!isLoaded || messages.length !== 1) return;
    
    setAutoScroll(true);
    const scrollTimer = setTimeout(() => scrollToBottom('instant'), 100);
    return () => clearTimeout(scrollTimer);
  }, [messages.length, scrollToBottom, isLoaded]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (!isLoaded || !isOpen || isMinimized) return;

    if (textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized, isLoaded]);

  // Enhanced message interaction functions
  const copyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const toggleMessageReaction = (messageId: string, reaction: 'liked' | 'disliked') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        // Toggle the reaction and remove the opposite if present
        if (reaction === 'liked') {
          return { ...msg, liked: !msg.liked, disliked: false };
        } else {
          return { ...msg, liked: false, disliked: !msg.disliked };
        }
      }
      return msg;
    }));
  };

  const shareMessage = async (content: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hireall AI Chat',
          text: content,
          url: window.location.href
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      await copyMessage(content, 'share-fallback');
    }
  };

  const playSound = (type: 'message' | 'notification' = 'message') => {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'message') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
      } else {
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
      }

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  };

  // Enhanced input handling
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };



  // Save current chat session to localStorage (debounced)
  useEffect(() => {
    if (!isLoaded) return;
    
    const timeoutId = setTimeout(() => {
      try {
        if (messages.length > 1) { // Only save if there are actual messages (beyond welcome)
          localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        }
      } catch (error) {
        console.error('Failed to save current chat:', error);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [messages, isLoaded]);

  // Save chat history to localStorage when history changes (debounced)
  useEffect(() => {
    if (!isLoaded) return;
    
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(chatHistory));
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [chatHistory, isLoaded]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setAutoScroll(true);
    setInputMessage("");
    setIsLoading(true);
    setIsTyping(false);
    playSound('message');

    setTimeout(() => scrollToBottom('instant'), 10);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          context: user ? `User is signed in with email: ${user.email}` : 'User is not signed in',
          category: selectedCategory
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        category: data.category || 'general',
        typingAnimation: true
      };

      setMessages(prev => [...prev, assistantMessage]);
      playSound('notification');
      setTimeout(() => scrollToBottom('instant'), 10);
    } catch (error) {
      console.error('Chatbot error:', error);
      showError('Connection failed', 'Unable to connect to AI assistant. Please try again.');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        role: 'assistant',
        timestamp: new Date(),
        category: 'general'
      };
      setMessages(prev => [...prev, errorMessage]);
      setTimeout(() => scrollToBottom('instant'), 10);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
    setShouldPulse(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Chat history management functions
  const startNewChat = () => {
    // Save current chat to history if it has messages
    if (messages.length > 1) {
      setChatHistory(prev => [messages, ...prev.slice(0, 9)]); // Keep only last 10 sessions
    }

    // Start new chat
    setMessages([WELCOME_MESSAGE]);
    setInputMessage("");
    setShowHistory(false);
  };

  const loadChatSession = (sessionIndex: number) => {
    const session = chatHistory[sessionIndex];
    if (session) {
      setMessages(session);
      setShowHistory(false);
    }
  };

  const clearAllHistory = () => {
    setChatHistory([]);
    setMessages([WELCOME_MESSAGE]);
    setShowHistory(false);
    try {
      localStorage.removeItem(CHAT_SESSIONS_KEY);
      localStorage.removeItem(CHAT_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  };

  // Don't render until component is loaded to prevent blinking
  if (!isLoaded) {
    return null;
  }

  return (
    <TooltipProvider>
      <>
        {/* Floating Chat Button */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-20 right-6 sm:bottom-6 sm:right-6 z-[100]"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={toggleChat}
                  size="lg"
                  className={`relative rounded-full h-16 w-16 shadow-xl hover:shadow-2xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary/20 backdrop-blur-sm ${
                    !isOpen && shouldPulse ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: 180, opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3, type: "spring" }}
                      >
                        <X className="h-7 w-7 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="chat"
                        initial={{ rotate: 180, opacity: 0, scale: 0.5 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: -180, opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3, type: "spring" }}
                        className="relative"
                      >
                        <MessageCircle className="h-7 w-7 text-white" />
                        {isTyping && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1] }}
                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Floating notification indicator */}
                  {!isOpen && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-background"
                    >
                      <Sparkles className="h-2 w-2 text-destructive-foreground mx-auto" />
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-gray-900 text-white border-gray-700">
              <p className="font-medium">💬 Hireall AI Assistant</p>
              <p className="text-xs opacity-90">Get career advice and help</p>
            </TooltipContent>
          </Tooltip>
        </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ height: isMinimized ? 60 : undefined }}
            className={`fixed bottom-24 right-4 left-4 sm:right-6 sm:left-auto w-auto sm:w-[420px] max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3rem)] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${isMinimized ? '' : 'max-h-[calc(100vh-96px)]'}`}
          >
            {/* Enhanced Header */}
            <div className="relative overflow-hidden">
              {/* Theme-based Background */}
              <div className="absolute inset-0 bg-primary opacity-95"></div>
              <div className="absolute inset-0 bg-primary/50 animate-pulse"></div>

              {/* Header Content */}
              <div className="relative flex items-center justify-between p-4 text-primary-foreground">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-primary-foreground/30 shadow-lg">
                      <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-bold backdrop-blur-sm">
                        <Bot className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">Hireall AI</h3>
                      <Badge className="bg-secondary text-secondary-foreground border-0 text-xs font-semibold px-2 py-0.5">
                        <Zap className="w-3 h-3 mr-1" />
                        Online
                      </Badge>
                    </div>
                    <p className="text-xs opacity-90">Your Personal Career Assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20 rounded-full transition-colors duration-200"
                        title={soundEnabled ? "Disable sound" : "Enable sound"}
                      >
                        {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{soundEnabled ? "Disable" : "Enable"} sound notifications</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20 rounded-full transition-colors duration-200"
                    title="Chat history"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMinimize}
                    className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20 rounded-full transition-colors duration-200"
                    title="Minimize chat"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleChat}
                    className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20 rounded-full transition-colors duration-200"
                    title="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Chat Content */}
                  {showHistory ? (
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-foreground">Chat History</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={startNewChat}
                            className="h-8 px-3"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            New Chat
                          </Button>
                        </div>

                        {chatHistory.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No chat history yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {chatHistory.map((session, index) => {
                              const firstUserMessage = session.find(msg => msg.role === 'user');
                              const sessionDate = session[0]?.timestamp;
                              const messageCount = session.filter(msg => msg.role === 'user').length;

                              return (
                                <motion.button
                                  key={index}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={() => loadChatSession(index)}
                                  className="w-full text-left p-3 bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/30 rounded-lg transition-all duration-200"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">
                                        {firstUserMessage?.content || 'New conversation'}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <span>{messageCount} messages</span>
                                        <span>•</span>
                                        <span>{sessionDate ? new Date(sessionDate).toLocaleDateString() : 'Recent'}</span>
                                      </div>
                                    </div>
                                    <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        )}

                        {chatHistory.length > 0 && (
                          <div className="pt-4 border-t border-border/50">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearAllHistory}
                              className="w-full text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Clear All History
                            </Button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  ) : (
                    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                      <div className="space-y-4">
                        {showScrollButton && (
                          <div className="flex justify-center sticky top-0 z-10">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-3 shadow-sm bg-background/80 backdrop-blur border-border/50 hover:bg-background"
                               onClick={() => {
                                 setAutoScroll(true);
                                 scrollToBottom('smooth');
                               }}
                            >
                              Scroll to latest ↓
                            </Button>
                          </div>
                        )}
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                          >
                            {message.role === 'assistant' && (
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                              >
                                <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                                  <AvatarFallback className="bg-primary text-primary-foreground border-2 border-primary-foreground/30 shadow-md">
                                    <Bot className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                              </motion.div>
                            )}
                            <div className="flex flex-col max-w-[75%]">
                              {/* Category Badge for Assistant Messages */}
                              {message.role === 'assistant' && message.category && (
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.2 }}
                                  className="mb-1"
                                >
                                  <Badge className={`text-xs ${CATEGORY_COLORS[message.category] || CATEGORY_COLORS.general} border-0`}>
                                    {React.createElement(CATEGORY_ICONS[message.category] || Lightbulb, { className: "w-3 h-3 mr-1" })}
                                    {message.category}
                                  </Badge>
                                </motion.div>
                              )}

                              {/* Message Bubble */}
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className={`relative rounded-2xl px-4 py-3 text-sm shadow-lg backdrop-blur-sm transition-all duration-200 ${
                                  message.role === 'user'
                                    ? 'bg-primary text-primary-foreground ml-4 shadow-primary/25'
                                    : 'bg-card text-card-foreground border border-border shadow-border'
                                }`}
                              >
                                <div className="whitespace-pre-wrap break-words">
                                  {message.typingAnimation ? (
                                    <span className="inline-block">{message.content}</span>
                                  ) : (
                                    message.content
                                  )}
                                </div>

                                {/* Message Actions */}
                                {message.role === 'assistant' && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  >
                                    <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-1 border border-gray-200">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyMessage(message.content, message.id)}
                                            className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full transition-colors"
                                            title="Copy message"
                                          >
                                            {copiedMessageId === message.id ? (
                                              <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                              >
                                                <CheckCircle className="h-3 w-3 text-green-600" />
                                              </motion.div>
                                            ) : (
                                              <Copy className="h-3 w-3 text-gray-600" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Copy message</p>
                                        </TooltipContent>
                                      </Tooltip>

                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleMessageReaction(message.id, 'liked')}
                                            className={`h-6 w-6 p-0 hover:bg-gray-100 rounded-full transition-colors ${
                                              message.liked ? 'text-green-600' : 'text-gray-600'
                                            }`}
                                            title="Like message"
                                          >
                                            <ThumbsUp className="h-3 w-3" fill={message.liked ? 'currentColor' : 'none'} />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Helpful?</p>
                                        </TooltipContent>
                                      </Tooltip>

                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleMessageReaction(message.id, 'disliked')}
                                            className={`h-6 w-6 p-0 hover:bg-gray-100 rounded-full transition-colors ${
                                              message.disliked ? 'text-red-600' : 'text-gray-600'
                                            }`}
                                            title="Dislike message"
                                          >
                                            <ThumbsDown className="h-3 w-3" fill={message.disliked ? 'currentColor' : 'none'} />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Not helpful?</p>
                                        </TooltipContent>
                                      </Tooltip>

                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => shareMessage(message.content)}
                                            className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                                            title="Share message"
                                          >
                                            <Share2 className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Share message</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </motion.div>
                                )}

                                {/* Timestamp */}
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.4 }}
                                  className="text-xs opacity-70 mt-1"
                                >
                                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </motion.div>
                              </motion.div>
                            </div>
                            {message.role === 'user' && (
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                              >
                                <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                                  <AvatarFallback className="bg-secondary text-secondary-foreground border-2 border-secondary-foreground/30 shadow-md">
                                    <User className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                              </motion.div>
                            )}
                          </motion.div>
                        ))}

                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-3 justify-start"
                          >
                            <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary border border-primary/20">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-muted/50 rounded-2xl px-4 py-3 border border-border/50 shadow-sm">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Enhanced Suggested Questions */}
                        {messages.length === 1 && !isLoading && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                            className="mt-6"
                          >
                            <div className="text-center">
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.6, type: "spring" }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4"
                              >
                                <Sparkles className="h-4 w-4 text-primary" />
                                <p className="text-sm font-medium text-primary">Quick Suggestions</p>
                              </motion.div>

                              <div className="grid grid-cols-1 gap-3">
                                {SUGGESTED_QUESTIONS.map((question, index) => {
                                  const IconComponent = question.icon;
                                  return (
                                    <motion.button
                                      key={index}
                                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                      animate={{ opacity: 1, x: 0, scale: 1 }}
                                      whileHover={{ scale: 1.02, y: -2 }}
                                      whileTap={{ scale: 0.98 }}
                                      transition={{
                                        delay: 0.7 + index * 0.1,
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 25
                                      }}
                                      className="group relative text-left p-4 bg-card border border-border hover:border-primary/50 hover:shadow-lg rounded-xl text-sm text-card-foreground transition-all duration-300 overflow-hidden"
                                      onClick={() => handleSuggestedQuestion(question.text)}
                                    >
                                      {/* Subtle gradient overlay on hover */}
                                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                      <div className="relative flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                            question.category === 'interview' ? 'bg-primary/20 text-primary' :
                                            question.category === 'resume' ? 'bg-secondary/20 text-secondary' :
                                            question.category === 'salary' ? 'bg-accent/20 text-accent-foreground' :
                                            question.category === 'networking' ? 'bg-muted/50 text-muted-foreground' :
                                            question.category === 'career' ? 'bg-primary/10 text-primary' :
                                            'bg-muted/50 text-muted-foreground'
                                          }`}>
                                            <IconComponent className="w-4 h-4" />
                                          </div>
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                            {question.text}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className={`text-xs ${
                                              question.category === 'interview' ? 'border-primary/50 text-primary' :
                                              question.category === 'resume' ? 'border-secondary/50 text-secondary' :
                                              question.category === 'salary' ? 'border-accent/50 text-accent-foreground' :
                                              question.category === 'networking' ? 'border-border text-muted-foreground' :
                                              question.category === 'career' ? 'border-primary/30 text-primary' :
                                              'border-border text-muted-foreground'
                                            }`}>
                                              {question.category}
                                            </Badge>
                                            <Zap className="w-3 h-3 text-muted-foreground" />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Hover arrow */}
                                      <motion.div
                                        initial={{ opacity: 0, x: -5 }}
                                        whileHover={{ opacity: 1, x: 0 }}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary"
                                      >
                                        <ArrowRight className="w-4 h-4" />
                                      </motion.div>
                                    </motion.button>
                                  );
                                })}
                              </div>

                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.3 }}
                                className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-2"
                              >
                                <Target className="w-3 h-3" />
                                Or ask me anything about your career journey
                              </motion.p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </ScrollArea>
                  )}

                  {/* Enhanced Input Area */}
                  {!showHistory && (
                    <div className="border-t border-border bg-muted/30 p-4">
                      {/* Category Selector */}
                      {messages.length === 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-3"
                        >
                          <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Focus:</span>
                            {Object.entries(CATEGORY_COLORS).map(([category, colors]) => {
                              const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                              return (
                                <motion.button
                                  key={category}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                                    selectedCategory === category
                                      ? colors
                                      : 'bg-background border border-border text-muted-foreground hover:border-primary hover:text-primary'
                                  }`}
                                >
                                  <IconComponent className="w-3 h-3 mr-1" />
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      <form onSubmit={handleSubmit} className="flex gap-3">
                        <div className="flex-1 relative">
                          <Textarea
                            ref={textareaRef}
                            value={inputMessage}
                            onChange={handleInputChange}
                            placeholder="Ask me about your career... (e.g., interview prep, resume tips, salary negotiation)"
                            className="min-h-[48px] max-h-32 resize-none bg-background/90 backdrop-blur-sm border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 pr-12 rounded-lg shadow-sm"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                              }
                            }}
                          />

                          {/* Character count and typing indicator */}
                          <div className="absolute right-3 bottom-3 flex items-center gap-2">
                            {inputMessage.trim() && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-xs text-muted-foreground"
                              >
                                {inputMessage.trim().length}/500
                              </motion.span>
                            )}
                          </div>
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            type="submit"
                            size="lg"
                            disabled={!inputMessage.trim() || isLoading}
                            className="px-5 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg border-0"
                          >
                            {isLoading ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Send className="h-4 w-4" />
                              </motion.div>
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </Button>
                        </motion.div>
                      </form>

                      <div className="flex items-center justify-between mt-3 px-1">
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Briefcase className="h-3 w-3 text-primary" />
                            Career-focused AI assistant
                          </p>
                          {selectedCategory && (
                            <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                              <React.createElement(CATEGORY_ICONS[selectedCategory as keyof typeof CATEGORY_ICONS], { className: "w-3 h-3 mr-1" })}
                              {selectedCategory}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">Enter</kbd>
                          <span>to send</span>
                          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs ml-1">Shift+Enter</kbd>
                          <span>for new line</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      </>
    </TooltipProvider>
  );
}
