import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
 testDir:"./tests/e2e",
 fullyParallel:false,
 reporter:"list",
 timeout:20000,
 use:{baseURL:"http://127.0.0.1:4173",trace:"retain-on-failure",...devices["Desktop Chrome"]},
 webServer:{command:"npm run serve -- --port 4173",url:"http://127.0.0.1:4173",reuseExistingServer:!process.env.CI,timeout:10000},
});
