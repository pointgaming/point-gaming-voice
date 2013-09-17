var redis = require("redis"),
    client = redis.createClient(6379, "dev.pointgaming.com"),
    server = require("./server").server,
    auth = require("./authentication"),
    crypto = require("crypto"),
    crypt = require("./crypt"),
    rooms = {},
    tokens = {},
    
    ifRoomContainsUser = function (roomId, userId, fn) {
        var roomName = "Chat.Members.GameRoom_" + roomId;
        client.zscore(roomName, userId, function (err, score) {
            if (score !== null) {
                fn();
            }
        });
    };

exports.join = function (roomId, userId, address, port) {
    var i = 0,
        found = false,
        userInfo = {
            userId: userId,
            address: address,
            port: port
        };

    if (!rooms[roomId]) {
        rooms[roomId] = [];
    }

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

    server.send(new Buffer([0x00]), 0, 0, port, address);
    tokens[userId] = null;

    console.log("User " + userId + " joined room " + roomId);
};

exports.leave = function (roomId, userId, address, port) {
    var i = 0,
        s;

    if (!rooms[roomId]) {
        rooms[roomId] = [];
    }

    for (; i < rooms[roomId].length;) {
        s = rooms[roomId][i];

        if (s.userId === userId && s.address === address && s.port === port) {
            rooms[roomId].splice(i, 1);
        } else {
            i++;
        }
    }

    tokens[userId] = null;

    console.log("User " + userId + " left room " + roomId);
};

// { iv, aes { nonce, mtype, roomname, audio } }

exports.send = function (roomId, userId, audio) {
    ifRoomContainsUser(roomId, userId, function () {
        var i = 0,
            s,
        
            formPacketAndSend = function (user) {
                var iv = crypto.randomBytes(16),
                    aes = [],
                    finalPacket;

// Push nonce, MType 0x03, room name, and the audio.

                aes.push(crypto.randomBytes(4));
                aes.push(new Buffer([0x03]));
                aes.push(new Buffer(roomId, "hex"));
                aes.push(audio);

// Encrypt Buffer array in place.

                aes = Buffer.concat(aes);
                aes = crypt.encrypt(aes, new Buffer(tokens[user.userId], "hex"), iv);

// Form final packet and send it off.

                finalPacket = Buffer.concat([iv, aes]);

                server.send(finalPacket, 0, finalPacket.length, user.port, user.address);
                console.log("Audio sent from " + userId + " to " + roomId);
            };

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
