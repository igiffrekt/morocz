import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const writeClient = vi.hoisted(() => ({
  fetch: vi.fn(),
  create: vi.fn(),
  createIfNotExists: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("@/lib/sanity-write-client", () => ({ getWriteClient: () => writeClient }));
vi.mock("@/lib/google-calendar", () => ({ createCalendarEvent: vi.fn() }));

import { POST } from "./route";

// Chainable patch builder: .set().ifRevisionId().commit()
function makePatch(commit = () => Promise.resolve({})) {
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn(() => chain);
  chain.ifRevisionId = vi.fn(() => chain);
  chain.commit = vi.fn(commit);
  return chain;
}

function req() {
  return new Request("http://localhost/api/admin/booking-create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patientName: "Teszt Anna",
      patientEmail: "anna@example.com",
      patientPhone: "+36701234567",
      serviceId: "svc-1",
      slotDate: "2026-10-27",
      slotTime: "09:40",
    }),
  });
}

beforeEach(() => {
  getSession.mockReset().mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
  writeClient.fetch.mockReset();
  writeClient.create.mockReset().mockResolvedValue({ _id: "booking-new" });
  writeClient.createIfNotExists.mockReset().mockResolvedValue({});
  writeClient.patch.mockReset().mockImplementation(() => makePatch());
});

describe("POST /api/admin/booking-create", () => {
  it("rejects a slot that already has a confirmed booking", async () => {
    writeClient.fetch.mockResolvedValueOnce({
      lock: { _rev: "r1", status: "booked", heldUntil: null },
      existing: { patientName: "Putnokiné Berki Tímea" },
    });

    const res = await POST(req());

    expect(res.status).toBe(409);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("Putnokiné Berki Tímea");
    expect(writeClient.create).not.toHaveBeenCalled();
    expect(writeClient.patch).not.toHaveBeenCalled();
  });

  it("rejects a confirmed booking even when its lock was wrongly released", async () => {
    writeClient.fetch.mockResolvedValueOnce({
      lock: { _rev: "r1", status: "available", heldUntil: null },
      existing: { patientName: "Teszt Béla" },
    });

    const res = await POST(req());

    expect(res.status).toBe(409);
    expect(writeClient.create).not.toHaveBeenCalled();
  });

  it("rejects a slot a patient is actively holding", async () => {
    writeClient.fetch.mockResolvedValueOnce({
      lock: {
        _rev: "r1",
        status: "held",
        heldUntil: new Date(Date.now() + 60_000).toISOString(),
      },
      existing: null,
    });

    const res = await POST(req());

    expect(res.status).toBe(409);
    expect(writeClient.create).not.toHaveBeenCalled();
  });

  it("returns 409 when a patient wins the race for the lock", async () => {
    writeClient.fetch.mockResolvedValueOnce({
      lock: { _rev: "r1", status: "available", heldUntil: null },
      existing: null,
    });
    writeClient.patch.mockImplementationOnce(() =>
      makePatch(() => Promise.reject(new Error("revision mismatch"))),
    );

    const res = await POST(req());

    expect(res.status).toBe(409);
    expect(writeClient.create).not.toHaveBeenCalled();
  });

  it("books a free slot, including one whose hold has expired", async () => {
    writeClient.fetch.mockResolvedValueOnce({
      lock: {
        _rev: "r1",
        status: "held",
        heldUntil: new Date(Date.now() - 60_000).toISOString(),
      },
      existing: null,
    });

    const res = await POST(req());

    expect(res.status).toBe(201);
    const chain = writeClient.patch.mock.results[0]?.value as Record<
      string,
      ReturnType<typeof vi.fn>
    >;
    expect(chain.ifRevisionId).toHaveBeenCalledWith("r1");
    expect(chain.set).toHaveBeenCalledWith({ status: "booked" });
    expect(writeClient.create).toHaveBeenCalledWith(
      expect.objectContaining({ slotDate: "2026-10-27", slotTime: "09:40", createdByAdmin: true }),
    );
  });
});
