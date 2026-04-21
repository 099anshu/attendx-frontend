import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GraduationCap, BookOpen, Eye, EyeOff, Smartphone, ShieldX, KeyRound } from 'lucide-react';

// ── Device blocked screen ─────────────────────────────────────────────────
function DeviceBlockedScreen({ onBack }) {
  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 400, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center' }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', margin: '0 auto 20px', background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldX size={30} color="var(--red)" />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Wrong Device</div>
        <div style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          This account is already linked to another device.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: 'var(--accent-glow)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--accent2)' }}>1</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Use your registered device</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>Log in from the phone or device you originally used to create this account.</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase' }}>— or —</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--green)' }}>2</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Ask your teacher to reset</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>Your teacher can reset your device binding from the class portal.</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 20, background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.15)', fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, textAlign: 'left' }}>
          🔒 <strong style={{ color: 'var(--text2)' }}>Why is this happening?</strong><br />
          AttendX links each student account to one device to prevent proxy attendance.
        </div>
        <button className="btn btn-secondary btn-full" onClick={onBack}>← Try a different account</button>
      </div>
    </div>
  );
}

// ── Device taken screen ───────────────────────────────────────────────────
function DeviceTakenScreen({ onBack }) {
  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 400, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center' }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', margin: '0 auto 20px', background: 'rgba(245,158,11,0.08)', border: '2px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Smartphone size={30} color="var(--yellow)" />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Device Already Registered</div>
        <div style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          A student account already exists on this device. Only <strong>one student account</strong> is allowed per device.
        </div>
        <div style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 24, background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.15)', fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, textAlign: 'left' }}>
          🔒 <strong style={{ color: 'var(--text2)' }}>Why is this happening?</strong><br />
          AttendX allows only one student account per device to prevent proxy attendance. Please log in with your existing account.
        </div>
        <button className="btn btn-primary btn-full" style={{ marginBottom: 10 }} onClick={() => onBack('login')}>Sign In Instead</button>
        <button className="btn btn-secondary btn-full" onClick={() => onBack('register')}>← Go Back</button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', password: '', rollNumber: '', teacherCode: '' });
  const [showPass, setShowPass] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  const [deviceTaken, setDeviceTaken] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // ── Demo fill helper ──────────────────────────────────────────────────
  const fillDemo = (type) => {
    if (type === 'teacher') {
      setTab('login');
      setForm(f => ({ ...f, email: 'teacher@demo.com', password: 'demo123' }));
      toast.success('Teacher demo credentials filled!');
    } else {
      setTab('login');
      setForm(f => ({ ...f, email: 'student@demo.com', password: 'demo123' }));
      toast.success('Student demo credentials filled!');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setDeviceBlocked(false);
    setDeviceTaken(false);
    if (!form.email || !form.password) { setError('Email and password are required'); return; }
    if (tab === 'register' && !form.name) { setError('Name is required'); return; }
    if (tab === 'register' && role === 'teacher' && !form.teacherCode) {
      setError('Teacher invite code is required'); return;
    }
    setLoading(true);
    try {
      const user = tab === 'login'
        ? await login(form.email, form.password)
        : await register({ ...form, role });
      toast.success(`Welcome, ${user.name}!`);
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err) {
      if (err.response?.data?.deviceBlocked) setDeviceBlocked(true);
      else if (err.response?.data?.deviceTaken) setDeviceTaken(true);
      else setError(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const resetScreens = (goToTab) => {
    setDeviceBlocked(false);
    setDeviceTaken(false);
    setError('');
    setForm({ name: '', email: '', password: '', rollNumber: '', teacherCode: '' });
    if (goToTab) setTab(goToTab);
  };

  if (deviceBlocked) return <DeviceBlockedScreen onBack={() => resetScreens(null)} />;
  if (deviceTaken)   return <DeviceTakenScreen   onBack={(t) => resetScreens(t)} />;

  return (
    <div className="auth-page">
      <div className="auth-logo">Attend<span>X</span></div>
      <p className="auth-tagline">Smart attendance. Zero proxy. Secure by design.</p>

      <div className="auth-card">
        {/* Tab switcher */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Sign In</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>Register</button>
        </div>

        {/* Role selector */}
        {tab === 'register' && (
          <div className="form-group">
            <span className="form-label">I am a</span>
            <div className="role-tabs">
              <button className={`role-tab ${role === 'student' ? 'active' : ''}`} onClick={() => { setRole('student'); setError(''); }}>
                <GraduationCap size={20} /> Student
              </button>
              <button className={`role-tab ${role === 'teacher' ? 'active' : ''}`} onClick={() => { setRole('teacher'); setError(''); }}>
                <BookOpen size={20} /> Teacher
              </button>
            </div>
          </div>
        )}

        {/* Name */}
        {tab === 'register' && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Enter your name" value={form.name} onChange={set('name')} />
          </div>
        )}

        {/* Roll number + device notice */}
        {tab === 'register' && role === 'student' && (
          <>
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input className="form-input" placeholder="e.g. 21CS001" value={form.rollNumber} onChange={set('rollNumber')} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 10, fontSize: 12, color: 'var(--text2)' }}>
              <Smartphone size={14} style={{ color: 'var(--accent2)', marginTop: 1, flexShrink: 0 }} />
              <span>Your account will be <strong style={{ color: 'var(--accent2)' }}>linked to this device</strong>. Use this device to log in and mark attendance.</span>
            </div>
          </>
        )}

        {/* Email */}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Min 6 characters"
              value={form.password} onChange={set('password')} style={{ paddingRight: 44 }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', display: 'flex', cursor: 'pointer' }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Teacher invite code */}
        {tab === 'register' && role === 'teacher' && (
          <>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 10, fontSize: 12, color: 'var(--text2)' }}>
              <KeyRound size={14} style={{ color: 'var(--accent2)', marginTop: 1, flexShrink: 0 }} />
              <span>Teacher registration requires an <strong style={{ color: 'var(--accent2)' }}>invite code</strong> from your institution admin. This code changes every 3 months.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Teacher Invite Code</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showCode ? 'text' : 'password'} placeholder="Enter invite code"
                  value={form.teacherCode} onChange={set('teacherCode')}
                  style={{ paddingRight: 44, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                <button onClick={() => setShowCode(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', display: 'flex', cursor: 'pointer' }}>
                  {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {/* Submit */}
        <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : tab === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        {/* Demo credentials — quick fill buttons */}
        {tab === 'login' && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 10px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>DEMO ACCESS</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => fillDemo('teacher')} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: 12 }}>
                <BookOpen size={12} /> Teacher Demo
              </button>
              <button onClick={() => fillDemo('student')} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: 12 }}>
                <GraduationCap size={12} /> Student Demo
              </button>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', marginTop: 8 }}>
              Fills credentials automatically — just click Sign In
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
