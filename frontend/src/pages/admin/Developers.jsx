import { useEffect, useState } from 'react';
import * as api from '../../api/api.js';
import { EVIDENCE_LABEL, verificationRows } from '../../lib/verify.js';
import { useToast } from '../../components/toast.jsx';
import { Chip, Confirm, Empty, Field, Modal, PageHead, fmtDate } from '../../components/ui.jsx';
import SkillPicker from '../../components/SkillPicker.jsx';

const FIELDS = ['fullName', 'title', 'location', 'contact', 'education', 'experience', 'bio'];
const LABELS = { fullName: 'Full name', title: 'Professional title', location: 'Location', contact: 'Contact information', education: 'Education', experience: 'Experience', bio: 'Short bio' };
const BADGE = { verified: ['ok', '✓ Verified'], not_found: ['warn', '✗ Not found'], not_analyzed: ['', 'Not analyzed'] };

function DeveloperModal({ dev, catalogue, onClose, onSaved }) {
  const toast = useToast();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((f) => [f, dev[f] || ''])));
  const [skills, setSkills] = useState(dev.skills);
  const [error, setError] = useState('');
  const rows = verificationRows({ ...dev, skills });

  const save = async () => {
    setError('');
    try {
      await api.updateDeveloper(dev.id, { ...form, skills });
      toast.success('Developer updated.');
      onSaved();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Modal title={`${dev.fullName} · ${dev.email}`} onClose={onClose} wide>
      <div className="tabs" role="tablist">
        {[['profile', 'Profile'], ['skills', 'Skills'], ['github', 'GitHub and verification']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="grid2">
          {FIELDS.map((f) => (
            <Field key={f} label={LABELS[f]}>
              {f === 'bio' ? <textarea className="in" rows="3" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} /> : <input className="in" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />}
            </Field>
          ))}
        </div>
      )}

      {tab === 'skills' && <SkillPicker value={skills} onChange={setSkills} catalogue={catalogue} />}

      {tab === 'github' && (
        <div className="stack">
          {dev.github ? (
            <p>GitHub: <b>{dev.github.username}</b> · {dev.github.repos.length} repositories pulled {fmtDate(dev.github.pulledAt)}</p>
          ) : <Empty>This developer has not connected GitHub.</Empty>}
          {dev.analysis && <p className="muted">Last analysis {fmtDate(dev.analysis.ranAt)} · {dev.analysis.reposAnalyzed} repositories.</p>}
          {rows.length === 0 ? <span className="muted">No claimed skills.</span> : (
            <table>
              <thead><tr><th>Skill</th><th>Status</th><th>Evidence</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.skill}>
                    <td>{r.skill}</td>
                    <td><Chip tone={BADGE[r.status][0]}>{BADGE[r.status][1]}</Chip></td>
                    <td>{r.evidence.slice(0, 3).map((e, i) => <div key={i} className="small">{EVIDENCE_LABEL[e.type]}: {e.repo} — {e.detail}</div>)}{r.evidence.length > 3 && <div className="muted small">+ {r.evidence.length - 3} more</div>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="row end">
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn" onClick={save}>Save Changes</button>
      </div>
    </Modal>
  );
}

export default function Developers() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setRows(await api.listDevelopers());
    setCatalogue(await api.listSkills());
  };
  useEffect(() => { load(); }, []);

  const shown = rows.filter((d) => (status === 'all' || d.status === status) && `${d.fullName} ${d.email}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHead title="Manage Developers" subtitle="View and edit developer profiles and skills, and control account access." />
      <div className="row">
        <input className="in" style={{ width: 280 }} aria-label="Search developers" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="in" aria-label="Account status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Status: All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <section className="card">
        {shown.length === 0 ? <Empty>{rows.length === 0 ? 'No developers have registered yet.' : 'No developers match your search.'}</Empty> : (
          <div className="scroll">
            <table>
              <thead><tr><th>Developer</th><th>Email</th><th>Skills</th><th>GitHub</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {shown.map((d) => (
                  <tr key={d.id}>
                    <td><b>{d.fullName}</b><div className="muted small">{d.title || '—'}</div></td>
                    <td>{d.email}</td>
                    <td>{d.skills.length}</td>
                    <td>{d.analysis ? 'Analyzed' : d.github ? 'Connected' : 'Not connected'}</td>
                    <td><Chip tone={d.status === 'active' ? 'ok' : 'err'}>{d.status === 'active' ? 'Active' : 'Inactive'}</Chip></td>
                    <td>
                      <div className="row">
                        <button className="btn ghost" onClick={() => setEdit(d)}>View / Edit</button>
                        <button className="btn ghost" onClick={() => setConfirm(d)}>{d.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {edit && <DeveloperModal dev={edit} catalogue={catalogue} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
      {confirm && (
        <Confirm
          title={confirm.status === 'active' ? 'Deactivate developer' : 'Activate developer'}
          message={confirm.status === 'active' ? `${confirm.fullName} will no longer be able to log in.` : `${confirm.fullName} will be able to log in again.`}
          confirmLabel={confirm.status === 'active' ? 'Deactivate' : 'Activate'}
          danger={confirm.status === 'active'}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            await api.setUserStatus(confirm.userId, confirm.status === 'active' ? 'inactive' : 'active');
            toast.success('Account status updated.');
            setConfirm(null);
            load();
          }}
        />
      )}
    </div>
  );
}
