"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Bot, User, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showError } from "@/components/ui/Toast";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, getFirestore } from "firebase/firestore";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  content: "Hi! I'm Hireall AI, your career assistant. I can help with interview prep, resume tips, salary negotiation, and career advice. How can I help you today?",
  role: 'assistant',
  timestamp: new Date()
};

const SUGGESTED_QUESTIONS = [
  "How do I prepare for an interview?",
  "What should I include in my resume?",
  "How do I negotiate salary?",
  "What skills should I learn for tech?"
];

const sanitizeAssistantContent = (text: string): string => {
  if (!text) {
    return "";
  }

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
  const [emailRequired, setEmailRequired] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Simple scroll to bottom function
  const scrollToBottom = () => {
    if (!scrollAreaRef.current) return;
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (!viewport) return;

    setTimeout(() => {
      viewport.scrollTop = viewport.scrollHeight;
    }, 100);
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Save conversation to Firebase
  const saveMessageToFirebase = async (message: Message) => {
    if (!conversationId || !userEmail) return;

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

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Check if user is signed in, otherwise ask for email
    if (!user && !userEmail) {
      setEmailRequired(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Create conversation if it doesn't exist
    if (!conversationId) {
      const newConversationId = Date.now().toString();
      setConversationId(newConversationId);

      // Save conversation metadata
      try {
        const db = getFirestore();
        await addDoc(collection(db, 'conversations'), {
          id: newConversationId,
          userEmail: user?.email || userEmail,
          userId: user?.uid || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    }

    // Save user message to Firebase
    await saveMessageToFirebase(userMessage);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          context: user ? `User is signed in with email: ${user.email}` : `User email: ${userEmail}`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const sanitizedResponse = sanitizeAssistantContent(data.response);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: sanitizedResponse,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to Firebase
      await saveMessageToFirebase(assistantMessage);
    } catch (error) {
      console.error('Chatbot error:', error);
      showError('Connection failed', 'Unable to connect to AI assistant. Please try again.');

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

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userEmail.trim()) {
      setEmailRequired(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleChat}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      </div>

          {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 top-24 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-background border border-border rounded-lg shadow-lg flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-primary text-primary-foreground">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary-foreground/20">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Hireall AI</h3>
              <p className="text-xs opacity-90">Career Assistant</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleChat}
              className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Email Requirement */}
          {emailRequired && (
            <div className="flex-1 p-4 flex items-center justify-center">
              <div className="bg-muted rounded-lg p-6 w-full max-w-sm">
                <h3 className="font-semibold mb-2 text-center">Enter Your Email</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Please provide your email to start chatting with our AI assistant
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEmailRequired(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Start Chat
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Messages */}
          {!emailRequired && (
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isAssistant = message.role === 'assistant';
                  const displayContent = isAssistant ? sanitizeAssistantContent(message.content) : message.content;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {isAssistant && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {displayContent}
                      </div>
                      {message.role === 'user' && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggested Questions */}
                {messages.length === 1 && !isLoading && (
                  <div className="mt-6">
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-3">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-primary">Quick Questions</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {SUGGESTED_QUESTIONS.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestedQuestion(question)}
                          className="w-full text-left p-3 bg-card border border-border hover:bg-muted rounded-lg text-sm transition-colors"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Input */}
          {!emailRequired && (
            <div className="border-t border-border p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me about your career..."
                  className="min-h-[40px] max-h-32 resize-none"
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
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <div className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
