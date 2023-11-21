// @ts-check

import { world, system, Player } from '@minecraft/server';
import { FriendAPI, FriendManager } from './FriendManager';
import { FriendMenu } from './FriendMenu';
import * as util from './util';

export * from './team';
export * from './FriendMenu';

const friends = new FriendManager();
export { friends }

world.afterEvents.playerSpawn.subscribe(async ev => {
  const { initialSpawn, player } = ev;
  if (!initialSpawn) return;
  
  // @ts-ignore
  if (!player.isRegistered) { // 登録
    FriendAPI.registerUser(player);
    // @ts-ignore
    player.isRegistered = true;
  }
  
  await util.sleep(20*6); // 完全に参加できるまで待機

  const users = /** @type {import('./FriendManager').User[]} */ (friends.fetchRequest(player.id).got ?? []);
  if (users.length > 0) return player.sendMessage(`§e${users.length > 1 ? `${users.length} 件の` : `${users[0].name} から`}フレンド申請が届いています！\n/friend でフレンドメニューを開いてみましょう`);
});

system.runInterval(() => {
  for (const p of world.getPlayers()) {
    // @ts-ignore
    if (p.isRegistered) continue; 
    FriendAPI.registerUser(p);
    // @ts-ignore
    p.isRegistered = true;
  }
}, 10*20);

system.afterEvents.scriptEventReceive.subscribe(ev => {
  const { sourceEntity, id } = ev;
  
  if (sourceEntity instanceof Player && id === "friends:show") {
    if (!friends) return sourceEntity.sendMessage('§cError: フレンドの読み込みに失敗しました');
    new FriendMenu(sourceEntity, friends);
  }
}, {
  namespaces: [ 'friends' ]
});
