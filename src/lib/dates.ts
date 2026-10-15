const TZ = "America/Indiana/Indianapolis";

/** Convertit une valeur "datetime-local" / "date" (heure d’Indianapolis) en Date. */
export function parseLocalDateTime(value: string): Date | null {
  if (!value) return null;
  const asUtc = new Date(`${value.length === 10 ? `${value}T10:00` : value}:00Z`);
  if (Number.isNaN(asUtc.getTime())) return null;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(asUtc)
      .map((p) => [p.type, p.value]),
  );
  const localAsUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(asUtc.getTime() - (localAsUtc - asUtc.getTime()));
}

/** Valeur d'un champ `type="date"` (AAAA-MM-JJ, heure d'Indianapolis) à partir d'une Date stockée. */
export function toDateInput(d: Date | null | undefined) {
  if (!d) return "";
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
