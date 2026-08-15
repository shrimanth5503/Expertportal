/**
 * Safe API request client for The Expert Portal
 * Prevents "Unexpected token 'T', The page could not be found..." errors
 * when deployed to static hosts or when backend routes return non-JSON HTML.
 */

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; errorText?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // Check if the response is JSON
    if (contentType.includes('application/json')) {
      try {
        const json = await res.json();
        return {
          ok: res.ok,
          status: res.status,
          data: json,
          errorText: res.ok ? undefined : json?.message || `Request failed with status ${res.status}`,
        };
      } catch (jsonErr: any) {
        return {
          ok: false,
          status: res.status,
          data: null,
          errorText: `Failed to parse JSON response: ${jsonErr.message}`,
        };
      }
    }

    // Response is NOT JSON (likely 404/500 HTML error page from hosting provider like Vercel)
    const text = await res.text();
    const isHtml = text.trim().startsWith('<') || text.includes('The page could not be found') || text.includes('404: NOT_FOUND');

    let friendlyMessage = `Server returned status ${res.status}`;
    if (res.status === 404 && isHtml) {
      friendlyMessage = 'API endpoint not found (404). If deployed on Vercel, ensure vercel.json and api/index.ts are included.';
    } else if (isHtml) {
      friendlyMessage = `Server error (${res.status}): Non-JSON response returned from server.`;
    } else if (text.length < 200) {
      friendlyMessage = text;
    }

    return {
      ok: false,
      status: res.status,
      data: null,
      errorText: friendlyMessage,
    };
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      errorText: `Network connection failed: ${netErr.message || 'Check server status'}`,
    };
  }
}
