# Steam Online Tracker - Developer Guide

## Build and Deploy Commands
- **Build production frontend**: `npm run build` (compiles to `.millennium/Dist/index.js`).
- **Deploy locally to Steam**: Copy `.millennium`, `backend`, `frontend`, `plugin.json`, `README.md` to `C:\Program Files (x86)\Steam\millennium\plugins\steamonline`.
- **Command template (PowerShell)**:
  ```powershell
  npm run build; $dest = "C:\Program Files (x86)\Steam\millennium\plugins\steamonline"; Copy-Item -Path ".millennium", "backend", "frontend", "plugin.json", "README.md" -Destination $dest -Recurse -Force
  ```
- **Package Release**: Zip the above files directly (without nested root folder) into `Steam_Online_Plugin.zip`.

## Architectural Decisions
- **No Python Backend**: Outdated/deprecated in newer Millennium versions. We use Lua.
- **No VBScript or Cmd.exe**: Do not invoke child processes like `wscript.exe` or `curl.exe` in Lua using `io.popen` or `os.execute` because it flashes a console window on Windows and triggers antivirus / security flags.
- **Native Lua HTTP Client**: Millennium provides a native `http` module. Import it with `local http = require("http")` and fetch via `http.get(url)`. It returns a table with `headers`, `body`, and `status`.
- **No Frontend Direct Fetch**: Steam UI blocks external requests on the frontend due to strict CSP/CORS. All web fetches must go through the Lua backend via Millennium's IPC channel (`callable`).

## Core Code Conventions
- **Frontend IPC**: Call the backend using `callable<[args], returnType>("method_name")`.
- **Security**: Any backend method (like `get_online_players`) MUST strictly validate input parameters (e.g., `appId` must match pattern `^\d+$`) before putting them into URLs.
- **Cleanup**: In `index.tsx`, prevent memory leaks by clearing `setInterval` inside window `unload` event handlers.
