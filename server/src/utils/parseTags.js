export const parseTags = (raw) =>
  [...new Set(
    String(raw ?? "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .map((t) => t.slice(0, 100))
  )];