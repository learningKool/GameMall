

 
var socket = require('./lib/socket.io').listen(8880);
socket.sockets.on('connection',function(client){
		console.log('someone connect to me!');
        client.on('message', function(msg){
            console.log('Received expression from client ',msg);
            // catch error for bad expression          
            try{
                client.send(eval(msg));
            }catch(err){
                client.emit("error",err.message);
            }
        });               
        client.on('disconnect', function(){
            console.log('Disconnected');
        });
});
