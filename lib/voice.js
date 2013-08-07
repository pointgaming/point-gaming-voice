var dgram = require("dgram"),
    server = dgram.createSocket("udp4"),
    _ = require("underscore"),
    rooms = {};

exports.start = function (callback) {
    server.on("message", function (msg, rinfo) {
        var offset = 1,
            type = msg[0],
            roomNameLength,
            roomName,
            fromUserIdLength,
            fromUserId,
            messageNumber,
            audio,
            counter = 0,
            index = -1;

// We first need to determine the room name and user id.

        roomNameLength = msg.readUInt32LE(offset);
        offset += 4;

        roomName = msg.slice(offset, offset + roomNameLength);
        offset += roomNameLength;

        fromUserIdLength = msg.readUInt32LE(offset);
        offset += 4;

        fromUserId = msg.slice(offset, offset + fromUserIdLength);
        offset += fromUserIdLength;

// Message types 0x01 and 0x02 are JOIN and LEAVE commands, respectively.

        if (type == 0x01 || type == 0x02) {
            if (!rooms[roomName]) {
                rooms[roomName] = [];
            }

            _.each(rooms, function (room) {
                if (room.userId === fromUserId) {
                    index = counter;
                }

                counter++;
            });

            if (type == 0x01) {
                if (index === -1) {
                    rooms[roomName].push({
                        userId: fromUserId,
                        lastJoined: new Date()
                    });
                }
            } else {
                if (index !== -1) {
                    rooms[roomName].splice(index, 1);
                }
            }

// Message type 0x03 is audio transmission.

        } else if (type == 0x03) {
            messageNumber = msg.readUInt32LE(offset);
            offset += 4;

            audio = msg.slice(offset, msg.length);
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
