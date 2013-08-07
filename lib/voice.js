var dgram = require("dgram"),
    server = dgram.createSocket("udp4"),
    rooms = {};

exports.start = function (callback) {
    server.on("message", function (msg, rinfo) {
        var offset = 1,
            type = msg[0],
            roomNameLength,
            roomName,
            fromUserIdLength,
            fromUserId;

        if (type == 0x01) {
            roomNameLength = msg.readUInt32LE(offset);
            offset += 4;

            roomName = msg.slice(offset, offset + roomNameLength);
            offset += roomNameLength;

            fromUserIdLength = msg.readUInt32BE(offset);
            offset += 4;

            fromUserId = msg.slice(offset, offset + fromUserIdLength);
            offset += fromUserIdLength;

            if (!rooms[roomName]) {
                rooms[roomName] = [];
            }

            if (_.indexOf(rooms[roomName], rooms[roomName]) === -1) {
                rooms[roomName].push(fromUserId);
            }
        }
    });

    server.on("listening", function () {
        var address = server.address();
        console.log("Server listening on: " + address.address + ":" + address.port);

        if (typeof(callback) === "function") {
            callback();
        }
    });

    server.bind(31337);
};
