// @ts-check

import { world, system, Player } from '@minecraft/server';
import { FriendManager } from './FriendManager';
import { chestLocation } from './config';
import { FriendMenu } from './FriendMenu';
import * as util from './util';

export * from './team';
export * from './FriendMenu';

/** @type {FriendManager|undefined} */
export let friends;
/** @type {import('./Database').Database|undefined} */
export let DB;

world.afterEvents.worldInitialize.subscribe(async () => {
  await util.worldLoad(chestLocation);
  friends = new FriendManager(chestLocation);
  DB = friends.DB;
});

world.afterEvents.playerSpawn.subscribe(async ev => {
  const { initialSpawn, player } = ev;
  if (!initialSpawn) return;
  
  const friends = await friendLoad();
  // @ts-ignore
  if (!player.isRegistered) { // 登録
    friends.registerUser(player);
    // @ts-ignore
    player.isRegistered = true;
  }
  
  await util.sleep(20*6); // 完全に参加できるまで待機

  const users = /** @type {import('./FriendManager').User[]} */ (friends.fetchRequest(player.id).got ?? []);
  if (users.length > 0) return player.sendMessage(`§e${users.length > 1 ? `${users.length} 件の` : `${users[0].name} から`}フレンド申請が届いています！\n/friend でフレンドメニューを開いてみましょう`);
});

system.runInterval(() => {
  if (!friends) return;
  for (const p of world.getPlayers()) {
    // @ts-ignore
    if (p.isRegistered) continue; 
    friends.registerUser(p);
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

/** @returns {Promise<FriendManager>} */
export function friendLoad() {
  return new Promise(r => {
    system.run(function check() {
      try {
        if (friends?.DB) r(friends);
      } catch {
        system.run(check);
      }
    })
  });
}