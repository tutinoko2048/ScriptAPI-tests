const { Scoreboard } = require("./src/Scoreboard");
const data = require("./scoreboard.json");

const toJson = require("./src/toJson");

const scoreboard = new Scoreboard(data);
const objective = scoreboard.getObjective('jaylydb:gotRequests');
console.log(toJson(objective.getScores()))