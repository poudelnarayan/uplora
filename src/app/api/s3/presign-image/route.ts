export const runtime = "nodejs";

// Back-compat alias:
// Some frontend flows call /api/s3/presign-image, but the canonical endpoint is /api/s3/presign.
// Keep this file minimal to avoid diverging behavior and to prevent duplicate exports.
export { POST } from "../presign/route";
