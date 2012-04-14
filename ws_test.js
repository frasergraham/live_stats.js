
var WebSocketServer = require('ws').Server

wss = new WebSocketServer({port: 8080});

wss.on('connection', function(ws) {

	

	var interval = setInterval(function(){
	
		var tmp = [];
		for (i = 0;i < 10; i++){
			tmp.push(Math.floor(Math.random() * 100);
		}

		ws.send(JSON.stringify(tmp));
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