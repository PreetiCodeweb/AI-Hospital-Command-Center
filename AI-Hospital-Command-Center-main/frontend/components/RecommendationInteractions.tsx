'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, ClipboardList, X } from 'lucide-react';

const recommendations = [
  'Reserve 2 ICU beds and prepare ventilators',
  'Augment nursing staff in ER and ICU',
  'Defer 3 low-priority surgeries',
  'Activate step-down unit for overflow',
];

export function RecommendationInteractions() {
  const [logOpen, setLogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<Record<number, string>>({});

  useEffect(() => {
    if (window.location.pathname !== '/recommendations') return;

    let cleanup = () => {};
    const bindControls = () => {
      const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.decision-tabs button'));
      const cards = Array.from(document.querySelectorAll<HTMLElement>('.recommendation-cards .rec-card'));
      if (!tabs.length || !cards.length) return;
    const filterCards = (filter: string) => {
      cards.forEach((card, index) => {
        const visible = filter === 'All' || filter === 'Critical' || filter === 'High impact'
          ? index < 2
          : index >= 2;
        card.style.display = visible ? '' : 'none';
      });
    };
    const listeners = tabs.map((tab) => {
      const listener = () => filterCards(tab.textContent?.trim() || 'All');
      tab.addEventListener('click', listener);
      return { tab, listener };
    });
    const decisionLog = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) => button.textContent?.includes('Decision log'));
    const openLog = () => setLogOpen(true);
    decisionLog?.addEventListener('click', openLog);

      cleanup = () => {
      listeners.forEach(({ tab, listener }) => tab.removeEventListener('click', listener));
      decisionLog?.removeEventListener('click', openLog);
      };
    };
    const observer = new MutationObserver(bindControls);
    observer.observe(document.body, { childList: true, subtree: true });
    bindControls();

    return () => {
      observer.disconnect();
      cleanup();
    };
  }, []);

  if (!logOpen) return null;

  return <>
    <div className="drawer-backdrop" onClick={() => setLogOpen(false)} />
    <aside className="slide-over recommendation-log" aria-label="Decision log">
      <div className="drawer-head">
        <div><span className="eyebrow">Human review history</span><h2>Decision log</h2></div>
        <button className="icon-button" onClick={() => setLogOpen(false)} aria-label="Close decision log"><X size={18} /></button>
      </div>
      <div className="profile-panel">
        <div className="data-health"><CheckCircle2 size={18} /><div><strong>12 open decisions</strong><span>3 require critical review</span></div></div>
        {selectedIndex === null ? recommendations.map((title, index) => <button className="drawer-row" key={title} onClick={() => setSelectedIndex(index)}><span><strong>0{index + 1} / {title}</strong><small>{statuses[index] || 'Pending human review'}</small></span><ChevronRight size={16} /></button>) : <div className="decision-log-detail">
          <button className="back-link" onClick={() => setSelectedIndex(null)}><ChevronRight size={15} /> Back to decisions</button>
          <span className="eyebrow">Decision 0{selectedIndex + 1}</span>
          <h3>{recommendations[selectedIndex]}</h3>
          <p>Review the recommended action and record the next workflow state.</p>
          <div className="decision-log-actions">
            <button className="primary-button" onClick={() => { setStatuses((current) => ({ ...current, [selectedIndex]: 'Approved by Admin User' })); setSelectedIndex(null); }}><CheckCircle2 size={16} /> Approve</button>
            <button className="secondary-button" onClick={() => { setStatuses((current) => ({ ...current, [selectedIndex]: 'Deferred for review' })); setSelectedIndex(null); }}>Defer</button>
          </div>
        </div>}
        <div className="data-health"><ClipboardList size={18} /><div><strong>Auditable workflow</strong><span>Reviewer, timestamp, and outcome are tracked.</span></div></div>
      </div>
    </aside>
  </>;
}
