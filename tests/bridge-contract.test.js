import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=path=>readFile(new URL(path,import.meta.url),"utf8");
test("bridge returns request id and result to iframe",async()=>{const s=await read("../src/screen-bridge.js");assert.match(s,/send\("RESPONSE",\{requestId:id,result\}\)/);});
test("all four screens request the shared store",async()=>{for(const path of ["../pages/dashboard.html","../pages/calendar.html","../pages/form.html","../pages/reports.html"]){const s=await read(path);assert.match(s,/ZIESORRA_SUMATIF_BRIDGE/);assert.match(s,/GET_SCHEDULES/);}});
test("report supports cancel and CSV export",async()=>{const s=await read("../pages/reports.html");assert.match(s,/CANCEL_SCHEDULE/);assert.match(s,/text\/csv/);});
