import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useChapterPages } from '../hooks/index';
import { getMangaChapters } from '../services/chapterService';
import { useApp } from '../context/AppContext';
import { LoadingSpinner, ErrorState } from '../components/States';
import './ReaderScreen.css';

// ─── Sub-components ────────────────────────────────────────────────────────────

const ProgressBar = ({ current, total }) => (
    <div className="progress-bar-track">
      <div
          className="progress-bar-fill"
          style={{ width: total > 0 ? `${((current + 1) / total) * 100}%` : '0%' }}
      />
      <span className="progress-label">{current + 1} / {total}</span>
    </div>
);

const PageThumbnailStrip = ({ pages, currentPage, onSelect }) => (
    <div className="thumbnail-strip">
      {pages.map((url, i) => (
          <button
              key={i}
              className={`thumb-btn ${i === currentPage ? 'active' : ''}`}
              onClick={() => onSelect(i)}
              aria-label={`Página ${i + 1}`}
          >
            <img src={url} alt={`Miniatura ${i + 1}`} loading="lazy" />
            <span className="thumb-num">{i + 1}</span>
          </button>
      ))}
    </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────

const ReaderScreen = () => {
  const { mangaId, chapterId } = useParams();
  const navigate = useNavigate();
  const { pages, loading, error, retry } = useChapterPages(chapterId);
  const { addHistory } = useApp();

  const [chapters, setChapters] = useState([]);
  const [readerMode, setReaderMode] = useState('horizontal');
  const [currentPage, setCurrentPage] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [fitMode, setFitMode] = useState('width');
  const [showError, setShowError] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  // Refs — evitan closures desactualizados
  const readerRef = useRef(null);
  const hideControlsTimer = useRef(null);
  const touchStart = useRef(null);
  const currentPageRef = useRef(0);
  const readerModeRef = useRef('horizontal');
  const pagesLengthRef = useRef(0);

  // Mantener refs sincronizados
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
  useEffect(() => { readerModeRef.current = readerMode; }, [readerMode]);
  useEffect(() => { pagesLengthRef.current = pages.length; }, [pages.length]);

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMangaChapters(mangaId, { limit: 200 });
        setChapters(res.data || []);
      } catch (err) {
        console.error('Error cargando capítulos:', err);
      }
    };
    load();
  }, [mangaId]);

  useEffect(() => {
    const current = chapters.find((c) => c.id === chapterId);
    if (current) {
      addHistory({
        chapterId: current.id,
        chapterNumber: current.attributes?.chapter,
        manga: { id: mangaId, attributes: current.attributes?.manga || {}, relationships: [] },
      });
    }
  }, [chapters, chapterId, mangaId, addHistory]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  const currentChapterIndex = chapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter =
      currentChapterIndex > -1 && currentChapterIndex < chapters.length - 1
          ? chapters[currentChapterIndex + 1]
          : null;

  // ── goToPage — lee siempre de refs, nunca de closures ────────────────────
  const goToPage = useCallback((index) => {
    const isMag = readerModeRef.current === 'magazine';
    const total = pagesLengthRef.current;
    let target = Math.max(0, Math.min(index, total - 1));
    if (isMag) {
      target = target % 2 === 0 ? target : target - 1;
    }
    currentPageRef.current = target;
    setCurrentPage(target);
  }, []); // sin dependencias — siempre lee de refs

  // ── Cambiar modo normalizando página ─────────────────────────────────────
  const handleModeChange = (newMode) => {
    readerModeRef.current = newMode;
    setReaderMode(newMode);
    if (newMode === 'magazine') {
      const normalized = currentPageRef.current % 2 === 0
          ? currentPageRef.current
          : currentPageRef.current - 1;
      currentPageRef.current = Math.max(0, normalized);
      setCurrentPage(currentPageRef.current);
    }
  };

  // ── Controls auto-hide ────────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setControlsVisible(false), 3500);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => clearTimeout(hideControlsTimer.current);
  }, [resetHideTimer]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      resetHideTimer();
      const step = readerModeRef.current === 'magazine' ? 2 : 1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToPage(currentPageRef.current + step);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goToPage(currentPageRef.current - step);
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goToPage, resetHideTimer]); // goToPage es estable, no hay stale closure

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      readerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ── Touch swipe ───────────────────────────────────────────────────────────
  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const dx = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) {
      const step = readerModeRef.current === 'magazine' ? 2 : 1;
      goToPage(currentPageRef.current + (dx > 0 ? step : -step));
    }
    touchStart.current = null;
  };

  // ── Image error ───────────────────────────────────────────────────────────
  const onImageError = (index) => setImageErrors((prev) => ({ ...prev, [index]: true }));
  const clearImageError = (index) => setImageErrors((prev) => {
    const next = { ...prev };
    delete next[index];
    return next;
  });

  // ── Early returns ─────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorState title="Error al cargar páginas" onRetry={retry} />;

  // ── Derived values ────────────────────────────────────────────────────────
  const isMagazine   = readerMode === 'magazine';
  const isHorizontal = readerMode === 'horizontal';
  const magazineLeft  = isMagazine ? currentPage : null;
  const magazineRight = isMagazine ? currentPage + 1 : null;

  return (
      <div
          ref={readerRef}
          className={`reader-screen reader-${readerMode} fit-${fitMode} ${controlsVisible ? 'controls-on' : 'controls-off'}`}
          onMouseMove={resetHideTimer}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={resetHideTimer}
      >

        {/* ── TOP BAR ──────────────────────────────────────────────────────────── */}
        <header className="reader-topbar">
          <button className="back-btn" onClick={() => navigate(-1)} title="Volver" aria-label="Volver">
            ←
          </button>

          <div className="topbar-center">
            <button className="chapter-selector-btn" onClick={() => setShowChapterList((p) => !p)}>
              Capítulo {chapters.find((c) => c.id === chapterId)?.attributes?.chapter ?? '—'}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>

          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggleFullscreen} title="Pantalla completa (F)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
              </svg>
            </button>
            <button className="icon-btn" onClick={() => setShowThumbnails((p) => !p)} title="Miniaturas">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
          </div>
        </header>

        {/* ── CHAPTER DROPDOWN ─────────────────────────────────────────────────── */}
        {showChapterList && (
            <div className="chapter-dropdown">
              <div className="chapter-dropdown-inner">
                {chapters.map((ch) => (
                    <button
                        key={ch.id}
                        className={`chapter-item ${ch.id === chapterId ? 'active' : ''}`}
                        onClick={() => {
                          navigate(`/manga/${mangaId}/chapter/${ch.id}`);
                          setShowChapterList(false);
                        }}
                    >
                      <span className="ch-num">Cap. {ch.attributes?.chapter}</span>
                      {ch.attributes?.title && <span className="ch-title">{ch.attributes.title}</span>}
                    </button>
                ))}
              </div>
            </div>
        )}

        {/* ── MODE SWITCHER ────────────────────────────────────────────────────── */}
        <div className="mode-switcher">
          {['horizontal', 'magazine'].map((m) => (
              <button
                  key={m}
                  className={`mode-pill ${readerMode === m ? 'active' : ''}`}
                  onClick={() => handleModeChange(m)}
              >
                {m === 'horizontal' && (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <rect x="2" y="5" width="7" height="10" rx="1.5"/>
                      <rect x="11" y="5" width="7" height="10" rx="1.5"/>
                    </svg>
                )}
                {m === 'magazine' && (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <rect x="1" y="3" width="8" height="14" rx="1.5"/>
                      <rect x="11" y="3" width="8" height="14" rx="1.5"/>
                    </svg>
                )}
                <span>{m === 'horizontal' ? 'Horizontal' : 'Revista'}</span>
              </button>
          ))}
        </div>


        <main className="reader-content reader-paged">

          {/* HORIZONTAL */}
          {isHorizontal && pages[currentPage] && (
              <div className="page-wrapper single">
                {imageErrors[currentPage] ? (
                    <div className="page-error">
                      <span>⚠ Página {currentPage + 1} no disponible</span>
                      <button onClick={() => clearImageError(currentPage)}>Reintentar</button>
                    </div>
                ) : (
                    <img
                        src={pages[currentPage]}
                        alt={`Página ${currentPage + 1}`}
                        className="reader-page"
                        onError={() => onImageError(currentPage)}
                    />
                )}
                <button className="click-zone left"  onClick={() => goToPage(currentPageRef.current - 1)} aria-label="Página anterior"/>
                <button className="click-zone right" onClick={() => goToPage(currentPageRef.current + 1)} aria-label="Página siguiente"/>
              </div>
          )}

          {/* MAGAZINE */}
          {isMagazine && (
              <div className="magazine-spread">
                {magazineLeft !== null && pages[magazineLeft] && (
                    <div className="magazine-page left-page">
                      {imageErrors[magazineLeft] ? (
                          <div className="page-error">
                            <span>⚠ Página {magazineLeft + 1} no disponible</span>
                            <button onClick={() => clearImageError(magazineLeft)}>Reintentar</button>
                          </div>
                      ) : (
                          <img src={pages[magazineLeft]} alt={`Página ${magazineLeft + 1}`}
                               className="reader-page" onError={() => onImageError(magazineLeft)}/>
                      )}
                      <span className="page-num-badge">{magazineLeft + 1}</span>
                    </div>
                )}
                {magazineRight !== null && pages[magazineRight] && (
                    <div className="magazine-page right-page">
                      {imageErrors[magazineRight] ? (
                          <div className="page-error">
                            <span>⚠ Página {magazineRight + 1} no disponible</span>
                            <button onClick={() => clearImageError(magazineRight)}>Reintentar</button>
                          </div>
                      ) : (
                          <img src={pages[magazineRight]} alt={`Página ${magazineRight + 1}`}
                               className="reader-page" onError={() => onImageError(magazineRight)}/>
                      )}
                      <span className="page-num-badge">{magazineRight + 1}</span>
                    </div>
                )}
                <button className="click-zone left"  onClick={() => goToPage(currentPageRef.current - 2)} aria-label="Anterior"/>
                <button className="click-zone right" onClick={() => goToPage(currentPageRef.current + 2)} aria-label="Siguiente"/>
              </div>
          )}
        </main>

        {/* ── PROGRESS BAR ─────────────────────────────────────────────────────── */}
        <ProgressBar current={currentPage} total={pages.length} />

        {/* ── BOTTOM NAV ───────────────────────────────────────────────────────── */}
        <nav className="reader-bottomnav">
          {prevChapter ? (
              <button className="chapter-nav-btn prev"
                      onClick={() => navigate(`/manga/${mangaId}/chapter/${prevChapter.id}`)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Cap. {prevChapter.attributes?.chapter}
              </button>
          ) : <span />}

          <div className="page-jump">
            <button className="pj-btn"
                    onClick={() => goToPage(currentPageRef.current - (isMagazine ? 2 : 1))}
                    disabled={currentPage === 0}>‹</button>
            <span className="pj-label">{currentPage + 1} / {pages.length}</span>
            <button className="pj-btn"
                    onClick={() => goToPage(currentPageRef.current + (isMagazine ? 2 : 1))}
                    disabled={currentPage >= pages.length - 1}>›</button>
          </div>

          {nextChapter ? (
              <button className="chapter-nav-btn next"
                      onClick={() => navigate(`/manga/${mangaId}/chapter/${nextChapter.id}`)}>
                Cap. {nextChapter.attributes?.chapter}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
          ) : <span />}
        </nav>

        {/* ── THUMBNAIL STRIP ──────────────────────────────────────────────────── */}
        {showThumbnails && (
            <PageThumbnailStrip
                pages={pages}
                currentPage={currentPage}
                onSelect={(i) => { goToPage(i); setShowThumbnails(false); }}
            />
        )}

        {/* ── ERROR MODAL ──────────────────────────────────────────────────────── */}
        {showError && (
            <div className="error-overlay" onClick={() => setShowError(false)}>
              <div className="error-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Error en páginas</h3>
                <p>{error?.message || 'Algunas páginas no se pudieron cargar.'}</p>
                <div className="error-modal-actions">
                  <button className="modal-btn secondary" onClick={() => setShowError(false)}>Cerrar</button>
                  <button className="modal-btn primary" onClick={() => { retry(); setShowError(false); }}>Reintentar</button>
                </div>
              </div>
            </div>
        )}

      </div>
  );
};

export default ReaderScreen;