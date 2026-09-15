# 32: 報表與 Google Sheets 手動輸出

**What to build:** 授權人員手動輸出報表到 Platform admin 核准的指定 Google Sheets，每次產生新的工作表快照；輸出時檢查操作者與目的地授權的交集；名下業績、介紹、Host 工作、公司／天城月對帳是四份分開的報表；不同受眾用不同檔案。

**Blocked by:** 05（文件保護核心：信封加密／KMS 埠、HMAC 查找索引、限時查看、故障暫停）、29（合作績效：公司行銷費、個人業績與獎金結算）

**Status:** ready-for-agent

**UI:**
- Surface: 管理端（授權人員）＋ Platform admin（核准目的地）
- Page type: DESIGN.md §3.2 總覽頁變體（報表卡×4 ＋ 輸出歷史 DataTable）
- Reference: `docs/design/references/partner-overview.png`
- Prototype: 無對應（比照 `#/platform/approvals` 的敏感匯出卡）
- Components: Card×4（名下業績／介紹／Host 工作／公司天城月對帳，各自 Button/secondary「輸出到 Sheets」與「下載 Excel」）、Select（核准目的地）、DataTable/dense（輸出歷史：時間、操作者、報表、目的地、快照工作表名）、InfoBox（上限 10 萬／2 萬明細）
- States: 目的地未核准 → 按鈕 disabled + hint；超限 → Toast/error；輸出進行中 → Button loading

- [ ] 四份報表分開，各自的欄位不混入其他受眾的資料（以回應欄位斷言）
- [ ] 只有操作者授權 ∩ 目的地核准同時成立才可輸出（一正一反）；下載當下再查一次權限
- [ ] 每次輸出建立新的工作表快照；沒有排程同步、背景重試或回寫 API
- [ ] Excel 上限 10 萬明細、Sheets 上限 2 萬明細，超限被拒；臨時 Excel 檔 7 天後清理（可控時鐘）
- [ ] 敏感匯出需核准範圍、用途與欄位；匯出留稽核紀錄
- [ ] 四份報表是四張獨立 Card，欄位說明各自列出；目的地未核准時輸出按鈕不可按並說明原因

**Notes:** G13：公司核准的 Google 目的地 ID 與配額未定，目的地為配置項；Google 端用假埠。
