import { auth } from "@/lib/auth";
import { isFeeExemptUser } from "@/lib/fee-exemption";
import { headers } from "next/headers";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return Response.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      },
      // Server-decided booking-fee waiver for this account (display only — the
      // checkout re-decides it from the session and never trusts the client).
      feeExempt: isFeeExemptUser(session.user),
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return Response.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}