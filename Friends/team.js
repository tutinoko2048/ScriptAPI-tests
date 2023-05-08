// @ts-check
import { world, Player } from '@minecraft/server';
import * as util from '../util/score';

// ワールド参加時 redけす
// ゲーム終了時 red, redd を*で全部消し飛ばす

const teamTag = /** @type {const} */ ({
  red: 'redman',
  blue: 'blueman',
  yellow: 'yellowman',
  lime: 'green'
});

const teamColor = {
  red: '§c',
  blue: '§1',
  yellow: '§e',
  lime: '§a'
}

/**
 * @param {Player} player 参加させるプレイヤー
 * @param {import('./FriendManager').FriendManager} friends FriendManager
 * @param {(keyof teamTag)[]} teams 振り分けに使うチーム名の配列
 * @param {boolean} [isStart] ゲーム開始時かどうか
 */
export function joinTeam(player, friends, teams, isStart) {
  const { error, data: list, message } = friends.getFriends(player.id);
  if (error) return player.sendMessage(`§c${message ?? 'エラーが発生しました'} 管理者に連絡してください`);
  const team = selectTeam(player, list ?? [], teams, isStart); // チームを決める
  
  player.addTag(team); // 最終的なチーム
  if (!player.hasTag(team + "d")) player.addTag(team + "d"); // リログ用につけておく
  
  player.sendMessage('§c§l敵チームとの協力プレイは禁止です！\n§r§b敵チームとの協力プレイをすると、サーバーからBANされます！');
  
  player.sendMessage(`あなたは${teamColor[team]}§l${team.toUpperCase()}チーム§r§fに加入しました`);
  player.addTag(teamTag[team]);
}

/**
 * @param {Player} player
 * @param {import('./FriendManager').User[]} friendList フレンドリスト
 * @param {(keyof teamTag)[]} teams 振り分けに使うチーム名の配列
 * @param {boolean} [isStart] ゲーム開始時かどうか
 * @returns {keyof teamTag} プレイヤーが参加するチームのタグ
 */
export function selectTeam(player, friendList, teams, isStart) {
  const ids = friendList.map(u => u.id);
  const players = world.getAllPlayers();
  const friends = players.filter(p => ids.includes(p.id));
  
  const teamHPs = teams.map(team => ({ team, score: util.getFakeScore(`${team}player`, team) }));
  
  // 全チームの人数
  const scores = getTeamCount(players, teams);
  
  // 人数0除外+1番人数が少ないチーム
  const sorted = /** @type {any} */ (scores.filter(d => isStart || !!d.count));
  const noZero = scores.every(x => !!x.count); // 開始時は0だからフレンドは考えない
  sorted.sort((a, b) => {
    if (noZero && a.count === b.count) { // 同じ人数の時 フレンドがいる方を優先
      a.hasFriend ??= friends.some(p => p.hasTag(a.team)); // hasTagの回数を減らすために保存しておく
      b.hasFriend ??= friends.some(p => p.hasTag(b.team));
      
      return b.hasFriend - a.hasFriend;
    }
    return a.count - b.count;
  });
  
  let tag = sorted[0].team;
  for (const { team, score } of teamHPs) {
    if (player.hasTag(team + "d")) {
      player.removeTag(team + "d");
      if (score != 0) return team;
    }
  }
  
  if (!tag) player.sendMessage('§cチームの振り分けに失敗しました 管理者に連絡してください');
  return tag;
}

/**
 * @param {Player[]} players
 * @param {(keyof teamTag)[]} teams
 */
function getTeamCount(players, teams) {
  return teams.map(team => (
    {
      team,
      count: players.filter(p => p.hasTag(team)).length
    }
  ))
}