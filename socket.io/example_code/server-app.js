

var app = require('http').createServer(handler)
  , io = require('./lib/socket.io').listen(app)
  , fs = require('fs')

app.listen(80);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
	  console.log('Error loading index.html');
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  
  	//var interval = setInterval(function() {
		socket.send('hello world');
		//socket.send('hello world');
	//},5000);
  //console.log('hello world');
  socket.on('my other event', function (data) {
    console.log(data);
  });
});