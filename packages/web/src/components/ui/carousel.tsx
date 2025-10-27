"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface CarouselProps {
  children: React.ReactNode
  className?: string
  autoPlay?: boolean
  interval?: number
  showDots?: boolean
  showArrows?: boolean
}

interface CarouselContextValue {
  currentIndex: number
  itemCount: number
  goToSlide: (index: number) => void
  nextSlide: () => void
  prevSlide: () => void
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

export function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error("useCarousel must be used within a CarouselProvider")
  }
  return context
}

export const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ children, className, autoPlay = false, interval = 3000, showDots = true, showArrows = true, ...props }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [itemCount, setItemCount] = React.useState(0)
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

    const items = React.useMemo(() => {
      return React.Children.toArray(children).filter(React.isValidElement)
    }, [children])

    React.useEffect(() => {
      setItemCount(items.length)
    }, [items.length])

    const goToSlide = React.useCallback((index: number) => {
      const validIndex = Math.max(0, Math.min(index, itemCount - 1))
      setCurrentIndex(validIndex)
    }, [itemCount])

    const nextSlide = React.useCallback(() => {
      setCurrentIndex((prev) => (prev + 1) % itemCount)
    }, [itemCount])

    const prevSlide = React.useCallback(() => {
      setCurrentIndex((prev) => (prev - 1 + itemCount) % itemCount)
    }, [itemCount])

    // Auto-play functionality
    React.useEffect(() => {
      if (autoPlay && itemCount > 1) {
        intervalRef.current = setInterval(nextSlide, interval)
        return () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
        }
      }
    }, [autoPlay, interval, itemCount, nextSlide])

    const contextValue = React.useMemo(() => ({
      currentIndex,
      itemCount,
      goToSlide,
      nextSlide,
      prevSlide,
    }), [currentIndex, itemCount, goToSlide, nextSlide, prevSlide])

    return (
      <CarouselContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("relative w-full overflow-hidden", className)}
          {...props}
        >
          <div className="flex transition-transform duration-300 ease-in-out"
               style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {children}
          </div>
          
          {showArrows && itemCount > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white h-8 w-8 rounded-full shadow-lg"
                onClick={prevSlide}
                disabled={itemCount <= 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="sr-only">Previous slide</span>
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white h-8 w-8 rounded-full shadow-lg"
                onClick={nextSlide}
                disabled={itemCount <= 1}
              >
                <ChevronRightIcon className="h-4 w-4" />
                <span className="sr-only">Next slide</span>
              </Button>
            </>
          )}
          
          {showDots && itemCount > 1 && (
            <div className="flex gap-2 justify-center mt-4">
              {Array.from({ length: itemCount }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-200",
                    index === currentIndex
                      ? "bg-primary"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

export const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-shrink-0 w-full", className)}
    {...props}
  />
))
CarouselContent.displayName = "CarouselContent"

export const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-shrink-0 w-full", className)}
    {...props}
  />
))
CarouselItem.displayName = "CarouselItem"
