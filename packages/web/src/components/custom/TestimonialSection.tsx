"use client";
import { motion } from "framer-motion";
import { TestimonialCarousel } from "@/components/ui/testimonial-carousel";

const testimonials = [
  {
    id: "1",
    name: "Aarav Sharma",
    role: "Software Engineer",
    company: "Google",
    avatar: "/testimonials/aarav.svg",
    content: "Hireall saved me weeks of searching. I landed offers within days using their Chrome extension. The sponsored job detection is incredibly accurate!",
    rating: 5,
  },
  {
    id: "2",
    name: "Priya Kapoor",
    role: "Data Analyst",
    company: "Amazon",
    avatar: "/testimonials/priya.svg",
    content: "The sponsored job detection is genius. I finally stopped wasting time on irrelevant listings. The CV evaluator helped me improve my resume by 40 points!",
    rating: 5,
  },
  {
    id: "3",
    name: "Rohan Mehta",
    role: "UI/UX Designer",
    company: "Microsoft",
    avatar: "/testimonials/rohan.svg",
    content: "The premium analytics gave me a huge advantage in my job hunt. The job tracking feature was a game-changer for me. Highly recommend!",
    rating: 5,
  },
  {
    id: "4",
    name: "Sofia Rodriguez",
    role: "Product Manager",
    company: "Meta",
    avatar: "/testimonials/sofia.svg",
    content: "As an international student, finding sponsored roles was challenging. Hireall made it so much easier to identify companies that would actually sponsor my visa.",
    rating: 5,
  },
  {
    id: "5",
    name: "James Chen",
    role: "Backend Developer",
    company: "Stripe",
    avatar: "/testimonials/james.svg",
    content: "The job tracking feature is amazing. I can manage all my applications in one place and get real-time updates on my progress.",
    rating: 5,
  },
];

export default function TestimonialSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl font-serif">
            What Our Users Say
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Real stories from people who landed their dream jobs with Hireall
          </p>
        </motion.div>

        {/* Testimonial Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <TestimonialCarousel
            testimonials={testimonials}
            autoPlay={true}
            showDots={true}
            showArrows={false}
          />
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
        >
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">500K+</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">4.9/5</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">95%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
