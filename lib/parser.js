var _ = require("underscore"),
    auth = require("./authentication"),
    crypt = require("./crypt"),
    server = require("./server").server,
    rooms = {};

exports.receipt = function (msg, rinfo) {
    var offset = 0,
        fromUserIdLength = msg[0],
        fromUserId,
        authToken,
        type = msg[0],
        nonce,
        antiDenial,
        roomNameLength,
        roomName,
        messageNumber,
        audio,
        counter = 0,
        index = -1;

// Store the user id this is coming from first.

    fromUserId = msg.slice(offset, offset + fromUserIdLength);
    offset += fromUserIdLength;

// We need to decrypt the rest of the packet. To do this, we need to get the
// key, which is the user's auth token.

    authToken = auth.getTokenForUserId(fromUserId);
    msg.write(crypt.decrypt(msg, authToken), offset);

// Packet type. This determines whether or not there's an audio transmission.
// JOIN:  0x01
// LEAVE: 0x02
// AUDIO: 0x03

    type = msg[offset];
    offset++;

// The nonce is a randomly generated integer. We do not need to do anything
// with it. We do, however, need to check our anti-DDoS.

    nonce = msg.slice(offset, offset + 4);
    offset += 4;

    antiDenial = msg.slice(offset, offset + 4);
    offset += 4;

    if (antiDenial.toString() !== (new Buffer([0x8E,0xAA,0xCF,0x12])).toString()) {
        throw new Error("Anti-DDoS check failed.");
    }

// Room name

    roomNameLength = msg[offset];
    offset++;

    roomName = msg.slice(offset, offset + roomNameLength);
    offset += roomNameLength;

// Perform authentication. This will throw an exception on failure.

    auth.authenticate(fromUserId, authToken);

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

        messageNumber = msg[offset];
        offset++;

        audio = msg.slice(offset, msg.length);

        _.each(rooms[roomName], function (user) {
            if (user.userId === fromUserId) {
                index = counter;
            }

            counter++;
        });

// Make sure the user is actually in the room. If so, send the audio
// transmission to every user in the room, excluding the sender.

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
