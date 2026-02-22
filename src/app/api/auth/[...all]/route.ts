import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Opt out of static generation — auth routes are always dynamic
export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler(auth);
