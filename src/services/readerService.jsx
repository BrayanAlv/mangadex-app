import client from '../api/axiosClient';

export const getAtHomeServer = async (chapterId) => {
  const response = await client.get(`/at-home/server/${chapterId}`);
  return response.data;
};

export const buildChapterPageUrls = ({ baseUrl, chapter, useDataSaver = false }) => {
  if (!baseUrl || !chapter?.hash) return [];
  const files = useDataSaver ? chapter.dataSaver : chapter.data;
  return files.map((file) => `${baseUrl}/${useDataSaver ? 'data-saver' : 'data'}/${chapter.hash}/${file}`);
};
