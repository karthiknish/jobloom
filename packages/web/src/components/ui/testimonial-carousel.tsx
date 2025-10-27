"use client";

import React from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { Card, CardContent } from "./card";
import { Carousel, CarouselContent, CarouselItem } from "./carousel";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  className?: string;
  autoPlay?: boolean;
  showDots?: boolean;
  showArrows?: boolean;
}

export function TestimonialCarousel({
  testimonials,
  className,
  autoPlay = true,
  showDots = true,
  showArrows = false,
}: TestimonialCarouselProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={cn(
          "h-4 w-4",
          index < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-gray-200 text-gray-200"
        )}
      />
    ));
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <Carousel
        className="w-full"
        autoPlay={autoPlay}
        interval={5000}
        showDots={showDots}
        showArrows={showArrows}
      >
        <CarouselContent>
          {testimonials.map((testimonial) => (
            <CarouselItem key={testimonial.id}>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-6">
                    {/* Avatar */}
                    <div className="relative">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-lg"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-1">
                        <Star className="h-4 w-4 text-primary-foreground fill-current" />
                      </div>
                    </div>

                    {/* Content */}
                    <blockquote className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                      &ldquo;{testimonial.content}&rdquo;
                    </blockquote>

                    {/* Rating */}
                    <div className="flex justify-center space-x-1">
                      {renderStars(testimonial.rating)}
                    </div>

                    {/* Author Info */}
                    <div className="space-y-1">
                      <div className="font-semibold text-lg text-foreground">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                        {testimonial.company && (
                          <>
                            {" • "}
                            <span className="text-primary font-medium">
                              {testimonial.company}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
