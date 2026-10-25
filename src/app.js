import { setBridgeScreen } from "./screen-bridge.js";
import { getSupabaseClient, signInWithPassword, signOut } from "./supabase-client.js";
import { getSignedInProfile } from "./supabase-repository.js";
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

const authPanel=document.querySelector("#authPanel");
const loginForm=document.querySelector("#loginForm");
const authMessage=document.querySelector("#authMessage");
const accountBar=document.querySelector("#accountBar");
const accountLabel=document.querySelector("#accountLabel");
const modeBadge=document.querySelector("#modeBadge");
function showSignedOut(message){
 if(!authPanel||!loginForm)return;
 authPanel.hidden=false;frame.hidden=true;document.querySelector(".page-heading").hidden=true;
 navItems.forEach(item=>item.disabled=true);
 if(accountBar){accountBar.hidden=true;accountBar.style.display="none";}
 if(authMessage)authMessage.textContent=message||"Masuk menggunakan akun sekolah.";
}
function showSignedIn(profile){
 authPanel.hidden=true;frame.hidden=false;document.querySelector(".page-heading").hidden=false;
 navItems.forEach(item=>item.disabled=false);
 if(accountBar){accountBar.hidden=false;accountBar.style.display="flex";}
 if(accountLabel)accountLabel.textContent=(profile.full_name||"Pengguna")+" · "+profile.role;
 if(modeBadge)modeBadge.textContent="SUPABASE · DATABASE AKTIF";
}
if(window.ZIESORRA_SUPABASE_CONFIG&&authPanel&&loginForm){
 showSignedOut("Memeriksa sesi Supabase…");
 (async()=>{
  try{
   const client=await getSupabaseClient();
   const {data,error}=await client.auth.getSession();
   if(error)throw error;
   if(data.session)showSignedIn(await getSignedInProfile());
   else showSignedOut("Masuk untuk mengakses jadwal database.");
  }catch(error){showSignedOut("Koneksi Supabase belum siap: "+error.message);}
 })();
 loginForm.addEventListener("submit",async event=>{
  event.preventDefault();
  const button=loginForm.querySelector('button[type="submit"]');
  button.disabled=true;button.textContent="Memeriksa akun…";
  try{
   await signInWithPassword(document.querySelector("#loginEmail").value,document.querySelector("#loginPassword").value);
   showSignedIn(await getSignedInProfile());
   frame.src=frame.getAttribute("src");
  }catch(error){
   if(authMessage)authMessage.textContent=error.message||"Gagal masuk.";
   try{await signOut();}catch(ignore){}
  }finally{button.disabled=false;button.textContent="Masuk";document.querySelector("#loginPassword").value="";}
 });
 const logoutButton=document.querySelector("#logoutButton");
 if(logoutButton)logoutButton.addEventListener("click",async()=>{
  try{await signOut();showSignedOut("Anda sudah keluar.");}
  catch(error){if(authMessage)authMessage.textContent=error.message;}
 });
}else{
 if(authPanel)authPanel.hidden=true;
 if(accountBar){accountBar.hidden=true;accountBar.style.display="none";}
 if(modeBadge)modeBadge.textContent="DEMO · NON-PERSISTEN";
}
