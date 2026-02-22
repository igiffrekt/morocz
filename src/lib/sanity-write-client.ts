import { createClient } from "@sanity/client";

let _writeClient: ReturnType<typeof createClient> | null = null;

export function getWriteClient() {
  if (!_writeClient) {
    const token = process.env.SANITY_WRITE_TOKEN ?? process.env.SANITY_API_TOKEN;
    if (!token) {
      throw new Error("[sanity-write-client] Missing SANITY_WRITE_TOKEN or SANITY_API_TOKEN env var");
    }
    _writeClient = createClient({
      // biome-ignore lint/style/noNonNullAssertion: Required at runtime
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      // biome-ignore lint/style/noNonNullAssertion: Required at runtime
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01",
      token,
      useCdn: false,
    });
  }
  return _writeClient;
}
