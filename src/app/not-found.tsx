import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Oldal nem található",
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <p
        className="text-[8rem] md:text-[12rem] font-extrabold text-primary/10 leading-none select-none"
        aria-hidden="true"
      >
        404
      </p>
      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">Az oldal nem található</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        A keresett oldal nem létezik, vagy áthelyezésre került.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-accent text-primary font-bold hover:bg-accent/80 transition-colors"
      >
        Vissza a főoldalra
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
