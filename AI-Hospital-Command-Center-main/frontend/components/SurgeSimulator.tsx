'use client';

import { ArrowRight, Bed, BrainCircuit, CheckCircle2, Clock3, Pause, Play, RefreshCw, ShieldCheck, Users, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { runSimulation } from '../simulationService';

const scenarios = [
  { id: 'mass-casualty', label: 'Mass casualty event', influx: 420, duration: 12, severity: 'Critical', beds: 72, staff: 58, icon: 'MC', description: 'Sudden high-acuity arrivals following a major incident.' },
  { id: 'flu-outbreak', label: 'Flu outbreak', influx: 260, duration: 72, severity: 'High', beds: 132, staff: 68, icon: 'FLU', description: 'Sustained respiratory demand across emergency and ward capacity.' },
  { id: 'heatwave', label: 'Heatwave', influx: 180, duration: 24, severity: 'Moderate', beds: 160, staff: 74, icon: 'HEAT', description: 'Elevated arrivals with a slower recovery profile over one day.' },
  { id: 'traffic-accident', label: 'Major traffic accident', influx: 340, duration: 8, severity: 'High', beds: 94, staff: 62, icon: 'MTA', description: 'Compressed trauma surge with a short, intense arrival window.' },
  { id: 'custom', label: 'Custom scenario', influx: 240, duration: 12, severity: 'High', beds: 132, staff: 72, icon: 'EDIT', description: 'Build a scenario from the operational controls below.' },
];
const severityMultiplier: Record<string, number> = { Moderate: .72, High: .9, Critical: 1.08 };

export function SurgeSimulator() {
  const [scenarioId, setScenarioId] = useState('mass-casualty');
  const [influx, setInflux] = useState(420);
  const [duration, setDuration] = useState(12);
  const [severity, setSeverity] = useState('Critical');
  const [beds, setBeds] = useState(72);
  const [staff, setStaff] = useState(58);
  const [running, setRunning] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [lastRun, setLastRun] = useState('Preview ready');
  const scenario = scenarios.find((item) => item.id === scenarioId) || scenarios[0];
  const result = useMemo(() => {
    const pressure = influx * severityMultiplier[severity];
    const overload = Math.max(68, Math.min(100, Math.round(68 + pressure / 15 - staff / 8 + (180 - beds) / 16)));
    const overloadHours = Math.max(1.5, Math.round((beds / Math.max(50, pressure)) * 18 * 10) / 10);
    const shortage = staff < 65 ? 'High' : staff < 80 ? 'Moderate' : 'Low';
    const equipment = pressure > 300 ? 'Ventilators + monitors' : pressure > 190 ? 'Ventilators' : 'No immediate shortage';
    return { overload, overloadHours, shortage, equipment, peak: Math.min(99, overload + 3) };
  }, [beds, influx, severity, staff]);
  const chart = Array.from({ length: 8 }, (_, index) => ({ label: `${index * 2}h`, value: Math.min(100, Math.round(34 + index * (result.overload - 30) / 7)) }));
  const selectScenario = (next: typeof scenarios[number]) => { setScenarioId(next.id); setInflux(next.influx); setDuration(next.duration); setSeverity(next.severity); setBeds(next.beds); setStaff(next.staff); setRunning(false); setLastRun(`${next.label} loaded`); };
  const run = async () => {
    if (running) { setRunning(false); setLastRun('Simulation paused'); return; }
    setRequestPending(true);
    try {
      await runSimulation({ department_type: 'EMERGENCY', additional_arrivals: influx, window_hours: duration, apply_optimization: true });
      setRunning(true);
      setLastRun('Simulation recalculated just now');
    } catch (error) {
      setLastRun(error instanceof Error ? error.message : 'Simulation request failed');
    } finally {
      setRequestPending(false);
    }
  };
  return <div className="surge-simulator"><div className="simulator-header"><div><span className="eyebrow">Scenario planning / decision support</span><h1>Emergency surge simulator</h1><p>Explore hypothetical pressure before it reaches the floor.</p></div><div className="simulator-state"><i className={running ? 'running' : ''} /> {running ? 'Simulation running' : 'Preview mode'}<span>SIM-042</span></div></div><div className="scenario-tabs-functional">{scenarios.map((item) => <button key={item.id} className={scenarioId === item.id ? 'selected' : ''} onClick={() => selectScenario(item)}><b>{item.icon}</b><span>{item.label}</span>{scenarioId === item.id && <CheckCircle2 size={14} />}</button>)}</div><div className="selected-scenario"><div><span className="eyebrow">Selected scenario</span><h2>{scenario.label}</h2><p>{scenario.description}</p></div><div><span>Projected influx</span><strong>+{influx}</strong><small>patients / {duration} hours</small></div><div><span>Severity</span><strong className={severity.toLowerCase()}>{severity}</strong><small>Model response profile</small></div></div><div className="simulator-content"><section className="panel simulator-controls"><div className="section-title"><div><h2>Scenario controls</h2><span>Changes recalculate outputs immediately</span></div><button className="icon-button" onClick={() => selectScenario(scenarios[4])} aria-label="Reset to custom scenario"><RefreshCw size={16} /></button></div><RangeControl label="Expected patient influx" value={influx} min={0} max={500} suffix="patients" onChange={(value) => { setScenarioId('custom'); setInflux(value); setLastRun('Unsaved parameter change'); }} /><RangeControl label="Duration" value={duration} min={1} max={72} suffix="hours" onChange={(value) => { setScenarioId('custom'); setDuration(value); setLastRun('Unsaved parameter change'); }} /><RangeControl label="Staff availability" value={staff} min={40} max={100} suffix="%" onChange={(value) => { setScenarioId('custom'); setStaff(value); setLastRun('Unsaved parameter change'); }} /><RangeControl label="Available beds" value={beds} min={0} max={500} suffix="beds" onChange={(value) => { setScenarioId('custom'); setBeds(value); setLastRun('Unsaved parameter change'); }} /><label className="severity-control">Severity<select value={severity} onChange={(event) => { setScenarioId('custom'); setSeverity(event.target.value); setLastRun('Unsaved parameter change'); }}><option>Moderate</option><option>High</option><option>Critical</option></select></label><button className="primary-button wide" onClick={run}>{running ? <><Pause size={16} /> Pause simulation</> : <><Play size={16} /> Run simulation</>}</button><span className="simulation-status"><i /> {lastRun}</span></section><section className="panel simulator-visual"><div className="section-title"><div><h2>Operational pressure projection</h2><span>Current scenario / baseline comparison</span></div><span className="model-label">MODEL v2.4</span></div><div className="projection-chart"><div className="projection-grid" />{chart.map((point) => <div className="projection-column" key={point.label}><div className="projection-bar" style={{ height: `${point.value}%` }}><span>{point.value}%</span></div><small>{point.label}</small></div>)}</div><div className="projection-legend"><span><i className="red" />ICU load</span><span><i className="orange" />Bed demand</span><span><i className="teal" />Staff pressure</span></div><div className="simulation-stream"><span><i /> Arrival velocity</span><strong>+{Math.round(influx / 12)} / hour</strong><span><i /> Peak window</span><strong>Hour {Math.max(2, Math.round(result.overloadHours))} - {Math.max(4, Math.round(result.overloadHours) + 3)}</strong></div></section><section className="panel simulator-results"><div className="ai-badge"><BrainCircuit size={16} /> Recalculated output</div><h2>Simulation results</h2><span className="result-context">{scenario.label} / {severity} profile</span><Result label="Predicted ICU overload" value={`In ${result.overloadHours} hours`} tone="critical" /><Result label="Maximum bed utilization" value={`${result.peak}%`} tone="critical" /><Result label="Staff shortage risk" value={result.shortage} tone={result.shortage === 'High' ? 'high' : 'warning'} /><Result label="Equipment shortage" value={result.equipment} tone="warning" /><div className="intervention-card"><span>With intervention / +8 staff</span><strong>{Math.max(72, result.peak - 9)}%</strong><small>Projected peak utilization</small></div><button className="secondary-button wide" onClick={() => setLastRun('Recommendations generated for review')}><Zap size={15} /> Generate recommendations</button></section></div><div className="simulator-foot"><ShieldCheck size={15} /><span>Simulation outputs are decision-support estimates and require operational review before action.</span><span><Clock3 size={14} /> Updated from mock model just now</span></div></div>;
}
function RangeControl({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) { return <div className="range-control"><div><label>{label}</label><strong>{value} <small>{suffix}</small></strong></div><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /><div><span>{min}</span><span>{max} {suffix}</span></div></div>; }
function Result({ label, value, tone }: { label: string; value: string; tone: string }) { return <div className="sim-result"><span>{label}</span><strong className={tone}>{value}</strong></div>; }
