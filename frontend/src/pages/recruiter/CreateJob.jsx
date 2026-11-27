import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { extractSkills, readCv } from '../../lib/cv.js';
import { useToast } from '../../components/toast.jsx';
import { Field, PageHead } from '../../components/ui.jsx';
import SkillPicker from '../../components/SkillPicker.jsx';

const EMPTY = { title: '', description: '', responsibilities: '', location: '', experience: '' };

export default function CreateJob() {
  const { id } = useParams();
  const { profile } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const input = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [required, setRequired] = useState([]);
  const [preferred, setPreferred] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [file, setFile] = useState(null);
  const [doc, setDoc] = useState({ name: null, text: '' });
  const [extract, setExtract] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listSkills().then(setCatalogue);
    if (id) {
      api.getRecruiterJob(profile.id, id).then((j) => {
        setForm({ title: j.title, description: j.description, responsibilities: j.responsibilities, location: j.location, experience: j.experience });
        setRequired(j.requiredSkills);
        setPreferred(j.preferredSkills);
        setDoc({ name: j.requirementsFile, text: j.requirementsText || '' });
      }).catch((e) => setError(e.message));
    }
  }, [id, profile.id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const runExtract = async () => {
    setError('');
    setExtract('');
    try {
      const text = await readCv(file);
      const found = extractSkills(text, catalogue.map((s) => s.name)).filter((s) => !preferred.includes(s));
      setDoc({ name: file.name, text });
      setRequired([...new Set([...required, ...found])]);
      setExtract(found.length ? `Found ${found.length} skill${found.length > 1 ? 's' : ''} in ${file.name}. They were added to Required skills. You can adjust them on the next step.` : `No catalogue skills were found in ${file.name}. Add the skills manually.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const save = async (andReview) => {
    setError('');
    setBusy(true);
    try {
      const job = await api.saveJob(profile.id, { ...form, requiredSkills: required, preferredSkills: preferred, requirementsFile: doc.name, requirementsText: doc.text }, id || null);
      if (andReview) nav(`/recruiter/jobs/${job.id}/requirements`);
      else {
        toast.success('Draft saved.');
        nav('/recruiter/jobs');
      }
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <div>
      <PageHead title={id ? 'Edit Job Post' : 'Create Job Post'} subtitle="Define the job and its requirements." />
      {profile.approval.status !== 'approved' && <div className="alert info">You can save drafts now. A job can be published only after your company is approved. <Link to="/recruiter/profile">Company profile</Link></div>}
      {id && <div className="alert warn">Saving changes sends the job back to draft until you confirm the requirements again.</div>}

      <section className="card stack">
        <h2>Job information</h2>
        <Field label="Job title"><input className="in" value={form.title} onChange={set('title')} /></Field>
        <Field label="Job description"><textarea className="in" rows="4" value={form.description} onChange={set('description')} /></Field>
        <Field label="Responsibilities"><textarea className="in" rows="3" value={form.responsibilities} onChange={set('responsibilities')} /></Field>
        <div className="row">
          <Field label="Location"><input className="in" value={form.location} onChange={set('location')} /></Field>
          <Field label="Experience required"><input className="in" value={form.experience} onChange={set('experience')} placeholder="Enter experience requirements" /></Field>
        </div>
      </section>

      <div className="grid2">
        <section className="card stack">
          <h2>Required skills</h2>
          <SkillPicker value={required} onChange={setRequired} catalogue={catalogue.filter((s) => !preferred.includes(s.name))} />
        </section>
        <section className="card stack">
          <h2>Preferred skills</h2>
          <SkillPicker value={preferred} onChange={setPreferred} catalogue={catalogue.filter((s) => !required.includes(s.name))} />
        </section>
      </div>

      <section className="card stack">
        <h2>Upload requirements document</h2>
        <p className="muted">Optional. Upload a job description (PDF or plain text, up to 5 MB). Skillora reads it and proposes skills for you to review.</p>
        <div className="row">
          <label className="btn ghost">Browse Files<input ref={input} type="file" accept=".pdf,.txt" hidden onChange={(e) => { setFile(e.target.files[0] || null); setExtract(''); }} /></label>
          {file && <span>Selected file: <b>{file.name}</b></span>}
          <button className="btn ghost" onClick={runExtract} disabled={!file}>Extract Requirements</button>
        </div>
        {doc.name && !file && <p className="muted small">Uploaded document: {doc.name}</p>}
        {extract && <div className="alert ok">{extract}</div>}
      </section>

      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="row">
        <button className="btn ghost" onClick={() => save(false)} disabled={busy}>Save Job</button>
        <button className="btn" onClick={() => save(true)} disabled={busy}>Continue to Review</button>
      </div>
    </div>
  );
}
