var crypto = require("crypto");

exports.encrypt = function (data, iv, key) {
    var cipher = crypto.createCipheriv("AES-128-CBC", key, iv),
        crypted = cipher.update(data);

    crypted += cipher.final();

    return crypted;
};

exports.decrypt = function (data, iv, key) {
    var decipher = crypto.createDecipheriv("AES-128-CBC", key, iv),
        decrypted = decipher.update(data);

    decrypted += decipher.final();

    return decrypted;
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
    var i = 0,
        bytes = [];

    for (; i < str.length; i += 2) {
        bytes.push(parseInt(str.substring(i, i + 2), 16));
    }

    return new Buffer(bytes);
};
