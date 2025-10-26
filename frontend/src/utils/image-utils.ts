export const getImageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `https://padak-backend.onrender.com${path}`;
};