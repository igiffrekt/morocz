"use client"

import * as React from "react"
import { motion, PanInfo } from "framer-motion"

// Simple cn utility (clsx + tailwind-merge alternative)
function cn(...classes: (string | undefined | null | Record<string, boolean>)[]): string {
  return classes
    .flat()
    .filter((item) => typeof item === 'string')
    .join(' ')
}

export interface Testimonial {
 id: number | string
 name: string
 avatar: string
 description: string
}

interface TestimonialCarouselProps
 extends React.HTMLAttributes<HTMLDivElement> {
 testimonials: Testimonial[]
 showArrows?: boolean
 showDots?: boolean
}

const TestimonialCarousel = React.forwardRef<
 HTMLDivElement,
 TestimonialCarouselProps
>(
 (
 { className, testimonials, showArrows = true, showDots = true, ...props },
 ref,
 ) => {
 const [currentIndex, setCurrentIndex] = React.useState(0)
 const [exitX, setExitX] = React.useState<number>(0)

 const handleDragEnd = (
 event: MouseEvent | TouchEvent | PointerEvent,
 info: PanInfo,
 ) => {
 if (Math.abs(info.offset.x) > 100) {
 setExitX(info.offset.x)
 setTimeout(() => {
 setCurrentIndex((prev) => (prev + 1) % testimonials.length)
 setExitX(0)
 }, 200)
 }
 }

 const goNext = () => {
 setCurrentIndex((prev) => (prev + 1) % testimonials.length)
 }

 const goPrev = () => {
 setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
 }

 return (
 <div
 ref={ref}
 className={cn(
 "w-full flex items-center justify-center py-6 md:py-8",
 className
 )}
 {...props}
 >
 <div className="relative w-full h-72">
 {testimonials.map((testimonial, index) => {
 const isCurrentCard = index === currentIndex
 const isPrevCard =
 index === (currentIndex - 1 + testimonials.length) % testimonials.length
 const isNextCard =
 index === (currentIndex + 1) % testimonials.length

 if (!isCurrentCard && !isPrevCard && !isNextCard) return null

 return (
 <motion.div
 key={testimonial.id}
 className={cn(
 "absolute w-full h-full rounded-2xl cursor-grab active:cursor-grabbing",
 "bg-white shadow-xl border border-gray-100",
 "dark:bg-card dark:shadow-[2px_2px_4px_rgba(0,0,0,0.4),-1px_-1px_3px_rgba(255,255,255,0.1)]",
 )}
 style={{
 zIndex: isCurrentCard ? 3 : isPrevCard ? 2 : 1,
 }}
 drag={isCurrentCard ? "x" : false}
 dragConstraints={{ left: 0, right: 0 }}
 dragElastic={0.7}
 onDragEnd={isCurrentCard ? handleDragEnd : undefined}
 initial={{
 scale: 0.95,
 opacity: 0,
 y: isCurrentCard ? 0 : isPrevCard ? -20 : -40,
 rotate: isCurrentCard ? 0 : isPrevCard ? 2 : 4,
 }}
 animate={{
 scale: isCurrentCard ? 1 : 0.95,
 opacity: isCurrentCard ? 1 : isPrevCard ? 0.6 : 0.3,
 x: isCurrentCard ? exitX : 0,
 y: isCurrentCard ? 0 : isPrevCard ? -20 : -40,
 rotate: isCurrentCard ? exitX / 20 : isPrevCard ? 2 : 4,
 }}
 transition={{
 type: "spring",
 stiffness: 300,
 damping: 20,
 }}
 >
 <div className="p-5 md:p-6 flex flex-col items-center gap-4 h-full justify-between">
 <img
 src={testimonial.avatar}
 alt={testimonial.name}
 className="w-16 h-16 rounded-full object-cover"
 />
 <div className="flex-1 flex flex-col items-center gap-2.5">
 <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-foreground text-center">
 {testimonial.name}
 </h3>
 <p className="text-center text-sm text-gray-600 dark:text-muted-foreground leading-relaxed">
 {testimonial.description}
 </p>
 </div>


 </div>
 </motion.div>
 )
 })}
 {showDots && (
 <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-2">
 {testimonials.map((_, index) => (
 <button
 key={index}
 onClick={() => setCurrentIndex(index)}
 aria-label={`Vélemény ${index + 1}`}
 className={cn(
 "w-1.5 h-1.5 rounded-full transition-colors cursor-pointer",
 index === currentIndex
 ? "bg-primary dark:bg-primary w-6 rounded-full"
 : "bg-gray-300 dark:bg-muted-foreground/30",
 )}
 />
 ))}
 </div>
 )}
 </div>
 </div>
 )
 },
)
TestimonialCarousel.displayName = "TestimonialCarousel"

export { TestimonialCarousel }
