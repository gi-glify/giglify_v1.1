import { requireAdmin } from "../_shared/auth.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { db } = await requireAdmin(req);
    const body = await req.json();
    const applicationId = typeof body?.applicationId === "string" ? body.applicationId : "";
    if (!applicationId) throw new HttpError("applicationId is required", 400, "validation_error");
    const { data: application, error: applicationError } = await db.from("requester_applications").select("id, id_document_path").eq("id", applicationId).single();
    if (applicationError) throw applicationError;
    const { data: signed, error: signedError } = await db.storage.from("requester-kyc").createSignedUrl(application.id_document_path, 300);
    if (signedError) throw signedError;
    return json({ applicationId, signedUrl: signed.signedUrl, expiresInSeconds: 300 });
  } catch (error) {
    return errorResponse(error);
  }
});
