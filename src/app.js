import { setBridgeScreen } from "./screen-bridge.js";
const u=document.querySelector('meta[name="supabase-url"]')?.content?.trim();
const k=document.querySelector('meta[name="supabase-publishable-key"]')?.content?.trim();
if(u&&k) window.ZIESORRA_SUPABASE_CONFIG={url:u,publishableKey:k};
const routes = {
  dashboard: {title:"Dashboard",description:"Ringkasan perencana asesmen sekolah dasar.",src:"./pages/dashboard.html"},
  calendar: {title:"Sumatif Planner",description:"Kalender dan detail jadwal asesmen.",src:"./pages/calendar.html"},
  form: {title:"Form & Validasi",description:"Form jadwal dan pemeriksaan aturan bisnis.",src:"./pages/form.html"},
  reports: {title:"Laporan & Tabel",description:"Tabel jadwal, audit, ekspor, dan cetak.",src:"./pages/reports.html"}
};
const navItems=[...document.querySelectorAll("[data-route]")];
const frame=document.querySelector("#screenFrame");
const pageTitle=document.querySelector("#pageTitle");
const screenTitle=document.querySelector("#screenTitle");
const screenDescription=document.querySelector("#screenDescription");
const sidebar=document.querySelector("#sidebar");
const scrim=document.querySelector("#mobileScrim");
function navigate(route,{updateHash=true}={}){
 const resolved=routes[route]?route:"dashboard",page=routes[resolved];
 setBridgeScreen(resolved);
 navItems.forEach(item=>{const active=item.dataset.route===resolved;item.classList.toggle("active",active);item.setAttribute("aria-current",active?"page":"false");});
 pageTitle.textContent=page.title;screenTitle.textContent=page.title;screenDescription.textContent=page.description;
 if(frame.getAttribute("src")!==page.src)frame.setAttribute("src",page.src);
 if(updateHash)history.replaceState(null,"",`#${resolved}`);
 sidebar.classList.remove("open");scrim.classList.remove("visible");
}
navItems.forEach(item=>item.addEventListener("click",()=>navigate(item.dataset.route)));
document.querySelector("#menuToggle").addEventListener("click",()=>{sidebar.classList.toggle("open");scrim.classList.toggle("visible");});
scrim.addEventListener("click",()=>{sidebar.classList.remove("open");scrim.classList.remove("visible");});
window.addEventListener("hashchange",()=>navigate(location.hash.slice(1),{updateHash:false}));
navigate(location.hash.slice(1)||"dashboard",{updateHash:false});
