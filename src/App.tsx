import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import HomePage from './pages/HomePage';
import ConverterPage from './pages/ConverterPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import CookieConsent from './components/CookieConsent';

interface NavItem {
  path: string;
  label: string;
}

const navigation: NavItem[] = [
  { path: '/', label: 'Home' },
  { path: '/converter', label: 'Converter' },
  { path: '/blog', label: 'Blog' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
  { path: '/privacy-policy', label: 'Privacy Policy' },
  { path: '/terms-of-service', label: 'Terms of Service' },
  { path: '/cookie-policy', label: 'Cookie Policy' },
];

function NavigationList({ className, itemClassName }: { className?: string, itemClassName?: string }) {
  return (
    <nav className={className}>
      <ul className="flex items-center gap-6">
        {navigation.map((item) => (
          <li key={item.path}>
            <NavLink 
              to={item.path} 
              className={({ isActive }) => `text-sm font-medium transition-colors hover:text-white ${isActive ? 'text-white' : 'text-gray-400'} ${itemClassName || ''}`}
              end={item.path === '/'}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SiteLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-dark text-gray-200 font-sans selection:bg-primary/30">
      {/* Decorative background glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none z-0" />

      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <NavLink to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">
              MockData.net
            </NavLink>
          </div>
          <NavigationList className="hidden md:block" />
          <div className="md:hidden">
            {/* Mobile menu toggle could go here */}
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col relative z-10 w-full" id="main-content">
        <Outlet />
      </main>

      <footer className="border-t border-gray-800 bg-gray-900/40 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} MockData.net. All rights reserved.</p>
          <NavigationList className="opacity-70 hover:opacity-100 transition-opacity" itemClassName="!text-xs" />
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <HelmetProvider>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/json-generator" element={<HomePage defaultTool="json" />} />
            <Route path="/csv-generator" element={<HomePage defaultTool="csv" />} />
            <Route path="/sql-generator" element={<HomePage defaultTool="sql" />} />
            <Route path="/mock-api-simulator" element={<HomePage defaultTool="api" />} />
            <Route path="/converter" element={<ConverterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsPage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Route>
        </Routes>
        <CookieConsent />
      </HelmetProvider>
    </BrowserRouter>
  );
}
