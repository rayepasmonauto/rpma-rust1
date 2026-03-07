const FALLBACK_IMAGE_DATA_URI =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

/**
 * Strips the file:// protocol prefix and returns a plain OS path.
 * Handles both the standard form (file:///C:/path) and the non-standard
 * Windows backend form (file://C:\path).
 */
function stripFileProtocol(value: string): string {
  if (value.startsWith('file:///')) {
    return decodeURIComponent(value.slice(8)).replace(/^\/([A-Za-z]:)/, '$1');
  }
  if (value.startsWith('file://')) {
    return decodeURIComponent(value.slice(7));
  }
  return value;
}

/**
 * Mirrors the logic of @tauri-apps/api/core convertFileSrc without requiring
 * a package import (avoids SSR issues). On Windows/Android Tauri uses
 * https://asset.localhost/{path}; on macOS/Linux it uses asset://localhost/{path}.
 */
function buildAssetUrl(filePath: string, protocol = 'asset'): string {
  const encoded = encodeURIComponent(filePath);
  if (typeof navigator !== 'undefined' && /Win/i.test(navigator.platform)) {
    return `https://${protocol}.localhost/${encoded}`;
  }
  return `${protocol}://localhost/${encoded}`;
}

export function resolveLocalImageUrl(input?: string | null): string {
  const value = (input ?? '').trim();
  if (!value) return FALLBACK_IMAGE_DATA_URI;
  if (typeof window === 'undefined') return FALLBACK_IMAGE_DATA_URI;

  // Already a web/data/blob/asset URL — pass through unchanged
  if (
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('asset:') ||
    value.startsWith('http://')
  ) {
    return value;
  }

  // Convert local file paths (Windows absolute, Unix absolute, file:// URIs)
  const rawPath = stripFileProtocol(value);
  if (
    /^[A-Za-z]:[\\/]/.test(rawPath) ||
    rawPath.startsWith('/') ||
    rawPath.startsWith('\\\\')
  ) {
    try {
      return buildAssetUrl(rawPath.replace(/\\/g, '/'));
    } catch {
      // fall through to fallback
    }
  }

  return FALLBACK_IMAGE_DATA_URI;
}

export function shouldUseUnoptimizedImage(url?: string | null): boolean {
  const value = (url ?? '').trim();
  if (!value) return true;

  return (
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('asset:') ||
    value.startsWith('https://asset.localhost') ||
    value.startsWith('http://asset.localhost')
  );
}

export const LOCAL_IMAGE_FALLBACK_SRC = FALLBACK_IMAGE_DATA_URI;
