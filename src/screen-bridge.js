/**
 * Same-origin bridge for prototype and Supabase-backed modes.
 * Supabase mode is enabled only when runtime config is present. RLS remains
 * the authorization boundary; this bridge is not a replacement for RLS.
 */
import {getSchedules,getActiveScheduleRecords,validateCandidate,saveSchedule,cancelSchedule,subscribeSchedules,resetDemoStore} from "./store.js";
import {getSupabaseClient, getCurrentUser, signInWithPassword, signOut} from "./supabase-client.js";
import {getSignedInProfile,loadPlannerReferenceData,listSchedules,createSchedule,updateSchedule,cancelScheduleInDatabase,deleteSchedulePermanently} from "./supabase-repository.js";

const ALLOWED=new Set(["dashboard","calendar","form","reports"]);
const frame=document.querySelector("#screenFrame");
let activeScreen="dashboard";
let referenceData=null;
const isSupabaseConfigured=()=>!!(window.ZIESORRA_SUPABASE_CONFIG?.url&&window.ZIESORRA_SUPABASE_CONFIG?.publishableKey);
function send(type,payload={}){if(frame?.contentWindow)frame.contentWindow.postMessage({namespace:"ZIESORRA_SUMATIF_BRIDGE",type,payload},location.origin);}
function fail(error){return {ok:false,error:error?.message||String(error)};}
async function dispatch(type,payload={}){
  if(type==="GET_AUTH_MODE") return {ok:true,mode:isSupabaseConfigured()?"supabase":"demo"};
  if(!isSupabaseConfigured()){
    switch(type){
      case "GET_AUTH_STATUS": return {ok:true,mode:"demo",profile:null};
      case "GET_REFERENCE_DATA": return {ok:true,referenceData:null};
      case "GET_SCHEDULES": return {ok:true,schedules:getSchedules()};
      case "GET_ACTIVE_SCHEDULES": return {ok:true,schedules:getActiveScheduleRecords()};
      case "VALIDATE_SCHEDULE": return {ok:true,validation:validateCandidate(payload.candidate,payload.options||{})};
      case "SAVE_SCHEDULE": return saveSchedule(payload.candidate||{});
      case "UPDATE_SCHEDULE": return saveSchedule(payload.candidate||{});
      case "CANCEL_SCHEDULE": return cancelSchedule(payload.id);
      case "DELETE_SCHEDULE": return fail(new Error("Penghapusan permanen hanya tersedia untuk admin di mode Supabase."));
      case "SIGN_IN": return fail(new Error("Konfigurasi Supabase belum tersedia."));
      case "SIGN_OUT": return {ok:true};
      case "RESET_DEMO_STORE": resetDemoStore(); return {ok:true};
      default: return null;
    }
  }

  switch(type){
    case "GET_AUTH_STATUS": {
      const user=await getCurrentUser();
      if(!user) return {ok:true,mode:"supabase",profile:null};
      const profile=await getSignedInProfile();
      return {ok:true,mode:"supabase",profile};
    }
    case "SIGN_IN": {
      await signInWithPassword(payload.email,payload.password);
      const profile=await getSignedInProfile();
      referenceData=await loadPlannerReferenceData();
      const schedules=await listSchedules();
      return {ok:true,mode:"supabase",profile,referenceData,schedules};
    }
    case "SIGN_OUT": await signOut(); referenceData=null; return {ok:true,mode:"supabase"};
    case "GET_REFERENCE_DATA":
      referenceData=await loadPlannerReferenceData();
      return {ok:true,referenceData};
    case "GET_SCHEDULES":
      return {ok:true,schedules:await listSchedules(payload.filters||{})};
    case "GET_ACTIVE_SCHEDULES":
      return {ok:true,schedules:(await listSchedules()).filter(s=>s.status==="scheduled")};
    case "VALIDATE_SCHEDULE":
      // Database triggers/constraints validate authoritative rules on write.
      return {ok:true,validation:{valid:true,checks:[{key:"database",label:"Validasi database",passed:true,message:"Pemeriksaan akhir dilakukan oleh aturan Supabase saat penyimpanan."}]}};
    case "SAVE_SCHEDULE": {
      const row=await createSchedule(payload.candidate||{});
      send("STORE_CHANGED",{action:"created",record:row,schedules:await listSchedules()});
      return {ok:true,record:row,validation:{valid:true,checks:[]},errors:[]};
    }
    case "UPDATE_SCHEDULE": {
      const row=await updateSchedule(payload.id||payload.candidate?.id,payload.candidate||{});
      send("STORE_CHANGED",{action:"updated",record:row,schedules:await listSchedules()});
      return {ok:true,record:row,validation:{valid:true,checks:[]},errors:[]};
    }
    case "CANCEL_SCHEDULE": {
      const record=await cancelScheduleInDatabase(payload.id);
      const schedules=await listSchedules();
      send("STORE_CHANGED",{action:"cancelled",record,schedules});
      return {ok:true,record:{...record,status:record.status},schedules};
    }
    case "DELETE_SCHEDULE": {
      const record=await deleteSchedulePermanently(payload.id);
      send("STORE_CHANGED",{action:"deleted",record,schedules:await listSchedules()});
      return {ok:true,record};
    }
    case "RESET_DEMO_STORE": return fail(new Error("Store demo tidak aktif saat menggunakan Supabase."));
    default: return null;
  }
}
window.addEventListener("message",async event=>{
  if(event.origin!==location.origin||event.source!==frame?.contentWindow)return;
  const message=event.data;if(!message||message.namespace!=="ZIESORRA_SUMATIF_BRIDGE")return;
  const id=message.requestId;
  try{const result=await dispatch(message.type,message.payload||{});if(result!==null)send("RESPONSE",{requestId:id,result});}
  catch(error){send("RESPONSE",{requestId:id,result:fail(error)});}
});
subscribeSchedules(event=>{if(!isSupabaseConfigured())send("STORE_CHANGED",event);});
export function setBridgeScreen(screen){if(ALLOWED.has(screen))activeScreen=screen;}
