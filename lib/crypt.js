var crypto = require("crypto"),
    iv = new Buffer([
        0x65, 0x99, 0x71, 0xDE,
        0xF1, 0xB9, 0xFA, 0x22,
        0x18, 0x56, 0x61, 0x2F,
        0x83, 0x71, 0x4E, 0xAD
    ]);

exports.encrypt = function (data, key) {
    var cipher = crypto.createCipheriv("AES-128-CBC", key, iv),
        crypted = cipher.update(data);

    crypted += cipher.final();

    return crypted;
};

exports.decrypt = function (data, key) {
    var decipher = crypto.createDecipheriv("AES-128-CBC", key, iv),
        decrypted = decipher.update(data);

    decrypted += decipher.final();

    return decrypted;
};

exports.binaryToUserId = function (bin) {
    var i = 0,
        result = "";

    for (; i < 4; ++i) {
        result += bin[i].toString(16);
    }

    result += "-";

    for (i = 4; i < 6; ++i) {
        result += bin[i].toString(16);
    }

    result += "-";

    for (i = 6; i < 8; ++i) {
        result += bin[i].toString(16);
    }

    result += "-";

    for (i = 8; i < 10; ++i) {
        result += bin[i].toString(16);
    }

    result += "-";

    for (i = 10; i < bin.length; ++i) {
        result += bin[i].toString(16);
    }

    return result;
};

exports.hexToBuffer = function (str) {
    var i = 0,
        bytes = [];

    for (; i < str.length; i += 2) {
        bytes.push(parseInt(str.substring(i, i + 2), 16));
    }

    return new Buffer(bytes);
};
