import { Player, ScoreboardIdentityType, world } from '@minecraft/server';
import { rankicon, getScore } from './util/function';
import { db } from './Database/index';

/** @typedef {{ playerId: string, value: number }} RankEntry */

export const RankType = /** @type {const} */ ({
  ServerTime: 'servertime',
  PlayTime: 'playtime',
  SP: 'sp',
  Kills: 'killcountall',
  Deaths: 'deathcountall',
  KD: 'kd',
  Wins: 'wincount',
  Achievements: 'achhowmany',
});
/** @typedef {RankType[keyof RankType]} RankTypes */

/**
 * @param {Player|string} player Player or playerId
 * @returns {string}
 */
function formatName(player) {
  const playerName = player instanceof Player
    ? player.name
    : db.get('users', player) ?? '§7不明なプレイヤー';
  const icon = rankicon(playerName);
  return icon ? `${icon} ${playerName}` : playerName;
}

/**
 * @param {RankTypes|Player} mode ランキングの種類またはプレイヤー(個別表示用)
 * @returns {string} ランキング本体
 * @example getRanking(RankType.ServerTime);
 * getRanking(player);
 */
export function getRanking(mode) {
  if (mode instanceof Player) {
    return playerRanking(mode);
  } else {
    return globalRanking(mode);
  }
}

/**
 * @param {RankTypes} type 
 * @returns {string}
 */
function globalRanking(type) {
  const rankName = Object.entries(RankType).find(([ _, value ]) => value === type)[0];
  if (!rankName) throw new TypeError(`Invalid rank type: ${type}`);
  /** @type {string[]} */
  const rows = [ `${type} ランキング\n` ];

  const excluded = getExcluded();
  if (type === RankType.ServerTime || type === RankType.PlayTime) {
    const hourEntries = getSorted(type + 'h', excluded).slice(0, 30); // xxxtimeh
    const timeEntries = hourEntries.map(entry => {
      entry.value = (entry.value * 60) + getScore(entry.playerId, type + 'm', true); // 時間と分の合計
      return entry;
    });
    timeEntries.sort((a, b) => b.value - a.value);
    const result = timeEntries.slice(0, 10).map((entry, i) => {
      const hours = getScore(entry.playerId, type + 'h', true);
      const minutes = getScore(entry.playerId, type + 'm', true);
      return `  §a#${i + 1}§r ${formatName(entry.playerId)}§r: ${hours}時間 ${minutes}分`;
    });
    rows.push(...result);

  } else if (type === RankType.KD) {
    const killEntries = getSorted(RankType.Kills, excluded);
    const kdEntries = killEntries
      .map(entry => {
        const deaths = getScore(entry.playerId, RankType.Deaths, true);
        if (entry.value + deaths < 100) return null; // K+D 100より下はnullをセット
        entry.value = entry.value / deaths;
        return entry;
      })
      .filter(Boolean); // null除外
    kdEntries.sort((a, b) => b.value - a.value);
    const result = kdEntries.slice(0, 10).map((entry, i) =>
      `  §a#${i + 1}§r ${formatName(entry.playerId)}§r: ${entry.value.toFixed(1)}`
    );
    rows.push(...result);

  } else { // その他特殊処理がいらないランキング
    const entries = getSorted(type, excluded);
    const result = entries.map((entry, i) =>
      `  §a#${i + 1}§r ${formatName(entry.playerId)}§r: ${entry.value}`
    );
    rows.push(...result);
  }

  return rows.join('\n');
}

/**
 * @param {Player} player
 * @returns {string}
 */
function playerRanking(player) {
  /** @type {string[]} */
  const rows = [ `${formatName(player)}§r さんの順位\n` ];

  const excluded = getExcluded();
  if (excluded.includes(player.id)) { // 除外リストに入ってたら
    rows.push('§7§oランキングが無効化されています');
    return rows.join('\n');
  }
  
  for (const [rankName, type] of Object.entries(RankType)) {
    if (type === RankType.ServerTime || type === RankType.PlayTime) {
      const hourEntries = getSorted(type + 'h', excluded); // 'xxxtimeh'
      const timeEntries = hourEntries.map(entry => {
        entry.value = (entry.value * 60) + getScore(entry.playerId, type + 'm', true); // 時間と分の合計
        return entry;
      });
      timeEntries.sort((a, b) => b.value - a.value);
      const rankIndex = timeEntries.findIndex(entry => entry.playerId === player.id);
      const hours = getScore(player.id, type + 'h', true);
      const minutes = getScore(player.id, type + 'm', true);
      
      // ServerTime: #1 1時間30分
      rows.push(`  ${rankName}: §a#${rankIndex + 1}§r ${hours}時間 ${minutes}分`);
      continue;
    }

    if (type === RankType.KD) {
      const killEntries = getSorted(RankType.Kills, excluded);
      const kdEntries = killEntries
        .map(entry => {
          const deaths = getScore(entry.playerId, RankType.Deaths, true);
          if (entry.value + deaths < 100) return null; // K+D 100より下はnullをセット
          entry.value = entry.value / deaths;
          return entry;
        })
        .filter(Boolean); // nullを除外
      kdEntries.sort((a, b) => b.value - a.value);
      const rankIndex = kdEntries.findIndex(entry => entry.playerId === player.id);
      if (rankIndex === -1) continue;
      const kd = kdEntries[rankIndex].value;
      rows.push(`  ${rankName}: §a#${rankIndex + 1}§r ${kd.toFixed(1)}`);
      continue;
    }

    // その他特殊処理がいらないランキング
    const entries = getSorted(type, excluded);
    const rankIndex = entries.findIndex(entry => entry.playerId === player.id);
    rows.push(`  ${rankName}: §a#${rankIndex + 1}§r ${entries[rankIndex].value}`);
  }

  return rows.join('\n');
}

/** 
 * @param {string} objectiveId
 * @param {string[]} [excludeList] 順位付けから除外するプレイヤーIDの配列
 * @returns {RankEntry[]}
 */
function getSorted(objectiveId, excludeList) {
  /** @type {RankEntry[]} */
  const entries = world.scoreboard.getObjective(objectiveId).getScores()
    .filter(info => info.participant.type === ScoreboardIdentityType.FakePlayer)
    .map(info => ({ playerId: info.participant.displayName, value: info.score }));
  
  entries.sort((a, b) => b.value - a.value);
  return excludeList ? entries.filter(e => !excludeList.includes(e.playerId)) : entries;
}

/** @returns {string[]} */
function getExcluded() {
  const excluded = [...db.entries('rankingExcludes')] // [playerId, boolean][]
    .filter(e => e[1]) // trueの人を抽出
    .map(e => e[0]); // key(id)の配列に変換
  return excluded;
}


/** @param {string} playerId */
export function getKD(playerId) {
  const kills = getScore(playerId, 'killcountall', true);
  const deaths = getScore(playerId, 'deathcountall', true);
  const KD = kills / deaths;
  return KD;
}