# DentaPlan deployment-ready starter

This folder is a cleaned-up deployable version of the files supplied. It includes a lightweight responsive dashboard, demo appointment/patient/chair data, and a Gemini assistant UI.

## Local run

1. Install Node.js 20+ (22 recommended).
2. Run `npm install`.
3. Optional AI: copy `.env.example` to `.env` and add your Gemini API key.
4. Run `npm run dev` for the static frontend, or `npm start` to run the Express server with the AI endpoint.

## Deploy frontend

For Vercel: import this folder/repository, use `npm run build` as the build command, and `dist` as output. The static frontend works without an API key; the AI Assistant needs the Express API deployed separately with `GEMINI_API_KEY` configured.

## Notes

- The uploaded files did not include the original `src/main.tsx`, original app components, or `src/assets/images` folder. This package therefore uses a reconstructed starter dashboard and does not reproduce every original screen.
- Demo records are sample data. Do not use real patient data in this demo deployment.
- Appointment/patient data is not persisted to a database yet.

## Included original feature views
The project now includes the supplied React feature views in `src/views/`, with supporting
algorithms, clinic data, types, and UI primitives copied into their expected locations.
These views are included in the source bundle; the simplified deployment entry point
(`src/main.tsx`) is still the active UI and does not yet wire every feature view into navigation.
