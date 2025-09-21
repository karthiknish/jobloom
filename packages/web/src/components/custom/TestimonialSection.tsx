"use client";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { playfair } from "@/font";

const testimonials = [
  {
    name: "Aarav Sharma",
    role: "Software Engineer",
    text: "Jobloom saved me weeks of searching. I landed interviews within days using their Chrome extension.",
    image: "aarav.svg",
  },
  {
    name: "Priya Kapoor",
    role: "Data Analyst",
    text: "The sponsored job detection is genius. I finally stopped wasting time on irrelevant listings.",
    image: "priya.svg",
  },
  {
    name: "Rohan Mehta",
    role: "UI/UX Designer",
    text: "The premium analytics gave me a huge advantage in my job hunt. Highly recommend!",
    image: "rohan.svg",
  },
];

export default function TestimonialSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <h2
            className={`text-3xl font-bold text-gray-900 sm:text-4xl ${playfair.className}`}
          >
            What Our Users Say
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Real stories from people who landed their dream jobs with Jobloom
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="hover:shadow-lg transition-shadow rounded-2xl border border-gray-100">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={`/testimonials/${t.image}`}
                        alt={t.name}
                      />
                      <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{t.name}</h3>
                      <p className="text-sm text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{t.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
