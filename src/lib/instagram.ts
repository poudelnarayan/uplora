/**
 * Instagram publishing helpers.
 *
 * This module is intentionally "pure" (no Clerk, no route handlers).
 * Route handlers should fetch/store credentials and call these helpers.
 */

export type InstagramPublishImageParams = {
  /** Instagram user/business account id */
  instagramUserId: string;
  /** Access token with `instagram_business_content_publish` scope */
  accessToken: string;
  /** Publicly accessible image URL (https) */
  imageUrl: string;
  /** Optional caption */
  caption?: string;
  /** Optional Meta Graph API version; defaults to env or v19.0 */
  apiVersion?: string;
};

export type InstagramPublishImageResult = {
  creationId: string;
  mediaId: string;
};

/**
 * Publish an image to Instagram:
 * 1) Create a media container
 * 2) Publish the container
 *
 * NOTE: This uses the Meta Graph API style endpoints. Your token must be valid for publishing.
 */
export async function publishInstagramImagePost(params: InstagramPublishImageParams): Promise<InstagramPublishImageResult> {
  const apiVersion = params.apiVersion || process.env.META_API_VERSION || "v19.0";
  const igUserId = params.instagramUserId;

  // Step 1) Create media container
  const containerUrl = new URL(`https://graph.facebook.com/${apiVersion}/${encodeURIComponent(igUserId)}/media`);
  containerUrl.searchParams.set("image_url", params.imageUrl);
  if (params.caption) containerUrl.searchParams.set("caption", params.caption);
  containerUrl.searchParams.set("access_token", params.accessToken);

  const containerRes = await fetch(containerUrl.toString(), { method: "POST" });
  const containerJson: any = await containerRes.json();
  if (!containerRes.ok || containerJson?.error || !containerJson?.id) {
    throw new Error(`Instagram media container failed: ${JSON.stringify(containerJson?.error || containerJson)}`);
  }

  const creationId = String(containerJson.id);

  // Step 2) Publish media container
  const publishUrl = new URL(`https://graph.facebook.com/${apiVersion}/${encodeURIComponent(igUserId)}/media_publish`);
  publishUrl.searchParams.set("creation_id", creationId);
  publishUrl.searchParams.set("access_token", params.accessToken);

  const publishRes = await fetch(publishUrl.toString(), { method: "POST" });
  const publishJson: any = await publishRes.json();
  if (!publishRes.ok || publishJson?.error || !publishJson?.id) {
    throw new Error(`Instagram media publish failed: ${JSON.stringify(publishJson?.error || publishJson)}`);
  }

  return { creationId, mediaId: String(publishJson.id) };
}


