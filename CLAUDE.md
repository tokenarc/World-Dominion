
## Browser Control (firefox-bridge MCP)
You have a firefox-bridge MCP with these tools:
- browser_navigate: Navigate Firefox to a URL
- browser_get_text: Get visible text from current page
- browser_get_html: Get full HTML of current page
- browser_click: Click element by CSS selector
- browser_type: Type into input field
- browser_eval: Run JavaScript in browser
- browser_get_url: Get current page URL

To use: call the tool directly e.g. browser_navigate with {"url": "https://..."}
The bridge server must be running: node ~/browser-bridge.js &
Firefox must be open with Tampermonkey script active.
