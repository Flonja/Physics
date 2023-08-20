const version = "1.20.10";

const bedrock = require("bedrock-protocol");
const { Physics, PlayerState } = require("prismarine-physics");
const mcData = require("./minecraft-data/mc_data")(`bedrock_${version}`);

const client = bedrock.createClient({
    host: "localhost",
    port: 19132,
    username: "Notch",
    offline: true,
    version: version
});
client.registry = mcData;
client.version = `bedrock_${version}`;

const world = require("./world")(client);
const physics = Physics(mcData, world);
const controls = {
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    sneak: false
};

client.on("spawn", () => {
    require("./player")(client);
    const playerState = new PlayerState(client, controls);
    playerState.teleportTicks = 5;
    const movement = require("./movement")(client, playerState);

    let ref;
    ref = setInterval(() => {
        if(ref === undefined) return;
        movement.tick();

        if(playerState.teleportTicks === 0) {
            movement.send(controls);
            physics.simulatePlayer(playerState, world).apply(client);
        }
    }, 50); // 1 tick
});
