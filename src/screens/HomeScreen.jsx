import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePopularManga, usePaginatedManga, useMangaSearch } from '../hooks/index';
import { useApp } from '../context/AppContext';
import { SearchBar } from '../components/SearchBar';
import { MangaCard } from '../components/MangaCard';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/States';
import heroImage from '../source/img/1376072.jpg';
import './HomeScreen.css';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { items: topManga, loading: topLoading, error: topError } = usePopularManga();
  const { items: gridManga, loading: gridLoading, error: gridError, loadMore } = usePaginatedManga();
  const [query, setQuery] = useState('');
  const { results, loading: searchLoading } = useMangaSearch(query);
  const { history, recentSearches } = useApp();

  const navigateDetail = useCallback((manga) => {
    navigate(`/manga/${manga.id}`);
  }, [navigate]);

  const data = query ? results : gridManga;
  const loading = query ? searchLoading : gridLoading;

  return (
    <div className="home-screen">
      {/* Header */}
      <div className="home-header">
        <div className="header-hero">
          {topManga.length > 0 && (
            <>
              <img src={heroImage}
              alt="hero" className="hero-image" />
              <div className="hero-overlay"></div>
            </>
          )}
          <div className="header-content">
            <h1>Explora mangas</h1>
            <p>Los mejores títulos en un solo lugar</p>
          </div>
        </div>

        {/* Search */}
        <div className="search-wrapper">
          <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar manga o autor" />
          {recentSearches.length > 0 && !query && (
            <div className="recent-searches">
              {recentSearches.map((item) => (
                <button key={item} className="recent-chip" onClick={() => setQuery(item)}>
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Continue Reading */}
        {history.length > 0 && (
          <div className="continue-section">
            <h2>Continuar leyendo</h2>
            <div className="history-list">
              {history.slice(0, 5).map((entry) => (
                <div key={entry.chapterId} className="history-item" onClick={() => navigate(`/manga/${entry.manga.id}/chapter/${entry.chapterId}`)}>
                  <p className="history-title">{entry.manga.attributes?.title?.en || 'Sin título'}</p>
                  <p className="history-chapter">Cap. {entry.chapterNumber || '--'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/*/!* Top Mangas *!/*/}
        {/*{topLoading ? (*/}
        {/*  <LoadingSpinner />*/}
        {/*) : topError ? (*/}
        {/*  <ErrorState title="Error al cargar top mangas" subtitle="Intenta de nuevo" />*/}
        {/*) : (*/}
        {/*  <div className="top-section">*/}
        {/*    <h2>Top mangas</h2>*/}
        {/*    <div className="mangas-carousel">*/}
        {/*      {topManga.map((manga, index) => (*/}
        {/*        <MangaCard*/}
        {/*          key={`${manga.id}-${index}`}*/}
        {/*          manga={manga}*/}
        {/*          onPress={() => navigateDetail(manga)}*/}
        {/*          status={manga.attributes?.status}*/}
        {/*        />*/}
        {/*      ))}*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*)}*/}

        {/* Grid Title */}
        <h2 className="grid-title">{query ? `Resultados para "${query}"` : 'Explorar mangas'}</h2>
      </div>

      {/* Grid */}
      <div className="grid-section">
        {loading ? (
          <LoadingSpinner />
        ) : data.length === 0 ? (
          <EmptyState title="Sin resultados" subtitle="Prueba con otro término" />
        ) : (
          <>
            <div className="mangas-grid">
              {data.map((manga, index) => (
                <MangaCard
                  key={`${manga.id}-${index}`}
                  manga={manga}
                  onPress={() => navigateDetail(manga)}
                  status={manga.attributes?.status}
                />
              ))}
            </div>
            {!query && gridManga.length > 0 && (
              <button className="load-more" onClick={loadMore}>
                Cargar más
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
