# 07: 會員申請表單、證件上傳、OCR 輔助與申請版本

**What to build:** 申請人在手機優先的 RWD 表單自行填寫、上傳證件、由 OCR 先擷取再自行確認更正後送出；每次送出保存一個申請版本；換裝置後可用案件編號＋原手機或 Email 核實取回申請。

**Blocked by:** 05（文件保護核心：信封加密／KMS 埠、HMAC 查找索引、限時查看、故障暫停）

**Status:** ready-for-agent

**UI:**
- Surface: 玩家端（未登入申請人，手機優先 RWD）
- Page type: 無先例 → 依 DESIGN.md §8 步驟 3 先 `/prototype` 產 2 個 variant（單頁長表單 vs 四步 Stepper）再定案
- Reference: `docs/design/references/player-home-mobile.png`（僅取 token 與間距）
- Prototype: 無對應路由；申請流程結果會出現在 `#/admin/review`
- Components: Stepper、Input、檔案上傳（依 Input 規格）、InfoBox（OCR 告知）、Button/primary（送出）、Button/secondary（先手填）、ResultBanner（送出結果＋案件編號）
- States: OCR 進行中（骨架＋「可先手填」）、逾時（InfoBox + 重試）、辨識失敗（維持手填）、送出成功（案件編號、取回方式）

- [ ] 申請人不需帳號即可開始申請；台灣籍申請人在沒有身分證時可改用護照送出
- [ ] 送出前必須看到「證件圖片將送交外部 OCR 服務」的告知；沒有玩家端的 OCR 停用選項
- [ ] OCR 只收到辨識所需的圖片與參數；假 OCR 埠能證明請求裡沒有積分、Agent、行程或金鑰
- [ ] OCR 成功時欄位預填但可修改；申請人確認後才是送審值
- [ ] 假 OCR 注入逾時 >30 秒：介面允許先手填；>2 分鐘：本次逾時可重試；辨識失敗：仍能手填送審
- [ ] 每次送出產生新申請版本，補件時舊版本內容保留可見
- [ ] 用案件編號＋原手機或 Email 核實（OTP）後可取回申請、查進度與補件；只憑案件編號無法讀到任何證件內容（一正一反）
- [ ] 上傳的證件原圖、預覽／縮圖、OCR 結果、手填敏感欄位全部經第 05 票的加密保存
- [ ] 員工／Agent 能產生並發送申請連結，但沒有任何代填、代送 API
- [ ] OCR 逾時與失敗兩態都有畫面且不阻擋手填；送出成功頁顯示案件編號與「換裝置取回」說明

**Notes:** G01：OCR 欄位準確率門檻無數值，不得捏造；介面不可出現「政府驗證通過」等文案。
