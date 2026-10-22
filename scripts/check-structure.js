import {access,readFile} from "node:fs/promises";
const required=["index.html","src/app.js","src/app.css","src/domain.js","src/store.js","src/screen-bridge.js","pages/dashboard.html","pages/calendar.html","pages/form.html","pages/reports.html","tests/domain.test.js","tests/store.test.js"];
for(const file of required){await access(file);console.log("OK",file);}
const html=await readFile("index.html","utf8");
if(!html.includes('type="module" src="./src/app.js"'))throw new Error("App module entrypoint missing.");
console.log("Structure check passed.");
