# POKERNEXT Platform

POKERNEXT 是撲克旅遊會員平台：會員申請入會、報名合作場館（例：濟州天城 PokerRoom）的行程，以積分兌換住宿，並在現場由合作場館人員完成到場、押金與異動作業。平台同時服務三種使用者：玩家、合作場館人員、POKERNEXT 內部人員。

其他領域術語由 `/domain-modeling` 在解決具體用語時逐步補進來；spec 見 `.scratch/pokernext-platform/spec.md`。

## Language

### Surfaces（介面面向）

**玩家端 (Player)**:
會員與申請人使用的手機優先介面；五項主導覽：首頁、我的行程、到場碼、我的積分、我的帳戶。
_Avoid_: 前台、會員 App、客戶端

**合作端 (Partner)**:
合作場館（例：天城）現場人員使用的桌面工作區；只看得到本場館、本次行程需要的資料。
_Avoid_: 場館後台、天城端、B 端

**管理端 (Admin)**:
POKERNEXT 內部人員（管理者、客服、銷售）使用的桌面工作區。
_Avoid_: 後台、內部系統、管理後台

**Surface**:
上述三種介面面向之一。每張涉及畫面的票都要標明所屬 surface。

## UI

所有畫面的視覺規範在 **`docs/design/DESIGN.md`**（token、版面、元件目錄、狀態規則、票與畫面對照），參考圖在 `docs/design/references/`。

- 任何涉及畫面的 spec、票、實作、code review 都必須引用 DESIGN.md 的元件名與 token，不自行發明樣式。
- 涉及畫面的票要有 `**UI:**` 段（格式見 `docs/agents/issue-tracker.md`）。
- 實作 agent 的流程見 DESIGN.md 第 8 節（先讀規範與參考圖 → 沒先例的畫面先 `/prototype` → 交付前截圖比對）。
