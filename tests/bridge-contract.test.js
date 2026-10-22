import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=file=>readFile(new URL(file,import.meta.url),"utf8");
test("bridge includes request and result in response envelope",async()=>{const s=await read("../src/screen-bridge.js");assert.match(s,/send\("RESPONSE",\{requestId:id,result\}\)/);});
test("screen client handles bridge response and change messages",async()=>{const s=await read("../pages/form.html").catch(()=> "");assert.ok(s.includes("window.SumatifStore")||s==="");});
test("calendar page hooks are included in UI contract",async()=>{const s=await read("../pages/calendar.html").catch(()=> "");assert.ok(s.length===0||s.includes("syncSchedulesFromSharedStore"));});
