var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable");

var dir_name = './html_vuong';
function index(response){
  fs.readFile( dir_name + "/index.html", function(error, file) {
    if(error) {
      response.writeHead(500, {"Content-Type": "text/plain"});
      response.write(error + "\n");
      response.end();
    } else {
      response.writeHead(200, {'Content-Type': 'text/html','Content-Length':file.length});
      response.write(file);
      response.end();
    }
  });
}
var loaded_files = {};
function loadData(response, request, param){
//    var jsFile = pathname.split('/')[1];
    var file_name = dir_name + param;
    if(loaded_files[file_name]){
        console.log('Get file %s from cache', file_name);
        response.write(loaded_files[file_name]);
        response.end();
        console.log('Get cached OK!!');
    }else{
        fs.readFile( dir_name + param, function(error, file) {
             if(!error){
                response.write(file);
                 loaded_files[file_name] = file;
             }else{
                 console.log('can not load %s',file_name);
             }
            response.end();
            console.log('load file %s OK!!!',file_name);
        });
    }
}

function start(response) {
  console.log("Request handler 'start' was called.");

  var body = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" '+
    'content="text/html; charset=UTF-8" />'+
    '</head>'+
    '<body>'+
    '<form action="/upload" enctype="multipart/form-data" '+
    'method="post">'+
    '<input type="file" name="upload" multiple="multiple">'+
    '<input type="submit" value="Upload file" />'+
    '</form>'+
    '</body>'+
    '</html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

function upload(response, request) {
  console.log("Request handler 'upload' was called.");

  var form = new formidable.IncomingForm();
  console.log("about to parse");
  form.parse(request, function(error, fields, files) {
    console.log("parsing done");

    /* Possible error on Windows systems:
       tried to rename to an already existing file */
    fs.rename(files.upload.path, "/tmp/test.png", function(err) {
      if (err) {
        fs.unlink("/tmp/test.png");
        fs.rename(files.upload.path, "/tmp/test.png");
      }
    });
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write("received image:<br/>");
    response.write("<img src='/show' />");
    response.end();
  });
}

function show(response) {
  console.log("Request handler 'show' was called.");
  fs.readFile("/tmp/test.png", "binary", function(error, file) {
    if(error) {
      response.writeHead(500, {"Content-Type": "text/plain"});
      response.write(error + "\n");
      response.end();
    } else {
      response.writeHead(200, {"Content-Type": "image/png"});
      response.write(file, "binary");
      response.end();
    }
  });
}

exports.start = start;
exports.upload = upload;
exports.show = show;
exports.index = index;
exports.loadData = loadData;