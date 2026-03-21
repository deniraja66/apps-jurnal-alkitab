export const getAssetPath = (path: string) => {
  if (!path) return '';
  // If it's already a full URL or blob, return as is
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  
  const base = import.meta.env.BASE_URL || '/';
  // Ensure base ends with / and path doesn't start with /
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  return `${normalizedBase}${normalizedPath}`;
};
