import { useState } from 'react';
import InvestigateSection from './components/InvestigateSection';
import TopBar from './components/TopBar';
import HeroSection from './components/HeroSection';
import RisingSection from './components/RisingSection';
import CitiesMatrix from './components/CitiesMatrix';
import { GapsSection, GlossarySection, SourcesSection } from './components/StaticSections';
import UploadModal from './components/UploadModal';
import DetectivePanel from './components/DetectivePanel';
import { ACTIONS } from './data/findings';

export default function App() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  // A question sent from "Investigate any place", with the live result as context
  const [pending, setPending] = useState<{ question: string; context: string; id: number } | null>(null);

  function handleGoTo(target: string) {
    const [section] = target.split(':');
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <TopBar onUpload={() => setUploadOpen(true)} onAsk={() => setChatOpen(true)} />
      <main id="main">
        <HeroSection onUpload={() => setUploadOpen(true)} onGoTo={handleGoTo} />
        <InvestigateSection onAsk={(question, context) => { setPending({ question, context, id: Date.now() }); setChatOpen(true); }} />
        <RisingSection />
        <CitiesMatrix />


        <section id="causes" className="sec wrap">
          <h2 className="sec-h">Findings and actions</h2>
          <p className="sec-intro">Which factors the evidence points to, and what to do first, ordered by how strong the evidence is.</p>
          <ol className="alist">
            {ACTIONS.map((a, i) => (
              <li key={i}>
                <h4>{a.title}</h4>
                <div className="meta"><span>{a.who}</span></div>
                <p>{a.why}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="history" className="sec wrap">
          <h2 className="sec-h">Since 1902</h2>
          <p className="sec-intro">Major floods and the factors that built up behind them.</p>
          <ol className="tl">
            {[
              { when: '1902', title: 'Manila South Harbor tide gauge starts recording', text: 'The longest record in this investigation. It gives 95 usable years of sea level at the Manila shoreline up to 2022.' },
              { when: '1965 onward', title: 'Sea level at Manila starts rising about nine times faster', text: 'Our test of the tide-gauge record finds +15 mm per decade before 1965 and +139 mm per decade after.' },
              { when: 'Sep 2009', title: 'Ondoy (Ketsana)', text: '455 mm fell in 24 hours at Science Garden, Quezon City. The Marikina River peaked near 21.5 m.' },
              { when: 'Dec 2011', title: 'Sendong (Washi)', text: 'Flash floods hit Cagayan de Oro and Iligan at night. Death tolls range from about 1,200 to 2,500 across sources.' },
              { when: 'Nov 2020', title: 'Ulysses (Vamco)', text: 'The Marikina River peaked about 22 m. At Tuguegarao the Buntun gauge hit 13.3 m, 39 of 49 barangays flooded.' },
              { when: 'Oct 2024', title: 'Kristine (Trami)', text: 'Naga reported over 700 mm in 24 hours, with 22 of 27 barangays under water. Buntun Bridge at Tuguegarao reached 11.2 m.' },
            ].map((e, i) => (
              <li key={i}>
                <div className="when">{e.when}</div>
                <h4>{e.title}</h4>
                <p>{e.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <GapsSection />

        <section id="ask" className="sec wrap">
          <h2 className="sec-h">Ask Detective</h2>
          <p className="sec-intro">
            Click the button below or the floating button in the bottom-right corner to ask questions about the data, predictions, and what is missing.
          </p>
          <button type="button" className="btn" onClick={() => setChatOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 6 }}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>
            Open Ask Detective
          </button>
        </section>

        <GlossarySection />
        <SourcesSection />
      </main>

      <footer>
        <div className="wrap">
          Built from NASA POWER, GPM IMERG and MODIS, NOAA (GHCN, IBTrACS, ONI), PSMSL, GHSL, Dartmouth Flood Observatory, MMDA and census records, 1902 to 2025.
          Trends describe the past and are not forecasts.
        </div>
      </footer>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <DetectivePanel open={chatOpen} onOpen={() => setChatOpen(true)} onClose={() => setChatOpen(false)} pending={pending} />
    </>
  );
}
