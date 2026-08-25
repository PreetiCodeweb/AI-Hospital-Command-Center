'use client';

import { Check, CheckCircle2, Database, Download, Eye, EyeOff, Gauge, LockKeyhole, RefreshCw, RotateCcw, Save, ShieldCheck, SlidersHorizontal, Volume2, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

type SettingsTab = 'General' | 'Notifications' | 'Data Sources' | 'AI Preferences' | 'Security' | 'Appearance';
const tabs: SettingsTab[] = ['General', 'Notifications', 'Data Sources', 'AI Preferences', 'Security', 'Appearance'];

export function WorkspaceSettings({ close }: { close: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('General');
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState('All changes are local to this prototype.');
  const [toggles, setToggles] = useState({ darkMode: true, compactMode: false, reducedMotion: false, criticalAlerts: true, weeklyDigest: true, explainableSignals: true });
  const [chartDensity, setChartDensity] = useState('Balanced');
  const [forecastHorizon, setForecastHorizon] = useState('24 hours');
  const [accentIntensity, setAccentIntensity] = useState('Operational');
  useEffect(() => {
    const storedTheme = window.localStorage.getItem('medinexus-theme');
    const storedSettings = window.localStorage.getItem('medinexus-settings');
    if (storedSettings) {
      try {
        const savedSettings = JSON.parse(storedSettings);
        if (savedSettings.toggles) setToggles(savedSettings.toggles);
        if (savedSettings.chartDensity) setChartDensity(savedSettings.chartDensity);
        if (savedSettings.forecastHorizon) setForecastHorizon(savedSettings.forecastHorizon);
        if (savedSettings.accentIntensity) setAccentIntensity(savedSettings.accentIntensity);
        return;
      } catch { setStatus('Saved preferences could not be read; using defaults'); }
    }
    if (storedTheme === 'light') setToggles((current) => ({ ...current, darkMode: false }));
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = toggles.darkMode ? 'dark' : 'light';
    root.dataset.compact = toggles.compactMode ? 'true' : 'false';
    root.dataset.reducedMotion = toggles.reducedMotion ? 'true' : 'false';
    root.dataset.chartDensity = chartDensity.toLowerCase();
    root.dataset.accentIntensity = accentIntensity.toLowerCase().replace(' ', '-');
    window.localStorage.setItem('medinexus-theme', toggles.darkMode ? 'dark' : 'light');
    window.localStorage.setItem('medinexus-settings', JSON.stringify({ toggles, chartDensity, forecastHorizon, accentIntensity }));
  }, [toggles, chartDensity, forecastHorizon, accentIntensity]);
  useEffect(() => {
    const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('.settings-workspace .settings-select-row select'));
    const listeners = selects.map((select, index) => {
      const listener = () => {
        if (index === 0) setChartDensity(select.value);
        if (index === 1) setForecastHorizon(select.value);
        if (index === 2) setAccentIntensity(select.value);
        setSaved(false);
        setStatus(`${select.value} selected`);
      };
      select.addEventListener('change', listener);
      return { select, listener };
    });
    return () => listeners.forEach(({ select, listener }) => select.removeEventListener('change', listener));
  }, [activeTab]);
  const toggle = (key: keyof typeof toggles) => { setToggles((current) => ({ ...current, [key]: !current[key] })); setSaved(false); setStatus('Unsaved preference change'); };
  const save = () => { setSaved(true); setStatus('Workspace preferences saved just now'); };
  const reset = () => { setToggles({ darkMode: true, compactMode: false, reducedMotion: false, criticalAlerts: true, weeklyDigest: true, explainableSignals: true }); setChartDensity('Balanced'); setForecastHorizon('24 hours'); setAccentIntensity('Operational'); setSaved(false); setStatus('Preferences reset to recommended defaults'); };
  return <div className="settings-workspace"><div className="settings-workspace-head"><div><span className="eyebrow">Workspace control</span><h2>Settings</h2><p>Configure how MediNexus presents operational intelligence.</p></div><button className="icon-button" onClick={close} aria-label="Close settings"><X size={18} /></button></div><div className="settings-workspace-tabs">{tabs.map((tab) => <button key={tab} className={activeTab === tab ? 'selected' : ''} onClick={() => { setActiveTab(tab); setStatus(`${tab} settings loaded`); }}>{tab}</button>)}</div><div className="settings-workspace-body">{activeTab === 'General' && <><SettingsSection title="Interface preferences" detail="Make the command center fit your operating rhythm." /><SettingToggle label="Dark mode" detail="Use the high-contrast command center theme" on={toggles.darkMode} onToggle={() => toggle('darkMode')} icon={Eye} /><SettingToggle label="Compact mode" detail="Increase information density across panels" on={toggles.compactMode} onToggle={() => toggle('compactMode')} icon={SlidersHorizontal} /><SettingToggle label="Reduced motion" detail="Minimize transitions and graph animation" on={toggles.reducedMotion} onToggle={() => toggle('reducedMotion')} icon={Gauge} /><div className="settings-select-row"><div><strong>Chart density</strong><span>Choose the amount of context shown in charts</span></div><select defaultValue="Balanced"><option>Balanced</option><option>Detailed</option><option>Minimal</option></select></div></>}{activeTab === 'Notifications' && <><SettingsSection title="Notification routing" detail="Choose which operational signals reach your workspace." /><SettingToggle label="Critical alerts" detail="Immediate alerts for safety and capacity thresholds" on={toggles.criticalAlerts} onToggle={() => toggle('criticalAlerts')} icon={Zap} /><SettingToggle label="Weekly digest" detail="Send a Monday summary of decisions and trends" on={toggles.weeklyDigest} onToggle={() => toggle('weeklyDigest')} icon={Volume2} /><button className="settings-action-row" onClick={() => setStatus('Notification test sent to Admin User')}><Volume2 size={17} /><span>Send test notification</span><Check size={16} /></button></>}{activeTab === 'Data Sources' && <><SettingsSection title="Connected data sources" detail="Monitor freshness and connection health." /><div className="data-source-list">{['EHR / Patient census', 'Bed management', 'Staff scheduling', 'Equipment telemetry', 'Emergency arrivals'].map((source, index) => <div className="data-source-row" key={source}><div className="source-icon"><Database size={15} /></div><div><strong>{source}</strong><span>Synced {index + 1} minute{index ? 's' : ''} ago</span></div><span className="source-healthy"><i /> Healthy</span></div>)}</div><button className="secondary-button wide" onClick={() => setStatus('All 24 data sources refreshed just now')}><RefreshCw size={15} /> Refresh all sources</button></>}{activeTab === 'AI Preferences' && <><SettingsSection title="Explainability & model behavior" detail="Keep AI outputs transparent and reviewable." /><SettingToggle label="Explainable signals" detail="Show primary factors beside every prediction" on={toggles.explainableSignals} onToggle={() => toggle('explainableSignals')} icon={ShieldCheck} /><div className="settings-select-row"><div><strong>Forecast horizon</strong><span>Default range for predictive views</span></div><select defaultValue="24 hours"><option>6 hours</option><option>24 hours</option><option>7 days</option></select></div><div className="settings-note"><ShieldCheck size={16} /><span>AI recommendations remain advisory and require authorized human review.</span></div></>}{activeTab === 'Security' && <><SettingsSection title="Security & access" detail="Review workspace protection controls." /><button className="settings-action-row" onClick={() => setStatus('Security activity log opened')}><LockKeyhole size={17} /><span>View security activity log</span><Check size={16} /></button><button className="settings-action-row" onClick={() => setStatus('Session access review started')}><ShieldCheck size={17} /><span>Review active sessions</span><Check size={16} /></button><div className="security-status"><LockKeyhole size={17} /><div><strong>Workspace protected</strong><span>End-to-end encryption and role-based access enabled.</span></div></div></>}{activeTab === 'Appearance' && <><SettingsSection title="Appearance" detail="Tune the visual language of your command center." /><SettingToggle label="Dark mode" detail="Use the high-contrast command center theme" on={toggles.darkMode} onToggle={() => toggle('darkMode')} icon={Eye} /><div className="settings-select-row"><div><strong>Accent intensity</strong><span>Control the strength of status highlights</span></div><select defaultValue="Operational"><option>Operational</option><option>Subtle</option><option>High contrast</option></select></div></>}</div><div className="settings-workspace-footer"><span className={saved ? 'saved' : ''}>{saved && <CheckCircle2 size={14} />}{status}</span><div><button className="control-button" onClick={reset}><RotateCcw size={14} /> Reset</button><button className="primary-button" onClick={save}><Save size={14} /> Save changes</button></div></div></div>;
}
function SettingsSection({ title, detail }: { title: string; detail: string }) { return <div className="settings-section"><h3>{title}</h3><span>{detail}</span></div>; }
function SettingToggle({ label, detail, on, onToggle, icon: Icon }: { label: string; detail: string; on: boolean; onToggle: () => void; icon: typeof Eye }) { return <div className="settings-toggle-row"><div className="settings-toggle-icon"><Icon size={16} /></div><div><strong>{label}</strong><span>{detail}</span></div><button className={`switch ${on ? 'on' : ''}`} onClick={onToggle} aria-pressed={on} aria-label={`${label}: ${on ? 'on' : 'off'}`}><span /></button></div>; }
