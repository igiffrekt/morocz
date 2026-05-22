import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Jogosulatlan hozzáférés." }, { status: 403 });
  }

  const services = await getWriteClient().fetch<Array<{ _id: string; name: string; price: number | null }>>(
    `*[_type == "service" && isHidden != true] | order(order asc) { _id, name, price }`,
  );

  return Response.json({ services });
}
