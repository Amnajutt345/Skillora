
# Skillora Backend

**Skillora** is a role-based developer skill management platform backend built with FastAPI and PostgreSQL. It provides authentication, developer profile management, skill management, CV-based skill extraction, and administrator controls for managing the central skill catalogue.

This repository contains the backend REST API. It is designed to integrate with a web or mobile frontend.

---

# 1. Project Overview

Skillora aims to connect developers, recruiters, and administrators through a unified platform.

The backend currently provides:

- User registration and login
- JWT-based authentication
- Role-based access control
- Developer profile management
- Manual skill management
- CV upload and skill extraction
- Central skill catalogue management
- Admin approval and rejection of skills
- Bulk skill status management
- Duplicate skill merging
- PostgreSQL database integration

## User Roles

| Role | Description |
|---|---|
| Developer | Creates a profile, manages skills, and uploads CVs |
| Recruiter | Reserved for future recruiter-specific functionality |
| Admin | Manages and reviews the central skill catalogue |

---

# 2. Technology Stack

| Technology | Purpose |
|---|---|
| Python | Backend programming language |
| FastAPI | REST API framework |
| PostgreSQL | Relational database |
| SQLAlchemy | ORM and database operations |
| Pydantic | Request validation and response schemas |
| PyJWT | JWT authentication |
| pwdlib | Password hashing |
| psycopg2-binary | PostgreSQL driver |
| Uvicorn | Development server |
| python-dotenv | Environment variable management |
| pypdf | PDF text extraction |
| PyMuPDF | PDF processing |
| pytesseract | OCR for scanned PDFs |
| Pillow | Image processing |

---

# 3. Project Structure

```text
Skillora-Backend/
│
├── main.py
├── database.py
├── models.py
├── schemas.py
├── security.py
├── dependencies.py
├── requirements.txt
├── migrate_to_postgresql.py
├── .env
├── .gitignore
│
├── routers/
│   ├── auth.py
│   ├── profile.py
│   ├── admin.py
│   ├── recruiter.py
│   ├── jobs.py
│   └── github.py
│
├── services/
│   ├── cv_parser.py
│   └── matcher.py
│
└── uploads/
```

### Main Files

| File | Responsibility |
|---|---|
| `main.py` | Initializes FastAPI and registers routers |
| `database.py` | PostgreSQL connection and database sessions |
| `models.py` | SQLAlchemy database models |
| `schemas.py` | Request and response validation schemas |
| `security.py` | Password hashing and JWT generation |
| `dependencies.py` | Authentication and role authorization |
| `routers/auth.py` | Registration, login, logout, and user authentication |
| `routers/profile.py` | Developer profile, skills, and CV operations |
| `routers/admin.py` | Skill catalogue administration |
| `services/cv_parser.py` | Extracts text from PDF files and performs OCR |
| `services/matcher.py` | Matches extracted CV text against known skills |
| `migrate_to_postgresql.py` | One-time data migration utility |

**Note:** Recruiter, jobs, and GitHub router modules are reserved for future development. Their endpoints are not currently registered as active features.

---

# 4. Requirements

Install the following before running the project:

1. Python 3.11 or compatible version
2. PostgreSQL
3. Git
4. Visual Studio Code
5. Tesseract OCR for scanned PDF processing

---

# 5. Installation and Setup

## Step 1: Clone the Repository

```bash
git clone https://github.com/Amnajutt345/Skillora-Backend.git
```

Navigate into the project:

```bash
cd Skillora-Backend
```

## Step 2: Create a Virtual Environment

Windows PowerShell:

```powershell
python -m venv venv
```

Activate it:

```powershell
.\venv\Scripts\Activate.ps1
```

## Step 3: Install Dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Step 4: Configure Environment Variables

Create a `.env` file in the project root.

Add the following structure:

```env
DB_USER=postgres
DB_PASSWORD=your_local_database_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skillora_db

SECRET_KEY=your_long_random_secret_key
```

Replace the placeholder values with your local configuration.

**Important:**
- Never commit `.env` to GitHub.
- Never expose database passwords or JWT secrets.
- Each developer should configure their own local environment variables.

---

# 6. PostgreSQL Database Setup

Skillora uses PostgreSQL as its primary database.

## Create Database

Open pgAdmin or PostgreSQL Query Tool and execute:

```sql
CREATE DATABASE skillora_db;
```

Make sure the `.env` database credentials match your PostgreSQL installation.

## Database Connection

The backend connects through SQLAlchemy using:

```python
postgresql+psycopg2
```

The database engine uses connection health checking through `pool_pre_ping=True`.

## Main Database Tables

| Table | Purpose |
|---|---|
| `users` | Stores user accounts |
| `profiles` | Stores developer profile information |
| `skills` | Stores the central skill catalogue |
| `profile_skills` | Connects developers with their skills |
| `revoked_tokens` | Stores logged-out JWT tokens |

The SQLAlchemy models define the database structure.

---

# 7. Running the Backend

Make sure:

- Virtual environment is activated.
- PostgreSQL service is running.
- `.env` is correctly configured.

Start the development server:

```bash
uvicorn main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

## Useful URLs

| URL | Purpose |
|---|---|
| `http://127.0.0.1:8000/` | Root endpoint |
| `http://127.0.0.1:8000/health` | Health check |
| `http://127.0.0.1:8000/docs` | Swagger API documentation |
| `http://127.0.0.1:8000/redoc` | ReDoc documentation |

---

# 8. Authentication and Authorization

Skillora uses JWT-based authentication.

## Password Security

- Passwords are hashed before being stored.
- Password verification uses pwdlib.
- Plain-text passwords are never stored in the database.

## JWT Authentication

After successful login, the backend returns an access token.

Current token configuration:

| Property | Value |
|---|---|
| Algorithm | HS256 |
| Token Type | Bearer |
| Expiration | 30 minutes |

## Authentication Header

All protected endpoints require:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Role-Based Access Control

The backend checks the authenticated user's role before allowing access to protected endpoints.

| Feature | Developer | Recruiter | Admin |
|---|---|---|---|
| Registration | Yes | Yes | Yes |
| Login | Yes | Yes | Yes |
| View own account | Yes | Yes | Yes |
| Developer profile | Yes | No | No |
| Manage own skills | Yes | No | No |
| Upload CV | Yes | No | No |
| Manage skill catalogue | No | No | Yes |

A user with an incorrect role receives `403 Forbidden`.

**Security note:** Registration currently accepts the three role values. Before public deployment, administrator account creation should be restricted to a trusted provisioning process.

---

# 9. API Reference

Base URL:

```text
http://127.0.0.1:8000
```

All protected endpoints require a valid Bearer token.

## 9.1 General Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Welcome message |
| GET | `/health` | API health check |

## 9.2 Authentication Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/auth/me` | Get authenticated user details |
| POST | `/auth/logout` | Revoke current access token |

### Register

**POST** `/auth/register`

Request:

```json
{
  "name": "Sample Developer",
  "email": "developer@example.com",
  "password": "StrongPassword123",
  "role": "developer"
}
```

Successful response:

```json
{
  "message": "Account created successfully",
  "user_id": 1,
  "role": "developer"
}
```

### Login

**POST** `/auth/login`

Request:

```json
{
  "email": "developer@example.com",
  "password": "StrongPassword123"
}
```

Successful response:

```json
{
  "message": "Login successful",
  "user_id": 1,
  "name": "Sample Developer",
  "role": "developer",
  "access_token": "<JWT_ACCESS_TOKEN>",
  "token_type": "bearer"
}
```

### Get Current User

**GET** `/auth/me`

Requires authentication.

Example response:

```json
{
  "user_id": 1,
  "name": "Sample Developer",
  "role": "developer",
  "email": "developer@example.com"
}
```

### Logout

**POST** `/auth/logout`

Requires authentication.

The current token is added to the revoked-token table.

Example response:

```json
{
  "message": "Logout successful"
}
```

## 9.3 Developer Profile Endpoints

All endpoints require the `developer` role.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/profile` | Create developer profile |
| GET | `/profile` | Retrieve developer profile |
| PUT | `/profile` | Update developer profile |
| GET | `/profile/skills` | Get developer skills |
| POST | `/profile/skills` | Add a skill manually |
| DELETE | `/profile/skills/{skill_name}` | Remove a skill |
| POST | `/profile/cv` | Upload CV and extract skills |

### Create Profile

**POST** `/profile`

Request:

```json
{
  "name": "Sample Developer",
  "description": "Computer Science student",
  "qualification": "BS Computer Science",
  "location": "Faisalabad"
}
```

### Get Profile

**GET** `/profile`

Returns the authenticated developer's profile.

### Update Profile

**PUT** `/profile`

Request:

```json
{
  "description": "Software developer interested in backend development",
  "location": "Lahore"
}
```

Only supplied fields are updated.

### Get Skills

**GET** `/profile/skills`

Example response:

```json
[
  {
    "name": "Python",
    "source": "manual",
    "verified": false
  },
  {
    "name": "SQL",
    "source": "cv",
    "verified": false
  }
]
```

### Add Skill

**POST** `/profile/skills`

Request:

```json
{
  "name": "Figma"
}
```

Example response:

```json
{
  "message": "Skill added successfully",
  "skill": "Figma",
  "source": "manual",
  "verified": false
}
```

### Remove Skill

**DELETE** `/profile/skills/{skill_name}`

Example:

```http
DELETE /profile/skills/Figma
```

Example response:

```json
{
  "message": "Skill removed successfully"
}
```

### Upload CV

**POST** `/profile/cv`

Request content type:

```text
multipart/form-data
```

Form field:

```text
file
```

Accepted format:

```text
PDF
```

Example response:

```json
{
  "message": "CV uploaded successfully",
  "extracted_skills": ["Python", "SQL"],
  "added_skills": ["Python", "SQL"],
  "cv_path": "uploads/generated-file-name.pdf"
}
```

## 9.4 Administrator Endpoints

All endpoints require the `admin` role.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/skills` | Create a catalogue skill |
| GET | `/admin/skills` | List, search, filter, and paginate skills |
| PATCH | `/admin/skills/{skill_id}/status` | Approve or reject a skill |
| PATCH | `/admin/skills/bulk-status` | Bulk approve or reject skills |
| POST | `/admin/skills/merge` | Merge duplicate skills |
| DELETE | `/admin/skills/{skill_id}` | Delete an unassigned skill |

### Create Skill

**POST** `/admin/skills`

Request:

```json
{
  "name": "React Native"
}
```

### Get Skills

**GET** `/admin/skills`

Query parameters:

| Parameter | Description |
|---|---|
| `status` | Filter by pending, approved, or rejected |
| `search` | Search by skill name |
| `page` | Page number |
| `limit` | Number of records per page |

Example:

```http
GET /admin/skills?status=pending&search=java&page=1&limit=10
```

### Update Skill Status

**PATCH** `/admin/skills/{skill_id}/status`

Example:

```http
PATCH /admin/skills/12/status?status=approved
```

Allowed statuses:

- `approved`
- `rejected`

### Bulk Update Skills

**PATCH** `/admin/skills/bulk-status`

Request:

```json
{
  "skill_ids": [12, 13, 14],
  "status": "approved"
}
```

### Merge Skills

**POST** `/admin/skills/merge`

Request:

```json
{
  "source_skill_id": 13,
  "target_skill_id": 12
}
```

The source skill is merged into the target skill, and existing profile associations are transferred.

### Delete Skill

**DELETE** `/admin/skills/{skill_id}`

A skill assigned to a developer cannot be deleted.

---

# 10. CORS Configuration

The backend currently allows these development origins:

```text
http://localhost:3000
http://127.0.0.1:3000
http://localhost:5173
http://127.0.0.1:5173
```

If the frontend runs on another port, add its exact origin to the CORS configuration in `main.py`.

For deployment, configure only trusted frontend origins.

---

# 11. HTTP Status Codes and Error Handling

| Status | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created |
| 400 | Invalid request or business rule |
| 401 | Authentication required or token invalid |
| 403 | Access forbidden due to role |
| 404 | Resource not found |
| 409 | Resource conflict |
| 422 | Validation error |
| 500 | Internal server error |

Example error:

```json
{
  "detail": "Invalid email or password"
}
```

The frontend should display safe error messages and never expose internal server details.

---

# 12. CV Parsing and Skill Matching

The CV workflow follows these steps:

1. Developer uploads a PDF CV.
2. Backend saves the uploaded file.
3. PDF text is extracted using pypdf.
4. If readable text is insufficient, PyMuPDF renders pages.
5. Tesseract OCR extracts text from scanned pages.
6. The matcher compares extracted text against approved catalogue skills.
7. Matching skills are attached to the developer profile.
8. The skill source is recorded as `cv`.

The current OCR configuration contains a Windows-specific Tesseract path. Update it for other operating systems or deployment environments.

---

# 13. Database Models

## Users

Stores account information.

| Field | Description |
|---|---|
| id | Primary key |
| name | User name |
| email | Unique email |
| hashed_password | Hashed password |
| role | User role |

## Profiles

Stores developer profile information.

| Field | Description |
|---|---|
| id | Primary key |
| user_id | User foreign key |
| name | Profile name |
| description | Profile description |
| qualification | Education |
| location | Location |
| cv_path | Uploaded CV path |
| github_username | Optional GitHub username |
| created_at | Creation timestamp |

## Skills

Stores the central skill catalogue.

| Field | Description |
|---|---|
| id | Primary key |
| name | Skill name |
| status | pending, approved, rejected |
| merged_into_id | Target skill reference |
| created_at | Creation timestamp |

## Profile Skills

Connects profiles and skills.

| Field | Description |
|---|---|
| id | Primary key |
| profile_id | Profile foreign key |
| skill_id | Skill foreign key |
| source | manual or cv |
| verified | Verification status |

## Revoked Tokens

Stores revoked JWT tokens to prevent their reuse after logout.

---

# 14. Testing with Postman

Recommended testing sequence:

1. Register a developer account.
2. Log in and copy the access token.
3. Use Bearer Token authentication in Postman.
4. Create a developer profile.
5. Retrieve and update the profile.
6. Add and remove skills.
7. Upload a PDF CV.
8. Log in as an administrator.
9. Test skill creation and listing.
10. Test skill approval and rejection.
11. Test bulk skill updates.
12. Test skill merging and deletion.
13. Verify that incorrect roles receive 403.
14. Log out and verify that the revoked token cannot be reused.

Swagger UI is also available at:

```text
http://127.0.0.1:8000/docs
```

---

# 15. Data Migration Utility

The project includes:

```text
migrate_to_postgresql.py
```

This utility transfers existing project records into the configured PostgreSQL database.

Important points:

- Configure `.env` before running the script.
- The source data file expected by the script must be present in the project root.
- The target PostgreSQL tables must be empty.
- The script stops if target tables already contain records.
- Keep a backup before migration.
- Do not rerun the utility against an already populated target database.

Run only when an intentional migration is required:

```bash
python migrate_to_postgresql.py
```

For normal development, start the FastAPI server instead.

---

# 16. Security and Production Considerations

Before public deployment:

- Restrict administrator account creation.
- Use a strong and unique JWT secret.
- Enable HTTPS.
- Configure trusted CORS origins.
- Protect database credentials.
- Validate uploaded files and impose file-size limits.
- Protect uploaded CV files because they may contain personal information.
- Use appropriate database permissions.
- Add automated tests.
- Use a database schema migration system such as Alembic.
- Replace machine-specific OCR paths with deployment configuration.
- Use production server settings.
- Avoid exposing internal errors and sensitive data.

---

# 17. Current Development Scope

The currently registered backend functionality includes:

- Authentication
- Developer profiles
- Developer skills
- CV upload and skill extraction
- Administrator skill management
- PostgreSQL integration

Recruiter-specific functionality, job management, and external GitHub integration are reserved for future implementation.

The frontend should integrate only with endpoints currently available in the running API.

Always check Swagger documentation after backend changes:

```text
http://127.0.0.1:8000/docs
```

---

# 18. Git Workflow

The team uses feature branches and pull requests.

Example:

```bash
git checkout amna
git pull origin amna
```

After making changes:

```bash
git status
git add .
git diff --cached
git commit -m "Describe your changes professionally"
git push origin amna
```

Create or update a pull request:

```text
amna → test
```

Never commit:

- `.env`
- Database files
- Database backups
- Virtual environments
- Uploaded CVs
- Access tokens
- Secret keys

---

# 19. Future Development

Potential future improvements include:

- Recruiter profile and dashboard
- Job posting and job management
- Developer-job matching
- External GitHub integration
- Advanced skill-based recommendations
- Automated testing
- Alembic database migrations
- Production deployment
- Improved CV parsing and matching
- Notifications and messaging

---

# Maintainer Notes

- Keep backend schemas consistent with API request and response structures.
- Update this README whenever endpoints or database structures change.
- Use Swagger UI to verify endpoint contracts.
- Keep credentials and sensitive user information private.
- Test changes before pushing commits.
- Document newly implemented endpoints.

**Skillora Backend — FastAPI, PostgreSQL, and REST API.**
