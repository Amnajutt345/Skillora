import { Navigate, Route, Routes } from 'react-router-dom';
import { homeFor, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import DevProfile from './pages/developer/Profile.jsx';
import DevGithub from './pages/developer/GitHub.jsx';
import DevAnalysis from './pages/developer/Analysis.jsx';
import DevDashboard from './pages/developer/Dashboard.jsx';
import DevCv from './pages/developer/CvUpload.jsx';
import DevView from './pages/developer/ViewProfile.jsx';
import DevJobs from './pages/developer/Jobs.jsx';
import DevJobDetails from './pages/developer/JobDetails.jsx';
import DevSkillReco from './pages/developer/SkillRecommendations.jsx';
import DevApplications from './pages/developer/Applications.jsx';
import DevNotifications from './pages/developer/Notifications.jsx';
import DevSettings from './pages/developer/Settings.jsx';
import DevHelp from './pages/developer/Help.jsx';
import CompanyProfile from './pages/recruiter/CompanyProfile.jsx';
import RecDashboard from './pages/recruiter/Dashboard.jsx';
import RecJobs from './pages/recruiter/Jobs.jsx';
import RecCreateJob from './pages/recruiter/CreateJob.jsx';
import RecRequirements from './pages/recruiter/RequirementsReview.jsx';
import RecDevelopers from './pages/recruiter/Developers.jsx';
import RecCandidate from './pages/recruiter/Candidate.jsx';
import RecSettings from './pages/recruiter/Settings.jsx';
import RecHelp from './pages/recruiter/Help.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminDevelopers from './pages/admin/Developers.jsx';
import AdminCompanies from './pages/admin/Companies.jsx';
import AdminSkills from './pages/admin/Skills.jsx';
import AdminStatistics from './pages/admin/Statistics.jsx';

function Home() {
  const { user } = useAuth();
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<Login admin />} />
      <Route path="/register" element={<Register />} />

      <Route path="/developer" element={<Layout role="developer" />}>
        <Route path="dashboard" element={<DevDashboard />} />
        <Route path="profile" element={<DevProfile />} />
        <Route path="view" element={<DevView />} />
        <Route path="cv" element={<DevCv />} />
        <Route path="github" element={<DevGithub />} />
        <Route path="analysis" element={<DevAnalysis />} />
        <Route path="jobs" element={<DevJobs />} />
        <Route path="jobs/:id" element={<DevJobDetails />} />
        <Route path="skill-recommendations" element={<DevSkillReco />} />
        <Route path="applications" element={<DevApplications />} />
        <Route path="notifications" element={<DevNotifications />} />
        <Route path="settings" element={<DevSettings />} />
        <Route path="help" element={<DevHelp />} />
      </Route>

      <Route path="/recruiter" element={<Layout role="recruiter" />}>
        <Route path="dashboard" element={<RecDashboard />} />
        <Route path="profile" element={<CompanyProfile />} />
        <Route path="jobs" element={<RecJobs />} />
        <Route path="jobs/new" element={<RecCreateJob />} />
        <Route path="jobs/:id/edit" element={<RecCreateJob />} />
        <Route path="jobs/:id/requirements" element={<RecRequirements />} />
        <Route path="developers" element={<RecDevelopers />} />
        <Route path="candidates/:devId" element={<RecCandidate />} />
        <Route path="settings" element={<RecSettings />} />
        <Route path="help" element={<RecHelp />} />
      </Route>

      <Route path="/admin" element={<Layout role="admin" />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="developers" element={<AdminDevelopers />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="skills" element={<AdminSkills />} />
        <Route path="statistics" element={<AdminStatistics />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
