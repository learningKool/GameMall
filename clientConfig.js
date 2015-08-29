
var fs = require("fs");
var port = 8080;//process.env['PORT'];
var http_url = "127.0.0.1";//process.env['HTTP_URL'];

function updateClientConfig(){
	var script = 'var port = "' + port + '" , http_url = "' + http_url + '";';
	console.log(script.length + ' : ' + script);
	var buf = new Buffer(script.length);
	len = buf.write(script);
	// console.log(len);
	fs.open('./html_vuong/js/config.js', 'w', function(err, fd){
		if(err){
			console.log(err);
		}else{
			fs.write(fd, buf, 0, len, 0, function(err1, written, buffer){
				if(err1){
					console.log(err1);
				}
			});
		}
	});
}

exports.updateConfig = updateClientConfig;
exports.port = port;
exports.http_url = http_url;