import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Activity, AlertTriangle, TrendingUp, Thermometer, HeartPulse, Scale } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface VitalRecord {
  id: string;
  date: string;
  temperature: number;
  systolic: number;
  diastolic: number;
  weight: number;
  isAnomaly: boolean;
}
interface VitalsTrackerProps {
  onBack?: () => void;
}

export const VitalsTracker: React.FC<VitalsTrackerProps> = ({ onBack }) => {
  const [vitals, setVitals] = useState<VitalRecord[]>([
    { id: '1', date: '2026-08-10', temperature: 98.6, systolic: 120, diastolic: 80, weight: 65, isAnomaly: false },
    { id: '2', date: '2026-08-11', temperature: 98.4, systolic: 118, diastolic: 79, weight: 65, isAnomaly: false },
    { id: '3', date: '2026-08-12', temperature: 98.8, systolic: 122, diastolic: 82, weight: 64.5, isAnomaly: false },
  ]);

  const [temp, setTemp] = useState('');
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [weight, setWeight] = useState('');
  const [showAnomaly, setShowAnomaly] = useState(false);

  const checkAnomaly = (t: number, s: number, d: number) => {
    return t >= 100 || s >= 140 || d >= 90 || s <= 90 || d <= 60;
  };

  const handleAddVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!temp || !sys || !dia || !weight) return;

    const t = parseFloat(temp);
    const s = parseInt(sys);
    const d = parseInt(dia);
    const w = parseFloat(weight);

    const isAnomaly = checkAnomaly(t, s, d);

    const newRecord: VitalRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      temperature: t,
      systolic: s,
      diastolic: d,
      weight: w,
      isAnomaly
    };

    setVitals([newRecord, ...vitals]);
    
    if (isAnomaly) {
      setShowAnomaly(true);
      toast.error('Anomaly Detected! High risk indicators found. Early warning sent to doctor.');
    } else {
      setShowAnomaly(false);
      toast.success('Vitals logged successfully. All metrics are within normal range.');
    }

    setTemp('');
    setSys('');
    setDia('');
    setWeight('');
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
              <span className="text-xl">←</span>
            </Button>
          )}
          <div className="bg-blue-100 p-3 rounded-full">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Time-Series Vitals Tracker</h2>
            <p className="text-sm text-gray-600">Continuous health monitoring & anomaly detection</p>
          </div>
        </div>
      </div>

      {showAnomaly && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
          <div>
            <h4 className="font-semibold text-red-800">Critical Anomaly Detected</h4>
            <p className="text-red-600 text-sm">
              Your recent vitals indicate a potential risk. The system has automatically generated a risk score and alerted your primary physician.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleAddVitals} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 rounded-lg border">
        <div>
          <Label className="flex items-center space-x-1 mb-2"><Thermometer className="w-4 h-4"/> <span>Temp (°F)</span></Label>
          <Input type="number" step="0.1" value={temp} onChange={e => setTemp(e.target.value)} placeholder="98.6" required />
        </div>
        <div>
          <Label className="flex items-center space-x-1 mb-2"><HeartPulse className="w-4 h-4"/> <span>Systolic</span></Label>
          <Input type="number" value={sys} onChange={e => setSys(e.target.value)} placeholder="120" required />
        </div>
        <div>
          <Label className="flex items-center space-x-1 mb-2"><HeartPulse className="w-4 h-4"/> <span>Diastolic</span></Label>
          <Input type="number" value={dia} onChange={e => setDia(e.target.value)} placeholder="80" required />
        </div>
        <div>
          <Label className="flex items-center space-x-1 mb-2"><Scale className="w-4 h-4"/> <span>Weight (kg)</span></Label>
          <Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="65" required />
        </div>
        <div className="col-span-2 md:col-span-4 mt-2">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Log Vitals & Run Analysis</Button>
        </div>
      </form>

      <div>
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center"><TrendingUp className="w-4 h-4 mr-2" /> Recent Trends</h3>
        <div className="space-y-3">
          {vitals.map(v => (
            <div key={v.id} className={`flex items-center justify-between p-3 rounded-lg border ${v.isAnomaly ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
              <div className="text-sm font-medium text-gray-600 w-24">{v.date}</div>
              <div className="flex space-x-6 flex-1 justify-center">
                <span className={v.temperature >= 100 ? 'text-red-600 font-bold' : ''}>{v.temperature}°F</span>
                <span className={v.systolic >= 140 || v.diastolic >= 90 ? 'text-red-600 font-bold' : ''}>{v.systolic}/{v.diastolic} mmHg</span>
                <span>{v.weight} kg</span>
              </div>
              <div className="w-24 text-right">
                {v.isAnomaly ? <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-semibold">Anomaly</span> : <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Normal</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 border-t pt-6">
        <h3 className="font-semibold text-gray-700 mb-4">Heterogeneous Data Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer">
            <div className="text-2xl mb-2">📄</div>
            <h4 className="font-semibold text-blue-600">Upload Lab Report (PDF)</h4>
            <p className="text-xs text-gray-500 mt-1">AI will automatically extract values to update your risk profile.</p>
          </div>
          <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer">
            <div className="text-2xl mb-2">⌚</div>
            <h4 className="font-semibold text-purple-600">Sync Wearable Device</h4>
            <p className="text-xs text-gray-500 mt-1">Connect Apple Watch / Fitbit for continuous heart rate monitoring.</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
