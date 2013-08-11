var db = require("mongojs").connect("dev.pointgaming.com/pointgaming", ["auth_tokens"]);

exports.getTokenForUserId = function (userId, fn) {
    db.auth_tokens.find({ desktop: true, user_id: userId }, function (err, auth_tokens) {
        if (err || !auth_tokens) {
            console.log("No auth tokens found.");
            fn(null);
        }

        fn(auth_tokens[0]._id);
    });
};
