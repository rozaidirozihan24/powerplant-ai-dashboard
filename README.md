# PowerPlantAi2 — Google AI Studio dashboard converted to React JavaScript

This project is a **JavaScript/JSX** version of the user's original Google AI Studio stack-emissions forecasting dashboard. Its existing interface and features are retained: Operational Forecast, Model Benchmark & Test Metrics, CEMS Data Cleansing & Audit, Engineer’s Guide, Architecture, NOx/SO2/PM pollutant selection, synthetic data, CSV upload, forecasts, threshold editor and exports.

**Important:** This retains the original **stack-emissions** subject, not the earlier simple steam-flow demo. The in-browser machine-learning ensemble is a demonstration implementation trained on simulated data. The included `backend` is an optional Python API example, **not connected or deployed by default**. No PI, SharePoint, CEMS, or real-time backend is connected.

## Replace the contents of your existing PowerPlantAi2 project

1. Stop Vite with `Ctrl+C` in the terminal.
2. Back up your current `PowerPlantAi2` folder (or commit it to GitHub).
3. Extract this ZIP and copy its **files and folders** into the existing `PowerPlantAi2` folder, replacing existing source files. Keep the project at the same level as `package.json`, **not nested**.
4. Open the `PowerPlantAi2` folder in VS Code.
5. In a PowerShell terminal with Node.js available, run:

```powershell
npm.cmd install
npm.cmd run dev
```

6. Open the Local URL Vite prints (usually `http://localhost:5173`).

**If your portable Node.js is not on PATH in a new terminal**, and the folder location has not changed, run:

```powershell
$nodePath = "$env:USERPROFILE\OneDrive - Malakoff Corporation Berhad\Desktop\node-v26.13.1-win-x64\node-v26.13.1-win-x64"
$env:Path = "$nodePath;$env:Path"
node -v
npm.cmd -v
```

Use exact folder location from File Explorer if different. Never upload confidential plant or company data to a public repo or free hosting service.

## File overview
- `src/App.jsx` — dashboard tabs and coordination
- `src/components/` — original visual components converted to `.jsx`
- `src/utils/` — original simulation, preprocessing, forecasting, metrics, CSV utilities converted to `.js`
- `src/index.css` — original Tailwind styling
- `backend/` — preserved optional backend example (not started by Vite)

## Publishing
When ready, publish a synthetic-only version by pushing source files to a GitHub repository and importing the repo on Vercel using framework **Vite**, build command `npm run build`, output folder `dist`. You must not publish internal or confidential data. The deploy does not automatically provide the optional Python backend.
