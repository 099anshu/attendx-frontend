import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { ChevronLeft, Users, PlayCircle, Upload, UserPlus, Trash2, CheckCircle, Clock, ShieldOff, Calendar, XCircle, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';

export default function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef();

  const [cls, setCls] = useState(null);
  const [approvedList, setApprovedList] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionRecords, setSessionRecords] = useState({});
  const [expandedSession, setExpandedSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('roster');
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', rollNumber: '', email: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => { load(); loadSessions(); }, [classId]);

  const load = async () => {
    try {
      const [cr, sr] = await Promise.all([
        API.get(`/classes/${classId}`),
        API.get(`/classes/${classId}/students`)
      ]);
      setCls(cr.data.class);
      setApprovedList(sr.data.approvedList || []);
    } catch {}
    setLoading(false);
  };

  const loadSessions = async () => {
    try {
      const r = await API.get(`/reports/class/${classId}`);
      setSessions(r.data.sessions || []);
    } catch {}
  };

  // ── File upload — works on both desktop and mobile ─────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const r = await API.post(`/classes/${classId}/upload-roster`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(r.data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
    setUploading(false);
    // Reset so same file can be re-uploaded
    e.target.value = '';
  };

  const handleAddStudent = async () => {
    if (!addForm.rollNumber && !addForm.email) { toast.error('Enter roll number or email'); return; }
    setAdding(true);
    try {
      const r = await API.post(`/classes/${classId}/add-student`, addForm);
      toast.success(r.data.enrolled ? 'Student added & enrolled!' : 'Added to roster (enrolls when they register)');
      setShowAddModal(false);
      setAddForm({ name: '', rollNumber: '', email: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add'); }
    setAdding(false);
  };

  const handleRemove = async (entry) => {
    if (!window.confirm(`Remove ${entry.name || entry.rollNumber || entry.email}?`)) return;
    try {
      await API.delete(`/classes/${classId}/remove-student`, { data: { rollNumber: entry.rollNumber, email: entry.email } });
      toast.success('Removed');
      load();
    } catch { toast.error('Failed to remove'); }
  };

  const loadSessionDetail = async (sessionId) => {
    if (expandedSession === sessionId) { setExpandedSession(null); return; }
    setExpandedSession(sessionId);
    if (sessionRecords[sessionId]) return;
    setLoadingSession(sessionId);
    try {
      const r = await API.get(`/reports/session/${sessionId}`);
      setSessionRecords(prev => ({ ...prev, [sessionId]: r.data.records }));
    } catch {}
    setLoadingSession(null);
  };

  const toggleRecord = async (record, sessionId) => {
    const newStatus = record.status === 'present' ? 'absent' : 'present';
    setEditingRecord(record._id);
    try {
      await API.patch(`/attendance/record/${record._id}`, { status: newStatus });
      setSessionRecords(prev => ({ ...prev, [sessionId]: prev[sessionId].map(r => r._id === record._id ? { ...r, status: newStatus, manuallyModified: true } : r) }));
      toast.success(`Marked ${newStatus}`);
    } catch { toast.error('Failed'); }
    setEditingRecord(null);
  };

  const resetDevice = async (userId, name) => {
    if (!window.confirm(`Reset device for ${name}?`)) return;
    try { await API.patch(`/auth/reset-device/${userId}`); toast.success('Reset done'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="loading-screen"><span className="spinner" /></div>;

  const enrolledCount = approvedList.filter(e => e.enrolled).length;
  const pendingCount = approvedList.filter(e => !e.enrolled).length;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}><ChevronLeft size={20} /></button>
          <div style={{ minWidth: 0 }}>
            <div className="page-title" style={{ fontSize: 18, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls?.subjectName}</div>
            <div className="page-subtitle">{cls?.subjectCode} · Sem {cls?.semester}</div>
          </div>
        </div>
      </div>

      <div className="section">
        {/* Stat row — 2x2 grid on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="stat-card">
            <div className="stat-value text-accent" style={{ fontSize: 22 }}>{approvedList.length}</div>
            <div className="stat-label">In Roster</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--green)', fontSize: 22 }}>{enrolledCount}</div>
            <div className="stat-label">Enrolled</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--yellow)', fontSize: 22 }}>{pendingCount}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 22 }}>{sessions.length}</div>
            <div className="stat-label">Sessions</div>
          </div>
        </div>

        <button className="btn btn-success btn-full" onClick={() => navigate(`/teacher/session/${classId}`)}>
          <PlayCircle size={16} /> Start Attendance Session
        </button>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'roster' ? 'active' : ''}`} onClick={() => setTab('roster')}>
            <Users size={12} style={{ display: 'inline', marginRight: 4 }} />Roster
          </button>
          <button className={`auth-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />Sessions
          </button>
        </div>

        {/* ── ROSTER TAB ── */}
        {tab === 'roster' && (
          <>
            {/* Upload buttons — stacked on mobile */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Hidden real file input */}
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              {/* Big tappable upload button — works on mobile */}
              <button
                className="btn btn-secondary btn-full"
                onClick={() => fileRef.current && fileRef.current.click()}
                disabled={uploading}
                style={{ height: 48 }}
              >
                {uploading
                  ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Uploading...</>
                  : <><Upload size={16} /> Upload CSV / Excel</>}
              </button>
              <button className="btn btn-primary btn-full" onClick={() => setShowAddModal(true)} style={{ height: 48 }}>
                <UserPlus size={16} /> Add Student Manually
              </button>
            </div>

            {/* Format hint */}
            <div style={{ padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text3)' }}>
              <FileSpreadsheet size={13} style={{ display: 'inline', marginRight: 5, color: 'var(--accent2)' }} />
              CSV columns: <strong style={{ color: 'var(--text2)' }}>name, roll_number, email</strong>
            </div>

            {/* Roster list */}
            {approvedList.length === 0 ? (
              <div className="empty-state">
                <Users /><h3>Roster is empty</h3>
                <p>Upload a CSV or add students manually</p>
              </div>
            ) : (
              <div className="card card-sm">
                {approvedList.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="avatar" style={{
                      background: entry.enrolled ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                      borderColor: entry.enrolled ? 'var(--green)' : 'var(--yellow)', fontSize: 12, flexShrink: 0
                    }}>
                      {entry.name?.[0] || entry.rollNumber?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entry.name || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {[entry.rollNumber, entry.email].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span className={`badge ${entry.enrolled ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 10 }}>
                        {entry.enrolled ? <><CheckCircle size={9} /> Done</> : <><Clock size={9} /> Pending</>}
                      </span>
                      {entry.userId && (
                        <button onClick={() => resetDevice(entry.userId, entry.name)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <ShieldOff size={9} /> Reset
                        </button>
                      )}
                    </div>
                    <button onClick={() => handleRemove(entry)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── SESSION HISTORY TAB ── */}
        {tab === 'history' && (
          <>
            {sessions.length === 0 ? (
              <div className="empty-state"><Calendar /><h3>No sessions yet</h3></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessions.map((s, i) => (
                  <div key={s._id || i} className="card card-sm" style={{ cursor: 'pointer' }} onClick={() => loadSessionDetail(s._id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg3)', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{new Date(s.startTime).getDate()}</span>
                        <span style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase' }}>{new Date(s.startTime).toLocaleString('en', { month: 'short' })}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{new Date(s.startTime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(s.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}><CheckCircle size={12} />{s.presentCount}</span>
                        <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}><XCircle size={12} />{s.absentCount}</span>
                        {expandedSession === s._id ? <ChevronUp size={14} color="var(--text3)" /> : <ChevronDown size={14} color="var(--text3)" />}
                      </div>
                    </div>

                    {expandedSession === s._id && (
                      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>✏️ Tap status to edit</div>
                        {loadingSession === s._id ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}><span className="spinner" /></div>
                        ) : (
                          (sessionRecords[s._id] || []).map(r => (
                            <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                              <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>{r.student?.name?.[0]}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.student?.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.student?.rollNumber}</div>
                              </div>
                              {r.manuallyModified && <span style={{ fontSize: 9, color: 'var(--yellow)', background: 'var(--yellow-dim)', padding: '2px 5px', borderRadius: 4, flexShrink: 0 }}>Edited</span>}
                              <button onClick={() => toggleRecord(r, s._id)} disabled={editingRecord === r._id}
                                className={`badge ${r.status === 'present' ? 'badge-green' : 'badge-red'}`}
                                style={{ cursor: 'pointer', border: 'none', flexShrink: 0, minWidth: 64, justifyContent: 'center', gap: 3 }}>
                                {editingRecord === r._id
                                  ? <span className="spinner" style={{ width: 10, height: 10, borderTopColor: 'currentColor' }} />
                                  : r.status === 'present' ? <><CheckCircle size={10} />Present</> : <><XCircle size={10} />Absent</>}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div className="modal-title">Add Student</div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Student name" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input className="form-input" placeholder="e.g. 21CS001" value={addForm.rollNumber} onChange={e => setAddForm(f => ({ ...f, rollNumber: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="student@email.com" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div style={{ padding: '10px 12px', background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 10, fontSize: 12, color: 'var(--text2)' }}>
                💡 If already registered, enrolled instantly. Otherwise enrolls when they register.
              </div>
              <button className="btn btn-primary btn-full" onClick={handleAddStudent} disabled={adding}>
                {adding ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : <><UserPlus size={14} /> Add to Roster</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
