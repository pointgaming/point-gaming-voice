var crypto = require("crypto");

exports.encrypt = function (data, key, iv) {
    var cipher = crypto.createCipheriv("AES-128-CBC", key, iv),
        crypted = Buffer.concat([cipher.update(data), cipher.final()]);

    return new Buffer(crypted);
};

exports.decrypt = function (data, key, iv) {
    var decipher = crypto.createDecipheriv("AES-128-CBC", key, iv),
        decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

    return new Buffer(decrypted);
};

exports.binaryToUserId = function (bin) {
    var i = 0,
        result = "";

    for (; i < 4; ++i) {
        result += ("00" + bin[i].toString(16)).substr(-2);
    }

    result += "-";

    for (i = 4; i < 6; ++i) {
        result += ("00" + bin[i].toString(16)).substr(-2);
    }

    result += "-";

    for (i = 6; i < 8; ++i) {
        result += ("00" + bin[i].toString(16)).substr(-2);
    }

    result += "-";

    for (i = 8; i < 10; ++i) {
        result += ("00" + bin[i].toString(16)).substr(-2);
    }

    result += "-";

    for (i = 10; i < bin.length; ++i) {
        result += ("00" + bin[i].toString(16)).substr(-2);
    }

    return result;
};

exports.hexToBuffer = function (str) {
    var i = 0;

    str = str.replace(/[^\dabcdef]/g, "");

    return new Buffer(str, "hex");
};
