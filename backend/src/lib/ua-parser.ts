import { UAParser } from 'ua-parser-js';

/** Parsed user-agent fields. */
export interface ParsedUserAgent {
  browser: string;
  os: string;
  device: string;
}

/**
 * Parses a user-agent string into browser, OS, and device fields.
 * @param userAgent - Raw user-agent header value.
 * @returns Parsed fields with "Unknown" or "Desktop" defaults.
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  return {
    browser: result.browser.name || 'Unknown',
    os: result.os.name || 'Unknown',
    device: result.device.type || 'Desktop',
  };
}
