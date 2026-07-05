# Steam Online Tracker (Millennium Plugin)

A beautiful, seamless Millennium plugin that displays the current number of online players for any game directly in your Steam Library.

## ✨ Features
- **Live Player Count:** Fetches the exact number of players currently in-game via the official Steam API.
- **Premium UI:** Injects a beautiful, glassmorphic badge into the bottom-right corner of the game's hero banner.
- **Steam Native Design:** Matches Steam's dark mode aesthetics with subtle hover animations and a glowing "online" indicator.
- **100% Safe & Silent:** Uses zero-footprint web techniques (JSONP) and a silent background fetcher fallback to completely bypass Steam's internal Content Security Policy without triggering any console windows. No risk of VAC bans.

## 📦 Installation

1. Make sure you have [Millennium for Steam](https://millennium.web.app/) installed.
2. Download the latest release of `steam-millennium-online`.
3. Extract the folder into your Millennium plugins directory:
   - Windows: `C:\Program Files (x86)\Steam\millennium\plugins\`
4. Restart Steam.
5. Go to your Library, click on any game, and look at the bottom right of the banner!

## 🛠️ How it works
Steam's built-in browser (CEF) has a strict Content Security Policy (CSP). To bypass this safely:
1. The plugin first attempts to fetch data via JSONP (injecting a temporary script tag) to avoid CORS and CSP blocking.
2. If Steam blocks the script, the plugin seamlessly falls back to the Millennium Lua backend.
3. The Lua backend executes a completely hidden VBScript that runs `curl.exe` to fetch the data directly from the Steam API, ensuring no black console windows ever flash on your screen.

## 📝 License
MIT License
