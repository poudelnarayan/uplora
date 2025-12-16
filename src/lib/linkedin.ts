/**
 * LinkedIn OAuth + API helpers (pure functions).
 *
 * OAuth:
 * - Authorize: https://www.linkedin.com/oauth/v2/authorization
 * - Token:     https://www.linkedin.com/oauth/v2/accessToken
 *
 * Identity:
 * - Member id: GET https://api.linkedin.com/v2/me
 * - OIDC profile: GET https://api.linkedin.com/v2/userinfo (when using openid/profile/email scopes)
 *
 * Posting:
 * - UGC: POST https://api.linkedin.com/v2/ugcPosts
 */

export function buildLinkedInAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope: string; // space-separated for LinkedIn, e.g. "openid profile email w_member_social"
}): string {
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("state", params.state);
  return url.toString();
}

function nowPlusSeconds(seconds?: number): string | null {
  if (typeof seconds !== "number") return null;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

async function jsonOrText(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json().catch(() => null);
  }
  return await res.text().catch(() => "");
}

export async function exchangeLinkedInCodeForToken(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{ accessToken: string; tokenExpiresAt: string | null; scope?: string }> {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: input.clientId,
      client_secret: input.clientSecret,
    }),
  });

  const json: any = await jsonOrText(res);
  if (!res.ok) {
    throw new Error(`LinkedIn token HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  if (!json?.access_token) {
    throw new Error(`LinkedIn token missing access_token: ${JSON.stringify(json)}`);
  }
  const expiresIn = typeof json?.expires_in === "number" ? json.expires_in : undefined;
  return {
    accessToken: String(json.access_token),
    tokenExpiresAt: nowPlusSeconds(expiresIn),
    scope: typeof json?.scope === "string" ? json.scope : undefined,
  };
}

export async function fetchLinkedInMe(accessToken: string): Promise<{ memberId: string }> {
  const res = await fetch("https://api.linkedin.com/v2/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const json: any = await jsonOrText(res);
  if (!res.ok) throw new Error(`LinkedIn /me HTTP ${res.status}: ${JSON.stringify(json)}`);
  if (!json?.id) throw new Error(`LinkedIn /me missing id: ${JSON.stringify(json)}`);
  return { memberId: String(json.id) };
}

export async function fetchLinkedInUserInfo(accessToken: string): Promise<{
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}> {
  // This endpoint is available when using OpenID Connect scopes.
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const json: any = await jsonOrText(res);
  if (!res.ok) {
    // best-effort only
    return {};
  }
  return {
    name: json?.name ?? null,
    email: json?.email ?? null,
    picture: json?.picture ?? null,
  };
}

export async function postLinkedInUgcText(input: {
  accessToken: string;
  authorUrn: string; // urn:li:person:{id}
  text: string;
  visibility?: "PUBLIC" | "CONNECTIONS";
}): Promise<any> {
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: input.authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: input.text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": input.visibility || "PUBLIC",
      },
    }),
  });
  const json: any = await jsonOrText(res);
  if (!res.ok) throw new Error(`LinkedIn ugcPosts HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
}


