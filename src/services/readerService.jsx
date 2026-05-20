import client from '../api/axiosClient';

export const getAtHomeServer = async (chapterId) => {
  const response = await client.get(`/at-home/server/${chapterId}`);
  return response.data;
};

export const buildChapterPageUrls = ({ baseUrl, chapter, useDataSaver = false }) => {
  if (!baseUrl || !chapter?.hash) return [];
  const files = useDataSaver ? chapter.dataSaver : chapter.data;
  if (!files || !files.length) return [];

  // Normalize baseUrl (no trailing slash)
  const normalizedBase = baseUrl.replace(/\/+$/, '');

  // Ensure we build safe URLs (encode filenames). Some CDNs are sensitive to
  // characters in filenames and require proper encoding.
  return files.map((file) => {
    const encoded = encodeURIComponent(file);
    const folder = useDataSaver ? 'data-saver' : 'data';
    return `${normalizedBase}/${folder}/${chapter.hash}/${encoded}`;
  });
};
