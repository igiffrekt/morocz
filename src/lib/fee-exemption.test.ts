import { afterEach, describe, expect, it, vi } from "vitest";
import { isFeeExemptEmail, isFeeExemptUser, parseFeeExemptEmails } from "./fee-exemption";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("parseFeeExemptEmails", () => {
  it("returns an empty set for missing / empty input", () => {
    expect(parseFeeExemptEmails(undefined).size).toBe(0);
    expect(parseFeeExemptEmails(null).size).toBe(0);
    expect(parseFeeExemptEmails("").size).toBe(0);
    expect(parseFeeExemptEmails(" , ,, ").size).toBe(0);
  });

  it("splits on commas, trims and lower-cases each entry", () => {
    const set = parseFeeExemptEmails("  Foo@Example.com , bar@example.hu,,BAZ@x.io ");
    expect([...set].sort()).toEqual(["bar@example.hu", "baz@x.io", "foo@example.com"]);
  });
});

describe("isFeeExemptEmail", () => {
  const list = "vip@example.com, Second@Example.org";

  it("matches case-insensitively and ignores surrounding whitespace", () => {
    expect(isFeeExemptEmail("VIP@example.com", list)).toBe(true);
    expect(isFeeExemptEmail("  second@example.org ", list)).toBe(true);
  });

  it("does not match other addresses, partial or empty values", () => {
    expect(isFeeExemptEmail("other@example.com", list)).toBe(false);
    expect(isFeeExemptEmail("vip@example.co", list)).toBe(false);
    expect(isFeeExemptEmail("xvip@example.com", list)).toBe(false);
    expect(isFeeExemptEmail("", list)).toBe(false);
    expect(isFeeExemptEmail(null, list)).toBe(false);
    expect(isFeeExemptEmail(undefined, list)).toBe(false);
  });

  it("never matches when the allowlist is empty", () => {
    expect(isFeeExemptEmail("vip@example.com", "")).toBe(false);
    expect(isFeeExemptEmail("vip@example.com", undefined)).toBe(false);
  });

  it("reads FEE_EXEMPT_EMAILS by default", () => {
    vi.stubEnv("FEE_EXEMPT_EMAILS", "env@example.com");
    expect(isFeeExemptEmail("ENV@example.com")).toBe(true);
    expect(isFeeExemptEmail("vip@example.com")).toBe(false);
  });
});

describe("isFeeExemptUser", () => {
  const list = "vip@example.com";

  it("exempts a verified account on the allowlist", () => {
    expect(isFeeExemptUser({ email: "Vip@Example.com", emailVerified: true }, list)).toBe(true);
  });

  it("does not exempt an unverified account, even with an allowlisted e-mail", () => {
    expect(isFeeExemptUser({ email: "vip@example.com", emailVerified: false }, list)).toBe(false);
    expect(isFeeExemptUser({ email: "vip@example.com" }, list)).toBe(false);
  });

  it("does not exempt a verified account that is not on the allowlist", () => {
    expect(isFeeExemptUser({ email: "other@example.com", emailVerified: true }, list)).toBe(false);
  });

  it("handles a missing user", () => {
    expect(isFeeExemptUser(null, list)).toBe(false);
    expect(isFeeExemptUser(undefined, list)).toBe(false);
  });
});
