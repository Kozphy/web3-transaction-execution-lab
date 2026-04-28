export function getUnixTimeMs() {
  return Date.now();
}

export function getUnixTimeNonce() {
  return BigInt(getUnixTimeMs());
}
