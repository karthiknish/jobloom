"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useApiMutation } from "../../hooks/useApi";
import { contactApi } from "../../utils/api/contact";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Loader2, Mail, MessageSquare, Send, User } from "lucide-react";

export default function ContactPage() {
  const { mutate: createContact } = useApiMutation(
    (variables: Record<string, unknown>) => {
      const { name, email, message } = variables;
      return contactApi.createContact({
        name: name as string,
        email: email as string,
        message: message as string
      });
    }
  );
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic client-side validation
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // Message length validation
    if (message.trim().length < 10) {
      toast.error("Message must be at least 10 characters long.");
      return;
    }

    if (message.trim().length > 1000) {
      toast.error("Message must be less than 1000 characters.");
      return;
    }

    setLoading(true);
    try {
      await createContact({ name, email, message });
      toast.success("Message sent! We'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      console.error("Contact form error:", err);
      
      // Provide more specific error messages
      if (err?.message?.includes("400")) {
        toast.error("Invalid form data. Please check your inputs and try again.");
      } else if (err?.message?.includes("500")) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error("Failed to send message. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-24 bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/2 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/2 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg sm:max-w-xl space-y-8 relative z-10"
      >
        <Card className="card-premium-elevated border-0 bg-surface p-8">
          <CardHeader className="space-y-4 text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4"
            >
              <MessageSquare className="h-8 w-8" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <CardTitle className="text-3xl font-bold text-gradient-premium">Contact Us</CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <CardDescription className="text-muted-foreground text-lg">
                Have a question or feedback? Fill out the form below and we&apos;ll get
                back to you within 24 hours.
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-semibold text-foreground">Name</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-premium" />
                  <Input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-premium pl-12 h-12"
                    placeholder="Your name"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-premium" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-premium pl-12 h-12"
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="message" className="text-sm font-semibold text-foreground">
                  Message
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    ({message.length}/1000)
                  </span>
                </Label>
                <div className="relative group">
                  <Textarea
                    id="message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={1000}
                    placeholder="Please describe your question or feedback in detail..."
                    className="input-premium min-h-[120px] resize-y p-4"
                    disabled={loading}
                  />
                </div>
                {message.length > 900 && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-amber-500 dark:text-amber-400 font-medium"
                  >
                    {message.length > 1000 ? "Maximum length exceeded." : "Almost at character limit."}
                  </motion.p>
                )}
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-premium w-full h-12 font-bold gradient-primary hover:shadow-premium-xl text-base"
                  size="lg"
                >
                  {loading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center"
                    >
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      <span>Send Message</span>
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </motion.form>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
