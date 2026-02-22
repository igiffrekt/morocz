import { createClient } from "@sanity/client";

let _writeClient: ReturnType<typeof createClient> | null = null;

export function getWriteClient() {
  if (!_writeClient) {
    _writeClient = createClient({
      // biome-ignore lint/style/noNonNullAssertion: Required at runtime
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      // biome-ignore lint/style/noNonNullAssertion: Required at runtime
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01",
      token: process.env.SANITY_WRITE_TOKEN,
      useCdn: false,
    });
  }
  return _writeClient;
}
