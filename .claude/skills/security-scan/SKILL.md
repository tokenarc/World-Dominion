---
name: security-scan
description: Performs a Red-Team audit of the current code/logic for vulnerabilities and leaks.
---
# Instructions
1. **Secret Hunting:** Scan the current file/context for hardcoded API keys, Mnemonics, or private tokens.
2. **Injection Check:** Verify that all user-input handlers are sanitized against SQLi or XSS.
3. **Logic Flaws:** Search for race conditions or unauthorized access points.
4. **The Verdict:** Assign a Risk Score (1-10). If > 3, provide the exact code fix immediately.
