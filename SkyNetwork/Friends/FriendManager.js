// @ts-check

import { world, Player } from '@minecraft/server';
import { Database } from './Database';
import { defaultMaxFriends } from './config';
import * as util from './util';

export const TABLES = /** @type {const} */ ({
  users: 'users',
  sentRequests: 'sentRequests',
  gotRequests: 'gotRequests',
  friends: 'friends',
  maxFriends: 'maxFriends'
});

/** @typedef {import('./types').UserList} UserList */
/** @typedef {import('./types').User} User */
/** @typedef {import('./types').Response} Response */
// source = じぶん, target = あいて

/** 
 * @param {Player | String} p
 * @param {String} m
*/
function sendMessage(p, m) {
  if (p === "all") world.sendMessage(m);
  else if (p instanceof Player) p.sendMessage(m);
}

export class FriendManager {
  /** @type {Database} */
  #DB;
  
  /** @param {import('@minecraft/server').Vector3} chestLocation */
  constructor(chestLocation) {
    this.#DB = new Database(chestLocation);
  }
  
  /** @type {Database} */
  get DB() { return this.#DB; }
  
  /**
   * @param {Player} player
   */
  registerUser(player) {
    const users = this.getUsers();
    users[player.id] = player.name;
    this.setUsers(users);
  }
  
  /** @returns {UserList} */
  getUsers() {
    let a = this.DB.get('score', 'aa')
    return this.DB.getTable(TABLES.users) ?? {};
  }
  
  /** @param {UserList} users */
  setUsers(users = {}) {
    this.DB.setTable(TABLES.users, users);
  }
  
  /**
   * @param {string} sourceId
   * @param {string} targetName
   * @returns {import('./types').SendResponse}
   */
  sendRequest(sourceId, targetName) {
    const target = world.getPlayers().find(p => p.name === targetName);
    if (sourceId === target?.id) {
      if (!target.hasTag('botti')) {
        sendMessage(target, `§g§l《実績解除》\n§r§a実績「ぼっち」を達成しました！\n報酬：500SP`)
        util.addScore(target, 'sp', 900);
        target.runCommandAsync(`playsound random.levelup @s ~~1~ 0.7 0.5`);
        target.addTag('botti')
      }
      return { error: true, message: '自分とフレンドになることはできませんよ...?' };
    }
    try {
      const targetId = target?.id ?? this.getIdByName(targetName);
      if (!targetId) return { error: true, message: `プレイヤー 「${targetName}§c」 が見つかりませんでした` };
      
      // フレンドの人数制限
      const sourceFriends = this.DB.get(TABLES.friends, sourceId) ?? [];
      const targetFriends = this.DB.get(TABLES.friends, targetId) ?? [];
      const sourceMax = this.getMaxFriends(sourceId);
      const targetMax = this.getMaxFriends(targetId);
      if (sourceMax !== -1 && sourceFriends.length >= sourceMax) return { error: true, message: `フレンド数が上限に達しています！ (${sourceFriends.length} > ${sourceMax})` };
      if (targetMax !== -1 && targetFriends.length >= targetMax) return { error: true, message: `相手のフレンド数が上限に達しています！` };
      
      // リクエスト送信
      const sent = this.DB.get(TABLES.sentRequests, sourceId) ?? [];
      const got = this.DB.get(TABLES.gotRequests, targetId) ?? [];
      if (sent.includes(targetId) && got.includes(sourceId)) return { error: true, message: `${targetName} は既に申請済みです` };
      sent.push(targetId);
      got.push(sourceId);
      this.DB.set(TABLES.sentRequests, sourceId, sent);
      this.DB.set(TABLES.gotRequests, targetId, got);
      return { error: false, targetId };
      
    } catch (e) {
      console.error(e, e.stack);
      return { error: true, message: 'データベースの操作に失敗しました' };
    }
  }
  
  /**
   * 送信/受信したリクエストを取得
   * @param {string} sourceId
   * @returns {import('./types').FetchResponse}
   */
  fetchRequest(sourceId) {
    try {
      const sent = this.DB.get(TABLES.sentRequests, sourceId) ?? []; // ids
      const got = this.DB.get(TABLES.gotRequests, sourceId) ?? [];
      const users = this.getUsers();
      /** @type {User[]} */
      const sentUsers = sent.map(id => ({ id, name: users[id] })); // id+name
      /** @type {User[]} */
      const gotUsers = got.map(id => ({ id, name: users[id] }));
      
      return { error: false, got: gotUsers, sent: sentUsers };
    } catch (e) {
      console.error(e, e.stack);
      return { error: true, message: 'データベースの操作に失敗しました' };
    }
  }
  
  /**
   * @param {string} sourceId
   * @param {string} targetId
   * @returns {Response}
   */
  acceptRequest(sourceId, targetId) {
    try {
      const res = this.addFriend(sourceId, targetId);
      if (res.error) return res; // 上限の時リクエストを削除しないようにする
      
      const sent = (this.DB.get(TABLES.sentRequests, targetId) ?? []).filter(r => r !== sourceId);
      const got = (this.DB.get(TABLES.gotRequests, sourceId) ?? []).filter(r => r !== targetId);
      this.DB.set(TABLES.sentRequests, targetId, sent.length ? sent : undefined);
      this.DB.set(TABLES.gotRequests, sourceId, got.length ? got : undefined);
      
      return res;
    } catch (e) {
      console.error(e, e.stack);
      return { error: true, message: 'データベースの操作に失敗しました' };
    }
  }
  
  /**
   * 送った側のリクエストをキャンセル
   * @param {string} sourceId
   * @param {string} targetId
   * @returns {Response}
   */
  cancelRequest(sourceId, targetId) {
    try {
      const sent = (this.DB.get(TABLES.sentRequests, sourceId) ?? []).filter(r => r !== targetId);
      const got = (this.DB.get(TABLES.gotRequests, targetId) ?? []).filter(r => r !== sourceId);
      this.DB.set(TABLES.sentRequests, sourceId, sent.length ? sent : undefined);
      this.DB.set(TABLES.gotRequests, targetId, got.length ? got : undefined);
      
      return { error: false }
    } catch (e) {
      console.error(e, e.stack);
      return { error: true, message: 'データベースの操作に失敗しました' };
    }
  }
  
  /**
   * @param {string} playerId
   * @returns {import('./types').FriendsResponse}
   */
  getFriends(playerId) {
    try {
      const friends = this.DB.get(TABLES.friends, playerId) ?? [];
      const users = this.getUsers();
      const players = world.getPlayers().map(p => p.id);

      /** @type {User[]} */
      const res = friends.map(id => ({ id, name: users[id], online: players.includes(id) }));
      return { error: false, data: res }
    } catch (e) {
      console.error(e, e.stack);
      return { error: true, message: 'データベースの操作に失敗しました' };
    }
  }
  
  /**
   * acceptして両方フレンドになる
   * @param {string} player1 (source player)
   * @param {string} player2 (target player)
   * @returns {Response}
   */
  addFriend(player1, player2) {
    const friends1 = this.DB.get(TABLES.friends, player1) ?? [];
    const friends2 = this.DB.get(TABLES.friends, player2) ?? [];
    
    // フレンドの人数制限
    const max1 = this.getMaxFriends(player1);
    const max2 = this.getMaxFriends(player2);
    if (max1 !== -1 && friends1.length >= max1) return { error: true, message: `フレンド数が上限に達しています！ (${friends1.length} > ${max1})\nCOAL以上のランクがあれば、フレンドを無限に登録可能になります…` };
    if (max2 !== -1 && friends2.length >= max2) return { error: true, message: `相手のフレンド数が上限に達しています！\nランクを紹介してあげてください…` };
    
    // 追加
    friends1.push(player2);
    friends2.push(player1);
    this.DB.set(TABLES.friends, player1, friends1);
    this.DB.set(TABLES.friends, player2, friends2);
    
    return { error: false }
  }
  
  /**
   * 両方のリストから削除
   * @param {string} player1
   * @param {string} player2
   */
  deleteFriend(player1, player2) {
    const friends1 = (this.DB.get(TABLES.friends, player1) ?? []).filter(r => r !== player2);
    const friends2 = (this.DB.get(TABLES.friends, player2) ?? []).filter(r => r !== player1);
    
    this.DB.set(TABLES.friends, player1, friends1.length ? friends1 : undefined);
    this.DB.set(TABLES.friends, player2, friends2.length ? friends2 : undefined);
  }
  
  /**
   * フレンドの最大人数を取得 -1なら無限
   * @param {string} playerId プレイヤーのID (<Player>.id)
   * @returns {number}
   */
  getMaxFriends(playerId) {
    return this.DB.get(TABLES.maxFriends, playerId) ?? defaultMaxFriends;
  }
  
  /**
   * フレンドの最大人数を設定
   * @param {string} playerId プレイヤーのID (<Player>.id)
   * @param {number} max 最大人数 -1なら無限
   */
  setMaxFriends(playerId, max) {
    if (typeof max !== 'number') throw TypeError('The value provided for max count is not a number');
    this.DB.set(TABLES.maxFriends, playerId, max);
  }
  
  /**
   * @param {string} userName
   * @returns {string|undefined}
   */
  getIdByName(userName) {
    const users = this.getUsers();
    return Object.keys(users).find(id => users[id] === userName);
  }
}
