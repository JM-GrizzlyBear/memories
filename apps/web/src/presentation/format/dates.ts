const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const DAY_MS = 24 * 60 * 60 * 1000;

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// The parts of the day a memory happened, for the timeline: { month: "May", day: "14", year: "2024" }
// The API sends midnight UTC, so read it in UTC to never shift the day
export function memoryDateParts(iso: string) {
  const date = new Date(iso);
  return {
    month: date.toLocaleDateString("en-US", {
      month: "short",
      timeZone: "UTC",
    }),
    day: String(date.getUTCDate()),
    year: String(date.getUTCFullYear()),
  };
}

// How long ago a memory happened, counted in whole days: "Today", "Yesterday", "2 years ago"
export function memoryAgo(iso: string) {
  const memoryDay = Date.parse(iso.slice(0, 10));
  const today = Date.parse(new Date().toLocaleDateString("en-CA")); // today in the user's time zone
  const days = Math.round((memoryDay - today) / DAY_MS);

  if (days === 0) return "Today";
  if (Math.abs(days) >= 365)
    return capitalize(relative.format(Math.round(days / 365), "year"));
  if (Math.abs(days) >= 30)
    return capitalize(relative.format(Math.round(days / 30), "month"));
  return capitalize(relative.format(days, "day"));
}

// How long ago something was kept: "just now", "5 minutes ago", "2 days ago"
export function timeAgo(iso: string) {
  const seconds = (Date.parse(iso) - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 365 * 86400],
    ["month", 30 * 86400],
    ["week", 7 * 86400],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return relative.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}

// "May 2024", for "friends since" and "joined"
export function monthYear(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
