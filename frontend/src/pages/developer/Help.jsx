import { Link } from 'react-router-dom';
import { PageHead } from '../../components/ui.jsx';

const FAQS = [
  ['What CV files can I upload?', 'Upload a PDF or plain-text .txt file up to 5 MB. Scanned image PDFs are not supported. Skillora extracts text and suggests catalogue skills; review the suggestions before confirming them.'],
  ['How do I connect a GitHub account?', 'Open GitHub Repositories, enter your GitHub username, and pull your public repositories. Select which repositories to analyze. This is a public-API integration, not GitHub OAuth.'],
  ['How are skills verified?', 'Analysis looks at repository languages, topics, and dependency files such as package.json and requirements.txt. Evidence is associated with claimed skills; a skill is only verified when the analysis finds supporting evidence.'],
  ['Why is a skill not verified?', 'The selected repositories may not contain evidence recognized by Skillora, or analysis may not have been run since your repositories changed. Review your selection and run analysis again.'],
  ['How do job recommendations work?', 'Published jobs from approved companies are matched against your profile. Verified skills contribute more strongly to compatibility than skills that are claimed but not verified.'],
  ['How do I apply and follow an application?', 'Open a job to review its details and compatibility, then choose Apply for Job. Application status and recruiter decisions are available under My Applications; recruiter updates also appear under Notifications.'],
];

export default function Help() {
  return (
    <div>
      <PageHead title="Developer Help" subtitle="A guide to building your profile, showing skill evidence, and applying to jobs." />

      <section className="card stack">
        <h2>Getting started</h2>
        <ol>
          <li>Complete your personal and professional details in <Link to="/developer/profile">Manage Profile</Link>.</li>
          <li>Optionally upload a CV and review extracted skills before adding them to your Skill Sheet.</li>
          <li>Connect your public repositories, choose repositories, and run an analysis to view skill evidence.</li>
          <li>Browse recommended jobs, review compatibility, and apply to opportunities that interest you.</li>
        </ol>
      </section>

      <div className="grid2">
        <section className="card stack">
          <h2>CV upload</h2>
          <p>Upload a PDF or plain-text CV up to 5 MB. Skillora extracts text in your browser and checks it against the current skill catalogue. Review the suggested skills and confirm them before they are added to your profile. A new CV adds confirmed skills; it does not remove existing skills.</p>
          <Link className="btn ghost" to="/developer/cv">Upload a CV</Link>
        </section>
        <section className="card stack">
          <h2>GitHub repositories and analysis</h2>
          <p>Pull repositories using your GitHub username, select the repositories to analyze, then open Analysis and Skill Sheet. Skillora uses GitHub-reported languages and topics and checks supported dependency manifests for libraries. The result shows evidence by repository and distinguishes verified, not-found, and not-yet-analyzed claims.</p>
          <p className="muted small">The current integration reads public repository data; GitHub OAuth is not available. Any optional access token is kept in this browser session.</p>
          <div className="row">
            <Link className="btn ghost" to="/developer/github">GitHub Repositories</Link>
            <Link className="btn ghost" to="/developer/analysis">Analysis and Skill Sheet</Link>
          </div>
        </section>
      </div>

      <div className="grid2">
        <section className="card stack">
          <h2>Recommendations and applications</h2>
          <p>Job recommendations come from published openings at approved companies. A job’s compatibility summary compares required and preferred skills with your profile and GitHub verification evidence. Open a job to review its requirements before applying.</p>
          <div className="row">
            <Link className="btn ghost" to="/developer/jobs">Job Recommendations</Link>
            <Link className="btn ghost" to="/developer/applications">My Applications</Link>
            <Link className="btn ghost" to="/developer/notifications">Notifications</Link>
          </div>
        </section>
        <section className="card stack">
          <h2>Frequently asked questions</h2>
          {FAQS.map(([question, answer]) => <details key={question}><summary>{question}</summary><p className="muted">{answer}</p></details>)}
        </section>
      </div>
    </div>
  );
}
