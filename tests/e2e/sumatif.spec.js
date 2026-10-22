import {test,expect} from "@playwright/test";
test("app opens and navigation reaches all four screens",async({page})=>{
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Dashboard"}).first()).toBeVisible();
 for(const [label,src] of [["Kalender Sumatif","calendar"],["Form & Validasi","form"],["Laporan & Tabel","reports"]]){
  await page.getByRole("button",{name:new RegExp(label)}).click();
  await expect(page.locator("#screenFrame")).toHaveAttribute("src",new RegExp(src));
  await expect(page.locator("#screenFrame")).toBeVisible();
 }
});
test("valid schedule is saved and appears in dashboard and report",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:/Form & Validasi/}).click();
 const frame=page.frameLocator("#screenFrame");
 await frame.locator("#input-assessment-date").fill("2026-10-20");
 await frame.locator("#topic-input").fill("Uji browser otomatis");
 await frame.getByRole("button",{name:/Validasi & simpan/}).click();
 await expect(frame.locator("#result")).toContainText("Jadwal tersimpan");
 await page.getByRole("button",{name:/Laporan & Tabel/}).click();
 const report=page.frameLocator("#screenFrame");
 await expect(report.locator("#rows")).toContainText("2026-10-20");
 await page.getByRole("button",{name:/Dashboard/}).click();
 const dashboard=page.frameLocator("#screenFrame");
 await expect(dashboard.locator("#rows")).toContainText("2026-10-20");
});
test("report cancellation changes status and remains in history",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:/Laporan & Tabel/}).click();
 const frame=page.frameLocator("#screenFrame");
 const firstScheduled=frame.locator("#rows tr").filter({has:frame.getByRole("button",{name:"Batalkan"})}).first();
 await expect(firstScheduled).toBeVisible();
 const scheduleId=await firstScheduled.getAttribute("data-schedule-id");
 page.once("dialog",dialog=>dialog.accept());
 await firstScheduled.getByRole("button",{name:"Batalkan"}).click();
 await expect(frame.locator(`#rows tr[data-schedule-id="${scheduleId}"] span.status`)).toHaveText("cancelled");
});

test("form limits subjects and teachers to active class assignments",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:/Form & Validasi/}).click();
 const frame=page.frameLocator("#screenFrame");
 await frame.locator("#class-select").selectOption("class-5b");
 await expect(frame.locator("#subject-select option")).toHaveCount(1);
 await expect(frame.locator("#subject-select")).toHaveValue("pjok");
 await expect(frame.locator("#teacher-select option")).toHaveCount(1);
 await expect(frame.locator("#teacher-select")).toHaveValue("teacher-rudi");
 await frame.locator("#class-select").selectOption("class-5a");
 await expect(frame.locator("#subject-select option")).toHaveCount(3);
 await expect(frame.locator("#teacher-select")).toHaveValue("teacher-ahmad");
});

test("calendar, dashboard and report stay consistent after cancellation",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:/Form & Validasi/}).click();
 let frame=page.frameLocator("#screenFrame");
 await frame.locator("#input-assessment-date").fill("2026-10-20");
 await frame.locator("#topic-input").fill("Audit konsistensi lintas layar");
 await frame.getByRole("button",{name:/Validasi & simpan/}).click();
 await expect(frame.locator("#result")).toContainText("Jadwal tersimpan");
 await page.getByRole("button",{name:/Kalender Sumatif/}).click();
 frame=page.frameLocator("#screenFrame");
 await expect(frame.locator("#list")).toContainText("2026-10-20");
 await expect(frame.locator("#calendar")).toContainText("Bahasa Indonesia");
 await page.getByRole("button",{name:/Laporan & Tabel/}).click();
 frame=page.frameLocator("#screenFrame");
 const row=frame.locator("#rows tr").filter({hasText:"2026-10-20"}).filter({hasText:"IPAS"});
 await expect(row).toBeVisible();
 const id=await row.getAttribute("data-schedule-id");
 page.once("dialog",dialog=>dialog.accept());
 await row.getByRole("button",{name:"Batalkan"}).click();
 await expect(frame.locator(`#rows tr[data-schedule-id="${id}"] span.status`)).toHaveText("cancelled");
 await page.getByRole("button",{name:/Dashboard/}).click();
 frame=page.frameLocator("#screenFrame");
 await expect(frame.locator("#rows")).not.toContainText("Audit konsistensi lintas layar");
 await expect(frame.locator("#cancelled")).toHaveText("2");
 await page.getByRole("button",{name:/Kalender Sumatif/}).click();
 frame=page.frameLocator("#screenFrame");
 await expect(frame.locator("#list")).toContainText("cancelled");
 await expect(frame.locator("#list")).toContainText("Bahasa Indonesia");
});
