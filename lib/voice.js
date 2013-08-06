var dgram = require("dgram"),
    server = dgram.createSocket("udp4");

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

            roomName = msg.slice(offset, roomNameLength);
            offset += roomNameLength;

            fromUserIdLength = msg.readUInt32LE(offset);
            offset += 4;

            fromUserId = msg.slice(offset, fromUserIdLength);
            offset += fromUserIdLength;

            console.log(fromUserId + " joined room " + roomName);
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
