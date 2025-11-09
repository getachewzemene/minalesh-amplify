export const ALL = 'all' as const;
export const NONE = 'none' as const;
export type Sentinel = typeof ALL | typeof NONE;

// Returns true if the value is a sentinel ("all" or "none")
export function isSentinel(value: string): value is Sentinel {
  return value === ALL || value === NONE;
}

export function isAll(value: string): value is typeof ALL {
  return value === ALL;
}

export function isNone(value: string): value is typeof NONE {
  return value === NONE;
}

// Convert a possibly empty string (nullable) into a UI-safe sentinel value
export function toSentinel(value: string, sentinel: Sentinel): string {
  return value === '' ? sentinel : value;
}

// Convert a UI value back to the underlying nullable string ('' when sentinel)
export function fromSentinel(value: string): string {
  return isSentinel(value) ? '' : value;
}
