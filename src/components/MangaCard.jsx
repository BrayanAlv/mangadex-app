import './MangaCard.css';
import { getCoverUrl, getTitle } from '../utils/mangadex';

export const MangaCard = ({ manga, onPress, rating, status }) => {
  const coverUrl = getCoverUrl(manga, 256);
  const title = getTitle(manga);

  return (
    <div className="manga-card" onClick={onPress}>
      <img src={coverUrl} alt={title} className="manga-cover" loading="lazy" />
      <div className="manga-info">
        <h3 className="manga-title">{title}</h3>
        <p className="manga-meta">★ {rating || '--'} · {status || 'Estado'}</p>
      </div>
    </div>
  );
};

