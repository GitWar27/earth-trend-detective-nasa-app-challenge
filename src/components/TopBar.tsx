import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { href: '#overview', label: 'Overview' },
  { href: '#investigate', label: 'Investigate' },
  { href: '#rising', label: 'The suspects' },
  { href: '#cities', label: 'Factors by city' },
  { href: '#causes', label: 'Findings and actions' },
  { href: '#history', label: 'Since 1902' },
  { href: '#gaps', label: 'What is missing' },
  { href: '#ask', label: 'Ask Detective', className: 'askl' },
  { href: '#glossary', label: 'Glossary' },
  { href: '#sources', label: 'Sources' },
];

interface Props { onUpload: () => void; onAsk: () => void; }

export default function TopBar({ onUpload, onAsk }: Props) {
  const [current, setCurrent] = useState('overview');

  useEffect(() => {
    const ids = NAV_LINKS.map(l => l.href.slice(1));
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setCurrent(e.target.id); }),
      { rootMargin: '-20% 0px -70% 0px' }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <header className="top">
      <div className="wrap bar">
        <a className="brand" href="#overview">Earth Trend Detective</a>
        <nav id="nav" aria-label="Sections">
          {NAV_LINKS.map(l => (
            l.href === '#ask'
              ? <a key={l.href} href={l.href} className={l.className} onClick={e => { e.preventDefault(); onAsk(); }} aria-current={current === 'ask' ? 'true' : undefined}>{l.label}</a>
              : <a key={l.href} href={l.href} className={l.className} aria-current={current === l.href.slice(1) ? 'true' : undefined}>{l.label}</a>
          ))}
        </nav>
        <button type="button" className="btn upopen" onClick={onUpload}>
          Upload / Test your data
        </button>
      </div>
    </header>
  );
}
