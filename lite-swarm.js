const http = require('http');

// Point this to your local Hydra Proxy
const HYDRA_URL = 'http://localhost:4000/v1/chat/completions'; 

// The Lite-Swarm Roster
const agents = {
    architect: "You are the Architect. Break this feature request down into 3 concrete technical steps. Reply ONLY with the steps.",
    coder: "You are the Coder. Take the Architect's steps and write the exact React/TypeScript code required. No pleasantries, just code.",
    reviewer: "You are the Security Reviewer. Look at the Coder's output. If there are bugs, output fixed code. If it's perfect, reply 'LGTM'."
};

async function askAgent(agentName, input) {
    console.log(`\n🤖 [${agentName.toUpperCase()}] is thinking...`);
    
    const payload = JSON.stringify({
        model: "gpt-3.5-turbo", // Hydra will intercept and route this
        messages: [
            { role: "system", content: agents[agentName] },
            { role: "user", content: input }
        ]
    });

    return new Promise((resolve) => {
        const req = http.request(HYDRA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer lite-token' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const response = JSON.parse(data);
                const text = response.choices?.[0]?.message?.content || "Error";
                resolve(text);
            });
        });
        req.write(payload);
        req.end();
    });
}

async function runSwarm() {
    const task = process.argv.slice(2).join(" ");
    if (!task) return console.log("❌ Please provide a task. Example: node lite-swarm.js 'Build a hex map'");

    console.log(`\n🌊 LITE-SWARM INITIATED: "${task}"`);
    
    // Step 1: Architect Plans
    const plan = await askAgent('architect', task);
    console.log(`\n📋 PLAN:\n${plan}`);

    // Step 2: Coder Builds
    const code = await askAgent('coder', plan);
    console.log(`\n💻 CODE:\n${code.substring(0, 300)}... [TRUNCATED]`);

    // Step 3: Reviewer Audits
    const review = await askAgent('reviewer', code);
    console.log(`\n🛡️ REVIEW:\n${review}`);
}

runSwarm();

