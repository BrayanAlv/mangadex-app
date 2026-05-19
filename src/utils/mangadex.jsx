const uploadBase = 'https://uploads.mangadex.org';

export const getTitle = (manga) => {
  if (!manga?.attributes?.title) return 'Sin titulo';
  return manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Sin titulo';
};

export const getDescription = (manga) => {
  if (!manga?.attributes?.description) return 'Sin descripcion disponible.';
  return (
    manga.attributes.description.en ||
    Object.values(manga.attributes.description)[0] ||
    'Sin descripcion disponible.'
  );
};

export const getCoverFileName = (manga) => {
  const cover = manga?.relationships?.find((rel) => rel.type === 'cover_art');
  return cover?.attributes?.fileName || null;
};

export const getCoverUrl = (manga, size = 256) => {
  const fileName = getCoverFileName(manga);
  if (!fileName || !manga?.id) return null;
  return `${uploadBase}/covers/${manga.id}/${fileName}.${size}.jpg`;
};

export const getAuthorName = (manga) => {
  const author = manga?.relationships?.find((rel) => rel.type === 'author');
  const artist = manga?.relationships?.find((rel) => rel.type === 'artist');
  return author?.attributes?.name || artist?.attributes?.name || 'Desconocido';
};

export const getGenres = (manga) => {
  const tags = manga?.attributes?.tags || [];
  return tags.map((tag) => tag.attributes?.name?.en).filter(Boolean);
};

export const formatChapterLabel = (chapter) => {
  const number = chapter?.attributes?.chapter || '0';
  const title = chapter?.attributes?.title || '';
  return title ? `Cap. ${number} - ${title}` : `Cap. ${number}`;
};

export const formatUpdatedAt = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
};

