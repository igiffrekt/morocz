"use client";

import { createContext, type ReactNode, useContext } from "react";

export interface SiteContact {
  phone: string;
  email: string;
  address: string;
}

const SiteContactContext = createContext<SiteContact | null>(null);

/** Makes the Sanity contact details available to client chrome (action bar, menus). */
export function SiteContactProvider({
  value,
  children,
}: {
  value: SiteContact;
  children: ReactNode;
}) {
  return <SiteContactContext.Provider value={value}>{children}</SiteContactContext.Provider>;
}

export function useSiteContact(): SiteContact | null {
  return useContext(SiteContactContext);
}
