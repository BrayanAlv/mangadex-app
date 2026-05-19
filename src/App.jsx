import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import HomeScreen from './screens/HomeScreen';
import MangaDetailScreen from './screens/MangaDetailScreen';
import ReaderScreen from './screens/ReaderScreen';

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/manga/:mangaId" element={<MangaDetailScreen />} />
            <Route path="/manga/:mangaId/chapter/:chapterId" element={<ReaderScreen />} />
          </Routes>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
