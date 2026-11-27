import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { useToast } from '../../components/toast.jsx';
import { Chip, Empty, PageHead } from '../../components/ui.jsx';

export default function RequirementsReview() {
  const { id } = useParams();
  const { profile } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [job, setJob] = useState(null);
  const [catalogue, setCatalogue] = useState([]);
  const [required, setRequired] = useState([]);
  const [preferred, setPreferred] = useState([]);
  const [pick, setPick] = useState('');
  const [group, setGroup] = useState('required');
  const [error, setError] = useState('');

  useEffect(() => {
    api.listSkills().then(setCatalogue);
    api.getRecruiterJob(profile.id, id).then((j) => { setJob(j); setRequired(j.requiredSkills); setPreferred(j.preferredSkills); }).catch((e) => setError(e.message));
  }, [id, profile.id]);

  if (error && !job) return <Empty>{error} <Link to="/recruiter/jobs">Back to jobs</Link></Empty>;
  if (!job) return null;

  const move = (skill, to) => {
    if (to === 'preferred') { setRequired(required.filter((s) => s !== skill)); setPreferred([...preferred, skill]); }
    else { setPreferred(preferred.filter((s) => s !== skill)); setRequired([...required, skill]); }
  };
  const options = catalogue.filter((s) => ![...required, ...preferred].includes(s.name));
  const add = () => {
    if (!pick) return;
    (group === 'required' ? setRequired : setPreferred)((l) => [...l, pick]);
    setPick('');
  };

  const confirm = async () => {
    setError('');
    try {
      await api.saveJob(profile.id, { ...job, requiredSkills: required, preferredSkills: preferred }, job.id);
      const { published } = await api.confirmRequirements(profile.id, job.id);
      toast.success(published ? 'Requirements confirmed. The job is published.' : 'Requirements confirmed. The job will be published once your company is approved.');
      nav('/recruiter/jobs');
    } catch (e) {
      setError(e.message);
    }
  };

  const Group = ({ title, list, to, label }) => (
    <section className="card stack">
      <h2>{title}</h2>
      {list.length === 0 && <span className="muted">None.</span>}
      <div>
        {list.map((s) => (
          <Chip key={s}>
            {s}
            <button type="button" className="x add" onClick={() => move(s, to)}>{label}</button>
            <button type="button" className="x" aria-label={`Remove ${s}`} onClick={() => (to === 'preferred' ? setRequired : setPreferred)((l) => l.filter((x) => x !== s))}>×</button>
          </Chip>
        ))}
      </div>
    </section>
  );

  return (
    <div>
      <PageHead title="Review Job Requirements" subtitle={`Check the skills for “${job.title}”. Nothing is published until you confirm.`} />
      {job.requirementsFile && <div className="alert info">Requirements document: <b>{job.requirementsFile}</b> · skills were proposed from its text.</div>}
      <div className="grid2">
        <Group title="Required skills" list={required} to="preferred" label="→ Preferred" />
        <Group title="Preferred skills" list={preferred} to="required" label="→ Required" />
      </div>
      <section className="card stack">
        <h2>Add Requirement</h2>
        <div className="row">
          <select className="in" aria-label="Skill to add" value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Choose a skill…</option>
            {options.map((s) => <option key={s.id} value={s.name}>{s.name} ({s.category})</option>)}
          </select>
          <select className="in" aria-label="Add as" value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="required">As required</option>
            <option value="preferred">As preferred</option>
          </select>
          <button className="btn ghost" onClick={add} disabled={!pick}>Add Requirement</button>
        </div>
      </section>
      {error && <div className="alert err" role="alert">{error}</div>}
      {profile.approval.status !== 'approved' && <div className="alert info">Your company is not approved yet. After you confirm, the job stays a draft and can be published once your company is approved.</div>}
      <div className="row">
        <button className="btn" onClick={confirm}>Confirm Requirements</button>
        <Link className="btn ghost" to={`/recruiter/jobs/${job.id}/edit`}>Return to Job Form</Link>
      </div>
    </div>
  );
}
