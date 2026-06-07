export function resolveAssetPath(path?: string) {
  if (!path) return path || '';
  // Vite env variable for R2 public URL (set in Vercel or locally as VITE_R2_PUBLIC_URL)
  const R2 = (import.meta as any).env?.VITE_R2_PUBLIC_URL || '';

  // If path points to the old lovable-uploads location, prefer the R2 public URL when available
  if (path.startsWith('/lovable-uploads') || path.startsWith('lovable-uploads')) {
    if (R2) {
      // ensure no duplicate slashes
      return `${R2.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    }
    // fallback to the original path (will work if files are present in public/)
    return path;
  }

  return path;
}
