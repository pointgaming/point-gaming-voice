var redis = require("redis"),
    client = redis.createClient(6379, "dev.pointgaming.com"),
    server = require("./server").server,
    rooms = {},
    
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

    server.send(new Buffer([]), 0, 0, port, address);

    console.log("User " + userId + " joined room " + roomId);
};

exports.leave = function (roomId, userId, address, port) {
    var i = 0,
        s;

    for (; i < rooms[roomId].length;) {
        s = rooms[roomId][i];

        if (s.userId === userId && s.address === address && s.port === port) {
            rooms[roomId].splice(i, 1);
        } else {
            i++;
        }
    }

    console.log("User " + userId + " left room " + roomId);
};

exports.send = function (roomId, userId, audio) {
    ifRoomContainsUser(roomId, userId, function () {
        console.log("Audio sent from " + userId + " to " + roomId);
    });
};
