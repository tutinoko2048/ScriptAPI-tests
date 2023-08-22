export declare enum ScoreboardIdentityType {
    Player = "Player",
    Entity = "Entity",
    FakePlayer = "FakePlayer"
}
export declare class ScoreboardObjective {
    private scoreboard;
    private data;
    constructor(scoreboard: Scoreboard, data: any);
    get id(): string;
    get displayName(): string;
    getScores(): ScoreboardScoreInfo[];
    getScore(participant: ScoreboardIdentity | string): number | undefined;
    toJSON(): {
        id: string;
        displayName: string;
    };
}
export declare class ScoreboardIdentity {
    private scoreboard;
    private data;
    constructor(scoreboard: Scoreboard, data: any);
    get displayName(): string;
    get id(): string;
    get type(): ScoreboardIdentityType;
    toJSON(): {
        id: string;
        displayName: string;
        type: ScoreboardIdentityType;
    };
}
export declare class ScoreboardScoreInfo {
    private scoreboard;
    private data;
    constructor(scoreboard: Scoreboard, data: any);
    get score(): number;
    get participant(): ScoreboardIdentity;
    toJSON(): {
        score: number;
        participant: ScoreboardIdentity;
    };
}
export declare class Scoreboard {
    data: any;
    constructor(data: any);
    getObjectives(): ScoreboardObjective[];
    getObjective(objectiveId: string): ScoreboardObjective | undefined;
    getParticipants(): ScoreboardIdentity[];
}
