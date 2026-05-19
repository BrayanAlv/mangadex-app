import { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getPopularManga, searchManga, getMangaById, getMangaStatistics } from '../services/mangaService';
import { getAtHomeServer, buildChapterPageUrls } from '../services/readerService';

export const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
};

export const usePaginatedManga = () => {
  const { getCacheItem, setCacheItem } = useApp();
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);

    const cacheKey = `popular:${offset}`;
    const cached = getCacheItem(cacheKey);
    if (cached) {
      setItems((prev) => [...prev, ...cached.data]);
      setOffset((prev) => prev + cached.limit);
      setHasMore(cached.total > offset + cached.limit);
      setLoading(false);
      return;
    }

    try {
      const response = await getPopularManga({ limit: 24, offset });
      const nextItems = response.data || [];
      setItems((prev) => [...prev, ...nextItems]);
      setHasMore(response.total > offset + response.limit);
      setOffset((prev) => prev + response.limit);
      setCacheItem(cacheKey, { data: nextItems, total: response.total, limit: response.limit });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [getCacheItem, setCacheItem, offset, loading, hasMore]);

  useEffect(() => {
    loadMore();
  }, []);

  const refresh = useCallback(async () => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
    setLoading(true);
    try {
      const response = await getPopularManga({ limit: 24, offset: 0 });
      setItems(response.data || []);
      setHasMore(response.total > response.limit);
      setOffset(response.limit);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, loading, error, hasMore, loadMore, refresh };
};

export const useMangaSearch = (query) => {
  const { addRecentSearch, getCacheItem, setCacheItem } = useApp();
  const debounced = useDebounce(query, 450);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const runSearch = async () => {
      if (!debounced?.trim()) {
        setResults([]);
        setLoading(false);
        setError(null);
        return;
      }

      const cacheKey = `search:${debounced}`;
      const cached = getCacheItem(cacheKey);
      if (cached) {
        setResults(cached);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await searchManga({ title: debounced, limit: 30, offset: 0 });
        const data = response.data || [];
        setResults(data);
        setCacheItem(cacheKey, data, 5 * 60 * 1000);
        addRecentSearch(debounced);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    runSearch();
  }, [debounced, addRecentSearch, getCacheItem, setCacheItem]);

  return { results, loading, error };
};

export const useMangaDetail = (mangaId) => {
  const { getCacheItem, setCacheItem } = useApp();
  const [manga, setManga] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDetail = useCallback(async () => {
    if (!mangaId) return;
    setLoading(true);
    setError(null);

    const cacheKey = `manga:${mangaId}`;
    const cached = getCacheItem(cacheKey);
    if (cached) {
      setManga(cached.manga);
      setStats(cached.stats);
      setLoading(false);
      return;
    }

    try {
      const response = await getMangaById(mangaId);
      const mangaData = response?.data;
      const statistics = await getMangaStatistics([mangaId]);
      setManga(mangaData);
      setStats(statistics?.[mangaId] || null);
      setCacheItem(cacheKey, { manga: mangaData, stats: statistics?.[mangaId] || null }, 10 * 60 * 1000);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [mangaId, getCacheItem, setCacheItem]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  return { manga, stats, loading, error, reload: loadDetail };
};

export const useChapterPages = (chapterId) => {
  const { setCacheItem, getCacheItem } = useApp();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const validatePages = (urls) => {
    if (!urls?.length) return 'No hay paginas disponibles.';
    const hasEmpty = urls.some((url) => !url);
    if (hasEmpty) return 'Hay paginas invalidas o corruptas.';
    return null;
  };

  const loadPages = useCallback(async () => {
    if (!chapterId) return;
    setLoading(true);
    setError(null);

    const cacheKey = `chapter:${chapterId}`;
    const cached = getCacheItem(cacheKey);
    if (cached) {
      setPages(cached);
      setLoading(false);
      return;
    }

    try {
      const atHome = await getAtHomeServer(chapterId);
      const urls = buildChapterPageUrls({ ...atHome });
      const validationError = validatePages(urls);
      if (validationError) throw new Error(validationError);
      setPages(urls);
      setCacheItem(cacheKey, urls, 5 * 60 * 1000);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [chapterId, getCacheItem, setCacheItem]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  return { pages, loading, error, retry: loadPages };
};

export const usePopularManga = () => {
  const { getCacheItem, setCacheItem } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPopular = async () => {
      setLoading(true);
      setError(null);
      const cacheKey = 'popular:top5';
      const cached = getCacheItem(cacheKey);
      if (cached) {
        setItems(cached);
        setLoading(false);
        return;
      }

      try {
        const response = await getPopularManga({ limit: 5, offset: 0 });
        setItems(response.data || []);
        setCacheItem(cacheKey, response.data || [], 5 * 60 * 1000);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadPopular();
  }, [getCacheItem, setCacheItem]);

  return { items, loading, error };
};

