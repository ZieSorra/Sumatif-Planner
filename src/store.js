/**
 * Shared in-memory schedule store. No localStorage, network calls, or persistence.
 */
import {DEMO_SCHEDULES,validateSchedule,SCHEDULE_STATUS} from "./domain.js";
let schedules=DEMO_SCHEDULES.map(row=>({...row}));const listeners=new Set();
const snapshot=()=>schedules.map(row=>({...row}));
function publish(action,record){const event={action,record:record?{...record}:null,schedules:snapshot()};listeners.forEach(fn=>fn(event));}
export function getSchedules(){return snapshot();}
export function getActiveScheduleRecords(){return snapshot().filter(s=>s.status!==SCHEDULE_STATUS.CANCELLED);}
export function subscribeSchedules(listener){if(typeof listener!=="function")throw new TypeError("Listener must be a function.");listeners.add(listener);return()=>listeners.delete(listener);}
export function validateCandidate(candidate,options={}){return validateSchedule(candidate,schedules,options);}
export function saveSchedule(candidate){
 const index=candidate.id?schedules.findIndex(s=>s.id===candidate.id):-1;
 const row={...candidate,id:candidate.id||`demo-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,status:candidate.status||SCHEDULE_STATUS.SCHEDULED};
 const validation=validateSchedule(row,schedules,{excludeId:index>=0?row.id:null});
 if(!validation.valid)return {ok:false,errors:validation.errors,validation,record:null};
 if(index>=0)schedules[index]={...row};else schedules.push({...row});
 publish(index>=0?"updated":"created",row);
 return {ok:true,errors:[],validation,record:{...row}};
}
export function cancelSchedule(id){const index=schedules.findIndex(s=>s.id===id);if(index<0)return {ok:false,error:"Jadwal tidak ditemukan."};if(schedules[index].status===SCHEDULE_STATUS.CANCELLED)return {ok:true,record:{...schedules[index]},unchanged:true};schedules[index]={...schedules[index],status:SCHEDULE_STATUS.CANCELLED};publish("cancelled",schedules[index]);return {ok:true,record:{...schedules[index]},unchanged:false};}
export function resetDemoStore(){schedules=DEMO_SCHEDULES.map(s=>({...s}));publish("reset",null);}
