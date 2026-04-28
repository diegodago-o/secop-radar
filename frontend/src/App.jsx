import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ProcessDetail } from './pages/ProcessDetail';

function NavBar() {
  const { pathname } = useLocation();
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
          <span className="text-xl">📡</span>
          <span>SECOP Radar</span>
          <span className="text-xs font-normal text-gray-400 hidden sm:inline">
            · C&M Consultores
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            to="/"
            className={`font-medium transition-colors ${
              pathname === '/' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Dashboard
          </Link>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
            Beta
          </span>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/procesos/:id" element={<ProcessDetail />} />
        </Routes>
      </main>
    </div>
  );
}
