import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useMangaDetail } from '../hooks/index';
import {
  getCoverUrl,
  getDescription,
  getGenres,
  getTitle,
  getAuthorName
} from '../utils/mangadex';
import { getMangaChapters } from '../services/chapterService';
import { useApp } from '../context/AppContext';
import { LoadingSpinner, ErrorState } from '../components/States';
import './MangaDetailScreen.css';

const LANGUAGE_NAMES = {
  es: 'Español',
  'es-la': 'Español LATAM',
  en: 'English',
  pt: 'Português',
  'pt-br': 'Português BR',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  ru: 'Русский',
  fr: 'Français',
  it: 'Italiano',
  de: 'Deutsch',
};

const MangaDetailScreen = () => {
  const { mangaId } = useParams();
  const navigate = useNavigate();

  const { manga, stats, loading, error, reload } = useMangaDetail(mangaId);
  const { favorites, toggleFavorite } = useApp();

  const [chapters, setChapters] = useState([]);
  const [chapterLoading, setChapterLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  const isFavorite = favorites.some((item) => item.id === manga?.id);

  useEffect(() => {
    const loadChapters = async () => {
      setChapterLoading(true);

      try {
        const response = await getMangaChapters(mangaId, {
          limit: 200,
        });

        setChapters(response.data || []);
      } catch (err) {
        console.error('Error loading chapters:', err);
      } finally {
        setChapterLoading(false);
      }
    };

    loadChapters();
  }, [mangaId]);

  const availableLanguages = useMemo(() => {
    const langs = [...new Set(
        chapters.map((chapter) => chapter.attributes?.translatedLanguage)
    )];

    return langs.sort();
  }, [chapters]);

  const filteredChapters = useMemo(() => {
    if (selectedLanguage === 'all') return chapters;

    return chapters.filter(
        (chapter) =>
            chapter.attributes?.translatedLanguage === selectedLanguage
    );
  }, [chapters, selectedLanguage]);

  if (loading) return <LoadingSpinner />;

  if (error || !manga) {
    return (
        <ErrorState
            title="Error al cargar manga"
            onRetry={reload}
        />
    );
  }

  const coverUrl = getCoverUrl(manga, 512);
  const title = getTitle(manga);
  const description = getDescription(manga);
  const genres = getGenres(manga);
  const author = getAuthorName(manga);

  const rating = stats?.rating?.average
      ? stats.rating.average.toFixed(1)
      : '--';

  return (
      <div className="manga-detail">
        {/* Header */}
        <div className="detail-header">
          <button
              className="back-btn"
              onClick={() => navigate('/')}
          >
            ←
          </button>
        </div>

        {/* Hero */}
        <div className="detail-hero">
          <img
              src={coverUrl}
              alt={title}
              className="detail-cover"
          />

          <div className="detail-overlay"></div>

          <div className="detail-content">
            <h1>{title}</h1>

            <p>
              Autor: {author} · ★ {rating}
            </p>

            <button
                className="favorite-btn"
                onClick={() => toggleFavorite(manga)}
            >
              {isFavorite
                  ? '❤ Quitar de favoritos'
                  : '🤍 Agregar a favoritos'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="detail-info">
          <section>
            <h2>Descripción</h2>
            <p>{description}</p>
          </section>

          <section>
            <h2>Géneros</h2>

            <div className="genres">
              {genres.map((genre) => (
                  <span
                      key={genre}
                      className="genre-tag"
                  >
                {genre}
              </span>
              ))}
            </div>
          </section>

          {/* Chapters */}
          <section>
            <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  marginBottom: '1rem',
                }}
            >
              <h2>Capítulos</h2>

              {/* FILTRO DE IDIOMAS */}
              <select
                  value={selectedLanguage}
                  onChange={(e) =>
                      setSelectedLanguage(e.target.value)
                  }
                  className="language-filter"
              >
                <option value="all">
                  Todos los idiomas
                </option>

                {availableLanguages.map((lang) => (
                    <option
                        key={lang}
                        value={lang}
                    >
                      {LANGUAGE_NAMES[lang] || lang}
                    </option>
                ))}
              </select>
            </div>

            {chapterLoading ? (
                <LoadingSpinner />
            ) : filteredChapters.length === 0 ? (
                <p className="no-chapters">
                  Sin capítulos disponibles
                </p>
            ) : (
                <div className="chapters-list">
                  {filteredChapters.map((chapter) => (
                      <button
                          key={chapter.id}
                          className="chapter-item"
                          onClick={() =>
                              navigate(
                                  `/manga/${mangaId}/chapter/${chapter.id}`
                              )
                          }
                      >
                        <div className="chapter-info">
                    <span className="chapter-number">
                      Cap.{' '}
                      {chapter.attributes?.chapter || '0'}
                    </span>

                          <span
                              className="chapter-title"
                              title={chapter.attributes?.title}
                          >
                      {chapter.attributes?.title ||
                          'Sin título'}
                    </span>

                          <span
                              style={{
                                fontSize: '0.8rem',
                                opacity: 0.7,
                              }}
                          >
                      {
                          LANGUAGE_NAMES[
                              chapter.attributes?.translatedLanguage
                              ] ||
                          chapter.attributes?.translatedLanguage
                      }
                    </span>
                        </div>

                        <span className="chapter-arrow">
                    →
                  </span>
                      </button>
                  ))}
                </div>
            )}
          </section>
        </div>
      </div>
  );
};

export default MangaDetailScreen;