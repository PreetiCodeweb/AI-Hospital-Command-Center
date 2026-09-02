'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, BrainCircuit, CheckCircle2, FileImage, LoaderCircle, ScanLine, ShieldCheck, Upload } from 'lucide-react';
import { simulateInjuryScan, uploadInjuryScan, type InjuryScanResponse } from '../injuryDetectionService';

const regions = ['HEAD', 'LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_FOREARM', 'RIGHT_FOREARM', 'LEFT_KNEE', 'RIGHT_KNEE', 'LEFT_ANKLE', 'RIGHT_ANKLE', 'LOWER_BACK'] as const;
type Region = typeof regions[number];
const pretty = (value: string) => value.split('_').map((part) => part[0] + part.slice(1).toLowerCase()).join(' ');
const tone = (value: string) => value === 'HIGH' ? 'critical' : value === 'MEDIUM' ? 'warning' : 'low';

export function InjuryScanner() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [patientRef, setPatientRef] = useState('');
  const [regionHint, setRegionHint] = useState<Region>('LEFT_KNEE');
  const [scanning, setScanning] = useState(false);
  const [response, setResponse] = useState<InjuryScanResponse | null>(null);
  const [error, setError] = useState('');
  const choose = (next?: File) => {
    if (!next) return;
    if (!next.type.startsWith('image/') && next.type !== 'application/dicom' && !next.name.toLowerCase().endsWith('.dcm')) { setError('Choose a PNG, JPG, WEBP, or DICOM file.'); return; }
    if (next.size > 50 * 1024 * 1024) { setError('Choose an image smaller than 50 MB.'); return; }
    setFile(next); setResponse(null); setError('');
  };
  const run = async () => {
    setScanning(true); setError('');
    try {
      if (file) {
        const form = new FormData(); form.append('file', file); if (patientRef.trim()) form.append('patient_ref', patientRef.trim()); form.append('region_hint', regionHint);
        setResponse(await uploadInjuryScan(form));
      } else {
        setResponse(await simulateInjuryScan({ patient_ref: patientRef.trim() || null, simulate_region_hint: regionHint }));
      }
    } catch { setError('The scan could not be completed. Confirm that the API is running and try again.'); }
    finally { setScanning(false); }
  };
  return <section className="injury-scanner-page"><header className="scanner-heading"><div><span className="eyebrow">Secure clinical decision support</span><h1>Injury detection scanner</h1><p>Upload a study or run a guided demo scan. Findings require clinician review.</p></div><span className="secure-label"><ShieldCheck size={16} /> Encrypted workspace</span></header><div className="scanner-disclaimer"><ShieldCheck size={17} /><span><strong>Clinical review required.</strong> Results identify potential areas of concern; they are not a diagnosis.</span></div><div className="scanner-grid"><article className="panel scanner-input-panel"><div className="scanner-panel-title"><div><span className="eyebrow">01 / Input study</span><h2>Prepare scan analysis</h2></div><ScanLine size={20} /></div><label className="scanner-field">De-identified patient reference<input value={patientRef} onChange={(event) => setPatientRef(event.target.value)} placeholder="e.g. MN-28401" /></label><label className="scanner-field">Region of concern<select value={regionHint} onChange={(event) => setRegionHint(event.target.value as Region)}>{regions.map((region) => <option value={region} key={region}>{pretty(region)}</option>)}</select></label><div className="scanner-dropzone"><div className="scanner-upload-icon"><Upload size={22} /></div><strong>{file ? file.name : 'Drop imaging study here'}</strong><span>{file ? 'Ready to analyse' : 'PNG, JPG, WEBP, or DICOM · 50 MB maximum'}</span><input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,.dcm" onChange={(event) => choose(event.target.files?.[0])} /><button type="button" className="secondary-button" onClick={() => inputRef.current?.click()}>{file ? 'Replace file' : 'Browse files'}</button></div>{error && <div className="scanner-error" role="alert"><AlertTriangle size={16} />{error}</div>}<button className="primary-button wide scanner-run" disabled={scanning} onClick={run}>{scanning ? <><LoaderCircle className="scanner-spin" size={17} /> Analysing study…</> : <><ScanLine size={17} /> Run injury analysis</>}</button></article><article className="panel scanner-results-panel"><div className="scanner-panel-title"><div><span className="eyebrow">02 / Analysis output</span><h2>{response ? 'Potential findings' : 'Awaiting analysis'}</h2></div>{response && <span className="scanner-count">{response.areas_of_concern} flagged</span>}</div>{response ? <><div className="scanner-findings">{response.findings.map((finding) => <div className="scanner-finding" key={`${finding.region}-${finding.possible_injury}`}><i className={tone(finding.severity)} /><div><strong>{pretty(finding.region)}</strong><span>{finding.possible_injury}</span><small>{finding.recommended_action}</small></div><em className={tone(finding.severity)}>{finding.severity}</em></div>)}</div><small className="scanner-scan-id"><CheckCircle2 size={14} /> Scan ID / {response.scan_id.slice(0, 8).toUpperCase()} · {new Date(response.scanned_at).toLocaleString()}</small></> : <div className="scanner-empty"><FileImage size={31} /><strong>Your findings will appear here</strong><span>Upload a study or run the guided demo scanner to begin.</span><BrainCircuit size={20} /></div>}</article></div></section>;
}
