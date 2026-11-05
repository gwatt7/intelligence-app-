// This project has two Vercel Blob stores connected. Vercel names the env
// vars for whichever store connected first `BLOB_STORE_ID` /
// `BLOB_READ_WRITE_TOKEN`; a second connected store that collides with
// those names gets auto-renamed with an extra "B" (`BLOBB_STORE_ID` /
// `BLOBB_READ_WRITE_TOKEN`) instead of overwriting the first store's vars.
// That's what happened in this project's Vercel dashboard, so the real
// read-write token for the store we actually use ("Northstar-videos") lives
// under the doubled-B name. Resolve whichever one is actually set so the
// app works regardless of which store ends up with the plain name.
export function resolveBlobReadWriteToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOBB_READ_WRITE_TOKEN;
}
