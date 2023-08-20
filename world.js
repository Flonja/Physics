const {Vec3} = require("vec3");

module.exports = (client) => {
    const Block = require("prismarine-block")(client.registry);
    const ChunkColumn = require("prismarine-chunk")(client.registry);

    return ((bedrockClient) => {
        const columns = {};
        bedrockClient.on("level_chunk", async (packet) => {
            const column = new ChunkColumn({x: packet.x, z: packet.z});
            const payload = Buffer.from(packet.payload);
            await column.networkDecodeNoCache(payload, packet.sub_chunk_count);
            columns[`${packet.x}:${packet.z}`] = column;
        });
        bedrockClient.on("update_block", async (packet) => {
            const column = columns[`${packet.position.x >> 4}:${packet.position.z >> 4}`];
            if(!column) return;

            column.setBlockStateId({x: packet.position.x & 0xf, y: packet.position.y + 64, z: packet.position.z & 0xf, l: packet.layer},
                packet.block_runtime_id);
        });
        bedrockClient.on("subchunk", async (packet) => {
            const getOrSetSubChunk = (offset) => {
                const X = packet.origin.x + offset.x;
                const Y = (packet.origin.y + offset.y) >> 4;
                const Z = packet.origin.z + offset.z;

                let column = columns[`${X}:${Z}`];
                if(!column) {
                    column = new ChunkColumn({x: X, z: Z});
                    columns[`${X}:${Z}`] = column;
                }

                let sec = column.sections[column.co + Y];
                if (!sec) {
                    sec = new column.Section(column.registry, column.Block, { y: Y, subChunkVersion: column.subChunkVersion });
                    column.sections[column.co + Y] = sec;
                }
                return sec;
            }

            for (const subChunkEntry of packet.entries) {
                if(subChunkEntry.result !== "success") continue;

                const subChunk = getOrSetSubChunk({ x: subChunkEntry.dx, y: subChunkEntry.dy, z: subChunkEntry.dz });
                const payload = Buffer.from(subChunkEntry.payload);
                subChunk.decode(2, payload); // StorageType.Runtime === 2
            }
        });
        return {
            getBlock: (pos) => {
                pos = Object.assign({}, pos); // Cloned
                const column = columns[`${pos.x >> 4}:${pos.z >> 4}`];
                if (!column) {
                    return Block.fromStateId(client.registry.blocksByName.air.defaultState, 0);
                }

                // + 64, cuz prismarine-chunk adds 4 subchunks of padding too?
                const b = column.getBlock({x: pos.x & 0xf, y: pos.y + 64, z: pos.z & 0xf});
                b.position = new Vec3(pos.x, pos.y, pos.z);
                return b;
            }
        };
    })(client);
};
