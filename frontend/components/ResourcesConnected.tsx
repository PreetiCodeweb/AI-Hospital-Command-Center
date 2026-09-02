'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Bed, CheckCircle2, LoaderCircle, RefreshCw, Send } from 'lucide-react';
import { apiRequest, ApiError } from '../apiClient';
import type { Bed as BedRecord, BedSummary } from '../types';

export function ResourcesConnected() {
  const [beds, setBeds] = useState<BedRecord[]>([]);
  const [summary, setSummary] = useState<BedSummary[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const [nextSummary, nextBeds] = await Promise.all([
        apiRequest<BedSummary[]>('/api/v1/beds'),
        apiRequest<BedRecord[]>('/api/v1/beds/ICU'),
      ]);
      setSummary(nextSummary); setBeds(nextBeds);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to load live bed availability.');
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const requestBed = async () => {
    const available = beds.find((bed) => bed.status === 'available');
    if (!available) { setError('No available ICU bed is currently eligible for request.'); return; }
    setSubmitting(true); setError(''); setMessage('');
    try {
      const order = await apiRequest<{ id: string }>('/api/v1/orders', { method: 'POST', body: JSON.stringify({ bed_id: available.id, department_id: available.department_id, bed_type: available.bed_type, quantity }) });
      setMessage(`Request ${order.id.slice(0, 8).toUpperCase()} submitted for review.`);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The bed request could not be submitted.');
    } finally { setSubmitting(false); }
  };
  return <section className="connected-resources"><div className="page-header"><div><span className="eyebrow">Capacity intelligence</span><h1>Beds & resource management</h1><p>Live availability from the hospital operations database.</p></div><button className="secondary-button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> Refresh</button></div><div className="stat-band">{summary.map((item) => <div key={item.department_type}><span>{item.department_type}</span><strong>{item.available}</strong><small>{item.available} available / {item.total_beds} total · {item.occupancy_pct}% occupied</small></div>)}</div><div className="panel" style={{ marginTop: 16, padding: 20 }}><div className="section-title"><div><h2>Request ICU capacity</h2><span>Creates a pending order visible to administrators.</span></div><Bed size={20} /></div><div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}><label>Quantity<input type="number" min={1} max={100} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label><button className="primary-button" onClick={() => void requestBed()} disabled={submitting || loading}>{submitting ? <><LoaderCircle className="scanner-spin" size={16} /> Submitting…</> : <><Send size={16} /> Request ICU bed</>}</button></div>{message && <p role="status" style={{ color: 'var(--teal)' }}><CheckCircle2 size={16} /> {message}</p>}{error && <p role="alert" style={{ color: 'var(--red)' }}><AlertTriangle size={16} /> {error}</p>}</div><div className="panel" style={{ marginTop: 16, padding: 20 }}><div className="section-title"><div><h2>ICU bed inventory</h2><span>{loading ? 'Loading live inventory…' : `${beds.length} beds`}</span></div></div>{loading ? <p>Loading live bed inventory…</p> : <div className="table-scroll"><table><thead><tr><th>Bed</th><th>Type</th><th>Status</th><th>Department</th></tr></thead><tbody>{beds.map((bed) => <tr key={bed.id}><td>{bed.bed_number}</td><td>{bed.bed_type}</td><td>{bed.status}</td><td>{bed.department_id.slice(0, 8)}</td></tr>)}</tbody></table></div>}</div></section>;
}
