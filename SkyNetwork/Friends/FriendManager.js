// @ts-check

import { world, Player } from '@minecraft/server';
import { defaultMaxFriends } from './config';
import * as util from './util';
import { db } from '../Database/index';

export const TABLES = /** @type {const} */ ({
  users: 'users',
  sentRequests: 'sentRequests',
  gotRequests: 'gotRequests',
  friends: 'friends',
  maxFriends: 'maxFriends'
});

const dbFailedMessage = 'データベースの操作に失敗しました';

/** @typedef {import('./types').UserList} UserList */
/** @typedef {import('./types').User} User */
/** @typedef {import('./types').Response} Response */
// source = じぶん, target = あいて

/** 
 * @param {Player|string} p
 * @param {string} m
*/
function sendMessage(p, m) {
  if (p === "all") world.sendMessage(m);
  else if (p instanceof Player) p.sendMessage(m);
}

/** @returns {{ error: true, result: null } | { error: false, result: any[] }} */
function toArray(data) {
  try {
    const result = JSON.parse(data) ?? [];
    return { error: false, result }
  } catch {
    return { error: true, result: null }
  }
}

export class FriendAPI {
  /**
   * プレイヤーIDと名前を紐付けて登録
   * @param {Player} player 
   */
  static registerUser(player) {
    db.set(TABLES.users, player.id, player.name);
  }

  /**
   * playerIdからUserオブジェクトを取得
   * @param {string} playerId 
   * @returns {User}
   */
  static getUser(playerId) {
    const name = db.get(TABLES.users, playerId);
    return { id: playerId, name }
  }

  /**
   * 
   * @param {string} playerName 
   * @returns {string|undefined}
   */
  static getIdByName(playerName) {
    for (const [id, name] of db.entries(TABLES.users)) {
      if (name === playerName) return id;
    }
  }

  /**
   * フレンド一覧を取得
   * @param {string} playerId 
   * @returns {string[]}
   */
  static getFriends(playerId) {
    const data = db.get(TABLES.friends, playerId) ?? '[]';
    const { result, error } = toArray(data);
    if (error) throw new Error('FriendAPI::getFriends Failed to parse JSON');
    return result;
  }

  /**
   * フレンド一覧を設定
   * @param {string} playerId 
   * @param {string[]} friends 
   */
  static setFriends(playerId, friends) {
    if (friends.length > 0) {
      db.set(TABLES.friends, playerId, JSON.stringify(friends));
    } else {
      db.delete(TABLES.friends, playerId);
    }
  }

  /**
   * 登録できるフレンドの最大数を取得
   * @param {string} playerId 
   * @returns {number}
   */
  static getMaxFriends(playerId) {
    return db.get(TABLES.maxFriends, playerId) ?? defaultMaxFriends;
  }

  /**
   * 登録できるフレンドの最大数を設定
   * @param {string} playerId 
   * @param {number} max -1なら無限
   */
  static setMaxFriends(playerId, max) {
    if (typeof max !== 'number') throw TypeError('The value provided for max count is not a number');
    db.set(TABLES.maxFriends, playerId, max);
  }

  /**
   * playerIdからsentRequestsを取得
   * @param {string} playerId 
   * @returns {string[]}
   */
  static getSentRequests(playerId) {
    const data = db.get(TABLES.sentRequests, playerId) ?? '[]';
    const { result, error } = toArray(data);
    if (error) throw new Error('FriendAPI::getSentRequests Failed to parse JSON');
    return result;
  }

  /**
   * @param {string} playerId 
   * @param {string[]} requests 
   */
  static setSentRequests(playerId, requests) {
    if (requests.length > 0) {
      db.set(TABLES.sentRequests, playerId, JSON.stringify(requests));
    } else {
      db.delete(TABLES.sentRequests, playerId);
    }
  }

  /**
   * playerIdからgotRequestsを取得
   * @param {string} playerId 
   * @returns {string[]}
   */
  static getGotRequests(playerId) {
    const data = db.get(TABLES.gotRequests, playerId) ?? '[]';
    const { result, error } = toArray(data);
    if (error) throw new Error('FriendAPI::getGotRequests Failed to parse JSON');
    return result;
  }

  /**
   * @param {string} playerId 
   * @param {string[]} requests 
   */
  static setGotRequests(playerId, requests) {
    if (requests.length > 0) {
      db.set(TABLES.gotRequests, playerId, JSON.stringify(requests));
    } else {
      db.delete(TABLES.gotRequests, playerId);
    }
  }
}

export class FriendManager {
  constructor() {}

  /**
   * @param {string} sourceId
   * @param {string} targetName
   * @returns {import('./types').SendResponse}
   */
  sendRequest(sourceId, targetName) {
    const target = world.getPlayers().find(p => p.name === targetName);
    if (sourceId === target?.id) { // 自分自身にリクエストしていたら
      if (!target.hasTag('botti')) {
        sendMessage(target, `§g§l《実績解除》\n§r§a実績「ぼっち」を達成しました！\n報酬：500SP`)
        util.addScore(target, 'sp', 900);
        target.runCommandAsync(`playsound random.levelup @s ~~1~ 0.7 0.5`);
        target.addTag('botti')
      }
      return { error: true, message: '自分とフレンドになることはできませんよ...?' };
    }
    try {
      const targetId = target?.id ?? FriendAPI.getIdByName(targetName);
      if (!targetId) return { error: true, message: `プレイヤー 「${targetName}§c」 が見つかりませんでした` };
      
      // フレンドの人数制限
      const sourceFriends = FriendAPI.getFriends(sourceId);
      const targetFriends = FriendAPI.getFriends(targetId);
      const sourceMax = FriendAPI.getMaxFriends(sourceId);
      const targetMax = FriendAPI.getMaxFriends(targetId);
      if (sourceMax !== -1 && sourceFriends.length >= sourceMax) {
        return { error: true, message: `フレンド数が上限に達しています！ (${sourceFriends.length} > ${sourceMax})` };
      }
      if (targetMax !== -1 && targetFriends.length >= targetMax) {
        return { error: true, message: `相手のフレンド数が上限に達しています！` };
      }
      
      // リクエスト送信
      const sent = FriendAPI.getSentRequests(sourceId);
      const got = FriendAPI.getGotRequests(targetId);
      if (sent.includes(targetId) && got.includes(sourceId)) {
        return { error: true, message: `${targetName} は既に申請済みです` };
      }
      sent.push(targetId);
      got.push(sourceId);
      FriendAPI.setSentRequests(sourceId, sent);
      FriendAPI.setGotRequests(targetId, got);
      return { error: false, targetId };
      
    } catch (e) {
      console.error(e, e.stack);
      return { error: true, message: dbFailedMessage };
    }
  }
  
  /**
   * 送信/受信したリクエストを取得
   * @param {string} sourceId
   * @returns {import('./types').FetchResponse}
   */
  fetchRequest(sourceId) {
    try {
      const sent = FriendAPI.getSentRequests(sourceId);
      const got = FriendAPI.getGotRequests(sourceId);
      const sentUsers = sent.map(id => FriendAPI.getUser(id)); // Userオブジェクトに変換
      const gotUsers = got.map(id => FriendAPI.getUser(id));
      
      return { error: false, got: gotUsers, sent: sentUsers };
    } catch (e) {
      console.error(e, e.stack);
      return { error: true, message: dbFailedMessage };
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
      
      const sent = FriendAPI.getSentRequests(targetId).filter(r => r !== sourceId);
      const got = FriendAPI.getGotRequests(sourceId).filter(r => r !== targetId);
      FriendAPI.setSentRequests(targetId, sent);
      FriendAPI.setGotRequests(sourceId, got);
      
      return res;
    } catch (e) {
      console.error(e, e.stack);
      return { error: true, message: dbFailedMessage };
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
      const sent = FriendAPI.getSentRequests(sourceId).filter(r => r !== targetId);
      const got = FriendAPI.getGotRequests(targetId).filter(r => r !== sourceId);
      FriendAPI.setSentRequests(sourceId, sent);
      FriendAPI.setGotRequests(targetId, got);
      
      return { error: false }
    } catch (e) {
      console.error(e, e.stack);
      return { error: true, message: dbFailedMessage };
    }
  }
  
  /**
   * @param {string} playerId
   * @returns {import('./types').FriendsResponse}
   */
  getFriendList(playerId) {
    try {
      const friends = FriendAPI.getFriends(playerId);
      const playerIds = world.getPlayers().map(p => p.id);

      /** @type {User[]} */
      const res = friends.map(id => {
        const user = FriendAPI.getUser(id);
        user.online = playerIds.includes(id);
        return user;
      });
      return { error: false, data: res }
    } catch (e) {
      console.error(e, e.stack);
      return { error: true, message: dbFailedMessage };
    }
  }
  
  /**
   * acceptして両方フレンドになる
   * @param {string} player1 (source player)
   * @param {string} player2 (target player)
   * @returns {Response}
   */
  addFriend(player1, player2) {
    const friends1 = FriendAPI.getFriends(player1);
    const friends2 = FriendAPI.getFriends(player2);
    
    // フレンドの人数制限
    const max1 = FriendAPI.getMaxFriends(player1);
    const max2 = FriendAPI.getMaxFriends(player2);
    if (max1 !== -1 && friends1.length >= max1) return {
       error: true,
       message: `フレンド数が上限に達しています！ (${friends1.length} > ${max1})\nCOAL以上のランクがあれば、フレンドを無限に登録可能になります…`
    };
    if (max2 !== -1 && friends2.length >= max2) return {
      error: true,
      message: `相手のフレンド数が上限に達しています！\nランクを紹介してあげてください…`
    };
    
    // 追加
    friends1.push(player2);
    friends2.push(player1);
    FriendAPI.setFriends(player1, friends1);
    FriendAPI.setFriends(player2, friends2);
    
    return { error: false }
  }
  
  /**
   * 両方のリストから削除
   * @param {string} player1
   * @param {string} player2
   */
  deleteFriend(player1, player2) {
    const friends1 = FriendAPI.getFriends(player1).filter(r => r !== player2); // player2を削除=player2以外を抽出
    const friends2 = FriendAPI.getFriends(player2).filter(r => r !== player1);
    FriendAPI.setFriends(player1, friends1);
    FriendAPI.setFriends(player2, friends2);
  }
}
