import { describe, expect, it } from "vitest";
import { formatTaxNumber, isValidHungarianTaxNumber, normalizeTaxNumber } from "./tax-number";

describe("tax-number", () => {
  it("accepts an 11-digit number with or without separators", () => {
    expect(isValidHungarianTaxNumber("12345678-1-23")).toBe(true);
    expect(isValidHungarianTaxNumber("12345678123")).toBe(true);
    expect(isValidHungarianTaxNumber(" 12345678 1 23 ")).toBe(true);
  });

  it("rejects anything that is not 11 digits", () => {
    expect(isValidHungarianTaxNumber("1234567-1-23")).toBe(false); // 10 digits
    expect(isValidHungarianTaxNumber("123456789012")).toBe(false); // 12 digits
    expect(isValidHungarianTaxNumber("abcdefgh-1-23")).toBe(false);
    expect(isValidHungarianTaxNumber("")).toBe(false);
  });

  it("normalizes to digits only", () => {
    expect(normalizeTaxNumber("12345678-1-23")).toBe("12345678123");
  });

  it("formats a valid number as XXXXXXXX-Y-ZZ", () => {
    expect(formatTaxNumber("12345678123")).toBe("12345678-1-23");
    expect(formatTaxNumber("12345678-1-23")).toBe("12345678-1-23");
  });

  it("throws when formatting an invalid number", () => {
    expect(() => formatTaxNumber("123")).toThrow();
  });
});
