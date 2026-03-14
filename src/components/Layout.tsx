import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Scissors, Users, User, LogIn, Wand2, Globe, BookOpen } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useLangStore } from '../store/langStore';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { isLoggedIn, currentUser } = useUserStore();
  const { lang, toggleLang, t } = useLangStore();

  const navItems = [
    { path: '/', icon: Home, labelKey: 'nav.home' },
    { path: '/studio', icon: Scissors, labelKey: 'nav.studio' },
    { path: '/ai-generation', icon: Wand2, labelKey: 'nav.ai' },
    { path: '/community', icon: Users, labelKey: 'nav.community' },
    { path: '/learning', icon: BookOpen, labelKey: 'nav.learning' },
    { path: '/profile', icon: User, labelKey: 'nav.profile' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Top Decoration */}
      <div className="h-3 bg-gradient-to-r from-red-800 via-red-600 to-red-800" />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg flex-shrink-0">
                <img src="/images/logo-scissors.jpg" alt="剪韵" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-800 tracking-wider" style={{ padding: '0 4px' }}>剪 韵</h1>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isActive ? 'bg-red-600 text-white shadow-lg' : 'text-red-800 hover:bg-red-100'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {/* Language Toggle */}
              <button
                onClick={toggleLang}
                title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-800 rounded-full hover:bg-amber-100 transition text-sm font-medium border border-amber-200"
              >
                <Globe className="w-4 h-4" />
                <span>{lang === 'zh' ? 'EN' : '中'}</span>
              </button>

              {isLoggedIn && currentUser ? (
                <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-red-800">{currentUser.username}</p>
                    <p className="text-xs text-red-600">Lv.{currentUser.level}</p>
                  </div>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('nav.login')}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="pb-20 md:pb-8 min-h-[calc(100vh-8rem)]">
        {children}
      </main>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-red-100 px-4 py-2 z-50">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-1 py-1"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 rounded-xl transition-all ${isActive ? 'bg-red-600 text-white' : 'text-red-700'}`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span className={`text-xs ${isActive ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      {/* Footer */}
      <footer className="hidden md:block bg-gradient-to-r from-red-800 via-red-700 to-red-800 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-red-200">{t('footer.text')}</p>
        </div>
      </footer>
    </div>
  );
}
