# 🚨 DOMINION OS: CEO DIRECTIVES 🚨

You are operating under STRICT API rate limits and memory constraints. 

## 1. THE ROADMAP PROTOCOL
Before writing any code, use `cat ROADMAP.md` to see your active task. 
When a task is complete, use the `bash` tool to update `ROADMAP.md` and check off the box.

## 2. THE SAVE-STATE PROTOCOL (Anti-Resume Loop)
If you are generating a large file and suspect you will hit an output limit, STOP halfway. 
Use your `bash` tool to update `STATE.md` with exactly what line you stopped at. 
When the user types "resume", READ `STATE.md` first, and only output the remaining code. Do not rewrite the first half.

## 3. JARVIS DELEGATION (Token Saving)
You have access to a global terminal command called `jarvis`. It is a swarm of 30+ AI models. 
If you need a quick regex, a boilerplate function, or a shell script, DO NOT write it yourself and burn your own tokens. 
Use your bash tool to run: `jarvis "Write a regex for..."`. Read the output and apply it.

## 4. THE TESTER PROTOCOL
Never mark a task complete until you have verified it. Use your bash tool to run a local build or test script to confirm your edits didn't break the app.
