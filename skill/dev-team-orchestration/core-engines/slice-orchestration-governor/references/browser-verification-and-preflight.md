# Browser Verification & Remote Debugging Preflight — v8.3.0

## Why Browser Preflight Matters in Antigravity

In current Antigravity releases, built-in IDE webview control (`webview_browser`) was removed from the `browser` subagent declarations in favor of **`chrome_devtools` MCP**, which drives external Google Chrome via **Chrome Remote Debugging** (`chrome://inspect/#remote-debugging`) after a one-time user `Allow / Permitir` confirmation.

At the same time, Playwright (`@playwright/test` / `playwright`) can run headless E2E tests directly in terminal when installed in a repository.

## Configured Modes (`.slices/SLICE_GOVERNOR.json` -> `browserTesting.mode`)

Set automatically during onboarding (or updated via `node .slices/agybot.mjs browser-config --mode <...>`):

1. `CHROME_DEVTOOLS_OR_PLAYWRIGHT` *(Default & Recommended)*:
   - Use **Playwright headless first** for fast deterministic assertions/CI checks when installed in the repo, and use Antigravity's `browser` subagent (`chrome_devtools` MCP) for live interactive/visual Chrome verification.
   - If Chrome Remote Debugging is inactive when `browser` / `chrome_devtools` runs, fall back to Playwright if available — or trigger a single guided `/grill-me` (`ask_question`).
2. `CHROME_DEVTOOLS`:
   - Always use external Chrome (`chrome://inspect/#remote-debugging`).
3. `PLAYWRIGHT_HEADLESS`:
   - Always run headless Playwright autonomously.
4. `MANUAL_ONLY`:
   - Skip automated browser runs; human validates UI manually.

## One-Step Guided `/grill-me` When Chrome Remote Debugging Is Not Ready

**Never loop or fail silently** on `DevToolsActivePort` / disconnected Chrome DevTools errors. Instead, issue **one** concise `ask_question` containing this 3-step setup guide:

1. Open `chrome://inspect/#remote-debugging` in Google Chrome.
2. Enable **Remote debugging** (Discover targets / port forwarding).
3. Click **Allow / Permitir** in the Chrome prompt when Antigravity connects.

And offer 3 clear choices:
- **Option 1 (Recommended):** `"Já ativei chrome://inspect/#remote-debugging — tentar Chrome agora e salvar como padrão"` -> persist with `node .slices/agybot.mjs browser-config --chrome-ready yes`, then resume verification.
- **Option 2:** `"Usar Playwright headless automaticamente e salvar como padrão"` -> persist with `node .slices/agybot.mjs browser-config --mode PLAYWRIGHT_HEADLESS`.
- **Option 3:** `"Pular teste automático no navegador agora (testarei manualmente)"` -> record honest `INCONCLUSIVE` / human visual deferral, never fabricate `VISUAL_PASS`.

## Mandatory Web Verifier Contract (QA & `AGY_UX_V2`)

Whenever automated browser verification runs (Playwright or `chrome_devtools`):
- Navigate the real running route (never synthetic fixtures alone) and click real controls (`normalPointerClickCount >= 1`, no `force:true` or JS dispatch workarounds).
- Assert **zero unexpected console errors and page errors** (`console.error == 0`).
- Verify layout and zero element overlap/overflow at both **desktop (`1280x720`)** and **mobile (`390x844`)**.
- Verify **persistence across full page reload** (`F5` / `page.reload()`) for stateful mutations.
- Attach screenshot artifacts and run qualitative `AGY_UX_V2` (`design-lint --changed`).
