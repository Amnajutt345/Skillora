import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { extractSkills, readCv } from '../../lib/cv.js';
import { useToast } from '../../components/toast.jsx';
import { Chip, PageHead, fmtDate } from '../../components/ui.jsx';
import SkillPicker from '../../components/SkillPicker.jsx';

const STEPS = ['Uploading', 'Processing document', 'Extracting skills', 'Extraction completed'];

export default function CvUpload() {
  const { profile, refresh } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const input = useRef(null);
  const [catalogue, setCatalogue] = useState([]);
  const [step, setStep] = useState(0); // 0 idle, 1-4 progress, -1 failed
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [skills, setSkills] = useState([]);
  const [over, setOver] = useState(false);

  useEffect(() => {
    api.listSkills().then(setCatalogue);
  }, []);

  const reset = () => {
    setStep(0); setError(''); setFile(null); setText(''); setSkills([]);
    if (input.current) input.current.value = '';
  };

  const handle = async (f) => {
    if (!f) return;
    reset();
    setFile(f);
    setStep(1);
    try {
      setStep(2);
      const t = await readCv(f);
      setStep(3);
      setText(t);
      setSkills(extractSkills(t, catalogue.map((s) => s.name)));
      setStep(4);
    } catch (e) {
      setError(e.message);
      setStep(-1);
    }
  };

  const confirm = async () => {
    try {
      await api.confirmCv(profile.id, { fileName: file.name, text, skills });
      refresh();
      toast.success('Skill Sheet updated from your CV.');
      nav('/developer/view');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <PageHead title="Upload Your CV" subtitle="Skillora extracts text and skills from your CV. You review them before they join your Skill Sheet." />
      {profile.cv && <div className="alert info">Current CV: <b>{profile.cv.fileName}</b> · uploaded {fmtDate(profile.cv.uploadedAt)}. Uploading a new CV adds to your skills; it does not remove existing ones.</div>}

      <section
        className={`card drop ${over ? 'over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]); }}
      >
        <p>Drag and drop your CV here</p>
        <p className="muted">PDF or plain text (.txt), up to 5 MB. Scanned image PDFs are not supported.</p>
        <div>
          <label className="btn">
            Browse Files
            <input ref={input} type="file" accept=".pdf,.txt" hidden onChange={(e) => handle(e.target.files[0])} />
          </label>
        </div>
        {file && <p className="small">Selected file: <b>{file.name}</b></p>}
      </section>

      {step !== 0 && (
        <section className="card stack">
          <h2>Extraction status</h2>
          <div className="row">
            {STEPS.map((s, i) => (
              <Chip key={s} tone={step === -1 ? '' : step > i + 1 || step === 4 ? 'ok' : step === i + 1 ? '' : ''}>
                {step === -1 ? '○' : step >= i + 1 && (step > i + 1 || step === 4) ? '✓' : step === i + 1 ? '●' : '○'} {s}
              </Chip>
            ))}
          </div>
          {step === -1 && <div className="alert err" role="alert">Extraction failed. {error}</div>}
        </section>
      )}

      {step === 4 && (
        <section className="card stack">
          <h2>Extracted skills</h2>
          {skills.length === 0 && <p className="muted">No catalogue skills were found in this CV. You can add skills below.</p>}
          <SkillPicker value={skills} onChange={setSkills} catalogue={catalogue} />
          <p className="muted">Review the skills before confirming. Nothing is added to your Skill Sheet until you confirm.</p>
          {error && <div className="alert err" role="alert">{error}</div>}
          <div className="row">
            <button className="btn" onClick={confirm} disabled={skills.length === 0}>Confirm Skill Sheet</button>
            <button className="btn ghost" onClick={reset}>Re-upload CV</button>
          </div>
        </section>
      )}
    </div>
  );
}
