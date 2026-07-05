export function randomId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25);
}
