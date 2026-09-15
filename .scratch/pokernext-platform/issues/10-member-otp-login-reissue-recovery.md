# 10: 會員 OTP 登入、換證與人工帳號恢復

**What to build:** 會員用已驗證手機或 Email 以 6 位數 10 分鐘 OTP 登入；換證、換聯絡方式後沿用同一 UUID；兩個管道都失效時走人工恢復（管理者核實＋另一位授權者核准＋新管道驗證），UUID 不變。

**Blocked by:** 04（角色／範圍／欄位／狀態授權檢查 ＋ 第二人核准框架）、09（雙驗證與唯一 UUID）

**Status:** ready-for-agent

**UI:**
- Surface: 玩家端（手機）
- Page type: 單欄手機頁（登入／換證／恢復三個入口）
- Reference: `docs/design/references/player-home-mobile.png`
- Prototype: `#/player/account`（換證／聯絡變更入口）
- Components: Input（6 位 OTP，等寬大字）、Button/primary、InfoBox（10 分鐘、重送 60 秒）、EmptyState（兩管道皆失效 → 人工恢復說明）
- States: OTP 錯誤第 5 次 → 本次 OTP 失效提示（不停用資格）；重送倒數；恢復流程「等待管理者核實」

- [ ] OTP 6 位數、10 分鐘有效；第 5 次輸錯只讓該次 OTP 失效，會員資格不停用（一正一反）
- [ ] 換證送審期間舊證件版本保留並標示有效／過期狀態；核准後新版本生效、UUID 不變
- [ ] 換聯絡方式需驗證新管道後才生效；舊管道在生效前仍可登入
- [ ] 人工恢復需第 04 票的第二人核准；核准者不能是核實者本人
- [ ] 恢復成功後所有舊登入與未用 OTP 立即失效，新舊管道都收到通知
- [ ] 會員永遠能查到自己的完整資料與歷程，不因換證而中斷
- [ ] OTP 輸入框為 6 格等寬、觸控區 ≥ 44px；錯誤與倒數皆有文字，不只靠顏色
