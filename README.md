# Personal CRM

A simple, dependency-free personal CRM for tracking contacts, relationship context,
notes, and follow-up dates in the browser.

## Features

- Add, edit, and delete contacts
- Search by name, company, relationship, tags, or notes
- Filter by relationship type
- Track last contact date, next follow-up date, and priority
- View summary cards for total contacts, upcoming follow-ups, and high-priority people
- Saves data locally in your browser with `localStorage`

## Run locally

```bash
npm start
```

Then open <http://localhost:4173>.

## Check JavaScript

```bash
npm run check
```

## Deploy to GitHub Pages

This app is static, so GitHub Pages can host it for free.

### One-time GitHub setup

1. Open the repository on GitHub.
2. Go to **Settings** -> **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Save the setting.

### Deploy

After the setup above, every push to the `main` branch deploys the app automatically.
The included workflow publishes these files from the repository root:

- `index.html`
- `styles.css`
- `app.js`
- `package.json`
- `README.md`

### Open the live app

After the workflow finishes, GitHub shows the app URL in **Settings** -> **Pages**.
It usually looks like:

```text
https://<your-github-username>.github.io/<repository-name>/
```

For this repository, the expected URL is:

```text
https://brysond1418-arch.github.io/test-app/
```

Note: CRM data is saved with `localStorage`, so each browser/device has its own
contacts unless cloud sync is added later.
