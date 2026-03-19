import { Routes, Route, Link } from 'react-router-dom';
import { LinksPage } from './pages/LinksPage';
import { LinkDetailPage } from './pages/LinkDetailPage';
import './App.css';

export function App() {
  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <h1>
            <Link to="/">PebblePost</Link>
          </h1>
          <p>URL Shortener</p>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LinksPage />} />
          <Route path="/links/:id" element={<LinkDetailPage />} />
        </Routes>
      </main>
    </>
  );
}
