import { describe, expect, it } from "vitest";
import { memoryDateParts, monthDay } from "./dates";

describe("memory dates", () => {
  it("never shift a day, whatever the time zone", () => {
    expect(memoryDateParts("2024-05-14T00:00:00.000Z")).toEqual({
      month: "May",
      day: "14",
      year: "2024",
    });
    expect(monthDay("2024-01-01")).toBe("Jan 1");
  });
});
