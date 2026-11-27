import { useEffect, useState } from 'react';
import * as api from '../../api/api.js';
import { useToast } from '../../components/toast.jsx';
import { Confirm, Empty, Field, Modal, PageHead } from '../../components/ui.jsx';

const CATEGORIES = ['Language', 'Framework', 'Library', 'Database', 'Tool', 'Data / ML', 'Other'];

function SkillForm({ initial, onSubmit, onCancel, label }) {
  const [name, setName] = useState(initial?.name || '');
  const [category, setCategory] = useState(initial?.category || 'Language');
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onSubmit({ name, category });
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form className="stack" onSubmit={submit}>
      <Field label="Skill name"><input className="in" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Skill category">
        <select className="in" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      </Field>
      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="row">
        <button className="btn">{label}</button>
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

export default function Skills() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const [delError, setDelError] = useState('');

  const load = async () => setRows(await api.listSkills());
  useEffect(() => { load(); }, []);

  const shown = rows.filter((s) => (cat === 'all' || s.category === cat) && s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHead title="Manage Skills" subtitle="The skill catalogue developers choose from and GitHub analysis matches against." />
      <div className="split">
        <div className="stack">
          <div className="row">
            <input className="in" style={{ width: 260 }} aria-label="Search skills" placeholder="Search skill by name" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="in" aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">Category: All</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <section className="card">
            {shown.length === 0 ? <Empty>No skills match.</Empty> : (
              <div className="scroll">
                <table>
                  <thead><tr><th>Skill</th><th>Category</th><th>Developers</th><th>Action</th></tr></thead>
                  <tbody>
                    {shown.map((s) => (
                      <tr key={s.id}>
                        <td><b>{s.name}</b></td><td>{s.category}</td><td>{s.usage}</td>
                        <td>
                          <div className="row">
                            <button className="btn ghost" onClick={() => setEdit(s)}>Edit</button>
                            <button className="btn ghost" onClick={() => { setDelError(''); setDel(s); }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
        <section className="card stack">
          <h2>Add skill</h2>
          <SkillForm key={rows.length} label="Add Skill" onSubmit={async (v) => { await api.addSkill(v); toast.success('Skill added.'); load(); }} />
        </section>
      </div>

      {edit && (
        <Modal title="Edit skill" onClose={() => setEdit(null)}>
          <SkillForm initial={edit} label="Save" onCancel={() => setEdit(null)} onSubmit={async (v) => { await api.updateSkill(edit.id, v); toast.success('Skill updated.'); setEdit(null); load(); }} />
        </Modal>
      )}
      {del && (
        <Confirm
          title="Delete skill"
          message={delError || `Delete “${del.name}” from the catalogue? Skills used on developer profiles cannot be deleted.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            try {
              await api.deleteSkill(del.id);
              toast.success('Skill deleted.');
              setDel(null);
              load();
            } catch (e) {
              setDelError(e.message);
            }
          }}
        />
      )}
    </div>
  );
}
