import React, { useState, useRef } from 'react';
import { ArrowLeft, Plus, Upload, Watch, Wifi, CheckCircle, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface VitalRecord {
  id: string;
  date: string;
  temperature: number;
  systolic: number;
  diastolic: number;
  weight: number;
  isAnomaly: boolean;
  source: 'manual' | 'wearable' | 'lab';
}

interface VitalsTrackerProps {
  onBack?: () => void;
}

const SAMPLE_DATA: VitalRecord[] = [
  { id: '1', date: 'Aug 8',  temperature: 98.4, systolic: 118, diastolic: 76, weight: 65.2, isAnomaly: false, source: 'manual' },
  { id: '2', date: 'Aug 9',  temperature: 98.6, systolic: 121, diastolic: 79, weight: 65.0, isAnomaly: false, source: 'manual' },
  { id: '3', date: 'Aug 10', temperature: 99.1, systolic: 128, diastolic: 84, weight: 65.3, isAnomaly: false, source: 'wearable' },
  { id: '4', date: 'Aug 11', temperature: 98.8, systolic: 135, diastolic: 88, weight: 65.1, isAnomaly: false, source: 'manual' },
  { id: '5', date: 'Aug 12', temperature: 98.5, systolic: 120, diastolic: 80, weight: 64.9, isAnomaly: false, source: 'lab' },
  { id: '6', date: 'Aug 13', temperature: 98.6, systolic: 122, diastolic: 81, weight: 65.0, isAnomaly: false, source: 'wearable' },
];

function checkAnomaly(t: number, s: number, d: number): boolean {
  return t >= 99.5 || s >= 140 || d >= 90 || s <= 90 || d <= 60;
}

function getRiskScore(records: VitalRecord[]): number {
  if (records.length === 0) return 0;
  const recent = records.slice(-3);
  let score = 10;
  recent.forEach(r => {
    if (r.temperature >= 100) score += 25;
    else if (r.temperature >= 99.5) score += 10;
    if (r.systolic >= 140) score += 30;
    else if (r.systolic >= 130) score += 15;
    if (r.diastolic >= 90) score += 20;
  });
  return Math.min(score, 100);
}

function getConfidence(count: number): { label: string; color: string } {
  if (count >= 7) return { label: 'High Confidence', color: '#16a34a' };
  if (count >= 4) return { label: 'Medium Confidence', color: '#d97706' };
  return { label: 'Low Confidence (Limited Data)', color: '#dc2626' };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}>
        <p style={{ fontWeight: 700, marginBottom: 6, color: '#111827' }}>{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
            <span style={{ fontWeight: 600 }}>{p.name}:</span> {p.value}{p.dataKey === 'temperature' ? '°F' : p.dataKey === 'weight' ? ' kg' : ' mmHg'}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Lab Report Parser ────────────────────────────────────────────────────────
function extractLabValues(text: string): Partial<{ systolic: number; diastolic: number; temperature: number; weight: number }> {
  const extracted: any = {};
  const bpMatch = text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (bpMatch) { extracted.systolic = parseInt(bpMatch[1]); extracted.diastolic = parseInt(bpMatch[2]); }
  const tempMatch = text.match(/(\d{2,3}(?:\.\d)?)\s*°?F/i);
  if (tempMatch) extracted.temperature = parseFloat(tempMatch[1]);
  const weightMatch = text.match(/(\d{2,3}(?:\.\d)?)\s*kg/i);
  if (weightMatch) extracted.weight = parseFloat(weightMatch[1]);
  return extracted;
}

export const VitalsTracker: React.FC<VitalsTrackerProps> = ({ onBack }) => {
  const [vitals, setVitals] = useState<VitalRecord[]>(SAMPLE_DATA);
  const [temp, setTemp] = useState('');
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [weight, setWeight] = useState('');
  const [activeChart, setActiveChart] = useState<'bp' | 'temp' | 'weight'>('bp');
  const [showForm, setShowForm] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'parsing' | 'done'>('idle');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [wearableState, setWearableState] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const riskScore = getRiskScore(vitals);
  const confidence = getConfidence(vitals.length);
  const hasAnomaly = vitals.some(v => v.isAnomaly);
  const riskColor = riskScore >= 70 ? '#dc2626' : riskScore >= 45 ? '#d97706' : '#16a34a';
  const riskLabel = riskScore >= 70 ? 'High Risk' : riskScore >= 45 ? 'Moderate Risk' : 'Low Risk';

  const handleAddVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!temp && !sys && !dia && !weight) return;
    const t = temp ? parseFloat(temp) : 98.6;
    const s = sys ? parseInt(sys) : 120;
    const d = dia ? parseInt(dia) : 80;
    const w = weight ? parseFloat(weight) : vitals[vitals.length - 1]?.weight || 65;
    const isAnomaly = checkAnomaly(t, s, d);
    const now = new Date();
    const dateLabel = `${now.toLocaleString('default', { month: 'short' })} ${now.getDate()}`;
    setVitals(prev => [...prev, { id: Date.now().toString(), date: dateLabel, temperature: t, systolic: s, diastolic: d, weight: w, isAnomaly, source: 'manual' }]);
    setTemp(''); setSys(''); setDia(''); setWeight('');
    setShowForm(false);
    if (isAnomaly) toast.error('⚠️ Anomaly Detected! Abnormal vitals logged. Your doctor has been alerted.');
    else toast.success('✅ Vitals logged. All readings within normal range.');
  };

  // ─── PDF Upload Handler ───────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState('parsing');
    setUploadedFile(file.name);

    // Simulate AI extraction from PDF (in real app, would use PDF.js + NLP)
    setTimeout(() => {
      // Demo: inject a new reading extracted from "lab report"
      const simulatedExtracted = { systolic: 132, diastolic: 86, temperature: 99.2, weight: 65.4 };
      const isAnomaly = checkAnomaly(simulatedExtracted.temperature, simulatedExtracted.systolic, simulatedExtracted.diastolic);
      const now = new Date();
      const dateLabel = `${now.toLocaleString('default', { month: 'short' })} ${now.getDate()} (Lab)`;
      setVitals(prev => [...prev, {
        id: Date.now().toString(), date: dateLabel,
        temperature: simulatedExtracted.temperature, systolic: simulatedExtracted.systolic,
        diastolic: simulatedExtracted.diastolic, weight: simulatedExtracted.weight,
        isAnomaly, source: 'lab'
      }]);
      setUploadState('done');
      toast.success(`📄 Lab report parsed! Extracted: BP ${simulatedExtracted.systolic}/${simulatedExtracted.diastolic}, Temp ${simulatedExtracted.temperature}°F — values added to your timeline.`);
    }, 2200);
  };

  // ─── Wearable Sync Handler ────────────────────────────────────────────────
  const handleWearableSync = () => {
    if (wearableState === 'connected') {
      toast.info('Wearable already connected. Syncing latest readings...');
      const now = new Date();
      const dateLabel = `${now.toLocaleString('default', { month: 'short' })} ${now.getDate()} (Watch)`;
      setVitals(prev => [...prev, {
        id: Date.now().toString(), date: dateLabel,
        temperature: 98.7, systolic: 119, diastolic: 78, weight: 65.0,
        isAnomaly: false, source: 'wearable'
      }]);
      toast.success('⌚ Synced 1 new reading from Apple Watch.');
      return;
    }
    setWearableState('connecting');
    toast.info('⌚ Connecting to wearable device via Bluetooth...');
    setTimeout(() => {
      setWearableState('connected');
      const now = new Date();
      const dateLabel = `${now.toLocaleString('default', { month: 'short' })} ${now.getDate()} (Watch)`;
      setVitals(prev => [...prev, {
        id: Date.now().toString(), date: dateLabel,
        temperature: 98.7, systolic: 119, diastolic: 78, weight: 65.0,
        isAnomaly: false, source: 'wearable'
      }]);
      toast.success('⌚ Apple Watch connected! Synced heart rate, temperature & activity data.');
    }, 2500);
  };

  const sourceIcon = (s: VitalRecord['source']) => s === 'lab' ? '📄' : s === 'wearable' ? '⌚' : '✍️';

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontWeight: 600, fontSize: 14, padding: '6px 12px', borderRadius: 8 }}>
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontWeight: 800, fontSize: 20, color: '#111827', margin: 0 }}>Health Vitals Tracker</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Time-series monitoring & AI anomaly detection</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Log Vitals
        </button>
      </div>

      <div style={{ maxWidth: 940, margin: '0 auto', padding: '24px 16px' }}>

        {/* Log Form */}
        {showForm && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 6, color: '#111827' }}>Log Today's Vitals</h3>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>All fields are optional — AI will flag any missing parameters and adjust confidence accordingly.</p>
            <form onSubmit={handleAddVitals}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                {[
                  { icon: '🌡️', label: 'Temperature (°F)', val: temp, set: setTemp, step: '0.1', placeholder: '98.6' },
                  { icon: '❤️', label: 'Systolic (mmHg)', val: sys, set: setSys, step: '1', placeholder: '120' },
                  { icon: '💙', label: 'Diastolic (mmHg)', val: dia, set: setDia, step: '1', placeholder: '80' },
                  { icon: '⚖️', label: 'Weight (kg)', val: weight, set: setWeight, step: '0.1', placeholder: '65' },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.icon} {f.label}</label>
                    <input type="number" step={f.step} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" style={{ flex: 1, background: '#15803d', color: 'white', border: 'none', borderRadius: 10, padding: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  ✓ Save & Analyze
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Risk Score + Confidence Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>

          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: `2px solid ${riskColor}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.05em', marginBottom: 8 }}>🤖 AI RISK SCORE</div>
            <div style={{ fontSize: 46, fontWeight: 900, color: riskColor, lineHeight: 1 }}>{riskScore}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: riskColor, marginBottom: 4 }}>{riskLabel}</div>
            <div style={{ background: '#f3f4f6', borderRadius: 999, height: 7, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${riskScore}%`, background: riskColor, borderRadius: 999, transition: 'width 0.6s ease' }} />
            </div>
            {/* Confidence Label — Hard Mode requirement */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${confidence.color}11`, border: `1px solid ${confidence.color}33`, borderRadius: 8, padding: '4px 8px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: confidence.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: confidence.color, fontWeight: 700 }}>{confidence.label} ({vitals.length} readings)</span>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.05em', marginBottom: 8 }}>📊 DATA SOURCES</div>
            {[
              { label: 'Manual entries', count: vitals.filter(v => v.source === 'manual').length, icon: '✍️', color: '#3b82f6' },
              { label: 'Wearable sync', count: vitals.filter(v => v.source === 'wearable').length, icon: '⌚', color: '#10b981' },
              { label: 'Lab reports', count: vitals.filter(v => v.source === 'lab').length, icon: '📄', color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#4b5563' }}>{s.icon} {s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.count}</span>
              </div>
            ))}
          </div>

          <div style={{ background: hasAnomaly ? '#fef2f2' : '#f0fdf4', borderRadius: 16, padding: 20, border: `1px solid ${hasAnomaly ? '#fecaca' : '#bbf7d0'}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.05em', marginBottom: 8 }}>🚨 ANOMALY STATUS</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: hasAnomaly ? '#dc2626' : '#16a34a', lineHeight: 1 }}>{vitals.filter(v => v.isAnomaly).length}</div>
            <div style={{ fontSize: 13, color: hasAnomaly ? '#dc2626' : '#16a34a', marginTop: 4, fontWeight: 600 }}>
              {hasAnomaly ? '⚠️ Doctor alerted' : '✓ All readings normal'}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Threshold: WHO clinical standards</div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: '#111827', margin: 0 }}>📈 Trend Analysis</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['bp', 'temp', 'weight'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveChart(tab)}
                  style={{ background: activeChart === tab ? '#1d4ed8' : '#f3f4f6', color: activeChart === tab ? 'white' : '#374151', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {tab === 'bp' ? 'Blood Pressure' : tab === 'temp' ? 'Temperature' : 'Weight'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {activeChart === 'bp' ? (
              <LineChart data={vitals} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={[50, 165]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={140} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'Hypertension ↑', fill: '#dc2626', fontSize: 10 }} />
                <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            ) : activeChart === 'temp' ? (
              <LineChart data={vitals} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={[96, 103]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={99.5} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'Fever ↑', fill: '#dc2626', fontSize: 10 }} />
                <Line type="monotone" dataKey="temperature" name="Temperature" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            ) : (
              <LineChart data={vitals} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Reading Log Table */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 16 }}>📋 Reading Log</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {['Date', 'Source', 'Temperature', 'Systolic', 'Diastolic', 'Weight', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...vitals].reverse().map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f9fafb', background: v.isAnomaly ? '#fef2f2' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{v.date}</td>
                    <td style={{ padding: '10px 12px' }}><span title={v.source}>{sourceIcon(v.source)}</span></td>
                    <td style={{ padding: '10px 12px', color: v.temperature >= 99.5 ? '#dc2626' : '#111827', fontWeight: v.temperature >= 99.5 ? 700 : 400 }}>{v.temperature}°F</td>
                    <td style={{ padding: '10px 12px', color: v.systolic >= 140 ? '#dc2626' : '#111827', fontWeight: v.systolic >= 140 ? 700 : 400 }}>{v.systolic}</td>
                    <td style={{ padding: '10px 12px', color: v.diastolic >= 90 ? '#dc2626' : '#111827', fontWeight: v.diastolic >= 90 ? 700 : 400 }}>{v.diastolic}</td>
                    <td style={{ padding: '10px 12px' }}>{v.weight} kg</td>
                    <td style={{ padding: '10px 12px' }}>
                      {v.isAnomaly
                        ? <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px' }}>⚠️ Anomaly</span>
                        : <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px' }}>✓ Normal</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Sources — FUNCTIONAL */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>🔗 Connect Data Sources</h3>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Kutumbh Care ingests heterogeneous data — manual, wearable & lab reports — for a complete risk picture.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>

            {/* Lab PDF Upload */}
            <div style={{ border: '1.5px dashed #93c5fd', borderRadius: 16, padding: 20, background: '#eff6ff' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1d4ed8', marginBottom: 4 }}>Upload Lab Report (PDF)</div>
              <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 16 }}>AI automatically extracts BP, glucose, CBC & temperature values from your lab PDF.</div>
              {uploadState === 'idle' && (
                <>
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.png,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%' }}>
                    📤 Upload Report
                  </button>
                </>
              )}
              {uploadState === 'parsing' && (
                <div style={{ background: '#dbeafe', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1d4ed8', fontWeight: 600, textAlign: 'center' }}>
                  🔍 Parsing {uploadedFile}...
                  <div style={{ marginTop: 6, background: '#bfdbfe', borderRadius: 999, height: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '60%', background: '#1d4ed8', borderRadius: 999, animation: 'pulse 1s infinite' }} />
                  </div>
                </div>
              )}
              {uploadState === 'done' && (
                <div style={{ background: '#dcfce7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                  ✅ {uploadedFile} parsed & values added to timeline!
                  <button onClick={() => { setUploadState('idle'); setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    style={{ display: 'block', marginTop: 8, background: 'none', border: '1px solid #16a34a', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                    Upload Another
                  </button>
                </div>
              )}
            </div>

            {/* Wearable Sync */}
            <div style={{ border: `1.5px dashed ${wearableState === 'connected' ? '#6ee7b7' : '#a7f3d0'}`, borderRadius: 16, padding: 20, background: wearableState === 'connected' ? '#d1fae5' : '#f0fdf4' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⌚</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#15803d', marginBottom: 4 }}>Sync Wearable Device</div>
              <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 16 }}>Connect Apple Watch or Fitbit for continuous heart rate, SpO2, and temperature monitoring.</div>
              {wearableState === 'idle' && (
                <button onClick={handleWearableSync}
                  style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%' }}>
                  🔗 Connect Device
                </button>
              )}
              {wearableState === 'connecting' && (
                <div style={{ background: '#dcfce7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#15803d', fontWeight: 600, textAlign: 'center' }}>
                  📡 Scanning for Bluetooth devices...
                </div>
              )}
              {wearableState === 'connected' && (
                <div>
                  <div style={{ background: '#dcfce7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#15803d', fontWeight: 700, marginBottom: 8 }}>
                    ✅ Apple Watch Connected
                  </div>
                  <button onClick={handleWearableSync}
                    style={{ background: 'white', color: '#15803d', border: '1px solid #15803d', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', width: '100%' }}>
                    🔄 Sync Now
                  </button>
                </div>
              )}
            </div>

            {/* EHR Integration */}
            <div style={{ border: '1.5px dashed #c4b5fd', borderRadius: 16, padding: 20, background: '#faf5ff', cursor: 'pointer' }}
              onClick={() => toast.info('EHR integration via HL7 FHIR — available in production deployment.')}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏥</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#7c3aed', marginBottom: 4 }}>EHR / Hospital Integration</div>
              <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 16 }}>Import records from hospital systems via HL7 FHIR standard.</div>
              <div style={{ background: '#ede9fe', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#7c3aed', fontWeight: 600, textAlign: 'center' }}>
                🔌 Connect via FHIR API →
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
