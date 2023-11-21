// gametest-utility-library https://github.com/Lapis256/gametest-utility-library/blob/main/src/debug/toJson.js

function isClass(obj) {
    return obj.toString().startsWith("class ");
}

function isGenerator(obj) {
    return obj[Symbol.iterator] &&
           obj[Symbol.iterator].name === "[Symbol.iterator]" &&
           typeof obj.next === "function";
}

function toJson(data, indent = 2, ignoreFunction = false) {
    return JSON.stringify(data, (key, value) => {
        switch (typeof value) {
            case "function":
                if (ignoreFunction) break;
                if (isClass(value)) {
                    return `[class ${value.name || key}]§r`;
                }
                return `[function ${value.name || key}]§r`;
            
            case "object": {
                if (isGenerator(value)) {
                    return `[generator ${key || "Generator"}]`;
                }
                if (Array.isArray(value)) {
                    return value;
                }
                let obj = {};
                for (const i in value) {
                    obj[i] = value[i];
                }
                return obj;
            }
            case "undefined":
                return null;
            
            case "string":
                return value;
            
            default:
                return value;
        }
    }, indent)
}

module.exports = toJson;
