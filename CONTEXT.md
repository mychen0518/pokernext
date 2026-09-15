# POKERNEXT Platform

POKERNEXT 是撲克旅遊會員平台：會員申請入會、報名合作場館（例：濟州天城 PokerRoom）的行程，以積分兌換住宿，並在現場由合作場館人員完成到場、押金與異動作業。平台同時服務四種使用者：玩家、合作場館人員、POKERNEXT 內部人員、外部 Agent。

其他領域術語由 `/domain-modeling` 在解決具體用語時逐步補進來；spec 見 `.scratch/pokernext-platform/spec.md`。

## Language

### Surfaces（介面面向）

**玩家端 (Player)**:
會員與申請人使用的手機優先版面家族；五項主導覽：首頁、我的行程、到場碼、我的積分、我的帳戶。
_Avoid_: 前台、會員 App、客戶端

**合作端 (Partner)**:
合作場館（例：天城）現場人員使用的桌面版面家族；只看得到本場館、本次行程需要的資料。
_Avoid_: 場館後台、天城端、B 端

**管理端 (Admin)**:
POKERNEXT 內部人員（管理者、客服、銷售、財務、Platform admin）與外部 Agent 使用的桌面版面家族。
_Avoid_: 後台、內部系統、管理後台

**接待端 (Reception)**:
接待人（Host／Reception）在現場使用的手機工作台版面家族，以任務與回報為主。
_Avoid_: 員工端、員工 App、Staff 端

**Surface**:
上述四種介面面向之一，是視覺與版面的家族，不決定資料權限。每張涉及畫面的票都要標明所屬 surface。
_Avoid_: 把 surface 當成角色入口來數（「六個 surface」）

### Workspaces（工作區）

**工作區 (Workspace)**:
某一類使用者登入後進入的入口，決定他能看到哪些頁面、能做哪些操作。每個工作區屬於恰好一個 Surface；多個工作區可以共用同一個 Surface。
_Avoid_: 端（單獨使用時與 Surface 混淆）、六端

**玩家工作區 (Player workspace)**:
會員使用的工作區；屬於玩家端。

**場館工作區 (Venue workspace)**:
合作場館人員使用的工作區（到場報到、行程異動、住宿兌換核對、押金）；屬於合作端。
_Avoid_: 天城合作端、天城端

**管理工作區 (Admin workspace)**:
POKERNEXT 管理者、客服、銷售、財務與稽核使用的工作區；屬於管理端。財務與稽核是本工作區內的角色，不是獨立工作區。
_Avoid_: 財務端

**平台治理工作區 (Platform workspace)**:
Platform admin 使用的最高治理工作區（權限、歸屬執行、稽核、核准）；屬於管理端。
_Avoid_: Platform admin 端

**接待工作區 (Reception workspace)**:
接待人使用的工作區（我的任務、現場事實回報）；屬於接待端。
_Avoid_: 員工端

**Agent 工作區 (Agent workspace)**:
外部 Agent 查看名下客戶與自身業績的工作區；屬於管理端。
_Avoid_: Agent 端

### Accounts（帳號）

**會員 (Member)**:
入會申請經審核通過、取得會員 UUID 的玩家；以會員身分登入玩家工作區。
_Avoid_: 用戶、玩家帳號

**申請人 (Applicant)**:
已送出入會申請、尚未取得會員 UUID 的人；不是會員。
_Avoid_: 準會員、未審會員

**工作帳號 (Work account)**:
經邀請建立、以密碼＋TOTP 登入的帳號，用於玩家工作區以外的工作區；合作場館人員與外部 Agent 也使用工作帳號。
_Avoid_: 員工帳號、後台帳號、staff account

### Status（狀態）

**客觀狀態 (Derived status)**:
由來源事件衍生、任何人都不能直接設定的狀態，例如已入住、已到 PokerRoom、在島內、住宿已扣分、押金已退還；各客觀狀態彼此獨立，不互相推定。
_Avoid_: 總狀態、手動狀態

**行程階段 (Trip stage)**:
從一個行程的客觀狀態衍生的唯讀顯示摘要，只用於畫面呈現，不驅動任何規則。
_Avoid_: 行程狀態（指可設定的欄位時）

## UI

所有畫面的視覺規範在 **`docs/design/DESIGN.md`**（token、版面、元件目錄、狀態規則、票與畫面對照），參考圖在 `docs/design/references/`。

- 任何涉及畫面的 spec、票、實作、code review 都必須引用 DESIGN.md 的元件名與 token，不自行發明樣式。
- 涉及畫面的票要有 `**UI:**` 段（格式見 `docs/agents/issue-tracker.md`）。
- 實作 agent 的流程見 DESIGN.md 第 8 節（先讀規範與參考圖 → 沒先例的畫面先 `/prototype` → 交付前截圖比對）。
