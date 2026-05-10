import { useMemo, useState } from 'react';
import { createCardDraft, occasions, styles } from '@paperhug/app-core';
import './styles.css';

const steps = ['Occasion', 'Recipient', 'Style', 'Message', 'Preview', 'Print'];

export default function App() {
  const [form, setForm] = useState({
    occasionId: 'birthday',
    styleId: 'kids-crayon',
    recipient: 'Nanna',
    sender: 'The kids',
    tone: 'sweet, funny, hand-made feeling',
    message: ''
  });
  const [step, setStep] = useState(0);
  const draft = useMemo(() => createCardDraft(form), [form]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <main className="mobile-shell">
      <header className="mobile-header">
        <p>Paperhug</p>
        <h1>{steps[step]}</h1>
        <div className="progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((label, index) => <span key={label} className={index <= step ? 'active' : ''} />)}
        </div>
      </header>

      {step === 0 && (
        <section className="screen-card">
          <h2>What's the occasion?</h2>
          <div className="choice-grid">
            {occasions.map((occasion) => (
              <button key={occasion.id} className={form.occasionId === occasion.id ? 'selected' : ''} onClick={() => update('occasionId', occasion.id)}>
                {occasion.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="screen-card">
          <h2>Who is it for?</h2>
          <label>Recipient<input value={form.recipient} onChange={(event) => update('recipient', event.target.value)} /></label>
          <label>From<input value={form.sender} onChange={(event) => update('sender', event.target.value)} /></label>
        </section>
      )}

      {step === 2 && (
        <section className="screen-card">
          <h2>Pick a look</h2>
          <div className="choice-grid">
            {styles.map((style) => (
              <button key={style.id} className={form.styleId === style.id ? 'selected' : ''} onClick={() => update('styleId', style.id)}>
                {style.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="screen-card">
          <h2>Message brief</h2>
          <label>Make it feel<textarea rows="5" value={form.tone} onChange={(event) => update('tone', event.target.value)} /></label>
          <label>Exact words, if you have them<textarea rows="5" value={form.message} placeholder="Optional" onChange={(event) => update('message', event.target.value)} /></label>
        </section>
      )}

      {step === 4 && (
        <section className="screen-card preview-screen">
          <h2>Preview</h2>
          <article className="mini-card">
            <small>{draft.occasion.name}</small>
            <h3>{draft.coverTitle}</h3>
            <p>For {draft.recipient}</p>
          </article>
          <article className="inside-message">
            <p>{draft.message}</p>
          </article>
        </section>
      )}

      {step === 5 && (
        <section className="screen-card">
          <h2>Ready to print</h2>
          <p className="helper">Paperhug keeps these settings explicit so the card prints correctly on A4.</p>
          <ul className="print-list">
            <li>A4 paper</li>
            <li>Landscape orientation</li>
            <li>Short-edge double-sided printing</li>
          </ul>
          <button className="primary" onClick={() => window.print()}>Open print preview</button>
        </section>
      )}

      <nav className="bottom-nav" aria-label="Builder navigation">
        <button disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</button>
        <button className="primary" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>{step === steps.length - 1 ? 'Done' : 'Next'}</button>
      </nav>
    </main>
  );
}
