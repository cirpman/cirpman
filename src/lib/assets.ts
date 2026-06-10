export function resolveAssetPath(path?: string) {
  if (!path) return path || '';
  
  // Block data: URIs and excessively long paths to avoid accidental inline base64
  // being used as object keys / src URLs (causes URI Too Long errors).
  if (typeof path === 'string' && path.startsWith('data:')) {
    console.warn('Blocked data: URI used as asset path');
    return '';
  }
  // Safety: avoid extremely long values (likely malformed keys or embedded data)
  if (typeof path === 'string' && path.length > 2000) {
    console.warn('Blocked overly long asset path');
    return '';
  }
  // Static assets (logo, team photos) from /lovable-uploads/ are ALWAYS served from public/
  // They never go to R2.
  if (path.startsWith('/lovable-uploads') || path.startsWith('lovable-uploads')) {
    // Always return as-is to load from public/
    return path.startsWith('/') ? path : `/${path}`;
  }

  // Admin-uploaded images already have full R2 URLs from the worker endpoint.
  // Pass them through as-is (e.g., https://cirpman-homes-files.b504159e8022ea6268f9390704f90c2f.r2.cloudflarestorage.com/uploads/...)
  return path;
}
