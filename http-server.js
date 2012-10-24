
var http = require("http");
var url = require("url")
    , fs = require("fs")
    , app = require("express")();

function start(route, handle, port) {
    function onRequest(request, response) {
        var path_name = url.parse(request.url).pathname;
//        console.log("\nRequest for " + path_name + " received.");

        route(handle, path_name, response, request);

    }

    var server = http.createServer(onRequest).listen(port);
    console.log("\nHttp Server has started!!\n");

    return server;
}

exports.start = start;