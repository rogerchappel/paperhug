import { useMemo, useState } from 'react';
import { createCardDraft, occasions, styles } from '@paperhug/app-core';
import { downloadCardPdf, downloadProjectJson } from './downloads.js';
import './styles.css';

const toneChips = ['warm', 'funny', 'from the kids', 'less cheesy', 'heartfelt', 'playful'];

export default function App() {
  const [form, setForm] = useState({
    occasionId: 'birthday',
    styleId: 'warm-watercolour',
    recipient: 'Mum',
    sender: 'Henry and Arthur',
    tone: 'funny, loving, not cheesy',
    message: ''
  });
  const draft = useMemo(() => createCardDraft(form), [form]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const addTone = (chip) => update('tone', form.tone ? `${form.tone}, ${chip}` : chip);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Paperhug</p>
        <h1>Make a printable card without fighting design tools.</h1>
        <p className="hero-copy">
          A family-friendly web and mobile surface for the Paperhug engine: occasion, details, preview, then print with the right landscape duplex defaults.
        </p>
        <div className="surface-pills" aria-label="Available surfaces">
          <span>Web app</span>
          <span>iOS + Android via Capacitor</span>
          <span>CLI engine underneath</span>
        </div>
      </section>

      <section className="builder-grid" aria-label="Card builder">
        <form className="card-form">
          <div className="step-heading">
            <span>1</span>
            <div>
              <h2>Card details</h2>
              <p>Keep it simple enough for a non-technical family member.</p>
            </div>
          </div>

          <label>
            Occasion
            <select value={form.occasionId} onChange={(event) => update('occasionId', event.target.value)}>
              {occasions.map((occasion) => <option key={occasion.id} value={occasion.id}>{occasion.name}</option>)}
            </select>
          </label>

          <div className="two-col">
            <label>
              Recipient
              <input value={form.recipient} onChange={(event) => update('recipient', event.target.value)} />
            </label>
            <label>
              From
              <input value={form.sender} onChange={(event) => update('sender', event.target.value)} />
            </label>
          </div>

          <label>
            Style
            <select value={form.styleId} onChange={(event) => update('styleId', event.target.value)}>
              {styles.map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}
            </select>
          </label>

          <label>
            Tone / brief
            <textarea value={form.tone} rows="3" onChange={(event) => update('tone', event.target.value)} />
          </label>

          <div className="chip-row" aria-label="Tone shortcuts">
            {toneChips.map((chip) => <button type="button" key={chip} onClick={() => addTone(chip)}>{chip}</button>)}
          </div>

          <label>
            Exact message <small>(optional)</small>
            <textarea value={form.message} rows="4" placeholder="Leave blank to let Paperhug draft it." onChange={(event) => update('message', event.target.value)} />
          </label>
        </form>

        <aside className="preview-panel" aria-label="Card preview">
          <div className="phone-frame">
            <div className="card-preview">
              <p className="cover-kicker">{draft.occasion.name}</p>
              <h2>{draft.coverTitle}</h2>
              <p>For {draft.recipient}</p>
              <span>{draft.style.name}</span>
            </div>
            <div className="message-preview">
              <p>{draft.message}</p>
              <small>From {draft.sender}</small>
            </div>
          </div>

          <div className="print-card">
            <h3>Print intent</h3>
            <dl>
              <div><dt>Paper</dt><dd>{draft.printIntent.paper}</dd></div>
              <div><dt>Orientation</dt><dd>{draft.printIntent.orientation}</dd></div>
              <div><dt>Duplex</dt><dd>{draft.printIntent.duplex}</dd></div>
            </dl>
            <div className="action-stack">
              <button type="button" onClick={() => downloadCardPdf(draft)}>Download card PDF</button>
              <button type="button" className="secondary" onClick={() => downloadProjectJson(draft)}>Download project JSON</button>
              <button type="button" className="secondary" onClick={() => window.print()}>Preview browser print</button>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
