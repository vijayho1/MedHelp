# Doctor's Aide (MedHelp)

AI-assisted patient intake app with voice capture, structured extraction, and offline persistence.

## Features
- 🎙️ **Voice-to-text** via browser Web Speech API (no paid STT needed)
- 🤖 **AI data extraction** using OpenRouter's Xiaomi MiMo-V2-Flash model
- 💾 **Offline persistence** - Patient records saved to browser `localStorage`
- 🔐 **Google sign-in** via Firebase Authentication
- 🔍 **Search & Filter** - Filter patients by name, symptoms, or date (dd/mm/yy)
- 🧪 **Dev Mode** - Generate random test patients with AI extraction (hidden in production)
- ⚡ **Modern Stack** - Vite + React + TypeScript + Tailwind + shadcn/ui

## Why Xiaomi MiMo-V2-Flash?

We chose **[Xiaomi MiMo-V2-Flash](https://openrouter.ai/xiaomi/mimo-v2-flash:free)** as our AI extraction model for several compelling reasons:

### Model Specifications
- **Architecture**: Mixture-of-Experts (MoE) with 309B total parameters, 15B active
- **Context Window**: 262,144 tokens (256K)
- **Cost**: **FREE** via OpenRouter ($0/M input & output tokens)

### Rankings & Performance
- 🏆 **#1 Open-Source Model** on SWE-bench Verified and SWE-bench Multilingual
- 📊 **Comparable to Claude Sonnet 4.5** at only ~3.5% of the cost
- ⚡ **High Throughput**: ~69 tokens/second average
- 🟢 **100% Uptime** on OpenRouter

### Why It Works for Healthcare
- Excels at **reasoning and structured extraction** - perfect for parsing clinical notes
- Supports **hybrid-thinking mode** for complex medical inference
- Open-source with transparent model weights
- Zero cost makes it ideal for prototyping and small clinics

### Previous Models Tried
We evaluated several models before settling on MiMo-V2-Flash:
- **Groq llama-3.3-70b-versatile** - Required paid API key
- **Google Gemini** - API quota issues
- **NVIDIA Nemotron 3 Nano 30B** - Did not follow JSON output instructions
- **DeepSeek R1** - Also failed to return structured JSON

MiMo-V2-Flash provides the best balance of cost (free), capability (structured JSON extraction), and reliability.

## Deployment: Netlify → Vercel Migration

We migrated from **Netlify** to **Vercel** for the following reasons:

### Why We Switched
1. **Better SPA Routing** - Vercel handles client-side routing natively with `vercel.json`
2. **Faster Builds** - Vercel's build times are noticeably faster for Vite projects
3. **Better DX** - Automatic preview deployments and instant rollbacks
4. **Edge Functions** - Better support for serverless functions if needed later

### Vercel Configuration
The project includes a `vercel.json` file that handles SPA routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

This ensures that refreshing on any route (e.g., `/dashboard`) doesn't result in a 404.

## Quick Start

```sh
git clone https://github.com/vijayho1/MedHelp.git
cd MedHelp
npm install
cp .env.example .env   # create this file using the template below
npm run dev
```

Open http://localhost:5173 and sign in with Google, then add a patient (voice or typed). Data persists in your browser.

## Environment Variables (.env)

```env
# OpenRouter API (FREE - for AI extraction)
VITE_OPENROUTER_API_KEY=your_openrouter_key

# Firebase Auth
VITE_FIREBASE_API_KEY=AIzaSyD-iw-DFQQBarKfVbc0j1FsVcX2JMj2qB8
VITE_FIREBASE_AUTH_DOMAIN=medhelp-af68a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=medhelp-af68a
VITE_FIREBASE_APP_ID=1:999268392916:web:71289a0c5fb6725d1a8041
VITE_FIREBASE_STORAGE_BUCKET=medhelp-af68a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=999268392916
```

### Getting an OpenRouter API Key (Free)
1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up / Sign in
3. Navigate to [API Keys](https://openrouter.ai/settings/keys)
4. Create a new key and add it to your `.env`

**Note**: MiMo-V2-Flash is completely free to use!

## Deployment (Vercel)

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables in Project Settings → Environment Variables
4. Deploy! Vercel auto-deploys on every push to main

### Firebase Auth Setup
Ensure your Vercel domain is whitelisted:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Authentication → Settings → Authorized domains
3. Add your `.vercel.app` domain

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Vite + React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| AI | OpenRouter (MiMo-V2-Flash) |
| Auth | Firebase Authentication |
| Speech | Browser Web Speech API |
| Storage | localStorage |
| Hosting | Vercel |

## Project Structure

```
src/
├── components/
│   ├── PatientForm.tsx      # Main form with AI extraction
│   ├── PatientCard.tsx      # Patient display card
│   ├── VoiceRecorderWebSpeech.tsx  # Voice recording
│   └── ui/                  # shadcn/ui components
├── contexts/
│   ├── AuthContext.tsx      # Firebase auth state
│   └── PatientContext.tsx   # Patient CRUD + random generation
├── pages/
│   ├── Dashboard.tsx        # Main dashboard with filters
│   ├── Login.tsx            # Google sign-in
│   └── Index.tsx            # Landing page
└── types/
    └── patient.ts           # TypeScript interfaces
```

## Features in Detail

### Voice Recording
- Uses browser's native Web Speech API
- No external STT service needed
- Works offline (for transcription)

### AI Extraction
The AI extracts structured data from clinical notes:
- Age, History, Symptoms
- Tests, Allergies
- **Possible Condition** (AI-inferred diagnosis)
- **Recommendations** (follow-up suggestions)

### Date Filtering
Filter patients by creation date using `dd/mm/yy` or `dd/mm/yyyy` format.

### Dev Mode Features
In development (`npm run dev`), a "Generate Random Patients" button appears to create test data with AI extraction. This is hidden in production builds.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| AI errors | Verify `VITE_OPENROUTER_API_KEY` is set |
| Auth blocked | Add Vercel domain to Firebase authorized domains |
| 404 on refresh | Ensure `vercel.json` is in project root |
| Duplicate transcription | Fixed in latest update - pull latest changes |
| No patients after refresh | localStorage was cleared; data is per-device |

## Future Improvements

- [ ] Replace localStorage with cloud database (Supabase/Firestore)
- [ ] Add audit logs per user
- [ ] Role-based access for clinics
- [ ] Export patient data (PDF/CSV)
- [ ] Multi-language support for voice input

## License

MIT

---

Built with ❤️ using React, TypeScript, and AI
