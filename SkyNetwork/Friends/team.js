// @ts-check
import { world, Player } from '@minecraft/server';
import * as util from './util';
import { FriendAPI } from './FriendManager';
import { ActionForm } from './ActionForm';

const DEBUG = true;

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
export async function joinTeam(player, teams, isStart) {
  let team;
  try {
    team = await selectTeam(player, teams, isStart);
  } catch (e) {
    console.error(e, e.stack);
    return;
  }

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
 * @returns {Promise<keyof TeamTag>} プレイヤーが参加するチームのタグ
 */
export async function selectTeam(target, teams, isStart) {
  const debugLogs = [`TeamSelection (name: ${target.name}, start: ${isStart}, game: ${getGame()}`];

  const friendList = FriendAPI.getFriends(target.id);
  const players = world.getPlayers();
  const onlineFriends = players.filter(p => friendList.includes(p.id));
  
  const teamHPs = /** @type {{ [key in keyof TeamTag]: number }} */ (
    Object.fromEntries(teams.map(team => [ team, util.getScore(`${team}player`, team) ]))
  );
  debugLogs.push(`TeamHP: ${JSON.stringify(teamHPs)}`);

  // 全チームそれぞれの人数 = redplayers
  const scores = getTeamCount(players, teams);
  debugLogs.push(`Teams excluded as 0 player: ${scores.filter(x => !isStart && x.count === 0).map(x => x.team)}`);
  
  /** @param {keyof TeamTag} team */
  const bedExists = (team) => teamHPs[team] === 100;
  
  const sorted = shuffleArray(scores.filter(d => isStart || !!d.count)); // 人数0除外+1番人数が少ないチーム

  const zeroExists = scores.some(x => !x.count); // 人数0が一つでもあるかどうか
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
  debugLogs.push(`TeamData: ${JSON.stringify(Object.fromEntries(sorted.map(x => [x.team, { fnd: x.hasFriend, cnt: x.count }])))}`);
  debugLogs.push(`TeamSelection result: ${sorted[0].team}`);

  const tag = sorted[0].team;
  for (const [ team, score ] of Object.entries(teamHPs)) {
    if (target.hasTag(team + "d")) {
      target.removeTag(team + "d");
      if (score != 0) return /** @type {keyof TeamTag} */ (team);
    }
  }
  
  if (!tag) target.sendMessage('§cチームの振り分けに失敗しました 管理者に連絡してください');
  
  if (DEBUG) console.warn(debugLogs.join('\n') + '\n');

  return tag;
}

/**
 * @param {Player} player
 * @param {(keyof TeamTag)[]} teams
 * @returns {Promise<(keyof TeamTag) | 'auto' |undefined>}
 */
async function askTeam(player, teams) {
  const form = new ActionForm();
  form.title('チームを選択');
  form.body('希望するチームを選択してください。');
  form.button('§lおまかせ', 'textures/blocks/wool_colored_white', 'auto');
  for (const team of teams)
    form.button(`${TeamColor[team]}${team.toUpperCase()}`, `textures/blocks/wool_colored_${team}`, team);
  const { canceled, button } = await form.show(player);
  if (canceled) return;
  return button.id;
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

/**
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}