# Training Product Implementation Plan

**Goal:** A training organisation — a law firm, a tech school, a course business — signs in and sees a product built for it: create a training, put material in it, give it to people, watch who finishes. No faculties, no semesters, no registration.

**Architecture:** Nothing new in the database. The academic tables stay exactly as they are; a training tenant simply never sees them. One orchestration service turns a single form submission into the course, cohort, module, lessons, quiz and assignments it implies, and mode-aware navigation hides everything that does not apply.

**Roles, mapped onto the ones that exist:**

| Existing role | Reads as | Can do |
|---|---|---|
| `admin` | Owner | Everything: create trainings, invite people, manage teams, org-wide compliance |
| `lecturer` | Trainer | Create and run their own trainings, mark work, issue certificates |
| `department_admin` | Team lead | Assign training to their own team, see their team's compliance |
| `student` | Learner | Take training, see deadlines and certificates |

## Global Constraints

- **Academic tenants are untouched.** Every change is gated on `mode === 'training'`; a school sees precisely what it sees today. Existing tests must stay green.
- **No new tables.** Trainings are courses, cohorts are course sections, material is modules and lessons. The words differ; the schema does not.
- **Nothing bypasses RLS.** The orchestration service runs as the signed-in user, so a trainer cannot create a training in an organisation they do not belong to.
- **`npm run verify` green before every commit**, and commits stage explicit paths — another session writes to this tree.

## Screens

| Route | Who | Purpose |
|---|---|---|
| `/admin/trainings` | Owner, Trainer | Every training, with completion at a glance |
| `/admin/trainings/new` | Owner, Trainer | The one guided form |
| `/admin/trainings/[id]` | Owner, Trainer | Material, people, progress, certificates |
| `/admin/people` | Owner | Invite learners, group them into teams, see each person's standing |
| `/admin/compliance` | Owner, Team lead | Overdue, due soon, expiring (exists) |
| `/student/training` | Learner | What I owe and by when (exists) |

## Tasks

### Task 1 — Mode-aware navigation
`getNavigationForRole(role, vocabulary, mode)`. In training mode the menu is: Owner — Dashboard, Trainings, People, Compliance, Settings. Trainer — Dashboard, Trainings, Certificates, Settings. Team lead — Dashboard, Compliance, Settings. Learner — Dashboard, My Training, My Certificates, Settings. Faculties, Departments, Programs, Semesters, Course Registration, Gradebook and Recordings are absent, not relabelled.

### Task 2 — TrainingBuilderService
`createTraining(input)` turns one submission into: a course with no department, a cohort dated from the form, one module, the lessons in order, an optional quiz with a pass mark, `valid_for_months`, and an assignment per selected person and team. Ordered so a failure cannot leave a half-built training visible: content first, publish last.

### Task 3 — The guided form and the hub
`/admin/trainings/new` is one page: name, description, material rows (written, video, document), optional quiz, who does it, due date, repeat annually. `/admin/trainings` lists trainings with assigned and completed counts.

### Task 4 — Training detail
Material editing, the people on it with progress, and certificate issuing in one place, replacing three trips through the academic screens.

### Task 5 — People and teams
Invite a learner, put them in a team, see every training they owe. Teams are departments, named as teams.

### Task 6 — Learner experience
`My Training` links straight into the material, tracks lesson completion, gates the quiz on the pass mark, and shows the certificate when it lands.
