"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const faqs = [
  {
    q: "How does Jobloom detect sponsored jobs?",
    a: "Our Chrome extension uses advanced algorithms to identify when companies are paying to promote their job listings across LinkedIn, Indeed, Glassdoor, and other major job sites. We analyze various signals including placement, labels, and company patterns.",
  },
  {
    q: "Is Jobloom free to use?",
    a: "Yes! Jobloom offers a generous free tier that includes sponsored job detection, basic application tracking, and the Chrome extension. Premium features like advanced analytics and unlimited CV evaluations are available in our paid plans.",
  },
  {
    q: "Which job sites does Jobloom work with?",
    a: "Jobloom currently supports LinkedIn, Indeed, Glassdoor, ZipRecruiter, and Monster. We're constantly adding support for more job sites based on user feedback. The extension automatically activates when you visit supported sites.",
  },
  {
    q: "Is my job search data private?",
    a: "Absolutely. We take privacy seriously. Your job search data is encrypted and stored securely. We never share your information with employers or third parties. You have full control over your data and can delete it at any time.",
  },
  {
    q: "How accurate is the sponsored job detection?",
    a: "Our detection algorithm has over 95% accuracy in identifying sponsored listings. We continuously improve our detection methods and update the extension regularly to maintain high accuracy across all supported job sites.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Everything you need to know about Jobloom
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <Card
              key={i}
              onClick={() => toggleFAQ(i)}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">{faq.q}</CardTitle>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {openIndex === i ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </motion.div>
              </CardHeader>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <CardContent>
                      <p className="text-gray-600">{faq.a}</p>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
