/**
 * Sumatif Planner domain contract — Phase 2 foundation.
 * Demo-only data. No network access or production persistence.
 */
export const DEMO_CONTEXT=Object.freeze({academicYear:"2026/2027",semester:1,semesterLabel:"Ganjil",school:"SD Citra Bangsa",mode:"local-demonstration"});
export const SCHEDULE_STATUS=Object.freeze({SCHEDULED:"scheduled",CANCELLED:"cancelled"});
export const ASSESSMENT_TYPE=Object.freeze({WRITTEN:"written",PRACTICAL:"practical"});
export const DEMO_CLASSES=Object.freeze([
{id:"class-5a",name:"Kelas 5-A",level:5,academicYear:"2026/2027"},
{id:"class-5b",name:"Kelas 5-B",level:5,academicYear:"2026/2027"},
{id:"class-3a",name:"Kelas 3-A",level:3,academicYear:"2026/2027"},
{id:"class-4b",name:"Kelas 4-B",level:4,academicYear:"2026/2027"}
]);
export const DEMO_ASSIGNMENTS=Object.freeze([
{teacherId:"teacher-ahmad",teacher:"Ahmad Faisal, S.Pd.",classId:"class-5a",subjectId:"ipas",academicYear:"2026/2027",active:true},
{teacherId:"teacher-ahmad",teacher:"Ahmad Faisal, S.Pd.",classId:"class-5a",subjectId:"bahasa-indonesia",academicYear:"2026/2027",active:true},
{teacherId:"teacher-ahmad",teacher:"Ahmad Faisal, S.Pd.",classId:"class-5a",subjectId:"matematika",academicYear:"2026/2027",active:true},
{teacherId:"teacher-nurjanah",teacher:"Dra. Hj. Nurjanah",classId:"class-3a",subjectId:"bahasa-indonesia",academicYear:"2026/2027",active:true},
{teacherId:"teacher-rudi",teacher:"Rudi Hartono, S.Pd.",classId:"class-5b",subjectId:"pjok",academicYear:"2026/2027",active:true},
{teacherId:"teacher-indah",teacher:"Indah Lestari, S.Pd.",classId:"class-4b",subjectId:"seni-rupa",academicYear:"2026/2027",active:true}
]);
export const DEMO_CALENDAR=Object.freeze([{date:"2026-10-22",selectable:false,dayType:"school_event",title:"Hari Santri & Perayaan Budaya SD"}]);
export const DEMO_SCHEDULES=Object.freeze([
{id:"sched-sd-17a",academicYear:"2026/2027",semester:1,classId:"class-5a",subjectId:"ipas",subject:"IPAS",teacherId:"teacher-ahmad",teacher:"Ahmad Faisal, S.Pd.",sumatifNumber:2,date:"2026-10-17",startTime:"07:30",endTime:"08:30",assessmentType:"written",room:"Ruang Kelas 5-A",material:"Sistem Organ Pernapasan",status:"scheduled"},
{id:"sched-sd-17b",academicYear:"2026/2027",semester:1,classId:"class-5a",subjectId:"bahasa-indonesia",subject:"Bahasa Indonesia",teacherId:"teacher-ahmad",teacher:"Ahmad Faisal, S.Pd.",sumatifNumber:1,date:"2026-10-17",startTime:"09:00",endTime:"10:00",assessmentType:"written",room:"Ruang Kelas 5-A",material:"Memahami teks informasi",status:"scheduled"},
{id:"sched-sd-17c",academicYear:"2026/2027",semester:1,classId:"class-5a",subjectId:"matematika",subject:"Matematika",teacherId:"teacher-ahmad",teacher:"Ahmad Faisal, S.Pd.",sumatifNumber:1,date:"2026-10-17",startTime:"10:30",endTime:"11:30",assessmentType:"written",room:"Ruang Kelas 5-A",material:"Operasi bilangan",status:"scheduled"},
{id:"sched-sd-18a",academicYear:"2026/2027",semester:1,classId:"class-5b",subjectId:"pjok",subject:"PJOK",teacherId:"teacher-rudi",teacher:"Rudi Hartono, S.Pd.",sumatifNumber:1,date:"2026-10-18",startTime:"07:30",endTime:"09:00",assessmentType:"practical",room:"Ruang Serbaguna SD",material:"Kebugaran jasmani",status:"scheduled"},
{id:"sched-sd-18b",academicYear:"2026/2027",semester:1,classId:"class-3a",subjectId:"bahasa-indonesia",subject:"Bahasa Indonesia",teacherId:"teacher-nurjanah",teacher:"Dra. Hj. Nurjanah",sumatifNumber:1,date:"2026-10-18",startTime:"09:30",endTime:"11:00",assessmentType:"written",room:"Ruang Kelas 3-A",material:"Membaca pemahaman",status:"scheduled"},
{id:"sched-sd-18c",academicYear:"2026/2027",semester:1,classId:"class-4b",subjectId:"seni-rupa",subject:"Seni Rupa & Prakarya",teacherId:"teacher-indah",teacher:"Indah Lestari, S.Pd.",sumatifNumber:1,date:"2026-10-18",startTime:"13:00",endTime:"14:30",assessmentType:"practical",room:"Studio Musik & Seni SD",material:"Karya dua dimensi",status:"scheduled"},
{id:"sched-cancelled-demo",academicYear:"2026/2027",semester:1,classId:"class-5a",subjectId:"ipas",subject:"IPAS",teacherId:"teacher-ahmad",teacher:"Ahmad Faisal, S.Pd.",sumatifNumber:3,date:"2026-10-17",startTime:"12:00",endTime:"13:00",assessmentType:"written",room:"Ruang Kelas 5-A",material:"Contoh jadwal dibatalkan",status:"cancelled"}
]);
const validTypes=new Set(Object.values(ASSESSMENT_TYPE)),validStatuses=new Set(Object.values(SCHEDULE_STATUS));
function overlaps(aStart,aEnd,bStart,bEnd){return !!(aStart&&aEnd&&bStart&&bEnd&&aStart<bEnd&&bStart<aEnd);}
const active=s=>s.status!==SCHEDULE_STATUS.CANCELLED;
export function validateSchedule(candidate,schedules=DEMO_SCHEDULES,options={}){
 const excludeId=options.excludeId??candidate.id??null,classes=options.classes??DEMO_CLASSES,assignments=options.assignments??DEMO_ASSIGNMENTS,calendar=options.calendar??DEMO_CALENDAR;
 const errors=[],warnings=[],checks=[];const add=(key,label,passed,message="")=>{checks.push({key,label,passed,message});if(!passed&&message)errors.push({key,message});};
 const cls=classes.find(c=>c.id===candidate.classId);
 add("class","Kelas sesuai tahun pelajaran",!!(cls&&cls.academicYear===candidate.academicYear&&cls.level>=1&&cls.level<=6),"Pilih kelas SD yang terdaftar pada tahun pelajaran yang dipilih.");
 const assignment=assignments.find(a=>a.active&&a.teacherId===candidate.teacherId&&a.classId===candidate.classId&&a.subjectId===candidate.subjectId&&a.academicYear===candidate.academicYear);
 add("teacher-assignment","Penugasan guru aktif",!!assignment,"Guru tidak memiliki penugasan aktif untuk kelas, mata pelajaran, dan tahun pelajaran ini.");
 add("semester","Semester valid",[1,2].includes(Number(candidate.semester)),"Semester harus 1 atau 2.");
 add("sumatif-number","Nomor sumatif valid",[1,2,3].includes(Number(candidate.sumatifNumber)),"Nomor sumatif harus 1, 2, atau 3.");
 add("assessment-type","Jenis asesmen valid",validTypes.has(candidate.assessmentType),"Jenis asesmen harus written atau practical.");
 const dateMatch=typeof candidate.date==="string"?candidate.date.match(/^(\d{4})-(\d{2})-(\d{2})$/):null;
 const parsedDate=dateMatch?new Date(Date.UTC(Number(dateMatch[1]),Number(dateMatch[2])-1,Number(dateMatch[3]))):null;
 const dateValid=!!(dateMatch&&parsedDate&&parsedDate.getUTCFullYear()===Number(dateMatch[1])&&parsedDate.getUTCMonth()===Number(dateMatch[2])-1&&parsedDate.getUTCDate()===Number(dateMatch[3]));
 add("date-valid","Tanggal asesmen valid",dateValid,"Tanggal wajib diisi dengan tanggal kalender yang valid.");
 const timePattern=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
 const timesValid=typeof candidate.startTime==="string"&&typeof candidate.endTime==="string"&&timePattern.test(candidate.startTime)&&timePattern.test(candidate.endTime);
 add("time-format","Format waktu valid",timesValid,"Waktu mulai dan selesai wajib diisi dengan format HH:MM yang valid.");
 add("status","Status jadwal valid",validStatuses.has(candidate.status??"scheduled"),"Status jadwal harus scheduled atau cancelled.");
 const locked=calendar.find(day=>day.date===candidate.date&&day.selectable===false);
 add("school-calendar","Kalender pendidikan",!locked,locked? `Tanggal ${candidate.date} ditandai sebagai ${locked.title||"hari nonaktif"}.`:"");
 const conflicts=schedules.filter(s=>active(s)&&s.id!==excludeId&&s.academicYear===candidate.academicYear&&Number(s.semester)===Number(candidate.semester)&&s.classId===candidate.classId&&s.date===candidate.date);
 const writtenCount=conflicts.filter(s=>s.assessmentType===ASSESSMENT_TYPE.WRITTEN).length+(candidate.assessmentType===ASSESSMENT_TYPE.WRITTEN&&active(candidate)?1:0);
 const totalCount=conflicts.length+(active(candidate)?1:0),practicalCount=conflicts.filter(s=>s.assessmentType===ASSESSMENT_TYPE.PRACTICAL).length+(candidate.assessmentType===ASSESSMENT_TYPE.PRACTICAL&&active(candidate)?1:0);
 add("daily-written-quota","Maksimal dua asesmen tertulis per kelas per hari",writtenCount<=2,`Batas asesmen tertulis terlampaui: ${writtenCount} pada ${candidate.date}.`);
 add("daily-total-quota","Maksimal tiga asesmen jika ada praktik",!(practicalCount>0&&totalCount>3),`Batas total asesmen terlampaui: ${totalCount} pada ${candidate.date}.`);
 add("time-order","Urutan waktu valid",timesValid&&candidate.endTime>candidate.startTime,"Waktu selesai harus setelah waktu mulai.");
 const duplicate=schedules.find(s=>active(s)&&s.id!==excludeId&&s.academicYear===candidate.academicYear&&Number(s.semester)===Number(candidate.semester)&&s.classId===candidate.classId&&s.subjectId===candidate.subjectId&&Number(s.sumatifNumber)===Number(candidate.sumatifNumber));
 add("sequence-unique","Nomor sumatif unik untuk mapel dan kelas",!duplicate,duplicate?`Sumatif ${candidate.sumatifNumber} untuk mapel ini sudah dijadwalkan.`:"");
 const timeConflict=conflicts.find(s=>overlaps(candidate.startTime,candidate.endTime,s.startTime,s.endTime));
 if(timeConflict)warnings.push({key:"time-overlap",message:`Waktu bentrok dengan jadwal ${timeConflict.id}.`});
 return {valid:errors.length===0,errors,warnings,checks};
}
export function getActiveSchedules(schedules=DEMO_SCHEDULES){return schedules.filter(active);}
export function summarizeSchedules(schedules=DEMO_SCHEDULES){
 const activeRows=getActiveSchedules(schedules);
 return {total:activeRows.length,cancelled:schedules.length-activeRows.length,written:activeRows.filter(s=>s.assessmentType==="written").length,practical:activeRows.filter(s=>s.assessmentType==="practical").length,conflicts:activeRows.filter(s=>!validateSchedule(s,schedules,{excludeId:s.id}).valid).length};
}
