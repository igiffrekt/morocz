"use client";

import { ArrowRight } from "lucide-react";

interface CTAButtonProps {
  text: string;
  href: string;
}

export function CTAButton({ text, href }: CTAButtonProps) {
  return (
    <a
      href={href}
      className="group relative inline-flex items-center"
    >
      {/* Left icon circle - appears on hover */}
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-[#e1bbcd] text-primary rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]">
        <ArrowRight className="w-6 h-6" strokeWidth={2.5} />
      </span>

      {/* Text - slides right on hover */}
      <span className="inline-flex items-center h-14 rounded-full bg-[#e1bbcd] text-primary px-8 font-bold text-sm whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:translate-x-14">
        {text}
      </span>

      {/* Right icon circle - disappears on hover */}
      <span className="w-14 h-14 flex items-center justify-center bg-[#e1bbcd] text-primary rounded-full shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-0">
        <ArrowRight className="w-6 h-6" strokeWidth={2.5} />
      </span>
    </a>
  );
}
