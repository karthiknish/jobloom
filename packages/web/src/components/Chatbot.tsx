"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Minimize2, Bot, User, History, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showError } from "@/components/ui/Toast";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  content: "👋 Hi! I'm Jobloom AI, your personal career assistant. I specialize in helping with job search strategies, interview preparation, resume optimization, salary negotiation, and career planning. Ask me anything about your professional journey!",
  role: 'assistant',
  timestamp: new Date()
};

const SUGGESTED_QUESTIONS = [
  "How do I prepare for a software engineering interview?",
  "What should I include in my resume?",
  "How do I negotiate my salary?",
  "How can I improve my LinkedIn profile?",
  "What skills should I learn for a career in tech?"
];

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Message persistence keys
  const CHAT_HISTORY_KEY = 'jobloom_chat_history';
  const CHAT_SESSIONS_KEY = 'jobloom_chat_sessions';

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = () => {
      try {
        const savedHistory = localStorage.getItem(CHAT_SESSIONS_KEY);
        const savedCurrent = localStorage.getItem(CHAT_HISTORY_KEY);

        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          // Convert timestamp strings back to Date objects
          const historyWithDates = parsedHistory.map((session: Message[]) =>
            session.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          );
          setChatHistory(historyWithDates);
        }

        if (savedCurrent) {
          const parsedCurrent = JSON.parse(savedCurrent);
          // Convert timestamp strings back to Date objects
          const currentWithDates = parsedCurrent.map((msg: Message) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(currentWithDates);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        // Reset to default if loading fails
        setMessages([WELCOME_MESSAGE]);
      }
    };

    loadChatHistory();
  }, []);

  // Save current chat session to localStorage
  useEffect(() => {
    const saveCurrentChat = () => {
      try {
        if (messages.length > 1) { // Only save if there are actual messages (beyond welcome)
          localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        }
      } catch (error) {
        console.error('Failed to save current chat:', error);
      }
    };

    saveCurrentChat();
  }, [messages]);

  // Save chat history to localStorage when history changes
  useEffect(() => {
    const saveChatHistory = () => {
      try {
        localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(chatHistory));
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    };

    saveChatHistory();
  }, [chatHistory]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          context: user ? `User is signed in with email: ${user.email}` : 'User is not signed in'
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
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      showError('Sorry, I\'m having trouble connecting. Please try again.');

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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

  return (
    <>
      {/* Floating Chat Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 sm:bottom-6 sm:right-6 z-[100]"
      >
        <Button
          onClick={toggleChat}
          size="lg"
          className={`rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 hover:scale-105 ${
            !isOpen ? 'animate-pulse' : ''
          }`}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? '60px' : 'min(520px, calc(100vh - 120px))'
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-20 right-4 left-4 sm:bottom-24 sm:right-6 sm:left-auto w-auto sm:w-96 max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3rem)] max-h-[calc(100vh-100px)] bg-background border border-border rounded-xl shadow-2xl z-[100] overflow-hidden backdrop-blur-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 ring-2 ring-white/20">
                  <AvatarFallback className="bg-white/30 text-primary-foreground font-bold">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">Jobloom AI</h3>
                  <p className="text-xs opacity-90">Your Career Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full transition-colors duration-200"
                  title="Chat history"
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMinimize}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full transition-colors duration-200"
                  title="Minimize chat"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleChat}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full transition-colors duration-200"
                  title="Close chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-[calc(100%-80px)]"
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
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {message.role === 'assistant' && (
                              <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary border border-primary/20">
                                  <Bot className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground ml-4'
                                  : 'bg-muted/50 text-foreground border border-border/50'
                              }`}
                            >
                              {message.content}
                            </div>
                            {message.role === 'user' && (
                              <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                                <AvatarFallback className="bg-secondary text-secondary-foreground">
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
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

                        {/* Suggested Questions */}
                        {messages.length === 1 && !isLoading && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mt-4 space-y-3"
                          >
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground font-medium mb-2">💡 Quick suggestions</p>
                              <div className="grid grid-cols-1 gap-2">
                                {SUGGESTED_QUESTIONS.map((question, index) => (
                                  <motion.button
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.6 + index * 0.1 }}
                                    className="text-left p-3 bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/30 rounded-lg text-sm text-foreground transition-all duration-200 hover:shadow-sm"
                                    onClick={() => handleSuggestedQuestion(question)}
                                  >
                                    {question}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </ScrollArea>
                  )}

                  {/* Input - Hide when viewing history */}
                  {!showHistory && (
                    <div className="border-t border-border/50 bg-muted/20 p-4">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                      <Textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask me about your career..."
                        className="min-h-[44px] max-h-32 resize-none bg-background border-border/50 focus:border-primary/50 transition-colors"
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!inputMessage.trim() || isLoading}
                        className="px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-muted-foreground">
                        💼 Career-focused AI assistant
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Press Enter to send</span>
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
  );
}
