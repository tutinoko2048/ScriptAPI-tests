// @ts-check
import { world } from '@minecraft/server';
import * as util from './util';
import { FriendAPI } from './FriendManager';

const DEBUG = false;

/** @typedef {import('@minecraft/server').Player} Player */

// ワールド参加時 redけす
// ゲーム終了時 red, redd を*で全部消し飛ばす
// めも: redオブジェクトの中にredplayer, redplayersが入ってる
// bedの時 ベッド存在してたらredplayerが100になる

const TeamTag = /** @type {const} */ ({
  red: 'redman',
  blue: 'blueman',
  yellow: 'yellowman',
  lime: 'green'
});

const TeamColor = /** @type {const} */ ({
  red: '§c',
  blue: '§1',
  yellow: '§e',
  lime: '§a'
});

const isBedGame = () => getGame() === 1;

/**
 * @param {Player} player 参加させるプレイヤー
 * @param {(keyof TeamTag)[]} teams 振り分けに使うチーム名の配列
 * @param {boolean} [isStart] ゲーム開始時かどうか
 */
export function joinTeam(player, teams, isStart) {
  const team = selectTeam(player, teams, isStart); // チームを決める

  // bedが存在していない=100より小さい時タグ付与
  // @ts-ignore
  if (isBedGame() && util.getScore(`${team}player`, team, true) < 100) {
    player.addTag('notrespawn');
  }
  
  player.addTag(team); // 最終的なチーム
  if (!player.hasTag(team + "d")) player.addTag(team + "d"); // リログ用につけておく
  
  player.sendMessage('§c§l敵チームとの協力プレイは禁止です！\n§r§b敵チームとの協力プレイをすると、サーバーからBANされます！');
  
  player.sendMessage(`あなたは${TeamColor[team]}§l${team.toUpperCase()}チーム§r§fに加入しました`);
  player.addTag(TeamTag[team]);
}

/**
 * @param {Player} target
 * @param {(keyof TeamTag)[]} teams 振り分けに使うチーム名の配列
 * @param {boolean} [isStart] ゲーム開始時かどうか
 * @returns {keyof TeamTag} プレイヤーが参加するチームのタグ
 */
export function selectTeam(target, teams, isStart) {
  const debugLogs = [`team selection start (player: ${target.name}, isStart:${isStart}, game: ${getGame()}`];

  const friendList = FriendAPI.getFriends(target.id);
  const players = world.getPlayers();
  const onlineFriends = players.filter(p => friendList.includes(p.id));
  
  const teamHPs = /** @type {{ [key in keyof TeamTag]: number }} */ (
    Object.fromEntries(teams.map(team => [ team, util.getScore(`${team}player`, team) ]))
  );
  debugLogs.push(`teamHPs: ${JSON.stringify(teamHPs)}`);

  // 全チームそれぞれの人数 = redplayers
  const scores = getTeamCount(players, teams);
  debugLogs.push(`exclude as 0 player: ${scores.filter(x => !isStart && x.count === 0).map(x => x.team)}`);
  
  /** @param {keyof TeamTag} team */
  const bedExists = (team) => teamHPs[team] === 100;
  
  // 人数0除外+1番人数が少ないチーム
  const sorted = (scores.filter(d => isStart || !!d.count));
  const zeroExists = scores.some(x => !x.count) // 人数0が一つでもあるかどうか
  sorted.sort((team1, team2) => {
    // ベッド存在を優先
    if (isBedGame() && (bedExists(team1.team) !== bedExists(team2.team))) {
      return bedExists(team1.team) ? -1 : 1;
    }

    // 人数少ない方優先
    if (zeroExists || team1.count !== team2.count) { 
      return team1.count - team2.count;
    }

    // 同じ人数の時 フレンドがいる方を優先
    team1.hasFriend ??= onlineFriends.some(p => p.hasTag(team1.team)); // hasTagの回数を減らすために保存しておく
    return team1.hasFriend ? -1 : 1;
  });
  debugLogs.push(`teamData: ${JSON.stringify(sorted)}`);
  debugLogs.push(`sortOrder: ${sorted.map(x => x.team).join(', ')}`);
  debugLogs.push(`selected: ${sorted[0].team}`);

  const tag = sorted[0].team;
  for (const [ team, score ] of Object.entries(teamHPs)) {
    if (target.hasTag(team + "d")) {
      target.removeTag(team + "d");
      if (score != 0) return /** @type {keyof TeamTag} */ (team);
    }
  }
  
  if (!tag) target.sendMessage('§cチームの振り分けに失敗しました 管理者に連絡してください');
  
  if (DEBUG) {
    debugLogs.push('='.repeat(10));
    console.warn(debugLogs.join('\n'));
  }

  return tag;
}

/**
 * @param {Player[]} players
 * @param {(keyof TeamTag)[]} teams
 * @returns {{ team: keyof TeamTag, count: number, hasFriend?: boolean }[]}
 */
function getTeamCount(players, teams) {
  return teams.map(team => (
    {
      team,
      count: players.filter(p => p.hasTag(team)).length
    }
  ))
}

/** @returns {number|undefined} */
function getGame() {
  return util.getScore('system', 'game');
}
