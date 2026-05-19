import client from '../api/axiosClient';

const baseParams = {
  'includes[]': ['cover_art', 'author', 'artist'],
};

export const searchManga = async ({ title, limit = 24, offset = 0 }) => {
  const response = await client.get('/manga', {
    params: {
      ...baseParams,
      title,
      limit,
      offset,
      'order[relevance]': 'desc',
      'hasAvailableChapters': true,
    },
  });
  return response.data;
};

export const getPopularManga = async ({ limit = 20, offset = 10 }) => {
  const response = await client.get('/manga', {
    params: {
      ...baseParams,
      limit,
      offset,
      'order[followedCount]': 'desc',
      'hasAvailableChapters': true,
    },
  });
  return response.data;
};

export const getMangaById = async (mangaId) => {
  const response = await client.get(`/manga/${mangaId}`, {
    params: baseParams,
  });
  return response.data;
};

export const getMangaStatistics = async (mangaIds) => {
  if (!mangaIds?.length) return {};
  const response = await client.get('/statistics/manga', {
    params: {
      'manga[]': mangaIds,
    },
  });
  return response.data?.statistics || {};
};
