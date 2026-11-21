# LeadPilot frontend (plain JSX)
React + Vite + Tailwind + React Router + TanStack Query + Recharts + Lucide. No TypeScript.
```
cp .env.example .env     # VITE_API_URL=http://localhost:4000
npm install
npm run dev              # http://localhost:5173
npm run build
```
Drop-in replacement for the earlier `frontend/` folder: same pages, same API calls, same behaviour. Only the file types changed (.tsx -> .jsx, .ts -> .js), and the TypeScript tooling was removed.
