import './SearchBar.css';

export const SearchBar = ({ value, onChangeText, placeholder }) => {
  return (
    <div className="search-bar">
      <svg className="search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
        <circle cx="8" cy="8" r="6" strokeWidth="2" />
        <path d="M13 13L17 17" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
    </div>
  );
};

