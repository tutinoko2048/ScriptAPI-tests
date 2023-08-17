const ScoreboardIdentityType = Object.freeze({
  Player: "Player",
  Entity: "Entity",
  FakePlayer: "FakePlayer",
});

const InternalScoreboardIdentityType = Object.freeze({
  1: ScoreboardIdentityType.Player,
  2: ScoreboardIdentityType.Entity,
  3: ScoreboardIdentityType.FakePlayer
});

class ScoreboardObjective {
  #scoreboard;
  #data;
  constructor(scoreboard, data) {
    this.#scoreboard = scoreboard;
    this.#data = data;
  }
  
  get id() {
    return this.#data.Name.value;
  }
  
  get displayName() {
    return this.#data.DisplayName.value;
  }
  
  getScores() {
    return this.#data.Scores.value.value_List.map(data => new ScoreboardScoreInfo(this.#scoreboard, data))
  }
  
  getScore(participant) {
    if (participant instanceof ScoreboardIdentity) {
      return this.getScores().find(info => info.participant.id === participant.id);
    } else if (typeof participant === 'string') {
      return this.getScore().find(info => info.participant.type === ScoreboardIdentityType.FakePlayer && info.participant.displayName === participant);
    }
    throw TypeError('unexpected type')
  }
  
  toJSON() {
    return { id: this.id, displayName: this.displayName }
  }
}

class ScoreboardIdentity {
  #scoreboard;
  #data;
  constructor(scoreboard, data) {
    this.#scoreboard = scoreboard;
    this.#data = data;
  }
  
  get displayName() {
    switch (this.type) {
      case ScoreboardIdentityType.Player: return this.#data.PlayerId.value;
      case ScoreboardIdentityType.Entity: return this.#data;
      case ScoreboardIdentityType.FakePlayer: return this.#data.FakePlayerName.value;
    }
    throw Error(`unhandled type value: ${this.type}`);
  }
  
  get id() {
    return this.#data.ScoreboardId.value;
  }
  
  get type() {
    return InternalScoreboardIdentityType[this.#data.IdentityType.value];
  }
  
  toJSON() {
    return { id: this.id, displayName: this.displayName, type: this.type }
  }
}

class ScoreboardScoreInfo {
  #scoreboard;
  #data;
  constructor(scoreboard, data) {
    this.#scoreboard = scoreboard;
    this.#data = data;
  }
  
  get score() {
    return this.#data.Score.value;
  }
  
  get participant() {
    return this.#scoreboard.getParticipants().find(identity => identity.id === this.#data.ScoreboardId.value);
  }
  
  toJSON() {
    return { score: this.score, participant: this.participant }
  }
}
class Scoreboard {
  #data;
  constructor(data) {
    this.#data = data[0].value;
  }
  
  getObjectives() {
    const objectives = this.#data.Objectives.value.value_List.map(data => new ScoreboardObjective(this, data))
    return objectives;
  }
  
  getObjective(objectiveId) {
    return this.getObjectives().find(objective => objective.id === objectiveId);
  }
  
  getParticipants() {
    return this.#data.Entries.value.value_List.map(data => new ScoreboardIdentity(this, data));
  }
}

module.exports = { Scoreboard, ScoreboardObjective, ScoreboardIdentity, ScoreboardScoreInfo, ScoreboardIdentityType }