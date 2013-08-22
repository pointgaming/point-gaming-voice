var dgram = require("dgram"),
    server = dgram.createSocket("udp4");

server.on("message", function (msg, rinfo) {
    try {
        require("./parser").receipt(msg, rinfo);
    } catch (e) {
        console.log("Exception caught on message receipt.", e);
    }
});

server.on("listening", function () {
    var address = server.address();
    console.log("Server listening on: " + address.address + ":" + address.port);
});

exports.server = server;
