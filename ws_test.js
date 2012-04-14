
var WebSocketServer = require('ws').Server

wss = new WebSocketServer({port: 8080});

wss.on('connection', function(ws) {

	var interval = setInterval(function(){
		ws.send('' + Math.floor(Math.random() * 100));
	}, 1000);

    ws.on('message', function(message) {
        console.log('received: %s', message);
    });

	ws.on('close', function(){
        console.log('Closed Socket');
		// stop sending
		clearInterval(interval);
	});

});