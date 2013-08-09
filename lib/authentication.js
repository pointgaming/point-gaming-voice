var db = require("mongojs").connect("dev.pointgaming.com/pointgaming", ["auth_tokens"]);

exports.getTokenForUserId = function (userId) {
    db.auth_tokens.find({ desktop: true }, function (err, auth_tokens) {
        if (err || !auth_tokens) {
            console.log("No auth tokens found.");
            return null;
        }

        return auth_tokens[0]._id.replace(/-/g, "");
    });
};
