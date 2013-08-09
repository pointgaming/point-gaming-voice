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
