export const Provider = {
  create() {
    throw new Error('Optional wagmi "accounts" package is not installed.');
  }
};

export function dialog() {
  throw new Error('Optional wagmi "accounts" package is not installed.');
}

export function webAuthn() {
  throw new Error('Optional wagmi "accounts" package is not installed.');
}

export function dangerous_secp256k1() {
  throw new Error('Optional wagmi "accounts" package is not installed.');
}
