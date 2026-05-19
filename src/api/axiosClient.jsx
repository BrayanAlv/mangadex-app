import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.mangadex.org',
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
});

const shouldRetry = (error) => {
  if (!error.response) return true;
  const status = error.response.status;
  return [408, 429, 500, 502, 503, 504].includes(status);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || !shouldRetry(error)) return Promise.reject(error);

    config._retryCount = config._retryCount || 0;
    if (config._retryCount >= 2) return Promise.reject(error);

    config._retryCount += 1;
    const delay = Math.min(1000 * 2 ** config._retryCount, 4000);
    await wait(delay);
    return client(config);
  }
);

export default client;

