const {Vec3} = require("vec3");
const {fromNotchianYaw, fromNotchianPitch} = require("./conversions");

module.exports = (client) => {
    const startGameData = client.startGameData;

    client.entity = {
        position: new Vec3(startGameData.player_position.x, startGameData.player_position.y, startGameData.player_position.z),
        velocity: new Vec3(0, 0, 0),
        onGround: false,
        isInWater: false,
        isInLava: false,
        isInWeb: false,
        isCollidedHorizontally: false,
        isCollidedVertically: false,
        pitch: fromNotchianPitch(startGameData.rotation.x), // Added
        yaw: fromNotchianYaw(startGameData.rotation.z),
        effects: []
    };
    client.inventory = { slots: [] };
    client.jumpTicks = 0;
    client.jumpQueued = false;
};