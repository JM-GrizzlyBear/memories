import { describe, expect, it } from "vitest";
import { passwordChecklist } from "./passwordRules";

const met = (password: string, confirm: string) =>
  Object.fromEntries(
    passwordChecklist(password, confirm).map((rule) => [rule.id, rule.met]),
  );

describe("the new-password checklist", () => {
  it("starts with nothing ticked", () => {
    expect(met("", "")).toEqual({ length: false, match: false });
  });

  it("ticks each rule as it's met", () => {
    expect(met("sunsetbeach26", "")).toEqual({ length: true, match: false });
    expect(met("short", "short")).toEqual({ length: false, match: true });
    expect(met("sunsetbeach26", "sunsetbeach26")).toEqual({
      length: true,
      match: true,
    });
  });
});
