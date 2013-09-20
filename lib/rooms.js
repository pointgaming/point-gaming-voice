var redis = require("redis"),
    client = redis.createClient(6379, "dev.pointgaming.com"),
    server = require("./server").server,
    auth = require("./authentication"),
    crypto = require("crypto"),
    crypt = require("./crypt"),
    rooms = {},
    tokens = {},

    checkRoom = function (roomId) {
        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }
    },
    
    ifRoomContainsUser = function (roomId, userId, fn) {
        var roomName = "Chat.Members.GameRoom_" + roomId;
        client.zscore(roomName, userId, function (err, score) {
            if (score !== null) {
                fn();
            }
        });
    },
    
    makeEncryptedPacket = function (bufferList, key) {
        var iv = crypto.randomBytes(16),
            aes,
            finalPacket;

// Push nonce, anti-DDoS, and bufferList.

        bufferList = Buffer.concat([
            crypto.randomBytes(4),
            new Buffer([0x8E,0xAA,0xCF,0x12])
        ].concat(bufferList));

// Encrypt Buffer array.

        aes = crypt.encrypt(bufferList, key, iv);

// Return final packet.

        return Buffer.concat([iv, aes]);
    };

exports.join = function (roomId, userId, address, port) {
    var i = 0,
        found = false,
        userInfo = {
            userId: userId,
            address: address,
            port: port
        };

    checkRoom(roomId);

    for (; i < rooms[roomId].length; ++i) {
        if (rooms[roomId][i].userId === userId) {
            rooms[roomId][i].address = address;
            rooms[roomId][i].port = port;
            found = true;
            break;
        }
    }

    if (found !== true) {
        rooms[roomId].push(userInfo);
    }

    auth.getTokenForUserId(userId, function (tokenId) {
        var packet;

        tokens[userId] = tokenId;
        packet = makeEncryptedPacket([
            new Buffer([0x03]),
            new Buffer(roomId, "hex"),
            new Buffer([0x01])
        ], crypt.hexToBuffer(tokenId));
        server.send(packet, 0, 0, port, address);

        console.log("User " + userId + " joined room " + roomId);
    });
};

exports.leave = function (roomId, userId, address, port) {
    var i = 0,
        s;

    checkRoom(roomId);

    for (; i < rooms[roomId].length;) {
        s = rooms[roomId][i];

        if (s.userId === userId && s.address === address && s.port === port) {
            rooms[roomId].splice(i, 1);
        } else {
            i++;
        }
    }

    auth.getTokenForUserId(userId, function (tokenId) {
        var packet;

        tokens[userId] = tokenId;
        packet = makeEncryptedPacket([
            new Buffer([0x03]),
            new Buffer(roomId, "hex"),
            new Buffer([0x01])
        ], crypt.hexToBuffer(tokenId));
        server.send(packet, 0, 0, port, address);

        console.log("User " + userId + " left room " + roomId);
    });
};

// Format: { iv, aes { nonce, anti-dos, mtype, room name, user id, audio } }

exports.send = function (roomId, userId, isTeamOnly, audio) {
    ifRoomContainsUser(roomId, userId, function () {
        var i = 0,
            s,
        
            formPacketAndSend = function (user) {
                var iv = crypto.randomBytes(16),
                    aes = [],
                    key,
                    finalPacket;

                finalPacket = makeEncryptedPacket([
                    new Buffer([0x03]),
                    new Buffer(roomId, "hex"),
                    new Buffer(userId.replace(/[^0-9a-f]/g, ""), "hex"),
                    new Buffer([ isTeamOnly ? 0x01 : 0x00 ]),
                    audio
                ], key);

                server.send(finalPacket, 0, finalPacket.length, user.port, user.address);
                console.log("Audio sent from " + userId + " to " + user.address + ":" + user.port + ", " + roomId);
            };

        checkRoom(roomId);

        for (; i < rooms[roomId].length; i++) {
            s = rooms[roomId][i];

            if (tokens[s.userId]) {
                formPacketAndSend(s);
            } else {
                auth.getTokenForUserId(s.userId, function (tokenId) {
                    tokens[s.userId] = tokenId;
                    formPacketAndSend(s);
                });
            }
        }
    });
};
