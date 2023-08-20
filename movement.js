const {Vec3} = require("vec3");
const {fromNotchianYaw, fromNotchianPitch, toNotchianYaw, toNotchianPitch} = require("./conversions");

module.exports = (client, playerState) => {
    const startGameData = client.startGameData;
    let previousPos = new Vec3(startGameData.player_position.x, startGameData.player_position.y, startGameData.player_position.z);
    let previousIntendedMovement = {
        forward: false,
        back: false,
        left: false,
        right: false,
        jump: false,
        sprint: false,
        sneak: false
    };
    let tick = 0;

    client.on("move_player", packet => {
        if(packet.runtime_id !== parseInt(startGameData.runtime_entity_id) && packet.mode === "teleport") {
            return;
        }
        playerState.teleportTicks = 5;
        playerState.pos.set(packet.position.x, packet.position.y - 1.621, packet.position.z);
        playerState.yaw = fromNotchianYaw(packet.yaw);
        playerState.pitch = fromNotchianPitch(packet.pitch);
    });
    client.on("set_entity_motion", packet => {
        if(packet.runtime_entity_id !== startGameData.runtime_entity_id) {
            return;
        }
        playerState.vel.set(packet.velocity.x, packet.velocity.y, packet.velocity.z);
    });
    return {
        send: (intendedMovement) => {
            const position = playerState.pos.clone().offset(0, 1.621, 0);
            const yaw = toNotchianYaw(playerState.yaw);
            const pitch = toNotchianPitch(playerState.pitch);
            switch (startGameData.movement_authority) {
                case "client":
                    client.queue("move_player", {
                        runtime_id: startGameData.runtime_entity_id,
                        position: position,
                        pitch: pitch,
                        yaw: yaw,
                        head_yaw: yaw,
                        mode: "normal",
                        on_ground: playerState.onGround,
                        tick: tick
                    });
                    break;
                case "server":
                    const moveVec = { x: 0, z: 0 };
                    moveVec.x += intendedMovement.left ? 1 : 0;
                    moveVec.x -= intendedMovement.right ? 1 : 0;
                    moveVec.z += intendedMovement.forward ? 1 : 0;
                    moveVec.z -= intendedMovement.back ? 1 : 0;

                    const flags = {};
                    if(intendedMovement.forward) flags["up"] = true;
                    if(intendedMovement.back) flags["down"] = true;
                    if(intendedMovement.left) flags["left"] = true;
                    if(intendedMovement.right) flags["right"] = true;
                    if(intendedMovement.sprint) {
                        if(intendedMovement.sprint !== previousIntendedMovement.sprint) {
                            flags[`${intendedMovement.sprint ? "start" : "stop"}_sprinting`] = true;
                        }
                        flags["sprinting"] = true;
                        flags["sprint_down"] = true;
                    }
                    if(intendedMovement.sneak) {
                        if(intendedMovement.sneak !== previousIntendedMovement.sneak) {
                            flags[`${intendedMovement.sneak ? "start" : "stop"}_sneaking`] = true;
                        }
                        flags["sneaking"] = true;
                        flags["sneak_down"] = true;
                    }
                    if(intendedMovement.jump) {
                        if(playerState.jumpTicks === 10) {
                            flags["start_jumping"] = true;
                        }
                        flags["jumping"] = true;
                        flags["jump_down"] = true;
                    }

                    client.queue("player_auth_input", {
                        position: position,
                        move_vector: moveVec,
                        analogue_move_vector: moveVec,
                        pitch: pitch,
                        yaw: yaw,
                        head_yaw: yaw,
                        delta: position.clone().subtract(previousPos),
                        input_data: flags,
                        input_mode: "mouse",
                        play_mode: "normal",
                        interaction_model: "classic",
                        tick: tick
                    });
                    break;
            }
            previousIntendedMovement = intendedMovement;
            previousPos = position;
        },
        tick: () => {
            if(playerState.teleportTicks !== 0) {
                playerState.teleportTicks--;
            }
            return ++tick;
        }
    };
}