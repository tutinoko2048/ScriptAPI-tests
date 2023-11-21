"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scoreboard = exports.ScoreboardScoreInfo = exports.ScoreboardIdentity = exports.ScoreboardObjective = exports.ScoreboardIdentityType = void 0;
var ScoreboardIdentityType;
(function (ScoreboardIdentityType) {
    ScoreboardIdentityType["Player"] = "Player";
    ScoreboardIdentityType["Entity"] = "Entity";
    ScoreboardIdentityType["FakePlayer"] = "FakePlayer";
})(ScoreboardIdentityType = exports.ScoreboardIdentityType || (exports.ScoreboardIdentityType = {}));
function toIdentityType(internalType) {
    switch (internalType) {
        case 1: return ScoreboardIdentityType.Player;
        case 2: return ScoreboardIdentityType.Entity;
        case 3: return ScoreboardIdentityType.FakePlayer;
        default: throw new TypeError(`unknown identity type: ${internalType}`);
    }
}
class ScoreboardObjective {
    constructor(scoreboard, data) {
        this.scoreboard = scoreboard;
        this.data = data;
    }
    get id() {
        return this.data.Name.value;
    }
    get displayName() {
        return this.data.DisplayName.value;
    }
    getScores() {
        return this.data.Scores.value.value_List.map(data => new ScoreboardScoreInfo(this.scoreboard, data));
    }
    getScore(participant) {
        if (participant instanceof ScoreboardIdentity) {
            return this.getScores().find(info => info.participant.id === participant.id).score;
        }
        else if (typeof participant === 'string') {
            return this.getScores().find(info => info.participant.type === ScoreboardIdentityType.FakePlayer && info.participant.displayName === participant).score;
        }
        throw TypeError('unexpected type');
    }
    toJSON() {
        return { id: this.id, displayName: this.displayName };
    }
}
exports.ScoreboardObjective = ScoreboardObjective;
class ScoreboardIdentity {
    constructor(scoreboard, data) {
        this.scoreboard = scoreboard;
        this.data = data;
    }
    get displayName() {
        switch (this.type) {
            case ScoreboardIdentityType.Player: return this.data.PlayerId.value;
            case ScoreboardIdentityType.Entity: return this.data.EntityID.value;
            case ScoreboardIdentityType.FakePlayer: return this.data.FakePlayerName.value;
            default: throw new TypeError(`unhandled type value: ${this.type}`);
        }
    }
    get id() {
        return this.data.ScoreboardId.value;
    }
    get type() {
        return toIdentityType(this.data.IdentityType.value);
    }
    toJSON() {
        return { id: this.id, displayName: this.displayName, type: this.type };
    }
}
exports.ScoreboardIdentity = ScoreboardIdentity;
class ScoreboardScoreInfo {
    constructor(scoreboard, data) {
        this.scoreboard = scoreboard;
        this.data = data;
    }
    get score() {
        return this.data.Score.value;
    }
    get participant() {
        return this.scoreboard.getParticipants().find(identity => identity.id === this.data.ScoreboardId.value);
    }
    toJSON() {
        return { score: this.score, participant: this.participant };
    }
}
exports.ScoreboardScoreInfo = ScoreboardScoreInfo;
class Scoreboard {
    constructor(data) {
        this.data = data[0].value;
    }
    getObjectives() {
        return this.data.Objectives.value.value_List.map(data => new ScoreboardObjective(this, data));
    }
    getObjective(objectiveId) {
        return this.getObjectives().find(objective => objective.id === objectiveId);
    }
    getParticipants() {
        return this.data.Entries.value.value_List.map(data => new ScoreboardIdentity(this, data));
    }
}
exports.Scoreboard = Scoreboard;
