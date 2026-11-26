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
    ├── lib/
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

### Phase 2 — Developer Profile

**Status: Completed**

Phase 2 focused on implementing the Developer Profile module of Skillora. This phase covered the developer dashboard, profile-related screens, and supporting functionality for managing and viewing developer profile information.

#### Implemented Features

**Developer Dashboard**
- Developer Dashboard
- Dashboard UI and supporting functionality

**Developer Profile**
- Profile management screen
- View Profile screen
- Profile-related functionality

**Supporting Components & Utilities**
- Skill selection component
- Profile-related utilities
- Skill matching utility
- Verification utility

The implementation was committed and pushed to the `meerab` branch.

### Phase 3 — CV & Skill Extraction

**Status: Completed**

Phase 3 focused on CV upload, text extraction, skill identification, and skill-related analysis and recommendations within the Developer Module.

#### Implemented Features

**CV Upload & Processing**
- CV upload interface
- PDF and TXT file support
- CV text extraction and processing
- File validation and size restrictions

**Skill Extraction**
- Automatic skill extraction from CV text
- Skill matching against the available skill catalogue
- Extracted skills review

**Skill Management**
- Add skills manually from the available skill catalogue
- Remove selected skills
- Review extracted skills before confirmation

**Analysis & Recommendations**
- Developer skill analysis
- Skill recommendations
- Supporting skill analysis utilities

**CV Confirmation**
- Confirm extracted and selected skills
- Save CV information and confirmed skills to the developer profile

Phase 3 implementation was committed and pushed to the `meerab` branch.

### Phase 4 — GitHub Integration

**Status: Completed**

Phase 4 focused on integrating GitHub with the Developer Module, allowing developers to fetch their repositories, select repositories for analysis, and identify technical skills based on repository evidence.

#### Implemented Features

**GitHub Integration**

- GitHub username integration
- Public repository fetching
- Repository import and display
- Repository selection for analysis
- Select all and clear selection functionality
- Repository management

**Repository Analysis**

- Repository-based skill analysis
- Programming language identification
- Repository topics analysis
- Dependency detection
- Analysis of repository evidence
- Skill identification based on repository content and metadata

**Skill Evidence & Verification**

- Repository-based skill evidence
- Evidence-based skill verification
- Verified and not-found skill status
- Analysis status tracking

**GitHub Management & Reliability**

- GitHub disconnect functionality
- GitHub token cleanup on disconnect
- Improved error handling during repository fetching
- Analysis loading and progress handling
- Repository fetching and analysis error handling

Phase 4 implementation was committed to the `meerab` branch.

---

## Upcoming Phases

- **Phase 5 — Developer Workflow:** Jobs, job details, applications, notifications, and supporting screens.
- **Phase 6 — Recruiter Module:** Company and job workflows, developer discovery, and candidate management.
- **Phase 7 — Admin Module:** Platform management and statistics.

