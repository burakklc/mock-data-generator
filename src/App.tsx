import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';

interface NavItem {
  path: string;
  label: string;
}

const navigation: NavItem[] = [
  { path: '/', label: 'Home' },
  { path: '/blog', label: 'Blog' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
  { path: '/privacy-policy', label: 'Privacy Policy' },
  { path: '/terms-of-service', label: 'Terms of Service' },
  { path: '/cookie-policy', label: 'Cookie Policy' },
];

function NavigationList({ className }: { className?: string }) {
  return (
    <nav className={className}>
      <ul className="site-nav">
        {navigation.map((item) => (
          <li key={item.path}>
            <NavLink to={item.path} className={({ isActive }) => (isActive ? 'is-active' : undefined)} end={item.path === '/'}>
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
    <div className="site-shell">
      <header className="site-header">
        <div className="site-logo">
          <NavLink to="/">MockData.net</NavLink>
        </div>
        <NavigationList />
      </header>
      <main className="site-main" id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>© {new Date().getFullYear()} MockData.net. All rights reserved.</p>
        <NavigationList className="site-footer__nav" />
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsPage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
