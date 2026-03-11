"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface BookingContextType {
  slotDate: string | null;
  slotTime: string | null;
  slotLockId: string | null;
  heldUntil: string | null;
  isExpired: boolean;
  secondsRemaining: number;
  setSlotSelection: (date: string, time: string, lockId: string, heldUntil: string) => void;
  clearSlotSelection: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [slotDate, setSlotDate] = useState<string | null>(null);
  const [slotTime, setSlotTime] = useState<string | null>(null);
  const [slotLockId, setSlotLockId] = useState<string | null>(null);
  const [heldUntil, setHeldUntil] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!heldUntil) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiresAt = new Date(heldUntil).getTime();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

      setSecondsRemaining(remaining);

      if (remaining === 0) {
        setIsExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [heldUntil]);

  const setSlotSelection = (date: string, time: string, lockId: string, until: string) => {
    setSlotDate(date);
    setSlotTime(time);
    setSlotLockId(lockId);
    setHeldUntil(until);
    setIsExpired(false);
    setSecondsRemaining(300); // 5 minutes
  };

  const clearSlotSelection = () => {
    setSlotDate(null);
    setSlotTime(null);
    setSlotLockId(null);
    setHeldUntil(null);
    setIsExpired(false);
    setSecondsRemaining(0);
  };

  return (
    <BookingContext.Provider
      value={{
        slotDate,
        slotTime,
        slotLockId,
        heldUntil,
        isExpired,
        secondsRemaining,
        setSlotSelection,
        clearSlotSelection,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within BookingProvider");
  }
  return context;
}
