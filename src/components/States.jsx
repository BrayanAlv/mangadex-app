import './States.css';

export const LoadingSpinner = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Cargando...</p>
    </div>
  );
};

export const ErrorState = ({ title, subtitle, onRetry }) => (
  <div className="error-state">
    <h2>{title}</h2>
    {subtitle && <p>{subtitle}</p>}
    {onRetry && (
      <button onClick={onRetry} className="retry-btn">
        Reintentar
      </button>
    )}
  </div>
);

export const EmptyState = ({ title, subtitle }) => (
  <div className="empty-state">
    <h2>{title}</h2>
    {subtitle && <p>{subtitle}</p>}
  </div>
);
