# TaskFlow - Project Management & Team Collaboration App

A full-stack MERN application (MongoDB, Express, React, Node.js) where teams create workspaces, manage projects, organise tasks on a Kanban board, comment on tasks, and track deadlines and progress. It is similar in concept to Trello or Asana and is written in plain JavaScript so a student can understand and explain every important part.

> **Read this first - verification status.** This project was generated and checked in a sandbox **without internet access**. What was verified: every backend file passes a Node syntax check and loads with all local imports resolving; the validators and date helpers were unit-tested; the whole React frontend was bundled with esbuild (syntax and imports are valid). What was **not** verified: `npm install` from the registry, a real MongoDB Atlas connection, `npm run dev`/`npm run build` with Vite and Tailwind, running the UI in a browser, and the Render/Vercel deployments. Follow this README, and tick the checklist in section Q only for things you have actually seen working. If something fails, section N explains how to diagnose it.

## Table of contents

- [A. Project introduction](#a-project-introduction)
- [B. Prerequisites](#b-prerequisites)
- [C. Exact project folder structure](#c-exact-project-folder-structure)
- [D. How to open the project in VS Code](#d-how-to-open-the-project-in-vs-code)
- [E. How to install dependencies](#e-how-to-install-dependencies)
- [F. How to configure MongoDB Atlas](#f-how-to-configure-mongodb-atlas)
- [G. How to configure environment variables](#g-how-to-configure-environment-variables)
- [H. How to run the complete project locally](#h-how-to-run-the-complete-project-locally)
- [I. How to test the APIs](#i-how-to-test-the-apis)
- [J. How to upload the project to GitHub](#j-how-to-upload-the-project-to-github)
- [K. How to deploy the backend to Render](#k-how-to-deploy-the-backend-to-render)
- [L. How to deploy the frontend to Vercel](#l-how-to-deploy-the-frontend-to-vercel)
- [M. Production configuration and CORS](#m-production-configuration-and-cors)
- [N. Common errors and troubleshooting](#n-common-errors-and-troubleshooting)
- [O. How to maintain and update the project](#o-how-to-maintain-and-update-the-project)
- [P. Resume and interview preparation](#p-resume-and-interview-preparation)
- [Q. Final completion checklist](#q-final-completion-checklist)

---

## A. Project introduction

**Project name:** TaskFlow - Project Management & Team Collaboration App

**Problem it solves:** Small teams (like college project groups) often track work in chats and spreadsheets. Tasks get lost, nobody knows who owns what, and deadlines are missed. TaskFlow gives one place to plan work, assign it, see its status at a glance, and discuss it.

**Objectives**

- Build a real full-stack app where the frontend, backend and database actually work together.
- Practise authentication, authorization (who may do what), REST API design and MongoDB data modelling.
- Deploy it publicly so it can go on a resume and be demonstrated in interviews.

**Main features**

| Area | What you can do |
|---|---|
| Authentication | Separate company and employee sign-up / sign-in, log out, stay logged in after a refresh, manage profile and password |
| Company onboarding | Company registration creates a company profile and its first workspace; company admins add employee accounts by work email |
| Dashboard | Project and task totals, overdue work, upcoming deadlines, status breakdown and an interactive 3D chart of daily task completions |
| Workspaces | Company accounts create, edit and delete workspaces; invite registered employees by email; roles owner / admin / member |
| Projects | Create, edit, delete (with confirmation), start and due dates, progress, search by name |
| Tasks | Create, edit, delete, description, priority (Low/Medium/High/Urgent), due date, status (To Do/In Progress/In Review/Done), assignee |
| Kanban board | 4 columns, native browser drag-and-drop, plus a status dropdown on every card; changes are saved to MongoDB |
| Comments | Add and view comments on a task with author and time |
| Search / filter / sort | Search tasks by title; filter by status, priority, assignee, due date (overdue / today / next 7 days / none); sort by due date, priority or creation date |
| Activity | Task created / updated / status changed / assigned / comment added, stored in MongoDB |
| Responsive UI | Sidebar on large screens, slide-out menu on phones and tablets, loading / empty / error states, toasts, confirmation dialogs |

**Technology stack**

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript, React 18, Vite, Tailwind CSS 3, Three.js, Axios, React Router |
| Backend | Node.js, Express 4, REST APIs |
| Database | MongoDB (Atlas) with Mongoose |
| Security | bcryptjs (password hashing), JSON Web Tokens, helmet, express-rate-limit, CORS |
| Tools | Git, GitHub |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

### Liquid Glass UI and task report
TaskFlow uses a graphite canvas with CSS glass surfaces, accessible solid fallbacks and a small WebGL glass navigation pill.
The dashboard loads a workspace-scoped task report from `GET /api/workspaces/:workspaceId/analytics/task-report`.
Three.js draws interactive status bars and daily completions; browsers without WebGL get a matching CSS bar chart.
Install frontend dependencies with `npm install --ignore-scripts` because the LiquidGlass package runs an unavailable `patch-package` hook after install.
Start the frontend from PowerShell with `cd frontend; npm run dev`, and start the API in a second terminal with `cd backend; npm run dev`.

**Why each extra package exists**

| Package | Purpose | Without it |
|---|---|---|
| `react-router-dom` | Gives the single-page app multiple URLs (`/projects/123`) | You would write your own URL handling |
| `axios` | Makes API calls; interceptors attach the login token automatically | You would use `fetch` and repeat the header logic |
| `bcryptjs` | Hashes passwords (never store plain text) | You must never write your own hashing |
| `jsonwebtoken` | Creates and verifies signed login tokens | You would need server-side sessions |
| `cors` | Allows only your frontend's URL to call the API from a browser | Browsers would block the deployed frontend |
| `dotenv` | Loads secrets from `.env` into `process.env` | Secrets would sit in the code |
| `helmet` | Adds safe HTTP security headers | You would set them one by one |
| `express-rate-limit` | Slows down password-guessing on login/register | Unlimited login attempts |
| `nodemon` (dev only) | Restarts the backend when you save a file | You would stop and start it by hand |
| `tailwindcss`, `postcss`, `autoprefixer` (dev) | Utility-class styling pipeline | You would write all CSS yourself |

There is no validation library (rules are hand-written in `backend/utils/validators.js`) and no drag-and-drop library (native browser API). The dashboard productivity visual uses a lazy-loaded Three.js WebGL scene with a CSS bar fallback when WebGL is unavailable.

**Architecture overview**

```
 Browser (React app on Vercel)
        |  HTTPS, JSON, header "Authorization: Bearer <token>"
        v
 Express API (Render)  -->  middleware: helmet, CORS, JSON parser, rate limit, auth check
        |                    routes -> controllers -> Mongoose models
        v
 MongoDB Atlas (cloud database)
```

Request flow example (moving a card): the card is dropped on a column, `KanbanBoard` calls `onMoveTask`, `ProjectBoard` updates the screen immediately and calls `taskApi.updateStatus` (`PATCH /api/tasks/:id/status`). The backend checks the token, loads the task, checks that you belong to its workspace, validates the status, saves it, writes an activity record and returns the updated task. If saving fails, the card jumps back.

**Data model and relationships**

- **User** - name, email (unique), account type (`company` or `employee`), optional company name and password hash (never returned by the API).
- **Workspace** - name, description, `owner` (User) and a `members` list of `{ user, role }` where role is `owner`, `admin` or `member`.
- **Project** - belongs to one Workspace (`workspace`), has `createdBy`, optional `startDate` / `dueDate`.
- **Task** - belongs to one Project (`project`) and also stores its `workspace` (so permission checks and dashboard queries need no extra lookup). Has `status`, `priority`, `dueDate`, `assignee` (User), `createdBy`, `updatedBy`.
- **Comment** - belongs to a Task (`task`), written by a User (`author`).
- **Activity** - a log line linked to a workspace, project, optional task and the user who did it.

Deleting a project deletes its tasks, their comments and its activity. Deleting a workspace deletes everything inside it. Removing a member unassigns their tasks. (These cascades are done in controller code, not in a database transaction - see limitations in section P.)

**Who may do what (enforced by the backend, not just by hiding buttons)**

| Action | Allowed for |
|---|---|
| See a workspace, its projects, tasks, comments | Any member of that workspace |
| Create/edit projects, tasks, comments | Any member |
| Delete a project or task | Owner, admin, or the person who created it |
| Delete a comment | Its author, or owner/admin |
| Edit workspace, add members, remove regular members | Owner or admin |
| Add/remove admins, change roles, delete workspace | Owner only |
| Leave a workspace | Any member except the owner |

**Authentication approach (and why)**

1. On login the server checks the password with bcrypt and returns a signed JWT (valid 7 days by default) that contains only the user id.
2. The React app stores the token in `localStorage` and the Axios interceptor adds `Authorization: Bearer <token>` to every request.
3. The `protect` middleware verifies the token on every protected route and loads the user from MongoDB.
4. After a page refresh the app calls `GET /api/auth/me` with the stored token, which restores the login. Logging out deletes the token in the browser.

*Why a bearer token instead of cookies?* The frontend (`*.vercel.app`) and backend (`*.onrender.com`) are different sites. Cross-site cookies need `SameSite=None; Secure` and are increasingly blocked by browsers, which makes login fail in ways that are hard for a beginner to debug. A bearer token works the same locally and in production.
*Trade-off:* a token in `localStorage` can be read by JavaScript, so a cross-site-scripting (XSS) bug could steal it. This app reduces the risk (React escapes output, no `dangerouslySetInnerHTML`, `helmet`, short-ish expiry) but does not remove it. A hardened version would use an HTTP-only cookie with a same-origin proxy.

**Screenshots (add later)**

The folder `docs/screenshots/` does not exist yet. After the app runs, create it (`mkdir docs\screenshots` in PowerShell from the project root), save screenshots such as `dashboard.png`, `board.png`, `task-details.png` and `mobile.png` into it, and add lines like this here:

```md
![Dashboard](docs/screenshots/dashboard.png)
![Kanban board](docs/screenshots/board.png)
```

---

## B. Prerequisites

Installed **on your computer**: Visual Studio Code, Node.js (includes npm), Git.
**Cloud services** (just accounts, nothing to install): GitHub, MongoDB Atlas, Vercel, Render.

| Tool | Where to get it | Notes |
|---|---|---|
| Visual Studio Code | https://code.visualstudio.com | Your code editor |
| Node.js **LTS** | https://nodejs.org | Choose the "LTS" installer; keep the default options. Node 18 or newer is required (20 or 22 LTS recommended). npm is installed with it |
| Git | https://git-scm.com/download/win | Keep default options during setup |
| GitHub account | https://github.com | Stores your code |
| MongoDB Atlas account | https://www.mongodb.com/cloud/atlas/register | Cloud database |
| Vercel account | https://vercel.com/signup | Sign up with your GitHub account (easiest) |
| Render account | https://render.com | Sign up with your GitHub account (easiest) |

**Verify the installs.** Close and reopen VS Code after installing, open a terminal (section D) and run:

```powershell
node -v
npm -v
git --version
```

Each command should print a version number (for example `v22.x.x`, `10.x.x`, `git version 2.x.x`). If you see "not recognized", see section N.

Before your first commit, tell Git who you are (once per computer):

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

---

## C. Exact project folder structure

The **project root** is the folder named `taskflow`. It contains two independent apps: `backend` (the API) and `frontend` (the website). Each has its own `package.json`.

```
taskflow/                         <- PROJECT ROOT (open this folder in VS Code)
├── .gitignore                    Files Git must never upload (.env, node_modules, dist)
├── README.md                     This guide
├── backend/                      Node.js + Express API
│   ├── .env.example              Template for backend secrets (copy to .env)
│   ├── package.json              Backend dependencies and scripts
│   ├── server.js                 Entry point: checks env vars, connects to MongoDB, starts the server
│   ├── app.js                    Builds the Express app: middleware, routes, error handling
│   ├── seed.js                   OPTIONAL demo data (npm run seed / seed:remove)
│   ├── config/
│   │   └── db.js                 MongoDB connection
│   ├── models/                   Mongoose schemas (database structure)
│   │   ├── User.js  Workspace.js  Project.js  Task.js  Comment.js  Activity.js
│   ├── middleware/
│   │   ├── authMiddleware.js     "protect": verifies the login token
│   │   ├── errorHandler.js       Turns errors into clean JSON responses
│   │   ├── rateLimiter.js        Limits login/register attempts
│   │   └── validateObjectId.js   Rejects malformed ids in URLs
│   ├── routes/                   URL -> controller mapping
│   │   ├── authRoutes.js  userRoutes.js  workspaceRoutes.js  projectRoutes.js
│   │   └── taskRoutes.js  activityRoutes.js  dashboardRoutes.js
│   ├── controllers/              The actual logic for each endpoint
│   │   ├── authController.js  userController.js  workspaceController.js  projectController.js
│   │   └── taskController.js  commentController.js  activityController.js  dashboardController.js
│   └── utils/                    Small helpers
│       ├── ApiError.js           Error with an HTTP status code
│       ├── asyncHandler.js       Forwards async errors to the error handler
│       ├── access.js             Membership/role checks used by every controller
│       ├── activity.js           Writes activity records
│       ├── constants.js          Statuses, priorities, roles
│       ├── dates.js              "Start of today (UTC)" helpers
│       ├── progress.js           Project progress calculation
│       ├── token.js              Creates login tokens
│       └── validators.js         Input validation functions
└── frontend/                     React + Vite + Tailwind website
    ├── .env.example              Template for the API URL (copy to .env)
    ├── index.html                Page shell (loads the Manrope font and src/main.jsx)
    ├── package.json              Frontend dependencies and scripts
    ├── vite.config.js            Vite settings (dev port 5173)
    ├── tailwind.config.js        Tailwind settings (scans src for classes)
    ├── postcss.config.js         Connects Tailwind to the build
    ├── vercel.json               Makes page refreshes work on Vercel
    └── src/
        ├── main.jsx              Starts React, wraps the app in Router + Toast + Auth providers
        ├── App.jsx               All routes (URLs -> pages)
        ├── index.css             Tailwind + reusable button/input/card classes
        ├── api/
        │   ├── client.js         Axios instance, token header, error-message helper
        │   └── endpoints.js      Every backend call, grouped by resource
        ├── context/
        │   ├── AuthContext.jsx   Logged-in user, login/register/logout
        │   └── ToastContext.jsx  Success/error pop-up messages
        ├── utils/                constants.js, format.js (dates), taskParams.js (filters -> query string)
        ├── components/           Reusable UI: Layout, Modal, ConfirmDialog, KanbanBoard, TaskCard,
        │                         TaskForm, ProjectForm, ProjectCard, TaskFilters, ActivityList,
        │                         Badges, Avatar, ProgressBar, Loading, ErrorMessage, EmptyState,
        │                         Icons, AuthShell, RouteGuards
        └── pages/                Login, Register, Dashboard, Workspaces, WorkspaceDetail, Projects,
                                  ProjectDetail, ProjectBoard, TaskDetail, Profile, NotFound
```

Folders such as `node_modules/` (downloaded packages), `dist/` (production build) and `package-lock.json` (exact versions) appear after you install or build; they are not part of the ZIP. The ZIP has no `package-lock.json` because it could not be generated without internet access - `npm install` creates it, and you should commit it.

---

## D. How to open the project in VS Code

1. **Get the files.** Download/receive `taskflow.zip`. In Windows File Explorer right-click it, choose **Extract All...**, and pick a simple location such as `C:\Users\YourName\Projects`. You should end up with `C:\Users\YourName\Projects\taskflow`. Avoid extracting into `Downloads` or into a folder that is inside the ZIP itself.
2. **Locate the folder.** In File Explorer open `taskflow`. You should see the folders `backend` and `frontend` and the file `README.md`. If you only see another `taskflow` folder inside, open that one.
3. **Open in VS Code.** Open VS Code, choose **File > Open Folder...**, select the `taskflow` folder (the one containing `backend` and `frontend`) and click **Select Folder**. Click "Yes, I trust the authors" if asked. (Shortcut: in File Explorer, right-click inside the folder and choose "Open with Code".)
4. **Open the integrated terminal.** Menu **Terminal > New Terminal** or press <kbd>Ctrl</kbd> + <kbd>`</kbd>. A PowerShell panel opens at the bottom.
5. **Move between folders.** Terminals start in the project root. Use:

   ```powershell
   cd backend      # go into the backend folder
   cd ..           # go back up to the project root
   cd frontend     # go into the frontend folder
   ```
6. **Tell the terminals apart.** The prompt shows the current folder, for example `PS C:\Users\YourName\Projects\taskflow\backend>`. You will use **two terminals** later: click the **+** icon in the terminal panel to open another. Right-click a terminal tab > **Rename** to call them `backend` and `frontend`.
7. **Confirm you are in the right directory.** Run:

   ```powershell
   pwd          # prints the current folder path
   ls           # lists files
   ```

   In `backend` you should see `package.json`, `server.js`, `app.js`. In `frontend` you should see `package.json`, `index.html`, `vite.config.js`. Running `npm` commands in the root folder (which has no `package.json`) is the most common beginner mistake.

---

## E. How to install dependencies

`package.json` lists a project's dependencies and its `npm run ...` scripts. `package-lock.json` records the exact versions that were installed, so everyone (and Render/Vercel) installs identical versions. Packages are downloaded into `node_modules/`, which is never committed. Both dependency lists contain only what the code imports (see the table in section A), so nothing here is optional.

There are two separate `package.json` files, so install twice:

```powershell
# Terminal 1 - from the project root
cd backend
npm install
```

```powershell
# Terminal 2 - from the project root
cd frontend
npm install
```

Wait for each to finish (it may print some "deprecated" warnings; warnings are fine, errors are not). Afterwards each folder contains `node_modules/` and `package-lock.json`.

---

## F. How to configure MongoDB Atlas

The website layout of Atlas changes from time to time; button names below may differ slightly, but the steps stay the same.

1. **Create an account** at https://www.mongodb.com/cloud/atlas/register (you can sign in with Google or GitHub) and verify your email.
2. **Create a project and a free database.** Create a project (for example `TaskFlow`), then choose **Create** / **Build a Database** and select the free **M0** option. Pick a nearby region (for Delhi, a Mumbai or Singapore region is a good choice) and create the cluster. If Atlas shows a "Connect" wizard right away, you can use it for steps 3 and 4.
3. **Create a database user.** In the left menu open **Database Access > Add New Database User**. Choose *Password* authentication, enter a username (for example `taskflow_user`) and click **Autogenerate Secure Password** - copy it somewhere safe. For privileges choose a role that only covers this app (for example "Read and write to any database" is the simplest; a custom role limited to the `taskflow` database is stricter). Click **Add User**. Prefer letters and numbers in the password; if it contains characters such as `@ : / ? # %`, they must be URL-encoded in the connection string (see step 6).
4. **Allow network access.** Open **Network Access > Add IP Address**. For local development click **Add Current IP Address**. *For Render's free tier you will also need to allow all addresses (`0.0.0.0/0`, "Allow access from anywhere")* because its outgoing IP addresses are not fixed. Understand the trade-off: the database is then reachable from anywhere on the internet and protected only by your username and password, so use a long random database password, a least-privilege user, never share the connection string, and consider a paid plan with fixed IPs or private networking for real production use. Do not use `0.0.0.0/0` carelessly.
5. **Get the connection string.** Go to **Database > Connect** (on your cluster) **> Drivers** (Node.js). Copy the string. It looks like:

   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. **Edit it.** Replace `<username>` and `<password>` with your database user's values (remove the `<` `>` brackets). Add the database name **`taskflow`** between `.net/` and `?`:

   `mongodb+srv://taskflow_user:YourPassword123@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority`

   (This example is made up. If your password has special characters, encode them - for example `@` becomes `%40`.) Atlas creates the `taskflow` database automatically when the first document is saved.
7. **Put it in the backend `.env` file** as `MONGODB_URI=...` (section G).
8. **Keep it private.** Never paste the real string into the README, a screenshot, a chat, or GitHub. If it leaks, reset the database user's password in Atlas immediately.
9. **Verify the connection.** Start the backend (section H). You should see `MongoDB connected (database: taskflow)`. You can also open `http://localhost:5000/api/health` - it should show `"status":"ok"`.
10. **Common connection errors:**
    - `bad auth` / `Authentication failed` - wrong username or password, or an un-encoded special character in the password.
    - `ENOTFOUND` / `querySrv ECONNREFUSED` / timeout (`Server selection timed out`) - your IP address is not in Network Access, you are offline, or a school/office network blocks the connection (try a phone hotspot).
    - `MONGODB_URI is missing` - the `.env` file is missing or in the wrong folder (section G).

---

## G. How to configure environment variables

Environment variables hold settings and secrets outside the code. There are **two separate `.env` files**.

### Backend: `backend/.env` (secrets - never public)

Create it by copying the template (run from the project root):

```powershell
cd backend
Copy-Item .env.example .env
```

Open `backend/.env` in VS Code and fill in:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

| Variable | Meaning |
|---|---|
| `PORT` | Local port. On Render the platform sets this itself - the code uses `process.env.PORT` |
| `MONGODB_URI` | Your Atlas connection string from section F |
| `JWT_SECRET` | Long random text used to sign login tokens. Anyone who knows it can forge logins |
| `JWT_EXPIRES_IN` | Optional. Login lifetime (default `7d`) |
| `CLIENT_URL` | The website address allowed to call the API (CORS). Several addresses can be separated with commas. No trailing slash |
| `NODE_ENV` | `development` locally, `production` on Render |

**Create a strong secret** (run in any terminal, copy the output into `JWT_SECRET`):

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend: `frontend/.env` (public values only)

```powershell
cd frontend
Copy-Item .env.example .env
```

```
VITE_API_URL=http://localhost:5000/api
```

**Important:** every variable starting with `VITE_` is compiled into the website and visible to anyone who opens the browser's developer tools. Never put a database string, JWT secret or any password in the frontend `.env`.

### Restarting after changes

Backend: stop it (<kbd>Ctrl</kbd> + <kbd>C</kbd>) and run `npm run dev` again (nodemon only restarts on code changes, not `.env` changes). Frontend: stop and run `npm run dev` again - Vite reads `.env` only at startup.

### Common mistakes

- **Wrong file name:** it must be exactly `.env`. Windows may hide extensions and create `.env.txt`. In File Explorer enable **View > Show > File name extensions** to check. VS Code's file list shows the real name.
- **Wrong directory:** `backend/.env` for the backend, `frontend/.env` for the frontend - not the project root.
- **Missing variable:** the backend exits with `Missing environment variables: ...`.
- **Incorrect MongoDB string:** see section F, step 10.
- **Spaces or quotes:** write `KEY=value` with no spaces around `=` and no quotes.
- **Committing `.env`:** the root `.gitignore` excludes it; always check (section J, step 8).

---

## H. How to run the complete project locally

Local URLs: **backend `http://localhost:5000`**, **frontend `http://localhost:5173`**.

1. Open the project in VS Code (section D) and make sure both `.env` files exist and both `npm install` commands have finished.
2. **MongoDB Atlas connectivity** needs nothing to start - it is a cloud service. Just make sure your IP is allowed (section F, step 4) and `MONGODB_URI` is correct.
3. **Terminal 1 - start the backend:**

   ```powershell
   cd backend
   npm run dev
   ```

   `npm run dev` runs `nodemon server.js`; nodemon restarts the server automatically whenever you save a backend file. You should see `MongoDB connected (database: taskflow)` and `TaskFlow API running on port 5000`. (`npm start` runs plain `node server.js`, which is what Render uses.)
4. **Verify the backend:** open http://localhost:5000/api/health in a browser. Expected: `{"success":true,"status":"ok",...}`.
5. **Terminal 2 - start the frontend** (click **+** for a new terminal):

   ```powershell
   cd frontend
   npm run dev
   ```

   Vite prints `Local: http://localhost:5173/`.
6. **Open** http://localhost:5173 in your browser. You are redirected to the login page.
7. **Register** an account (name, email, a password of 8+ characters with a letter and a number). You land on the dashboard.
8. **Create a workspace** (Workspaces > New workspace), open it, then **New project**.
9. **Create tasks** (New task) and open **Open board**. Drag a card to another column, or use the status dropdown on the card. Open a task to add comments.
10. **Verify persistence:** refresh the browser - everything is still there, and you are still logged in. In the Atlas website open **Database > Browse Collections > taskflow** and you will see the `users`, `workspaces`, `projects`, `tasks`, `comments` and `activities` collections filled with your data.

**To try collaboration:** register a second account (use a private window), then as the first user open the workspace and add the second user's email under Members.

**Optional demo data** (stop with <kbd>Ctrl</kbd> + <kbd>C</kbd> any time; it refuses to run if `NODE_ENV=production`):

```powershell
cd backend
npm run seed          # creates demo@taskflow.dev and teammate@taskflow.dev, password Demo@1234, plus a workspace, 2 projects, 9 tasks
npm run seed:remove   # deletes those two users and the workspaces they own
```

Available scripts - backend: `npm run dev`, `npm start`, `npm run seed`, `npm run seed:remove`. Frontend: `npm run dev`, `npm run build` (creates `dist/`), `npm run preview` (serves the build locally).

---

## I. How to test the APIs

All routes start with `/api`. Everything except `register`, `login` and `health` needs a login token in the header `Authorization: Bearer <token>`. Without it you get `401 You are not logged in`.

**In a browser** you can only send GET requests, so only the public check works:

- http://localhost:5000/api/health - should return `status: ok`
- http://localhost:5000/api/workspaces - returns a `401` JSON error (proof that protected routes are protected)

**In PowerShell** (already installed - no extra tool). Run these with the backend running:

```powershell
# 1. Register (the response contains a token)
$body = @{ name = "Test User"; email = "test@example.com"; password = "Test1234" } | ConvertTo-Json
$auth = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/register -ContentType "application/json" -Body $body
$headers = @{ Authorization = "Bearer $($auth.token)" }

# 2. Log in later with: POST /api/auth/login  { "email": "...", "password": "..." }

# 3. Create a workspace, then a project inside it
$ws = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/workspaces -Headers $headers -ContentType "application/json" -Body (@{ name = "My Team" } | ConvertTo-Json)
$wsId = $ws.workspace._id
$project = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/projects -Headers $headers -ContentType "application/json" -Body (@{ workspace = $wsId; name = "Website"; description = "Redesign" } | ConvertTo-Json)
$projectId = $project.project._id

# 4. Create a task, then move it to "In Progress"
$task = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/tasks -Headers $headers -ContentType "application/json" -Body (@{ project = $projectId; title = "Write copy"; priority = "High"; dueDate = "2026-12-01" } | ConvertTo-Json)
$taskId = $task.task._id
Invoke-RestMethod -Method Patch -Uri "http://localhost:5000/api/tasks/$taskId/status" -Headers $headers -ContentType "application/json" -Body (@{ status = "In Progress" } | ConvertTo-Json)

# 5. List tasks with filters
Invoke-RestMethod -Uri "http://localhost:5000/api/tasks?project=$projectId&status=In Progress&sort=priority" -Headers $headers
```

*Optional:* a tool such as Postman or the VS Code "Thunder Client" extension gives a friendlier interface for the same requests. It is not required.

**Endpoints** (all implemented in `backend/routes`):

| Method & path | What it does | Notes |
|---|---|---|
| `GET /api/health` | Server + database status | Public |
| `POST /api/auth/register` | Create account | Body `{ name, email, password }` -> `201` with `token` and `user` |
| `POST /api/auth/login` | Log in | Body `{ email, password }`; wrong details -> `401 Invalid email or password.` |
| `GET /api/auth/me` | Current user | Used to restore login |
| `PUT /api/users/profile` | Change name | `{ name }` |
| `PUT /api/users/password` | Change password | `{ currentPassword, newPassword }` |
| `GET /api/workspaces` | Your workspaces | |
| `POST /api/workspaces` | Create workspace | `{ name, description? }` |
| `GET /api/workspaces/:workspaceId` | Details + members + your role | Members only |
| `PUT /api/workspaces/:workspaceId` | Edit | Owner/admin |
| `DELETE /api/workspaces/:workspaceId` | Delete everything inside | Owner |
| `POST /api/workspaces/:workspaceId/members` | Add registered user | `{ email, role? }` role `member` or `admin`; owner/admin |
| `PATCH /api/workspaces/:workspaceId/members/:userId` | Change role | `{ role }`; owner |
| `DELETE /api/workspaces/:workspaceId/members/:userId` | Remove member / leave | |
| `GET /api/projects` | Projects you can access | `?workspace=<id>&search=<text>` |
| `POST /api/projects` | Create | `{ workspace, name, description?, startDate?, dueDate? }` |
| `GET /api/projects/:projectId` | Details, progress, members | |
| `PUT /api/projects/:projectId` | Edit | Any member |
| `DELETE /api/projects/:projectId` | Delete project + tasks | Owner/admin/creator |
| `GET /api/tasks` | List/filter/sort | `?project=&status=&priority=&assignee=(me\|unassigned\|id)&search=&due=(overdue\|today\|week\|none)&sort=(createdAt\|dueDate\|priority)&order=(asc\|desc)` |
| `POST /api/tasks` | Create | `{ project, title, description?, status?, priority?, dueDate?, assignee? }` |
| `GET /api/tasks/:taskId` | Details | |
| `PUT /api/tasks/:taskId` | Edit (any field above) | Any member |
| `PATCH /api/tasks/:taskId/status` | Move on the board | `{ status }` |
| `DELETE /api/tasks/:taskId` | Delete | Owner/admin/creator |
| `GET /api/tasks/:taskId/comments` | List comments | |
| `POST /api/tasks/:taskId/comments` | Add comment | `{ text }` |
| `DELETE /api/tasks/:taskId/comments/:commentId` | Delete comment | Author or owner/admin |
| `GET /api/activity` | Activity log | `?project=<id>` or `?task=<id>`, `&limit=` |
| `GET /api/dashboard` | Dashboard statistics | Optional `?workspace=<id>` |

Responses are JSON with `success: true/false`. Errors look like `{ "success": false, "message": "..." }`. Status codes used: 200, 201, 400 (invalid input), 401 (not logged in), 403 (not allowed), 404 (not found), 409 (conflict, e.g. duplicate email), 413, 429 (too many attempts), 500.

---

## J. How to upload the project to GitHub

1. **Create the repository.** On https://github.com click **+ > New repository**. Name it `taskflow`, choose Public (good for a portfolio) or Private, and **do not** tick "Add a README", ".gitignore" or a license (you already have them). Click **Create repository**.
2. **Open the project root** in VS Code (section D) and a terminal there (`pwd` should end in `\taskflow`).
3. **Initialise Git** (skip if the folder already has a `.git` folder):

   ```powershell
   git init
   ```
4. **Add and commit:**

   ```powershell
   git add .
   git commit -m "Initial commit: TaskFlow MERN app"
   ```
5. **Connect to GitHub and push.** Replace `YOUR_USERNAME` (and `taskflow` if you used another name) with your own values. Do not put passwords or tokens in this URL.

   ```powershell
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
   git push -u origin main
   ```

   A browser window asks you to sign in to GitHub the first time (Git Credential Manager); approve it.
6. **Verify.** Refresh your repository page: you should see `backend`, `frontend`, `README.md` and `.gitignore`.
7. **Check secrets were not uploaded.** In PowerShell run `git ls-files | Select-String "env"`. The only result should be `backend/.env.example` and `frontend/.env.example`. If a plain `.env` appears, stop: run `git rm --cached backend/.env` (and/or `frontend/.env`), commit, push, and **change every secret that was inside it** (reset the Atlas password and generate a new `JWT_SECRET`) because it has been public.
8. **Future changes:**

   ```powershell
   git status                      # see what changed
   git add .
   git commit -m "Describe what you changed"
   git push
   ```

Commit `package-lock.json` too (it is created by `npm install`).

---

## K. How to deploy the backend to Render

Deploy the backend **first**, then the frontend. Hosting free tiers, button names and sleep behaviour change over time, so read what Render shows on screen. At the time of writing, free web services go to sleep after a period without traffic, so the first request after a pause can take about a minute.

1. Make sure your latest code is on GitHub (section J).
2. Log in at https://dashboard.render.com and click **New + > Web Service**.
3. Choose **Build and deploy from a Git repository**, connect your GitHub account if asked, and select the `taskflow` repository.
4. Fill in the form:
   - **Name:** for example `taskflow-api` (this becomes part of the URL)
   - **Region:** the one closest to your users
   - **Branch:** `main`
   - **Root Directory:** `backend` (important: the backend lives in a subfolder)
   - **Runtime / Language:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (runs `node server.js`, exactly the `start` script in `backend/package.json`)
   - **Instance Type:** Free
5. Open **Environment Variables** (or the Advanced section) and add:

   | Key | Value |
   |---|---|
   | `MONGODB_URI` | Your Atlas connection string (with `/taskflow` in it) |
   | `JWT_SECRET` | A new long random secret (at least 32 characters - generate it as in section G; do not reuse your local one) |
   | `CLIENT_URL` | For now `http://localhost:5173`; you will change it to your Vercel URL in section L |
   | `NODE_ENV` | `production` |

   Do **not** set `PORT`: Render provides it. The server listens on `process.env.PORT` because the platform decides which port your app must use; hard-coding 5000 would make the service unreachable.
6. In MongoDB Atlas > Network Access make sure Render can connect (section F, step 4).
7. Click **Create Web Service**. Render installs packages and starts the server; watch the **Logs** tab until you see `MongoDB connected` and `TaskFlow API running`.
8. Copy the public URL shown at the top, such as `https://taskflow-api.onrender.com`.
9. **Test a real endpoint:** open `https://YOUR-SERVICE.onrender.com/api/health` - it should show `"status":"ok"`.
10. **If it fails:** open **Logs**. Typical causes: `Missing environment variables`, `Authentication failed` (bad Atlas password), `Server selection timed out` (Atlas network access), or **Root Directory** not set to `backend` (error like "Could not read package.json").

Every push to `main` redeploys automatically (Render's default). Environment variable changes also restart the service.

---

## L. How to deploy the frontend to Vercel

1. Make sure the code is on GitHub and the backend is deployed (you need its URL).
2. Log in at https://vercel.com, click **Add New... > Project** and import your `taskflow` repository.
3. In **Configure Project**:
   - **Framework Preset:** Vite
   - **Root Directory:** click **Edit** and choose `frontend`
   - **Build Command:** `npm run build` (the default for Vite)
   - **Output Directory:** `dist` (the default for Vite)
   - **Install Command:** leave the default
4. Open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com/api` (your Render URL **plus `/api`**, no trailing slash) |

5. Click **Deploy**. When it finishes Vercel shows your public URL, for example `https://taskflow-yourname.vercel.app`.
6. **Now go back to Render** > your service > **Environment** and change `CLIENT_URL` to exactly that Vercel URL (`https://taskflow-yourname.vercel.app`, no trailing slash). Save; Render restarts the service.
7. Open the Vercel URL and test: register, create a workspace, project and task, drag a card, refresh the page, and open a project URL directly and refresh (this works because of `frontend/vercel.json`, which sends every path to `index.html`).
8. **Troubleshooting:** see sections M and N. Remember that `VITE_` variables are baked into the site when it is **built**, so after changing `VITE_API_URL` you must trigger a new deployment (Vercel > Deployments > the three dots > **Redeploy**).

The deployed frontend must not call localhost. To check, open the live site, press <kbd>F12</kbd>, open the **Network** tab, perform an action and confirm the requests go to `onrender.com`.

---

## M. Production configuration and CORS

| Setting | Local | Production |
|---|---|---|
| Frontend URL | `http://localhost:5173` | `https://your-app.vercel.app` |
| Backend URL | `http://localhost:5000` | `https://your-api.onrender.com` |
| `VITE_API_URL` (frontend; set in `frontend/.env` locally and in Vercel for production) | `http://localhost:5000/api` | `https://your-api.onrender.com/api` |
| `CLIENT_URL` (backend; `backend/.env` locally, Render for production) | `http://localhost:5173` | `https://your-app.vercel.app` |

**CORS** is the browser rule that a website may only call another site's API if that API allows it. `backend/app.js` allows only the origins listed in `CLIENT_URL` (comma-separated; trailing slashes are removed automatically). The value must match the address in the browser's address bar exactly: `https` vs `http`, no extra path, no trailing slash. Requests without an `Origin` header (PowerShell, Postman) are not affected by CORS.

**Authentication in production:** this project uses a bearer token, not cookies. `frontend/src/api/client.js` adds `Authorization: Bearer <token>` to every request, so no cross-site cookie settings, `credentials` options or `SameSite` rules are needed, and login works the same locally and on Vercel/Render over HTTPS. (If you switch to cookies later, you would need `SameSite=None; Secure`, `withCredentials: true` and CORS `credentials: true`, and some browsers would still block third-party cookies.)

**Other production notes:** use a different, long `JWT_SECRET` than your local one; the backend refuses to start in production with a secret shorter than 32 characters; Vercel preview URLs (random subdomains) are *not* allowed by `CLIENT_URL` unless you add them, comma-separated.

---

## N. Common errors and troubleshooting

| Problem | How to identify | Fix |
|---|---|---|
| `node` / `npm` is not recognized | PowerShell says "The term 'node' is not recognized" | Install Node.js LTS (section B), then **close and reopen VS Code** completely. Still failing: restart the computer |
| `npm : File ...npm.ps1 cannot be loaded because running scripts is disabled` | Red PowerShell error on Windows | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` in PowerShell (answer `Y`), or switch the terminal to Command Prompt via the dropdown next to the **+** |
| Dependencies are missing | `Cannot find module 'express'` / `Failed to resolve import "axios"` | Run `npm install` **inside** the folder that failed (`backend` or `frontend`) |
| `npm run dev` fails | Error text right after the command | Read the first error line. Usually a missing install, wrong folder, or a missing script (`Missing script: "dev"` means you are in the wrong folder, e.g. the root) |
| The wrong directory is open | `ENOENT ... package.json` or `Missing script` | Run `pwd`; `cd` into `backend` or `frontend` (section D) |
| Frontend cannot connect to backend | Red "Cannot reach the server" message; Network tab shows failed requests | Is the backend terminal running? Open `/api/health`. Check `VITE_API_URL` (needs `/api` at the end), restart `npm run dev` after editing `.env` |
| MongoDB authentication fails | Backend log: `bad auth` / `Authentication failed` | Recheck username/password in `MONGODB_URI`; URL-encode special characters; reset the user's password in Atlas > Database Access |
| MongoDB connection times out | `Server selection timed out`, `ENOTFOUND` | Atlas > Network Access: add your current IP (or `0.0.0.0/0` for Render); check internet; try a phone hotspot; confirm the cluster is not paused |
| Environment variables are undefined | `Missing environment variables: ...` | `.env` must be named exactly `.env`, sit inside `backend/`, and use `KEY=value` lines; restart the server |
| Port already in use | `EADDRINUSE: address already in use :::5000` | An old backend is still running: close other terminals (<kbd>Ctrl</kbd> + <kbd>C</kbd>) or change `PORT` in `backend/.env` (and `VITE_API_URL`). Vite picks the next free port automatically; if it is not 5173, update `CLIENT_URL` to match |
| CORS errors | Browser console: "blocked by CORS policy" | `CLIENT_URL` on the backend must equal the website's exact address. Restart/redeploy the backend after changing it |
| Login fails unexpectedly | "Invalid email or password." | Check the email and password; register first; with seed data use `demo@taskflow.dev` / `Demo@1234`. "Too many attempts" means the rate limit hit - wait 15 minutes |
| Protected route returns an authentication error | `401` "You are not logged in" / "session is invalid or has expired" | Log in again. The token expires after 7 days. If you changed `JWT_SECRET`, all old tokens become invalid. In PowerShell, send the `Authorization` header (section I) |
| 403 "You do not have access" | Opening someone else's workspace, project or task | Expected behaviour. Ask the owner/admin to add your email under Members |
| Render deployment fails | Red "Deploy failed" in Render | Open Logs. Check Root Directory = `backend`, Build = `npm install`, Start = `npm start`, all four env vars set, Atlas network access open |
| Render app is very slow the first time | First request after inactivity takes ~1 minute | Free instances sleep. Wait and retry; the app waits up to 60 seconds before showing an error |
| Vercel deployment fails | Red build error in Vercel | Open the build log. Check Root Directory = `frontend`, Framework = Vite, build `npm run build`, output `dist`. Fix the first error shown, push, and it redeploys |
| Deployed frontend still calls localhost | Network tab shows `localhost:5000` | `VITE_API_URL` was missing when the site was built. Add it in Vercel > Settings > Environment Variables and **Redeploy** |
| Page refresh gives 404 on Vercel | Direct URL like `/projects/123` shows Vercel's 404 | Make sure `frontend/vercel.json` exists in the `frontend` folder and is pushed |
| Works locally but not in production | Different behaviour online | Compare the table in section M; check Render logs and the browser's Network tab for the failing request and its status code (401 = token, 403 = permission/CORS, 500 = backend log) |
| Styles look broken | Plain unstyled page | `npm install` in `frontend`, restart `npm run dev`; ensure `tailwind.config.js`, `postcss.config.js` and `src/index.css` exist |
| Drag-and-drop does not work on a phone | Cards do not move by touch | Native browser drag-and-drop is a desktop feature; use the status dropdown on each card |

---

## O. How to maintain and update the project

**Change a frontend component.** Edit a file in `frontend/src/components` or `frontend/src/pages` with `npm run dev` running; the browser updates instantly. Shared button/input styles live in `frontend/src/index.css`.

**Add a backend endpoint** (example: `GET /api/tasks/:taskId/summary`):
1. Write the function in the right controller (use `asyncHandler`, then `getTaskForUser(...)` so permissions are checked).
2. Register it in the matching `routes/*.js` file.
3. Add a function in `frontend/src/api/endpoints.js` and call it from a page.
4. Test with PowerShell (section I), then with the UI.

**Add a field to a Mongoose model** (example: `location` on a project):
1. Add `location: { type: String, trim: true, maxlength: 100, default: '' }` to `backend/models/Project.js`.
2. Validate and save it in `createProject` / `updateProject` in `projectController.js` (use `optionalString`).
3. Add an input in `frontend/src/components/ProjectForm.jsx` and show it where needed. Existing documents simply lack the field until saved again; defaults cover that.

**Update environment variables.** Locally: edit the `.env` file and restart. Render: Dashboard > your service > **Environment** > edit > save (auto-restarts). Vercel: Settings > **Environment Variables** > edit, then **Redeploy** (values are compiled in at build time).

**Test changes locally** before pushing: run both servers (section H) and click through the feature. For the frontend, `npm run build` must finish without errors.

**Commit and push:** `git add .`, `git commit -m "message"`, `git push`.

**Redeploy:** Render and Vercel both redeploy automatically when you push to `main`. You can also redeploy manually from each dashboard (Render: **Manual Deploy**; Vercel: **Deployments > Redeploy**).

---

## P. Resume and interview preparation

**Resume description (adapt after you have verified the features yourself):**

> **TaskFlow - Project Management & Team Collaboration App** | React, Node.js, Express, MongoDB, Tailwind CSS
> Full-stack Trello/Asana-style web app with workspaces, role-based access (owner/admin/member), projects, tasks, a drag-and-drop Kanban board, comments, activity log, filtering/sorting and a statistics dashboard. Built a REST API with JWT authentication, bcrypt password hashing and backend authorization checks on every resource; modelled related data with Mongoose; deployed the frontend on Vercel, the API on Render and the database on MongoDB Atlas.

**Features you can claim once you have run them and seen them work:** registration/login with hashed passwords and JWT; protected frontend routes and protected API endpoints; workspace membership with roles; project and task CRUD; Kanban board with native drag-and-drop whose status changes persist; comments; search/filter/sort; activity records; dashboard statistics computed from real data; responsive layout; deployment on Vercel + Render + Atlas. Do not claim anything you have not tested (see section Q).

**Short architecture explanation (say it in 30 seconds):** "The React single-page app, hosted on Vercel, talks to an Express REST API on Render through Axios. The API authenticates requests with a JWT, checks the user's workspace membership and role in every controller, and stores data in MongoDB Atlas through Mongoose models: users, workspaces, projects, tasks, comments and activity."

**Questions an interviewer may ask, with beginner-friendly answers**

1. *How does login work?* The server compares the password with a bcrypt hash and returns a JWT containing the user id. The frontend stores it and sends it in the `Authorization` header; middleware verifies it on each request.
2. *Why hash passwords, and why bcrypt?* If the database leaks, plain passwords would be exposed. bcrypt is slow on purpose and adds a random salt, so guessing is expensive. I used the `bcryptjs` library instead of inventing my own scheme.
3. *Where do you enforce authorization?* On the backend (`utils/access.js`): every controller loads the resource, finds its workspace and checks the user's role. Hiding buttons in React is only convenience, because anyone can call the API directly.
4. *Why JWT in `localStorage` instead of cookies?* The frontend and API are on different domains, which makes cross-site cookies unreliable. The trade-off is XSS exposure; an HTTP-only cookie with a same-origin proxy would be the next hardening step.
5. *How did you design the data model?* References by ObjectId: workspace has members with roles; project references workspace; task references project (and stores its workspace for fast permission checks); comments reference task. I chose references over embedding because tasks and comments grow and are queried independently.
6. *How does drag-and-drop work without a library?* The card sets the task id in `dataTransfer` on `dragstart`; each column calls `preventDefault` on `dragover` and reads the id on `drop`, then the page updates the UI immediately and calls the PATCH endpoint, reverting if it fails (an optimistic update). A dropdown is the fallback for touch screens.
7. *How do you prevent NoSQL injection / bad input?* Fields are type-checked (must be strings), ids are validated with a regex, enums are whitelisted, search text is regex-escaped, and request bodies are size-limited.
8. *What is CORS and how did you configure it?* A browser rule that blocks a site from calling another origin unless that server allows it. The API allows only the URLs in `CLIENT_URL`.
9. *Why `process.env.PORT`?* The hosting platform chooses the port; the app must listen on it.
10. *What happens when a project is deleted?* The controller deletes its tasks, comments and activity so nothing is orphaned.
11. *How is dashboard data produced?* MongoDB aggregation/count queries over the tasks of the user's workspaces - nothing hard-coded.
12. *What would you improve?* See the list below.

**Known limitations and possible improvements**

- Not verified end-to-end by the author of this code generator (see the status note at the top); test and fix issues you find.
- Token cannot be revoked before it expires; no refresh tokens, email verification, or password reset.
- Rate limiting only protects login/register; no automated tests (add Jest + Supertest for the API).
- Cascading deletes are not wrapped in a database transaction, so a crash mid-delete could leave leftovers.
- Due dates are treated as UTC calendar dates; users far from UTC may see "overdue" change a few hours early or late.
- Task lists are capped at 500 and sorted in memory; add pagination for large data.
- Members are added only if they already have an account (no email invitations).
- Activity feed and comments load on page open (no real-time updates, by design: no Socket.IO).
- Drag-and-drop uses the desktop browser API; touch devices use the dropdown.
- The app uses Google Fonts (the only external resource); remove the `<link>` tags in `frontend/index.html` for a fully offline build.
- Do not describe the app as "completely secure"; it implements common basics only. Before real production use you would add a security review, monitoring, backups and stricter network rules.

---

## Q. Final completion checklist

Tick an item (`[x]`) **only after you have seen it work yourself**. Nothing below has been ticked on your behalf.

- [ ] Frontend runs locally
- [ ] Backend runs locally
- [ ] MongoDB connection works
- [ ] Authentication works
- [ ] Workspaces work
- [ ] Projects work
- [ ] Tasks work
- [ ] Kanban status changes persist
- [ ] Comments work
- [ ] Search and filters work
- [ ] Authorization is enforced (try opening another user's workspace link - you should get a 403 message)
- [ ] GitHub repository is up to date
- [ ] Render backend is deployed
- [ ] Vercel frontend is deployed
- [ ] Production environment variables are configured
- [ ] Live application has been tested
- [ ] No secrets are exposed (`git ls-files | Select-String "env"` shows only `.env.example` files)
