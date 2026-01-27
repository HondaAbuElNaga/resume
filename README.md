[README.md](https://github.com/user-attachments/files/24822738/README.md)
# Backend Project Documentation

`
python manage.py runserver == uv run manage.py runserver
`
`
celery -A main worker -l info -P eventlet
`
`
npm run dev
`



## Overview
This backend project is built using Django and provides the necessary APIs and services for the application. It is structured to support various functionalities related to CV generation and management.

## Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── core/
│   ├── __init__.py
│   ├── adapters.py
│   ├── admin.py
│   ├── apps.py
│   ├── consumers.py
│   ├── cv_views.py
│   ├── models.py
│   ├── serializers.py
│   ├── tests.py
│   ├── urls.py
│   ├── views.py
│   ├── migrations/
│   └── schemas/
├── logs/
├── main/
│   ├── __init__.py
│   ├── asgi.py
│   ├── celery.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── media/
    ├── cvs/
    ├── generated_cvs/
    └── template_previews/
```
[README.md](https://github.com/user-attachments/files/24822739/README.md)# Frontend User Guide

This document explains how to install, run, and build the frontend application (Next.js) for the Easy CV project — both locally and for deployment.

Contents
- Overview
- Prerequisites
- Project structure
- Environment variables
- Install and run locally
- Production build and run
- Development tips
- Deployment (Docker example)
- Connecting to the backend
- Common issues and troubleshooting
- Tests
- Next steps


Overview

The frontend is built with Next.js and Tailwind CSS and may use TypeScript or JavaScript depending on the repository. It provides pages for CV creation, authentication (login/register), and a dashboard for users.


Prerequisites

- Node.js: v18 or later recommended.
- Package manager: `npm`, `yarn`, or `pnpm`.
- Git (to clone the repository).


Project structure (important)

- `frontend/`
	- `package.json` — dependencies and scripts.
	- `next.config.mjs` — Next.js configuration.
	- `src/` — application code (pages, components, libs).
	- `public/` — static assets.
	- `styles/` — CSS and Tailwind files.


Environment variables

Create a `.env.local` file in the `frontend/` directory containing examples like:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_SENTRY_DSN=...
```

- `NEXT_PUBLIC_API_BASE_URL`: base URL of the backend API (used by the client).
- Other third-party keys (Google OAuth, Sentry) should be prefixed with `NEXT_PUBLIC_` so they are available in the browser.


Install and run locally

1. Clone the repository and change into the frontend folder:

```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies:

```bash
npm install
# or
# yarn install
# or
# pnpm install
```

3. Create `.env.local` as shown above.

4. Start the development server:

```bash
npm run dev
# or
# yarn dev
# or
# pnpm dev
```

The app will typically be available at `http://localhost:3000` unless the port is changed.


Common scripts

- Development: `npm run dev`
- Build (production): `npm run build`
- Start production server: `npm run start` (or `npm start` depending on `package.json`)
- Lint: `npm run lint`
- Format: `npm run format`


Production build and run

1. Build:

```bash
npm run build
```

2. Start (serve the built app):

```bash
npm run start
```

Ensure `NEXT_PUBLIC_API_BASE_URL` points to the production API endpoint.


Connecting the frontend to the backend

- Make sure the backend is running (by default `http://localhost:8000` in this project).
- Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`, for example:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

- When calling protected endpoints, ensure the frontend sends the appropriate Authorization header (e.g., `Bearer <token>`). Check the backend authentication flow in `backend/README.md` for expected tokens or cookie behavior.


Development tips

- Fast Refresh is enabled during development.
- Use React DevTools to inspect component state.
- Keep local-only settings in `.env.local` and use `.env.production` for production variables.


Deployment (Docker example)

There is a `Dockerfile` in the frontend folder. Example commands to build and run a container:

```bash
# from inside the frontend folder
docker build -t easycv-frontend .
docker run -e NEXT_PUBLIC_API_BASE_URL=https://api.example.com -p 3000:3000 easycv-frontend
```

Pass required environment variables when running the container.


Common issues and troubleshooting

- CORS errors: Ensure the backend allows requests from the frontend origin (e.g., `http://localhost:3000`).
- Environment variables not available in the browser: Variables must start with `NEXT_PUBLIC_` and the dev server must be restarted after changes.
- Build errors: Check terminal logs and verify Node.js version and dependency compatibility.


Tests

If the frontend repository includes tests, run them with:

```bash
npm test
```


Next steps (suggestions)

- Add or update an API contract document in the backend if missing.
- Add CI/CD (e.g., GitHub Actions) to build and deploy frontend automatically.
- Create a `docker-compose` example that runs frontend and backend together for local testing.


References

- Check `frontend/package.json` for the exact scripts available.
- See the backend README for server configuration: [backend/README.md](../backend/README.md)

---

If you want, I can:
- expand this README with per-page examples and API call samples,
- provide an English + Arabic bilingual README,
- or create a `docker-compose.yml` that wires `frontend` and `backend` together locally.



## Installation
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Set up a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration
- **Settings**: Update the `settings.py` file to configure your database and other settings.
- **Media Files**: Ensure the `media/` directory is properly set up for file uploads.

## Running the Application
To run the development server, use:
```bash
python manage.py runserver
```

## API Endpoints
- **CV Generation**: `/api/cv/generate/`
- **CV Management**: `/api/cv/manage/`

## Testing
To run tests, use:
```bash
python manage.py test
```
# to activate celery 
```
celery -A main worker -l info -P eventlet
```

## Additional Notes
- Ensure you have the necessary permissions for the media directory.
- For production, consider using a WSGI server like Gunicorn.

## License
This project is licensed under the MIT License.
