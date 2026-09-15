# 08: 審核工作台：核准／補件／拒絕、版本綁定、重複提示

**What to build:** 管理者在審核工作台並列比對申請人輸入值、OCR 結果、證件原圖與重複候選提示，做出核准／補件／拒絕；核准只對特定申請版本生效。

**Blocked by:** 04（角色／範圍／欄位／狀態授權檢查 ＋ 第二人核准框架）、05（文件保護核心：信封加密／KMS 埠、HMAC 查找索引、限時查看、故障暫停）、07（會員申請表單、證件上傳、OCR 輔助與申請版本）

**Status:** ready-for-agent

**UI:**
- Surface: 管理端
- Page type: DESIGN.md §3.2 作業頁三欄變體
- Reference: `docs/design/references/partner-checkin.png`（雙欄作業頁擴為三欄）
- Prototype: `#/admin/review`；actions `reviewApp`
- Components: ListPanel（申請清單＋Badge 待審／補件／已核准）、Card×3（申請人輸入／OCR 擷取／證件原圖限時 5 分鐘）、Badge/warning（欄位與 OCR 不同）、InfoBox（重複候選）、Button/primary（核准 vN）、Button/secondary（補件）、Button/danger（拒絕）
- States: 原圖倒數與到期遮蔽；版本被申請人更新時 ResultBanner/error「請重查最新版本」

- [ ] 工作台同一畫面顯示輸入值、OCR 結果、原圖（走 5 分鐘限時查看）與重複候選
- [ ] 重複候選來自第 05 票的 HMAC 索引：相同發證國＋證件類型＋號碼已屬正式會員時，核准被暫停並引導找回原帳號
- [ ] Email／手機衝突但證件不同時只顯示衝突提示，不自動合併、不阻擋（一正一反）
- [ ] 核准綁定申請版本：核准後申請人若改姓名、生日或證件，該申請回到待審而不是沿用核准
- [ ] 管理者審核期間申請人送出新版本，管理者送出核准時被要求重查最新版本，舊版本核准被拒
- [ ] 要求補件時申請人看到明確缺項與原因，只需修正該項再送審
- [ ] 每次核准／補件／拒絕留下稽核紀錄（操作者、版本、結果）
- [ ] 輸入值與 OCR 不同的欄位以 Badge/warning 標示；原圖區塊顯示剩餘時間並在到期後遮蔽
