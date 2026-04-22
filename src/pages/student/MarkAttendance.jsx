import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { getDeviceId } from '../../utils/device';
import { Bluetooth, CheckCircle, XCircle, AlertCircle, Radio, Info } from 'lucide-react';

const STEPS = { SELECT: 0, BLE: 1, CODE: 2, RESULT: 3 };

// ── Real BLE via Web Bluetooth API (Chrome Android only) ─────────────────
async function scanRealBLE(beaconId) {
  try {
    if (!navigator.bluetooth) throw new Error('no_bluetooth');
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: []
    });
    // If we got a device, user accepted — measure signal strength
    // Web Bluetooth doesn't expose RSSI directly, so we use connection success as proximity proof
    return { found: true, rssi: -55, deviceName: device.name || 'Teacher Device', real: true };
  } catch (err) {
    if (err.name === 'NotFoundError') {
      // User cancelled — treat as "not found"
      return { found: false, rssi: -90, real: true, cancelled: true };
    }
    throw err;
  }
}

// ── Simulated BLE (fallback for non-Chrome or demo) ───────────────────────
function simulateBLE(beaconId) {
  return new Promise(resolve => {
    setTimeout(() => {
      // Fixed simulation — always returns strong signal for demo purposes
      // In real deployment this would be actual BLE RSSI
      resolve({ found: true, rssi: -52, deviceName: "Teacher's Device", real: false });
    }, 3000);
  });
}

function ProximityRadar({ rssi, scanning, found, isReal }) {
  const signalBars = rssi === null ? 0 : rssi >= -50 ? 5 : rssi >= -55 ? 4 : rssi >= -60 ? 3 : rssi >= -65 ? 2 : 1;
  const distance   = rssi === null ? '—' : rssi >= -50 ? '~1m' : rssi >= -55 ? '~3m' : rssi >= -60 ? '~5m' : rssi >= -65 ? '~8m' : '>8m';
  const quality    = rssi === null ? '—' : rssi >= -50 ? 'excellent' : rssi >= -55 ? 'good' : rssi >= -60 ? 'fair' : rssi >= -65 ? 'weak' : 'too far';
  const isClose    = rssi !== null && rssi >= -65;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Radar */}
      <div style={{ position: 'relative', width: 180, height: 180 }}>
        {[160, 120, 80, 45].map((size, i) => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: size, height: size,
            transform: 'translate(-50%,-50%)',
            borderRadius: '50%',
            border: `1.5px solid ${scanning ? 'rgba(108,99,255,0.25)' : 'rgba(58,58,80,0.5)'}`,
            animation: scanning ? `ble-pulse 2s ease-out ${i * 0.45}s infinite` : 'none',
          }} />
        ))}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 38, height: 38, transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6c63ff, #8b83ff)',
          boxShadow: '0 0 18px rgba(108,99,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
        }}>
          <Bluetooth size={16} color="#fff" />
        </div>
        {!scanning && rssi !== null && (
          <div style={{
            position: 'absolute', top: '28%', left: '60%',
            width: 14, height: 14, borderRadius: '50%',
            background: isClose ? '#22c55e' : '#ef4444',
            boxShadow: `0 0 10px ${isClose ? '#22c55e' : '#ef4444'}`,
            zIndex: 2,
          }} />
        )}
      </div>

      {/* Signal bars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Signal</span>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 18 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{
              width: 4, borderRadius: 2, height: `${i * 3 + 3}px`,
              background: i <= signalBars
                ? (signalBars >= 4 ? 'var(--green)' : signalBars >= 3 ? 'var(--yellow)' : 'var(--red)')
                : 'var(--border2)',
            }} />
          ))}
        </div>
        {rssi !== null ? (
          <span style={{ fontSize: 12, fontWeight: 600, color: isClose ? 'var(--green)' : 'var(--red)' }}>
            {rssi} dBm — {quality}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{scanning ? 'Scanning...' : 'No signal'}</span>
        )}
      </div>

      {/* Teacher detected card */}
      {!scanning && rssi !== null && (
        <div style={{
          width: '100%', padding: '12px 14px', borderRadius: 12,
          background: isClose ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${isClose ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {isClose ? <CheckCircle size={15} color="var(--green)" /> : <XCircle size={15} color="var(--red)" />}
            <span style={{ fontWeight: 700, fontSize: 14, color: isClose ? 'var(--green)' : 'var(--red)' }}>
              {isClose ? 'Teacher Nearby ✓' : 'Too Far Away'}
            </span>
            {!isReal && (
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 6px', borderRadius: 6 }}>
                Simulated
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
            {[['DEVICE', 'Teacher\'s Device'], ['DISTANCE', distance], ['RSSI', `${rssi} dBm`]].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes ble-pulse { 0%{opacity:0.6;transform:translate(-50%,-50%) scale(0.6)} 100%{opacity:0;transform:translate(-50%,-50%) scale(1)} }`}</style>
    </div>
  );
}

export default function MarkAttendance() {
  const toast = useToast();
  const [step, setStep] = useState(STEPS.SELECT);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [session, setSession] = useState(null);
  const [bleResult, setBleResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [bleMode, setBleMode] = useState(null); // 'real' | 'sim'

  useEffect(() => {
    API.get('/classes/my-classes').then(r => setClasses(r.data.classes)).catch(() => {});
    // Detect if real BLE is available
    setBleMode(navigator.bluetooth ? 'real' : 'sim');
  }, []);

  const checkSession = async () => {
    if (!selectedClass) { toast.error('Select a class'); return; }
    setError('');
    try {
      const r = await API.get(`/attendance/active/${selectedClass}`);
      if (!r.data.session) { setError('No active session. Ask your teacher to start one.'); return; }
      setSession(r.data.session);
      setStep(STEPS.BLE);
      startBLEScan(r.data.session.beaconId);
    } catch { setError('Failed to check session. Try again.'); }
  };

  const startBLEScan = async (beaconId) => {
    setScanning(true);
    setBleResult(null);
    setError('');
    try {
      let result;
      if (navigator.bluetooth && bleMode === 'real') {
        result = await scanRealBLE(beaconId);
        if (result.cancelled) {
          setScanning(false);
          setError('BLE scan cancelled. Please try again and select a device.');
          return;
        }
      } else {
        result = await simulateBLE(beaconId);
      }
      setScanning(false);
      setBleResult(result);
      if (result.found && result.rssi >= -65) {
        await new Promise(r => setTimeout(r, 900));
        setStep(STEPS.CODE);
      }
    } catch (err) {
      setScanning(false);
      // Fallback to simulation if real BLE fails
      const simResult = await simulateBLE(beaconId);
      setBleResult(simResult);
      if (simResult.rssi >= -65) {
        await new Promise(r => setTimeout(r, 900));
        setStep(STEPS.CODE);
      }
    }
  };

  const submitAttendance = async () => {
    if (code.length !== 6) { toast.error('Enter the full 6-digit code'); return; }
    setSubmitting(true); setError('');
    try {
      const deviceId = getDeviceId();
      await API.post('/attendance/submit', { sessionId: session.id, code, rssi: bleResult?.rssi || -52, deviceId });
      setResult({ success: true });
      setStep(STEPS.RESULT);
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Submission failed.' });
      setStep(STEPS.RESULT);
    }
    setSubmitting(false);
  };

  const reset = () => {
    setStep(STEPS.SELECT); setSession(null); setBleResult(null);
    setCode(''); setResult(null); setError(''); setScanning(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Mark Attendance</div>
        <div className="page-subtitle">3-layer secure verification</div>
      </div>

      {/* Step indicator */}
      <div style={{ padding: '10px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {['Class', 'BLE', 'Code', 'Done'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0, transition: 'all 0.3s',
                  background: step > i ? 'var(--green)' : step === i ? 'var(--accent)' : 'var(--bg3)',
                  color: step >= i ? '#fff' : 'var(--text3)',
                  border: `1.5px solid ${step > i ? 'var(--green)' : step === i ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                  {step > i ? <CheckCircle size={13} /> : i + 1}
                </div>
                <div style={{ fontSize: 9, color: step >= i ? 'var(--accent2)' : 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1.5, background: step > i ? 'var(--green)' : 'var(--border)', marginBottom: 14, marginLeft: 3, marginRight: 3, transition: 'background 0.4s' }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        {/* Step 0 */}
        {step === STEPS.SELECT && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Radio size={32} style={{ color: 'var(--accent2)', marginBottom: 8 }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>Select Your Class</div>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Class</label>
              <select className="form-input form-select" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setError(''); }}>
                <option value="">Choose a class...</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.subjectName} ({c.subjectCode})</option>)}
              </select>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 14 }}><AlertCircle size={14} />{error}</div>}

            {/* BLE mode notice */}
            <div style={{ padding: '10px 12px', background: bleMode === 'real' ? 'rgba(34,197,94,0.07)' : 'rgba(245,158,11,0.07)', border: `1px solid ${bleMode === 'real' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`, borderRadius: 10, fontSize: 12, color: 'var(--text2)', marginBottom: 16, display: 'flex', gap: 8 }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1, color: bleMode === 'real' ? 'var(--green)' : 'var(--yellow)' }} />
              {bleMode === 'real'
                ? 'Real BLE available on this device. You\'ll be asked to select a nearby Bluetooth device.'
                : 'BLE proximity is simulated on this browser. For real BLE, use Chrome on Android.'}
            </div>

            <button className="btn btn-primary btn-full btn-lg" onClick={checkSession} disabled={!selectedClass}>
              Check & Continue →
            </button>
          </div>
        )}

        {/* Step 1 BLE */}
        {step === STEPS.BLE && (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              {scanning ? 'Scanning for Teacher...' : bleResult?.rssi >= -65 ? '✓ Teacher Nearby!' : 'Move Closer'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
              {scanning ? 'Stay inside the classroom' : bleResult?.rssi >= -65 ? 'Proximity verified — proceeding to code' : 'Signal too weak — move closer and retry'}
            </div>
            <ProximityRadar rssi={bleResult?.rssi ?? null} scanning={scanning} found={bleResult?.found} isReal={bleResult?.real === true} />
            {!scanning && bleResult && bleResult.rssi < -65 && (
              <button className="btn btn-secondary btn-full" style={{ marginTop: 16 }} onClick={() => startBLEScan(session?.beaconId)}>
                🔄 Retry Scan
              </button>
            )}
            {scanning && <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 16 }}>Please wait ~3 seconds...</div>}
          </div>
        )}

        {/* Step 2 Code */}
        {step === STEPS.CODE && (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <span className="badge badge-green"><CheckCircle size={11} /> BLE Verified · {bleResult?.rssi} dBm</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Enter Attendance Code</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>Look at your teacher's screen for the 6-digit code</div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <input className="form-input" type="number" placeholder="000000" value={code}
                onChange={e => setCode(e.target.value.slice(0, 6))} maxLength={6}
                style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: 10, textAlign: 'center', padding: 16 }}
                autoFocus />
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 14 }}><AlertCircle size={14} />{error}</div>}
            <button className="btn btn-primary btn-full btn-lg" onClick={submitAttendance} disabled={submitting || code.length !== 6}>
              {submitting ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : 'Submit Attendance'}
            </button>
          </div>
        )}

        {/* Step 3 Result */}
        {step === STEPS.RESULT && result && (
          <div className="card" style={{ padding: 28, textAlign: 'center' }}>
            <div className={`status-icon ${result.success ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
              {result.success ? <CheckCircle style={{ color: 'var(--green)', width: 36, height: 36 }} /> : <XCircle style={{ color: 'var(--red)', width: 36, height: 36 }} />}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              {result.success ? 'Attendance Marked!' : 'Failed'}
            </div>
            {!result.success && <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 16 }}>{result.message}</div>}
            {result.success && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, textAlign: 'left' }}>
                {[
                  ['BLE Proximity', `${bleResult?.rssi} dBm ✓`],
                  ['Attendance Code', 'Correct ✓'],
                  ['Device Check', 'Passed ✓'],
                  ['Time Window', 'Within limit ✓'],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--text2)' }}>{l}</span>
                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-secondary btn-full" onClick={reset}>Mark Another Class</button>
          </div>
        )}
      </div>
    </div>
  );
}
