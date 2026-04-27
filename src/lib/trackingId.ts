/**
 * Generate a unique tracking ID in the format IP2026XXXXXX.
 * Total: 12 characters (IP + 10 digits).
 */
export const generateTrackingId = (): string => {
  const digits = Math.floor(1000000000 + Math.random() * 9000000000)
  return `IP${digits}`
}
