var crypto = require("crypto");

exports.encrypt = function (data, key) {
    var cipher = crypto.createCipher("AES-128-CBC", key),
        crypted = cipher.update(data);

    crypted += cipher.final();

    return crypted;
};

exports.decrypt = function (data, key) {
    var decipher = crypto.createDecipher("AES-128-CBC", key),
        decrypted = decipher.update(data);

    decrypted += decipher.final();

    return decrypted;
};
