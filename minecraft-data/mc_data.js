const path = require('path');

const defaultAttributes = [
    {
        "name": "maxHealth",
        "resource": "generic.max_health",
        "default": 20,
        "min": 1,
        "max": 1024
    },
    {
        "name": "followRange",
        "resource": "generic.follow_range",
        "default": 32,
        "min": 0,
        "max": 2048
    },
    {
        "name": "knockbackResistance",
        "resource": "generic.knockback_resistance",
        "default": 0,
        "min": 0,
        "max": 1
    },
    {
        "name": "movementSpeed",
        "resource": "generic.movement_speed",
        "default": 0.7,
        "min": 0,
        "max": 1024
    },
    {
        "name": "attackDamage",
        "resource": "generic.attack_damage",
        "default": 2,
        "min": 0,
        "max": 2048
    },
    {
        "name": "horseJumpStrength",
        "resource": "horse.jump_strength",
        "default": 0.7,
        "min": 0,
        "max": 2
    },
    {
        "name": "zombieSpawnReinforcements",
        "resource": "zombie.spawn_reinforcements",
        "default": 0,
        "min": 0,
        "max": 1
    },
    {
        "name": "attackSpeed",
        "resource": "generic.attack_speed",
        "default": 4,
        "min": 0,
        "max": 1024
    },
    {
        "name": "flyingSpeed",
        "resource": "generic.flying_speed",
        "default": 0.4,
        "min": 0,
        "max": 1024
    },
    {
        "name": "attackKnockback",
        "resource": "generic.attack_knockback",
        "default": 0,
        "min": 0,
        "max": 5
    },
    {
        "name": "armorHealth",
        "resource": "generic.armor",
        "default": 0,
        "min": 0,
        "max": 30
    },
    {
        "name": "armorToughness",
        "resource": "generic.armor_toughness",
        "default": 0,
        "min": 0,
        "max": 20
    },
    {
        "name": "luck",
        "resource": "generic.luck",
        "default": 0,
        "min": -1024,
        "max": 1024
    }
];
const sortArrayByKey = (arr, key) => {
    if(key === undefined || key === null || Object.values(arr)[0][key] === undefined) {
        return arr;
    }
    let newArr = {};
    for (const value of Object.values(arr)) {
        let newKey = undefined;
        switch (typeof key) {
            case "function":
                newKey = key(value)
                if(!["string", "bigint", "number", "boolean"].includes(typeof newKey))
                    throw Error(JSON.stringify(newKey));
                if(typeof newKey === "object") {
                    let length = Object.values(newArr).length;
                    for (const value1 of Object.values(newKey)) {
                        newArr[length++] = value1;
                    }
                    continue;
                }
                break;
            case "string":
                newKey = key;
                break;
            default:
                return arr;
        }

        newArr[value[newKey]] = value;
    }
    return newArr;
}

const overwritingFields = {
    "blocks.json": {
        "method": "map",
        "fields": {
            "blocks": "id",
            "blocksByName": "name",
            "blocksArray": null
        }
    },
    "biomes.json": {
        "method": "map",
        "fields": {
            "biomes": "id",
            "biomesByName": "name",
            "biomesArray": null
        }
    },
    "items.json": {
        "method": "map",
        "fields": {
            "items": "id",
            "itemsByName": "name",
            "itemsArray": null
        }
    },
    "entities.json": {
        "method": "map",
        "fields": {
            "entities": "id",
            "entitiesByName": "name",
            "entitiesArray": null
        }
    },
    "blockCollisionShapes.json": {
        "method": "overwrite",
        "field": "blockCollisionShapes"
    },
    "recipes.json": {
        "method": "overwrite",
        "field": "recipes"
    },
    "blockStates.json": {
        "method": "overwrite",
        "field": "blockStates"
    }
};
module.exports = (version) => {
    const mcData = require("minecraft-data")(version);
    mcData.attributesArray = sortArrayByKey(defaultAttributes);
    mcData.attributesByName = sortArrayByKey(defaultAttributes, "name");
    mcData.attributes = sortArrayByKey(defaultAttributes, "resource");
    for (const [file, options] of Object.entries(overwritingFields)) {
        const parsed = require(path.join(__dirname, version, file));
        switch (options.method) {
            case "map":
                for (const [fieldName, sortBy] of Object.entries(options.fields)) {
                    if(sortBy === null) {
                        mcData[fieldName] = Object.values(parsed);
                        continue;
                    }
                    mcData[fieldName] = sortArrayByKey(parsed, sortBy);
                }
                break;
            case "overwrite":
                mcData[options.field] = parsed;
                break;
        }
    }
    mcData.blocksByStateId = mcData.blockStates.map(value => mcData.blocksByName[value.name]);
    return mcData;
}
