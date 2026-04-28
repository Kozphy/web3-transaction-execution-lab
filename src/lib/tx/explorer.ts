export function buildExplorerTransactionUrl(explorerBaseUrl: string, hash: string) {
  return `${explorerBaseUrl.replace(/\/$/, "")}/tx/${hash}`;
}
