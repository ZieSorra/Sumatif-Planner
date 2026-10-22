import {test,expect} from "@playwright/test";
test("app opens and navigation reaches all four screens",async({page})=>{
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Dashboard"}).first()).toBeVisible();
 for(const label of ["Kalender Sumatif","Form & Validasi","Laporan & Tabel"]){
  await page.getByRole("button",{name:new RegExp(label)}).click();
  await expect(page.locator("#screenFrame")).toHaveAttribute("src",new RegExp(label==="Kalender Sumatif"?"calendar":label==="Form & Validasi"?"form":"reports"));
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
 await expect(report.locator("#rows")).toContainText("Uji browser otomatis");
 await page.getByRole("button",{name:/Dashboard/}).click();
 const dashboard=page.frameLocator("#screenFrame");
 await expect(dashboard.locator("#rows")).toContainText("Uji browser otomatis");
});
test("report cancellation changes status and remains in history",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:/Laporan & Tabel/}).click();
 const frame=page.frameLocator("#screenFrame");
 const firstScheduled=frame.locator("#rows tr").filter({has:frame.locator("span.status:not(.cancelled)")}).first();
 await expect(firstScheduled).toBeVisible();
 page.once("dialog",dialog=>dialog.accept());
 await firstScheduled.getByRole("button",{name:"Batalkan"}).click();
 await expect(firstScheduled.locator("span.status")).toHaveText("cancelled");
});
