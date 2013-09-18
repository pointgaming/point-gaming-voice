var auth = require("./authentication"),
    crypt = require("./crypt"),
    rooms = require("./rooms");

exports.receipt = function (msg, userInfo) {
    var offset = 0,
        userId,
        iv,
        decrypted,
        type,
        nonce,
        antiDenial,
        roomId,
        isTeamOnly;

// Store the user id the packet is coming from.

    userId = crypt.binaryToUserId(msg.slice(offset, offset + 16));
    offset += 16;

// The iv will be random, so we need to pass that to our crypt functions.

    iv = msg.slice(offset, offset + 16);
    offset += 16;

// We need to decrypt the rest of the packet. To do this, we need to get the
// key, which is the user's auth token.

    auth.getTokenForUserId(userId, function (authToken) {
        if (authToken === null) {
            throw new Error("Missing or invalid auth token.");
        }

        authToken = crypt.hexToBuffer(authToken);
        decrypted = crypt.decrypt(msg.slice(offset), authToken, iv);
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

// Room ID

        roomId = decrypted.slice(offset, offset + 12).toString("hex");
        offset += 12;

// Look up the user and send the audio transmission

        if (type === 0x01) {
            rooms.join(roomId, userId, userInfo.address, userInfo.port);
        } else if (type === 0x02) {
            rooms.leave(roomId, userId, userInfo.address, userInfo.port);
        } else if (type === 0x03) {
            isTeamOnly = decrypted[offset];
            offset++;

            rooms.send(roomId, userId, isTeamOnly, decrypted.slice(offset));
        }
    });
};
