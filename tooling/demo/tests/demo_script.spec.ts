/**
 * @fileoverview 示範劇本：Alex 的濟州行程（`docs/design/prototype/
 * pokernext-prototype.html` 的 13 步）。每個測試名稱是原型的步驟名稱，註記
 * `ticket` 是讓該步成立的票號（`.scratch/pokernext-platform/issues/`）。步驟依序
 * 執行、共用同一個頁面與 demo 資料；尚無對應票完成的步驟標為 `test.fixme`。
 *
 * 解除一步：把 `test.fixme(` 改成 `test(`，在內容裡用 `openWorkspace` 以該工作區
 * 的 demo 帳號進入，再像使用者一樣操作並驗證畫面。資料由各票的 demo seed 提供，
 * 不寫 SQL。不需改 playwright.config.ts。
 */

import {openWorkspace, test} from './support/script';

test.describe.serial('示範劇本：Alex 的濟州行程', () => {
  test.fixme(
    '玩家確認行程新版本 v2',
    {annotation: {type: 'ticket', description: '15, 17'}},
    async ({scriptPage}) => {
      // 玩家端 → 我的行程 → TR-260911-028
      await openWorkspace(scriptPage, 'player');
    },
  );

  test.fixme(
    '接待 Amy 回報「接機接到本人」（T05）',
    {annotation: {type: 'ticket', description: '20, 22'}},
    async ({scriptPage}) => {
      // 員工端 → 我的任務 → TSK-1042
      await openWorkspace(scriptPage, 'staff');
    },
  );

  test.fixme(
    '琪琪掃碼、本人核對、確認到場',
    {annotation: {type: 'ticket', description: '19'}},
    async ({scriptPage}) => {
      // 天城端 → 到場報到
      await openWorkspace(scriptPage, 'venue');
    },
  );

  test.fixme(
    '琪琪收到 KRW 300,000 押金',
    {annotation: {type: 'ticket', description: '27'}},
    async ({scriptPage}) => {
      // 天城端 → 到場報到／押金紀錄
      await openWorkspace(scriptPage, 'venue');
    },
  );

  test.fixme(
    '玩家確認「我已支付」',
    {annotation: {type: 'ticket', description: '27'}},
    async ({scriptPage}) => {
      // 玩家端 → 我的行程 → 押金
      await openWorkspace(scriptPage, 'player');
    },
  );

  test.fixme(
    'Amy 回報酒店已入住（T06）→ 在島玩家',
    {annotation: {type: 'ticket', description: '20, 22, 30'}},
    async ({scriptPage}) => {
      // 員工端 → 我的任務 → TSK-1043；合作端在島玩家頁
      await openWorkspace(scriptPage, 'staff');
    },
  );

  test.fixme(
    '玩家申請續住 1 晚',
    {annotation: {type: 'ticket', description: '21'}},
    async ({scriptPage}) => {
      // 玩家端 → 我的行程
      await openWorkspace(scriptPage, 'player');
    },
  );

  test.fixme(
    '琪琪開始執行並回報續住結果',
    {annotation: {type: 'ticket', description: '21'}},
    async ({scriptPage}) => {
      // 天城端 → 行程異動
      await openWorkspace(scriptPage, 'venue');
    },
  );

  test.fixme(
    '管理者核對續住結果並正式登錄',
    {annotation: {type: 'ticket', description: '16, 21'}},
    async ({scriptPage}) => {
      // 管理端 → 行程審核／預訂
      await openWorkspace(scriptPage, 'admin');
    },
  );

  test.fixme(
    '管理者核准每日積分 Excel 入帳',
    {annotation: {type: 'ticket', description: '24'}},
    async ({scriptPage}) => {
      // 管理端 → 積分匯入與結算
      await openWorkspace(scriptPage, 'admin');
    },
  );

  test.fixme(
    'Amy 回報已退房（T10）→ 管理者開放結算',
    {annotation: {type: 'ticket', description: '20, 22, 26'}},
    async ({scriptPage}) => {
      // 員工端 → 我的任務；管理端
      await openWorkspace(scriptPage, 'staff');
    },
  );

  test.fixme(
    '玩家確認結算 → 琪琪核對「雙方已對齊」',
    {annotation: {type: 'ticket', description: '26'}},
    async ({scriptPage}) => {
      // 玩家端 → 我的積分；天城端 → 住宿兌換核對
      await openWorkspace(scriptPage, 'player');
    },
  );

  test.fixme(
    '琪琪現場退押金 → 玩家確認已收到',
    {annotation: {type: 'ticket', description: '27'}},
    async ({scriptPage}) => {
      // 天城端 → 押金紀錄；玩家端 → 我的行程 → 押金
      await openWorkspace(scriptPage, 'venue');
    },
  );
});
