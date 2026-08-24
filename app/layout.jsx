import './globals.css';
import Link from 'next/link';
import { Wordmark } from '../components/ui';
import NavToggle from '../components/NavToggle';

export const metadata = {
  title: { default: 'False Idols — Events', template: '%s — False Idols' },
  description: 'False Idols Freestyle Athletics — events, calendar, and community media.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="site-header">
          <Wordmark />
          <NavToggle />
          <nav className="site-nav">
            <Link href="/events">EVENTS</Link>
            <Link href="/calendar">CALENDAR</Link>
            <Link href="/events/archive">PAST EVENTS</Link>
            <a href="https://www.falseidols.us" target="_blank" rel="noopener">SHOP</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wm-row"><span className="wm-false">FALSE</span><span className="wm-idols">IDOLS</span></div>
          <p className="tagline">NO IDOLS. NO LIMITS.</p>
          <p className="fine">
            © {new Date().getFullYear()} False Idols Freestyle Athletics ·{' '}
            <a href="https://www.falseidols.us/policies/privacy-policy" target="_blank" rel="noopener">Privacy</a> ·{' '}
            <Link href="/admin">Team Login</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
