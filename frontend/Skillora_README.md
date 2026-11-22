# Skillora

Skillora is a skill-focused platform designed to help developers showcase their skills, analyze their profiles and repositories, and connect with job opportunities. The platform also provides recruiter tools for reviewing developers and managing job requirements, along with administrative tools for platform management.

## Project Overview

Skillora aims to bring developer skills, portfolio evidence, and job matching workflows together in one platform.

### Main Modules

- **Developer Module:** Developer profile, CV and skill analysis, GitHub integration, skill evidence, recommendations, job browsing, and applications.
- **Recruiter Module:** Company profile, job posting and management, requirements review, developer discovery, and candidate review.
- **Admin Module:** Platform dashboards and management of developers, companies, skills, and statistics.
- **Public & Authentication:** Landing page, login, registration, and role-based access.

## Technology Stack

- React
- JavaScript (JSX)
- Vite
- React Router
- Browser local storage for the current demo data flow

## Repository Structure

The frontend is maintained inside the `frontend/` directory.

```text
frontend/
└── src/
    ├── api/
    ├── components/
    ├── context/
    ├── pages/
    │   ├── admin/
    │   ├── developer/
    │   └── recruiter/
    ├── App.jsx
    ├── main.jsx
    └── index.css
```

## Development Progress

### Phase 1 — Public & Authentication

**Status: Completed**

Phase 1 establishes the public entry points and shared authentication foundation.

- Landing page
- Login page
- Registration page
- Role selection and authentication flow
- Authentication context
- Routing foundation
- Protected routes and role-based access control
- Shared application layout and navigation

### Upcoming Phases

- **Phase 2 — Developer Profile:** Developer dashboard and profile-related screens.
- **Phase 3 — CV & Skill Extraction:** CV upload, skill extraction, analysis, skill sheet, and recommendations.
- **Phase 4 — GitHub Integration:** Repository connection, selection, analysis, and evidence workflows.
- **Phase 5 — Developer Workflow:** Jobs, job details, applications, notifications, and supporting screens.
- **Phase 6 — Recruiter Module:** Company and job workflows, developer discovery, and candidate management.
- **Phase 7 — Admin Module:** Platform management and statistics.


## Notes

This repository is being updated phase by phase as development progresses. Features listed under upcoming phases are planned and should not be considered complete yet.
