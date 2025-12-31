"use client";

import { useEffect } from "react";
import { useApiMutation } from "../../hooks/useApi";
import { contactApi } from "../../utils/api/contact";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";
import { Loader2, Mail, MessageSquare, Send, User } from "lucide-react";
import { analytics } from "@/firebase/analytics";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

// Zod schema for form validation
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters long")
    .max(1000, "Message must be less than 1000 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const toast = useToast();
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

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;
  const messageValue = form.watch("message");

  useEffect(() => {
    analytics.logPageView("/contact", "Contact");
    analytics.logFeatureUsed("contact_page_visit");
  }, []);

  const handleSubmit = async (values: ContactFormValues) => {
    try {
      await createContact(values);
      analytics.logGoalCompleted("contact", "contact_form_submitted");
      toast.success("Message sent! We'll get back to you soon.");
      form.reset();
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Contact form error:", error);
      analytics.logError("contact_form_failed", error?.message || "unknown_error");
      
      // Provide more specific error messages
      if (error?.message?.includes("400")) {
        toast.error("Invalid form data. Please check your inputs and try again.");
      } else if (error?.message?.includes("500")) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error("Failed to send message. Please try again later.");
      }
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
        <Card variant="premium-elevated" className="border-0 bg-surface p-8">
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-semibold text-foreground">Name</FormLabel>
                        <div className="relative group">
                          <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-premium" />
                          <FormControl>
                            <Input
                              {...field}
                              className="input-premium pl-12 h-12"
                              placeholder="Your name"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-semibold text-foreground">Email</FormLabel>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-premium" />
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              className="input-premium pl-12 h-12"
                              placeholder="you@example.com"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-semibold text-foreground">
                          Message
                          <span className="text-xs font-normal text-muted-foreground ml-2">
                            ({messageValue?.length || 0}/1000)
                          </span>
                        </FormLabel>
                        <div className="relative group">
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={5}
                              maxLength={1000}
                              placeholder="Please describe your question or feedback in detail..."
                              className="input-premium min-h-[120px] resize-y p-4"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                        {messageValue && messageValue.length > 900 && (
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-amber-500 font-medium"
                          >
                            {messageValue.length > 1000 ? "Maximum length exceeded." : "Almost at character limit."}
                          </motion.p>
                        )}
                      </FormItem>
                    )}
                  />

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <LoadingButton
                      type="submit"
                      loading={isSubmitting}
                      disabled={!isValid}
                      variant="premium"
                      className="w-full h-12 text-base"
                      size="lg"
                      loadingIcon={<Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      loadingText="Sending..."
                    >
                      <div className="flex items-center justify-center">
                        <Send className="mr-2 h-4 w-4" />
                        <span>Send Message</span>
                      </div>
                    </LoadingButton>
                  </motion.div>
                </form>
              </Form>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
