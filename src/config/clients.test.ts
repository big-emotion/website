import { describe, expect, it } from "vitest";
import { clientIdForEmail, isAllowedEmail, validateClientRegistry } from "./clients";

describe("clients registry", () => {
  describe("isAllowedEmail / clientIdForEmail", () => {
    it("recognizes a provisioned email case-insensitively", () => {
      expect(isAllowedEmail("Contact@Big-Emotion.com")).toBe(true);
      expect(clientIdForEmail("Contact@Big-Emotion.com")).toBe(
        clientIdForEmail("contact@big-emotion.com"),
      );
    });

    it("resolves an unknown email to null / false", () => {
      expect(isAllowedEmail("nobody@example.com")).toBe(false);
      expect(clientIdForEmail("nobody@example.com")).toBeNull();
    });

    it("trims surrounding whitespace before matching", () => {
      const known = clientIdForEmail("contact@big-emotion.com");
      expect(clientIdForEmail("  contact@big-emotion.com  ")).toBe(known);
    });
  });

  describe("validateClientRegistry", () => {
    it("accepts a well-formed registry", () => {
      expect(() =>
        validateClientRegistry([
          { clientId: "acme", emails: ["a@acme.com", "b@acme.com"] },
          { clientId: "beta", emails: ["c@beta.com"] },
        ]),
      ).not.toThrow();
    });

    it("rejects an empty clientId", () => {
      expect(() => validateClientRegistry([{ clientId: "  ", emails: ["a@acme.com"] }])).toThrow(
        /clientId/i,
      );
    });

    it("rejects a client with no emails", () => {
      expect(() => validateClientRegistry([{ clientId: "acme", emails: [] }])).toThrow(/email/i);
    });

    it("rejects duplicate emails across clients (case-insensitive)", () => {
      expect(() =>
        validateClientRegistry([
          { clientId: "acme", emails: ["shared@example.com"] },
          { clientId: "beta", emails: ["Shared@Example.com"] },
        ]),
      ).toThrow(/duplicate/i);
    });

    it("rejects duplicate emails within the same client", () => {
      expect(() =>
        validateClientRegistry([
          {
            clientId: "acme",
            emails: ["a@acme.com", "a@acme.com"],
          },
        ]),
      ).toThrow(/duplicate/i);
    });

    it("rejects an empty/blank email entry", () => {
      expect(() => validateClientRegistry([{ clientId: "acme", emails: ["  "] }])).toThrow(
        /email/i,
      );
    });
  });
});
