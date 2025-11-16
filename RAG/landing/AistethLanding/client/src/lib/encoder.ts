// Generate a 12-character encoder from username and password
export function generateEncoder(username: string, password: string): string {
  // Create a simple hash from username + password
  const combined = `${username}:${password}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to base36 (0-9, a-z) and take first 12 characters
  const base36 = Math.abs(hash).toString(36);
  const encoder = base36.padStart(12, '0').substring(0, 12);
  
  return encoder;
}

// Verify encoder matches username and password
export function verifyEncoder(encoder: string, username: string, password: string): boolean {
  const expectedEncoder = generateEncoder(username, password);
  return encoder === expectedEncoder;
}

