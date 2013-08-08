var dgram = require("dgram"),
    server = dgram.createSocket("udp4"),
    _ = require("underscore"),
    auth = require("./authentication"),
    rooms = {};

exports.start = function (callback) {
    var receipt = function (msg, rinfo) {
        var offset = 1,
            type = msg[0],
            authTokenLength,
            authToken,
            roomNameLength,
            roomName,
            fromUserIdLength,
            fromUserId,
            messageNumber,
            audio,
            counter = 0,
            index = -1;

// Authentication tokens

        authTokenLength = msg.readUInt32LE(offset);
        offset += 4;

        authToken = msg.slice(offset, offset + authTokenLength);
        offset += authTokenLength;

// We first need to determine the room name and user id.

        roomNameLength = msg.readUInt32LE(offset);
        offset += 4;

        roomName = msg.slice(offset, offset + roomNameLength);
        offset += roomNameLength;

        fromUserIdLength = msg.readUInt32LE(offset);
        offset += 4;

        fromUserId = msg.slice(offset, offset + fromUserIdLength);
        offset += fromUserIdLength;

// Perform authentication.

        try {
            auth.authenticate(fromUserId, authToken);
        } catch (e) {
            console.log("Authentication failure for user id: " + fromUserId + " with token: " + authToken);
            return;
        }

// Message types 0x01 and 0x02 are JOIN and LEAVE commands, respectively.

        if (type == 0x01 || type == 0x02) {
            if (!rooms[roomName]) {
                rooms[roomName] = [];
            }

            _.each(rooms[roomName], function (user) {
                if (user.userId === fromUserId) {
                    index = counter;
                }

                counter++;
            });

            if (type == 0x01) {
                console.log("Received join from user id: " + fromUserId + " - " + roomName);

                if (index === -1) {
                    rooms[roomName].push({
                        userId: fromUserId,
                        address: rinfo.address,
                        port: rinfo.port,
                        lastJoined: new Date()
                    });
                } else {
                    rooms[roomName][index].address = rinfo.address;
                    rooms[roomName][index].port = rinfo.port;
                }

                server.send(msg, 0, msg.length, rinfo.port, rinfo.address);
            } else {
                console.log("Received leave from user id: " + fromUserId + " - " + roomName);

                if (index !== -1) {
                    rooms[roomName].splice(index, 1);
                }
            }

// Message type 0x03 is audio transmission.

        } else if (type == 0x03) {
            console.log("Sending audio transmission from user id: " + fromUserId);

            messageNumber = msg.readUInt32LE(offset);
            offset += 4;

            audio = msg.slice(offset, msg.length);

            _.each(rooms[roomName], function (user) {
                if (user.userId === fromUserId) {
                    index = counter;
                }

                counter++;
            });

// The user is actually in the room.

            if (index !== -1) {
                counter = 0;

                _.each(rooms[roomName], function (user) {
                    if (counter !== index) {
                        server.send(msg, 0, msg.length, user.port, user.address);
                    }

                    counter++;
                });
            }
        }
    };

    server.on("message", function (msg, rinfo) {
        try {
            receipt(msg, rinfo);
        } catch (e) {
            console.log("Exception caught on message receipt.");
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
