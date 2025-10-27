"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How does Hireall detect sponsored jobs?",
    a: "Our Chrome extension uses advanced algorithms to identify when companies are paying to promote their job listings across LinkedIn, Indeed, Glassdoor, and other major job sites. We analyze various signals including placement, labels, and company patterns.",
  },
  {
    q: "Is Hireall free to use?",
    a: "Yes! Hireall offers a generous free tier that includes sponsored job detection, basic application tracking, and the Chrome extension. Premium features like advanced analytics and unlimited CV evaluations are available in our paid plans.",
  },
  {
    q: "Which job sites does Hireall work with?",
    a: "Hireall currently supports LinkedIn, Indeed, Glassdoor, ZipRecruiter, and Monster. We're constantly adding support for more job sites based on user feedback. The extension automatically activates when you visit supported sites.",
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
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl font-serif">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Everything you need to know about Hireall
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-0 shadow-sm">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline px-6">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground px-6">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
