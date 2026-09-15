# 31: 活動、名額與行銷推播

**What to build:** 管理者建立活動、審核、發布／下架、推播是四個獨立操作；單一行程最多一個優惠且不影響基本服務與正常積分；繁中與英文分語言審核；每人一次／可重複與總名額／不限；推播由一人建立、另一人核准，發送到全部已綁定、可用且已同意的管道；單管道退訂與全域退訂分開。

**Blocked by:** 11（通訊綁定與通知偏好）、15（行程申請、行程編號與版本、草稿、同行者）

**Status:** ready-for-agent

**UI:**
- Surface: 管理端
- Page type: DESIGN.md §3.2 總覽頁 DataTable ＋ 案件頁（活動編輯）
- Reference: `docs/design/references/partner-overview.png`
- Prototype: `#/admin/campaigns`；actions `publishCampaign`
- Components: DataTable/regular（活動、日期、名額 used/quota、語言、狀態）、Badge（草稿／已發布／已下架）、Button/secondary（送審發布／推播需另一人核准）、DetailPanel（分語言版本 Tabs、條件版本、名額規則 Radio）
- States: 未核准語言版本以 Badge/neutral「未核准」；推播候選名單固定後顯示人數與排除數

- [ ] 四個操作各自獨立、各有稽核；未發布的活動不對會員顯示
- [ ] 同一行程套第二個優惠被拒；優惠不改變積分入帳或基本服務
- [ ] 未核准的語言版本不展示（一正一反）
- [ ] 草稿行程與護照待補的新需求不占名額；每人一次的活動第二次報名被拒
- [ ] 推播核准時固定候選名單；發前重查只排除（已退訂、已停權）不新增
- [ ] 只送到已綁定、可用且已同意推廣的管道；退訂某管道後不改用他管道補發；範圍不明時停止全部；恢復需新的明確同意
- [ ] 建立、審核、發布／下架、推播四個動作是四顆獨立按鈕，各自的狀態以 Badge 顯示

**Notes:** G19：真實活動條件與授權發布人由業務提供。
