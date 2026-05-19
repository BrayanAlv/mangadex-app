import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

const STORAGE_KEYS = {
  favorites: 'mdx_favorites',
  history: 'mdx_history',
  recentSearches: 'mdx_recent_searches',
};

const initialState = {
  favorites: [],
  history: [],
  recentSearches: [],
  currentChapter: null,
  cache: {},
};

const AppContext = createContext(null);

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_FAVORITES':
      return {
        ...state,
        favorites: action.payload,
      };

    case 'ADD_FAVORITE': {
      const updated = [
        action.payload,
        ...state.favorites.filter(
            (item) => item.id !== action.payload.id
        ),
      ];

      return {
        ...state,
        favorites: updated,
      };
    }

    case 'REMOVE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.filter(
            (item) => item.id !== action.payload
        ),
      };

    case 'ADD_HISTORY': {
      const updated = [
        action.payload,
        ...state.history.filter(
            (item) =>
                item.chapterId !== action.payload.chapterId
        ),
      ];

      return {
        ...state,
        history: updated.slice(0, 30),
      };
    }

    case 'ADD_RECENT_SEARCH': {
      const trimmed = action.payload.trim();

      if (!trimmed) return state;

      const updated = [
        trimmed,
        ...state.recentSearches.filter(
            (item) => item !== trimmed
        ),
      ];

      return {
        ...state,
        recentSearches: updated.slice(0, 8),
      };
    }

    case 'SET_HISTORY':
      return {
        ...state,
        history: action.payload,
      };

    case 'SET_RECENT_SEARCHES':
      return {
        ...state,
        recentSearches: action.payload,
      };

    case 'SET_CURRENT_CHAPTER':
      return {
        ...state,
        currentChapter: action.payload,
      };

    case 'SET_CACHE_ITEM':
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.key]: action.payload,
        },
      };

    default:
      return state;
  }
};

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
      reducer,
      initialState
  );

  // Load storage once
  useEffect(() => {
    const favorites = readStorage(
        STORAGE_KEYS.favorites,
        []
    );

    const history = readStorage(
        STORAGE_KEYS.history,
        []
    );

    const recentSearches = readStorage(
        STORAGE_KEYS.recentSearches,
        []
    );

    dispatch({
      type: 'SET_FAVORITES',
      payload: favorites,
    });

    dispatch({
      type: 'SET_HISTORY',
      payload: history,
    });

    dispatch({
      type: 'SET_RECENT_SEARCHES',
      payload: recentSearches,
    });
  }, []);

  // Persist storage
  useEffect(() => {
    writeStorage(
        STORAGE_KEYS.favorites,
        state.favorites
    );
  }, [state.favorites]);

  useEffect(() => {
    writeStorage(
        STORAGE_KEYS.history,
        state.history
    );
  }, [state.history]);

  useEffect(() => {
    writeStorage(
        STORAGE_KEYS.recentSearches,
        state.recentSearches
    );
  }, [state.recentSearches]);

  // FAVORITES
  const addFavorite = useCallback((manga) => {
    dispatch({
      type: 'ADD_FAVORITE',
      payload: manga,
    });
  }, []);

  const removeFavorite = useCallback((mangaId) => {
    dispatch({
      type: 'REMOVE_FAVORITE',
      payload: mangaId,
    });
  }, []);

  const toggleFavorite = useCallback(
      (manga) => {
        const exists = state.favorites.some(
            (item) => item.id === manga.id
        );

        if (exists) {
          removeFavorite(manga.id);
        } else {
          addFavorite(manga);
        }
      },
      [state.favorites, addFavorite, removeFavorite]
  );

  // HISTORY
  const addHistory = useCallback((entry) => {
    dispatch({
      type: 'ADD_HISTORY',
      payload: entry,
    });
  }, []);

  // RECENT SEARCHES
  const addRecentSearch = useCallback((query) => {
    dispatch({
      type: 'ADD_RECENT_SEARCH',
      payload: query,
    });
  }, []);

  // CURRENT CHAPTER
  const setCurrentChapter = useCallback(
      (chapter) => {
        dispatch({
          type: 'SET_CURRENT_CHAPTER',
          payload: chapter,
        });
      },
      []
  );

  // CACHE
  const setCacheItem = useCallback(
      (key, value, ttlMs = 10 * 60 * 1000) => {
        dispatch({
          type: 'SET_CACHE_ITEM',
          key,
          payload: {
            value,
            expiresAt: Date.now() + ttlMs,
          },
        });
      },
      []
  );

  const getCacheItem = useCallback(
      (key) => {
        const cached = state.cache[key];

        if (!cached) return null;

        if (cached.expiresAt < Date.now()) {
          return null;
        }

        return cached.value;
      },
      [state.cache]
  );

  const value = useMemo(
      () => ({
        ...state,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        addHistory,
        addRecentSearch,
        setCurrentChapter,
        setCacheItem,
        getCacheItem,
      }),
      [
        state,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        addHistory,
        addRecentSearch,
        setCurrentChapter,
        setCacheItem,
        getCacheItem,
      ]
  );

  return (
      <AppContext.Provider value={value}>
        {children}
      </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
        'useApp must be used within AppProvider'
    );
  }

  return context;
};