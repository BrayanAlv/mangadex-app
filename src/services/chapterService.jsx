import client from '../api/axiosClient';

export const getMangaChapters = async (mangaId, { limit = 100, offset = 0 } = {}) => {
  const response = await client.get(`/manga/${mangaId}/feed`, {
    params: {
      limit,
      offset,
      'order[chapter]': 'desc',
    },
  });
  return response.data;
};

export const getChapterById = async (chapterId) => {
  const response = await client.get(`/chapter/${chapterId}`);
  return response.data;
};
