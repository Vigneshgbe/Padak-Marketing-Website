// frontend/src/utils/image-utils.ts
export const getImageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // FIX: Remove the array brackets []
  return `https://padak-backend.onrender.com${path}`;
};