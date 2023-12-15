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

export const PlayStyle = /** @type {const} */ ({
  Bed: 1,
  Kill: 2,
  Core: 3,
  Boss: 4
});

/** @typedef {keyof TeamTag} Teams */

/**
 * @param {Player} player 参加させるプレイヤー
 * @param {Teams[]} teams 振り分けに使うチーム名の配列
 * @param {boolean} [isStart] ゲーム開始時かどうか
 * @returns {Promise<boolean>} チーム選択が完了したかどうか キャンセルした場合falseを返します
 */
export async function joinTeam(player, teams, isStart) {
  let team;
  try {
    team = await selectTeam(player, teams, isStart);
  } catch (e) {
    console.error(`[joinTeam] ${e}`, e.stack);
    return false;
  }
  
  if (!team) return false;

  // bedが存在していない=100より小さい時タグ付与
  if (getGame() === PlayStyle.Bed && util.getScore(`${team}player`, team, true) < 100) {
    player.addTag('notrespawn');
  }
  
  player.addTag(team); // 最終的なチーム
  if (!player.hasTag(team + "d")) player.addTag(team + "d"); // リログ用につけておく
  
  player.sendMessage('§c§l敵チームとの協力プレイは禁止です！\n§r§b敵チームとの協力プレイをすると、サーバーからBANされます！');
  player.sendMessage(`あなたは${TeamColor[team]}§l${team.toUpperCase()}チーム§r§fに加入しました`);
  player.addTag(TeamTag[team]);
  return true;
}

/**
 * @param {Player} target
 * @param {Teams[]} teams 振り分けに使うチーム名の配列
 * @param {boolean} [isStart] ゲーム開始時かどうか
 * @returns {Promise<keyof TeamTag | undefined>} プレイヤーが参加するチームのタグ
 */
export async function selectTeam(target, teams, isStart) {
  console.warn(`[selectTeam] asking: ${target.name}`);
  const { canceled, selectedTeam } = await askTeam(target, teams, isStart);
  if (canceled) return;

  const currentGame = getGame();
  const gameName = Object.keys(PlayStyle).find(k => PlayStyle[k] === currentGame);
  const debugLogs = [ `[selectTeam] ${target.name} | game: ${gameName}(${currentGame})${isStart ? ', isStart' : ''}` ];

  const friendList = FriendAPI.getFriends(target.id);
  const players = world.getPlayers();
  const onlineFriends = players.filter(p => friendList.includes(p.id));
  
  const teamHPs = /** @type {{ [key in keyof TeamTag]: number }} */ (
    Object.fromEntries(teams.map(team => [ team, util.getScore(`${team}player`, team) ]))
  );

  // 全チームそれぞれの人数 = redplayers
  const scores = getTeamCount(teams);
  
  /** @param {keyof TeamTag} team */
  const bedExists = (team) => teamHPs[team] === 100;

  const joinableTeams = shuffleArray(isStart ? scores : filterJoinableTeam(teams));
  
  const zeroExists = joinableTeams.some(x => !x.count); // 人数0が一つでもあるかどうか
  joinableTeams.sort((team1, team2) => {
    // ベッド存在を優先
    if (currentGame === PlayStyle.Bed && (bedExists(team1.team) !== bedExists(team2.team))) {
      return bedExists(team1.team) ? -1 : 1;
    }

    // 人数少ない方優先
    if (zeroExists || team1.count !== team2.count) { 
      return team1.count - team2.count;
    }

    // 選択されたチームを優先
    if (selectedTeam && team1.team === selectedTeam) return -1;

    // 同じ人数の時 フレンドがいる方を優先
    team1.hasFriend ??= onlineFriends.some(p => p.hasTag(team1.team)); // hasTagの回数を減らすために保存しておく
    return team1.hasFriend ? -1 : 1;
  });
  const debugMsg = joinableTeams.map(x => `${x.team}(${x.count}): ${teamHPs[x.team]}HP${x.hasFriend?', fnd':''}`).join(' | ');
  debugLogs.push(`TeamData (${joinableTeams.length}/${teams.length} teams):\n${debugMsg}`);
  debugLogs.push(`Result: ${joinableTeams[0].team} (choice: ${selectedTeam})`);

  const tag = joinableTeams[0].team;
  
  if (!tag) target.sendMessage('§cチームの振り分けに失敗しました 管理者に連絡してください');
  if (DEBUG) console.warn(debugLogs.join('\n') + '\n');
  return tag;
}

/**
 * @param {Player} target
 * @param {Teams[]} teams
 * @param {boolean} isStart
 * @returns {Promise<{ selectedTeam?: Teams, canceled?: boolean }>}
 */
async function askTeam(target, teams, isStart) {
  const scores = getTeamCount(teams);
  const sortedTeams = shuffleArray(isStart ? scores : filterJoinableTeam(teams))
    .sort((t1, t2) => t1.count - t2.count)
    .map(t => t.team);

  if (sortedTeams.length === 0) {
    target.sendMessage(`§cError: 参加できるチームがありません`);
    return { canceled: true }
  }

  const form = new ActionForm();
  form.title('チームを選択');
  form.body('希望するチームを選択してください。');
  form.button('§lおまかせ', 'textures/blocks/wool_colored_white', 'auto');
  for (const team of sortedTeams)
    form.button(`${TeamColor[team]}${team.toUpperCase()}`, `textures/blocks/wool_colored_${team}`, team);
  const { canceled, button } = await form.show(target);
  if (canceled) return { canceled: true }
  if (button.id == 'auto') return { selectedTeam: undefined }
  return { selectedTeam: button.id }
}

/**
 * @param {Teams[]} teams
 * @returns {{ team: Teams, count: number, hasFriend?: boolean }[]}
 */
function filterJoinableTeam(teams) {
  const currentGame = getGame();
  const scores = getTeamCount(teams);
  return scores.filter(d => {
    if (!d.count) return false;
    if (
      (currentGame === PlayStyle.Core || currentGame === PlayStyle.Boss) &&
      util.getScore(`${d.team}hp`, d.team) === 0 // 壊されてた場合参加不可
    ) return false;
    return true;
  });
}

/**
 * @param {Teams[]} teams
 * @returns {{ team: Teams, count: number, hasFriend?: boolean }[]}
 */
function getTeamCount(teams) {
  const players = world.getPlayers();
  return teams.map(team => (
    { team, count: players.filter(p => p.hasTag(team)).length }
  ));
}

/** @returns {number|undefined} */
function getGame() { return util.getScore('system', 'game') }

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
