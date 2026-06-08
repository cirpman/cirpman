export function resolveAssetPath(path?: string) {
  if (!path) return path || '';

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
