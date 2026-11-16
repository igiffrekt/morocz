import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next/headers", () => ({ headers: vi.fn(() => Promise.resolve(new Headers())) }));

const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));

const getAvailableSlotsForDate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/availability", () => ({ getAvailableSlotsForDate }));

const assertDayStillOpen = vi.hoisted(() => vi.fn());
vi.mock("@/lib/booking-guards", () => ({ assertDayStillOpen }));

const writeClient = vi.hoisted(() => ({
  fetch: vi.fn(),
  createIfNotExists: vi.fn(),
  create: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/lib/sanity-write-client", () => ({ getWriteClient: () => writeClient }));

const sanityFetch = vi.hoisted(() => vi.fn());
vi.mock("@/sanity/lib/fetch", () => ({ sanityFetch }));

const generateAvailableSlots = vi.hoisted(() => vi.fn());
vi.mock("@/lib/slots", () => ({ generateAvailableSlots }));

const stripeCreate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/stripe", () => ({
  stripe: { checkout: { sessions: { create: stripeCreate } } },
  BOOKING_FEE_HUF: 5000,
}));

const findFirstUser = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ db: { query: { user: { findFirst: findFirstUser } } } }));

const runBookingConfirmedSideEffects = vi.hoisted(() => vi.fn());
vi.mock("@/lib/booking-confirmed", () => ({ runBookingConfirmedSideEffects }));

import { POST } from "./route";

function makePatch() {
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn(() => chain);
  chain.unset = vi.fn(() => chain);
  chain.ifRevisionId = vi.fn(() => chain);
  chain.commit = vi.fn(() => Promise.resolve({}));
  return chain;
}

function req(body: unknown) {
  return new Request("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  serviceId: "svc-1",
  slotDate: "2026-06-30",
  slotTime: "14:00",
  patientName: "Teszt Anna",
  patientEmail: "anna@example.com",
  patientPhone: "+36301234567",
};

beforeEach(() => {
  getSession.mockReset().mockResolvedValue({ user: { id: "user-1" } });
  assertDayStillOpen.mockReset().mockResolvedValue(null);
  getAvailableSlotsForDate.mockReset();
  writeClient.fetch.mockReset();
  writeClient.createIfNotExists.mockReset().mockResolvedValue({});
  writeClient.create.mockReset().mockResolvedValue({ _id: "booking-1" });
  writeClient.patch.mockReset().mockImplementation(() => makePatch());
  writeClient.delete.mockReset().mockResolvedValue({});
  sanityFetch.mockReset().mockImplementation(({ tags }: { tags: string[] }) => {
    const tag = tags[0];
    if (tag === "booking" || tag === "slotLock") return Promise.resolve([]);
    if (tag === "weeklySchedule") return Promise.resolve({ days: [] });
    if (tag === "blockedDate") return Promise.resolve({ dates: [] });
    if (tag === "service")
      return Promise.resolve({ name: "Vizsgálat", appointmentDuration: 20, price: 0 });
    return Promise.resolve(null);
  });
  generateAvailableSlots.mockReset().mockReturnValue([]);
  findFirstUser.mockReset().mockResolvedValue(null);
  runBookingConfirmedSideEffects.mockReset().mockResolvedValue(undefined);
  stripeCreate
    .mockReset()
    .mockResolvedValue({ id: "cs_test_1", url: "https://stripe.test/cs_test_1" });
});

describe("POST /api/checkout — slot window validation", () => {
  it("rejects a slot outside the day's allowed window with 409, no booking, no Stripe session", async () => {
    getAvailableSlotsForDate.mockResolvedValue({
      slots: ["08:40", "09:00", "12:20"],
      serviceName: "Vizsgálat",
      durationMinutes: 20,
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(409);
    expect(getAvailableSlotsForDate).toHaveBeenCalledWith("2026-06-30", "svc-1", undefined, {
      ignoreOccupancy: true,
    });
    expect(writeClient.create).not.toHaveBeenCalled();
    expect(stripeCreate).not.toHaveBeenCalled();
  });

  it("proceeds to create a Stripe session when the slot is within the window", async () => {
    getAvailableSlotsForDate.mockResolvedValue({
      slots: ["08:40", "09:00", "14:00"],
      serviceName: "Vizsgálat",
      durationMinutes: 20,
    });
    writeClient.fetch.mockResolvedValueOnce(null).mockResolvedValueOnce({
      _id: "slotLock-2026-06-30-14-00",
      _rev: "r1",
      status: "available",
      heldUntil: null,
      userId: null,
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(201);
    expect(stripeCreate).toHaveBeenCalledTimes(1);
    const json = (await res.json()) as { checkoutUrl: string };
    expect(json.checkoutUrl).toBe("https://stripe.test/cs_test_1");
  });
});

describe("POST /api/checkout — booking-fee allowlist (FEE_EXEMPT_EMAILS)", () => {
  const lock = {
    _id: "slotLock-2026-06-30-14-00",
    _rev: "r1",
    status: "available",
    heldUntil: null,
    userId: null,
  };

  function slotIsBookable() {
    getAvailableSlotsForDate.mockResolvedValue({
      slots: ["13:40", "14:00"],
      serviceName: "Vizsgálat",
      durationMinutes: 20,
    });
    writeClient.fetch.mockResolvedValueOnce(null).mockResolvedValueOnce(lock);
  }

  function sessionFor(email: string, emailVerified = true) {
    getSession.mockResolvedValue({ user: { id: "user-1", email, emailVerified } });
  }

  /** Every `.set(...)` payload sent through writeClient.patch(...). */
  function patchSets(): Array<{ id: unknown; fields: unknown }> {
    return writeClient.patch.mock.calls.flatMap((call, i) => {
      const chain = writeClient.patch.mock.results[i]?.value as { set: ReturnType<typeof vi.fn> };
      return chain.set.mock.calls.map((args) => ({ id: call[0], fields: args[0] }));
    });
  }

  beforeEach(() => {
    vi.stubEnv("FEE_EXEMPT_EMAILS", "vip@example.com, other@example.org");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allowlisted verified account: confirms the booking without Stripe", async () => {
    sessionFor("VIP@Example.com");
    slotIsBookable();

    const res = await POST(req({ ...validBody, patientEmail: "vip@example.com" }));

    expect(res.status).toBe(201);
    const json = (await res.json()) as {
      waived?: boolean;
      bookingId?: string;
      reservationNumber?: string;
      checkoutUrl?: string;
    };
    expect(json.waived).toBe(true);
    expect(json.bookingId).toBe("booking-1");
    expect(json.reservationNumber).toMatch(/^M-[A-Z0-9]{6}$/);
    expect(json.checkoutUrl).toBeUndefined();

    // No Stripe session at all (so no payment intent and no Számlázz invoice).
    expect(stripeCreate).not.toHaveBeenCalled();

    // Booking stored as final and marked fee-waived.
    expect(writeClient.create).toHaveBeenCalledTimes(1);
    const doc = writeClient.create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(doc).toMatchObject({
      _type: "booking",
      status: "confirmed",
      paymentStatus: "waived",
      paymentAmount: 0,
      userId: "user-1",
      reservationNumber: json.reservationNumber,
    });
    expect(typeof doc.managementToken).toBe("string");
    expect(doc).not.toHaveProperty("stripeSessionId");

    // Slot lock booked (optimistic lock) and linked to the booking.
    const sets = patchSets();
    expect(sets).toContainEqual({ id: lock._id, fields: { status: "booked" } });
    expect(sets).toContainEqual({
      id: lock._id,
      fields: { bookingRef: { _type: "reference", _ref: "booking-1" } },
    });
    // Never patched with a Stripe session id.
    expect(sets.some((s) => "stripeSessionId" in (s.fields as object))).toBe(false);

    // Same finalization as a successful payment: calendar event + confirmation email.
    expect(runBookingConfirmedSideEffects).toHaveBeenCalledTimes(1);
    expect(runBookingConfirmedSideEffects.mock.calls[0]?.[0]).toEqual({
      bookingId: "booking-1",
      reservationNumber: json.reservationNumber,
      managementToken: doc.managementToken,
      serviceId: "svc-1",
      slotDate: "2026-06-30",
      slotTime: "14:00",
      patientName: "Teszt Anna",
      patientEmail: "vip@example.com",
      patientPhone: "+36301234567",
      feeWaived: true,
    });
  });

  it("allowlisted account: a business-invoice request is ignored (no invoice is issued)", async () => {
    sessionFor("vip@example.com");
    slotIsBookable();

    const res = await POST(
      req({
        ...validBody,
        businessInvoice: { taxNumber: "not-a-tax-number", sameAsPersonal: true },
      }),
    );

    expect(res.status).toBe(201);
    expect(findFirstUser).not.toHaveBeenCalled();
    const doc = writeClient.create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(doc).not.toHaveProperty("businessInvoiceRequested");
    expect(doc).not.toHaveProperty("businessTaxNumber");
  });

  it("allowlisted account still goes through slot validation (409, nothing created)", async () => {
    sessionFor("vip@example.com");
    getAvailableSlotsForDate.mockResolvedValue({
      slots: ["09:00"],
      serviceName: "Vizsgálat",
      durationMinutes: 20,
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(409);
    expect(writeClient.create).not.toHaveBeenCalled();
    expect(runBookingConfirmedSideEffects).not.toHaveBeenCalled();
  });

  it("allowlisted account loses an already-booked slot like anyone else", async () => {
    sessionFor("vip@example.com");
    getAvailableSlotsForDate.mockResolvedValue({
      slots: ["14:00"],
      serviceName: "Vizsgálat",
      durationMinutes: 20,
    });
    writeClient.fetch.mockResolvedValueOnce({ ...lock, status: "booked" });

    const res = await POST(req(validBody));

    expect(res.status).toBe(409);
    expect(writeClient.create).not.toHaveBeenCalled();
    expect(runBookingConfirmedSideEffects).not.toHaveBeenCalled();
  });

  it("account not on the allowlist pays via Stripe", async () => {
    sessionFor("someone@example.com");
    slotIsBookable();

    const res = await POST(req(validBody));

    expect(res.status).toBe(201);
    const json = (await res.json()) as { waived?: boolean; checkoutUrl?: string };
    expect(json.waived).toBeUndefined();
    expect(json.checkoutUrl).toBe("https://stripe.test/cs_test_1");
    expect(stripeCreate).toHaveBeenCalledTimes(1);
    expect(writeClient.create.mock.calls[0]?.[0]).toMatchObject({
      paymentStatus: "pending",
      paymentAmount: 5000,
    });
    expect(runBookingConfirmedSideEffects).not.toHaveBeenCalled();
  });

  it("unverified account with an allowlisted e-mail pays via Stripe", async () => {
    sessionFor("vip@example.com", false);
    slotIsBookable();

    const res = await POST(req(validBody));

    expect(res.status).toBe(201);
    expect(stripeCreate).toHaveBeenCalledTimes(1);
    expect(writeClient.create.mock.calls[0]?.[0]).toMatchObject({ paymentStatus: "pending" });
    expect(runBookingConfirmedSideEffects).not.toHaveBeenCalled();
  });

  it("ignores client-sent waiver flags and the typed patient e-mail", async () => {
    sessionFor("someone@example.com");
    slotIsBookable();

    const res = await POST(
      req({ ...validBody, patientEmail: "vip@example.com", waived: true, feeWaived: true }),
    );

    expect(res.status).toBe(201);
    expect(stripeCreate).toHaveBeenCalledTimes(1);
    expect(writeClient.create.mock.calls[0]?.[0]).toMatchObject({ paymentStatus: "pending" });
  });

  it("empty FEE_EXEMPT_EMAILS waives nobody", async () => {
    vi.stubEnv("FEE_EXEMPT_EMAILS", "");
    sessionFor("vip@example.com");
    slotIsBookable();

    const res = await POST(req(validBody));

    expect(res.status).toBe(201);
    expect(stripeCreate).toHaveBeenCalledTimes(1);
  });
});
