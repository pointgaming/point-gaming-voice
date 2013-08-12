var _ = require("underscore"),
    auth = require("./authentication"),
    crypt = require("./crypt"),
    server = require("./server").server,
    rooms = {};

exports.receipt = function (msg, rinfo) {
    var offset = 0,
        fromUserId,
        iv,
        decrypted,
        type,
        nonce,
        antiDenial,
        roomNameLength,
        roomName,
        messageNumber,
        audio,
        counter = 0,
        index = -1;

// Store the user id the packet is coming from.

    fromUserId = crypt.binaryToUserId(msg.slice(offset, offset + 16));
    offset += 16;

// The iv will be random, so we need to pass that to our crypt functions.

    iv = msg.slice(offset, offset + 16);
    offset += 16;

// We need to decrypt the rest of the packet. To do this, we need to get the
// key, which is the user's auth token.

    auth.getTokenForUserId(fromUserId, function (authToken) {
        if (authToken === null) {
            throw new Error("Missing or invalid auth token.");
        }

        authToken = crypt.hexToBuffer(authToken);
        decrypted = crypt.decrypt(msg, iv, authToken);
        offset = 0;

// The nonce is a randomly generated integer. We do not need to do anything
// with it. We do, however, need to check our anti-DDoS.

        nonce = decrypted.slice(offset, offset + 4);
        offset += 4;

        antiDenial = decrypted.slice(offset, offset + 4);
        offset += 4;

        if (antiDenial.toString() !== (new Buffer([0x8E,0xAA,0xCF,0x12])).toString()) {
            throw new Error("Anti-DDoS check failed.");
        }

// Packet type. This determines whether or not there's an audio transmission.
// JOIN:  0x01
// LEAVE: 0x02
// AUDIO: 0x03

        type = decrypted[offset];
        offset++;

// Room name

        roomNameLength = decrypted[offset];
        offset++;

        roomName = decrypted.slice(offset, offset + roomNameLength);
        offset += roomNameLength;

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

            messageNumber = decrypted[offset];
            offset++;

            audio = decrypted.slice(offset, decrypted.length);

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
                        // TODO: Send audio to user.
                    }

                    counter++;
                });
            }
        }
    });
};
