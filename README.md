# Andrea RBT

A study app for the BACB RBT exam (2026, Test Content Outline 3rd Edition), made for Andrea.
Coach Mia (a pink elephant) explains everything in simple English.

## What's inside
- **Learn**: 51 lessons (6 domains), cheat sheet, glossary with "Spanish" tooltips
- **Watch**: video lessons narrated by Mia, 7 animated explainers, podcast mode, YouTube library
- **Practice**: 168 original questions, mixed quizzes, flashcards (spaced repetition + type-the-answer), mistakes bank, 9 games, Boss Battles, 85-question mock exam
- **Fun**: XP and levels, streaks with freezes, hearts, daily chest, challenges, badges, themes and Mia outfits
- **Study plan**: exam countdown, daily plan, focus timer (25/5), weekly report
- Installable app (PWA), works offline after the first visit

## Settings
**Vercel → Settings → Environment Variables**
| Name | What it is |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio key. Gives Mia her natural voice and powers "Ask Mia". Several keys can be separated by commas. |

Without it the app still works with the device's English voice.

## Cloud save (Firebase)
- Project: `andrea-rbt-2026` (config in `src/cloud.js`; Firebase web config is public by design).
- Sign-in: name + PIN become a Firebase Email/Password account. **Authentication → Email/Password must be enabled.**
- Data: one Firestore document per account in `progress/{uid}`. Rules in `firestore.rules`
  (each account can only read/write its own document). Deploy rules with `firebase deploy --only firestore:rules`.

## Video library
Add default videos in `src/data/videos.json`:
```json
[{ "title": "Partial vs whole interval", "domain": "A", "youtubeId": "VIDEO_ID" }]
```
Andrea can also paste any YouTube link in Watch → My YouTube videos.

## Run locally
```bash
npm install
npm run dev
```
