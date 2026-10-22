/**
 * Same-origin message bridge from screen iframe to app shell.
 * The in-memory store is prototype-only, not a production security boundary.
 */
import {getSchedules,getActiveScheduleRecords,validateCandidate,saveSchedule,cancelSchedule,subscribeSchedules,resetDemoStore} from "./store.js";
const ALLOWED=new Set(["dashboard","calendar","form","reports"]);
const frame=document.querySelector("#screenFrame");let activeScreen="dashboard";
function send(type,payload={}){if(frame?.contentWindow)frame.contentWindow.postMessage({namespace:"ZIESORRA_SUMATIF_BRIDGE",type,payload},location.origin);}
window.addEventListener("message",event=>{
 if(event.origin!==location.origin||event.source!==frame?.contentWindow)return;
 const message=event.data;if(!message||message.namespace!=="ZIESORRA_SUMATIF_BRIDGE")return;
 const id=message.requestId;let result;
 try{switch(message.type){
 case "GET_SCHEDULES":result={ok:true,schedules:getSchedules()};break;
 case "GET_ACTIVE_SCHEDULES":result={ok:true,schedules:getActiveScheduleRecords()};break;
 case "VALIDATE_SCHEDULE":result={ok:true,validation:validateCandidate(message.payload?.candidate,message.payload?.options||{})};break;
 case "SAVE_SCHEDULE":result=saveSchedule(message.payload?.candidate||{});break;
 case "CANCEL_SCHEDULE":result=cancelSchedule(message.payload?.id);break;
 case "RESET_DEMO_STORE":resetDemoStore();result={ok:true};break;
 default:return;
 }}catch(error){result={ok:false,error:error.message};}
 send("RESPONSE",{requestId:id,result});
});
subscribeSchedules(event=>send("STORE_CHANGED",event));
export function setBridgeScreen(screen){if(ALLOWED.has(screen))activeScreen=screen;}
