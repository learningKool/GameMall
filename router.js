function route(handle, pathname, response, request) {
//     console.log("About to route a request for " + pathname);

    var str = pathname.split('/');
    console.log(str);
    if(str.length > 1){
        if (typeof handle['/' + str[1]] === 'function') {
            handle['/' + str[1]](response, request, pathname);
            return;
        }
    }else if (typeof handle[pathname] === 'function') {
        handle[pathname](response, request, param);
        return;
    }

    console.log("No request handler found for " + pathname);
    response.writeHead(404, {"Content-Type": "text/html"});
    response.write("404 Not found");
    response.end();
}

exports.route = route;