# Doctor's Aide

AI-assisted patient intake app with voice capture, structured extraction, and offline persistence.

## Features
- Voice-to-text via browser Web Speech API (no paid STT needed)
- AI data extraction using Groq `llama-3.3-70b-versatile`
- Patient records saved to browser `localStorage` (works offline, per-device)
- Google sign-in via Firebase Authentication
- Vite + React + TypeScript + Tailwind + shadcn/ui components

## Quick start
```sh
git clone https://github.com/vijayho1/doctor-s-aide.git
cd doctor-s-aide
npm install
cp .env.example .env   # create this file using the template below
npm run dev
```

Open http://localhost:5173 and sign in with Google, then add a patient (voice or typed). Data persists in your browser.

## Environment variables (.env)
```
VITE_GROQ_API_KEY=your_groq_key

# Firebase Auth
VITE_FIREBASE_API_KEY=AIzaSyD-iw-DFQQBarKfVbc0j1FsVcX2JMj2qB8
VITE_FIREBASE_AUTH_DOMAIN=medhelp-af68a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=medhelp-af68a
VITE_FIREBASE_APP_ID=1:999268392916:web:71289a0c5fb6725d1a8041
VITE_FIREBASE_STORAGE_BUCKET=medhelp-af68a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=999268392916
```

Notes:
- Groq key is required for AI extraction.
- Firebase keys above match the current project; replace if you fork.
- `localStorage` is per-browser; clearing site data removes local patients.

## Deployment (Netlify)
1) Add env vars in Site settings → Environment variables (same as above).
2) Deploy from GitHub (main branch) or run `npm run build` locally and upload `dist/`.
3) SPA routing: `_redirects` is already configured.

## Tech stack
- Vite, React, TypeScript
- Tailwind CSS, shadcn/ui
- Groq API for AI
- Firebase Authentication
- Browser Web Speech API
- localStorage for persistence

## Troubleshooting
- **AI errors**: Verify `VITE_GROQ_API_KEY` is set in both `.env` and Netlify.
- **Auth blocked**: Ensure Netlify domain is whitelisted in Firebase Auth → Settings → Authorized domains.
- **No patients after refresh**: Browser storage was cleared; add again (data is per-device).

## Future improvements
- Replace localStorage with a shared database (Supabase/Firestore/PocketBase)
- Add audit logs per user
- Role-based access for clinics
