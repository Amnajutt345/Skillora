import { Link } from 'react-router-dom';
import { PageHead } from '../../components/ui.jsx';

const FAQS = [
  ['Why can’t I publish a job yet?', 'A company profile must be approved by an administrator. You can save a draft and confirm its requirements, but it will remain unpublished until the company is approved.'],
  ['Can I change requirements after publishing?', 'Yes. Edit the job and save it; changes return it to draft. Review and confirm the requirements again before it can be published.'],
  ['How are developers recommended?', 'Recommendations are ranked by compatibility with a published job. Verified GitHub skills count fully, while claimed but unverified skills contribute at half.'],
  ['What can I review on a candidate profile?', 'Candidate profiles show the developer’s public-in-app profile details, claimed skills, available GitHub evidence, and compatibility against one of your published jobs.'],
  ['What happens when I select or reject a candidate?', 'Shortlist a candidate first. You can then select or reject them; the decision is saved and an in-app notification is sent to the developer. Decisions cannot be undone through the current interface.'],
];

export default function Help() {
  return (
    <div>
      <PageHead title="Recruiter Help" subtitle="Manage your company presence, publish jobs, and evaluate developer candidates." />

      <section className="card stack">
        <h2>Getting started</h2>
        <ol>
          <li>Complete your company information and submit the company profile for administrator approval.</li>
          <li>Create a job post with its description and required and preferred skills.</li>
          <li>Review the proposed requirements and confirm them. Approved companies can publish the job at confirmation.</li>
          <li>Open developer recommendations for a published job, review candidate evidence, and shortlist candidates as appropriate.</li>
        </ol>
      </section>

      <div className="grid2">
        <section className="card stack">
          <h2>Company profile</h2>
          <p>Keep company name, description, industry, website, location, and contact details current. Submit a complete profile for review. The approval status and any requested updates are shown on the profile page; approval is required before jobs can be published.</p>
          <Link className="btn ghost" to="/recruiter/profile">Manage Company Profile</Link>
        </section>
        <section className="card stack">
          <h2>Create and manage jobs</h2>
          <p>Save a job with its title, description, responsibilities, location, experience, and skill requirements. A PDF or plain-text requirements document (up to 5 MB) can be used to suggest skills; review the extracted requirements before confirming. Manage drafts and published jobs from the jobs list.</p>
          <div className="row">
            <Link className="btn ghost" to="/recruiter/jobs/new">Create a Job</Link>
            <Link className="btn ghost" to="/recruiter/jobs">Manage Jobs</Link>
          </div>
        </section>
      </div>

      <div className="grid2">
        <section className="card stack">
          <h2>Requirements and recommendations</h2>
          <p>On the requirements review page, check the suggested skills, move skills between required and preferred, remove incorrect items, or add catalogue skills. At least one required skill is needed to confirm. Recommendations are available for published jobs and can be filtered by skill and minimum compatibility.</p>
          <Link className="btn ghost" to="/recruiter/developers">Developer Recommendations</Link>
        </section>
        <section className="card stack">
          <h2>Candidate profiles and evaluation</h2>
          <p>Open a candidate to review their profile, Skill Sheet, GitHub evidence where available, and compatibility for one of your published jobs. Shortlist candidates from the recommendations or candidate page. After shortlisting, select or reject them to send an in-app notification.</p>
          <Link className="btn ghost" to="/recruiter/jobs">View Job Applicants</Link>
        </section>
      </div>

      <section className="card stack">
        <h2>Frequently asked questions</h2>
        {FAQS.map(([question, answer]) => <details key={question}><summary>{question}</summary><p className="muted">{answer}</p></details>)}
      </section>
    </div>
  );
}
