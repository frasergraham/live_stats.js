
var fs = require('fs')
var data = require("./source.json");
var WebSocketServer = require('ws').Server

wss = new WebSocketServer({port: 8080});

watch = fs.watchFile("./source.json", function(event){
	fs.readFile("./source.json", function(err, file_contents){
		if(err) throw err;
		data = JSON.parse(file_contents);
		console.log(data)
	});
});

console.log(data);

wss.on('connection', function(ws) {

	var interval = setInterval(function(){
		var tmp_rand = {};

		for (set in data){
			var random_set = data[set].map(function(e){ 
				return {name : e, 
						value: Math.floor(Math.random() * 100)
						}
					});

			tmp_rand[set] = random_set;
		}
		
		console.log(tmp_rand);
		ws.send(JSON.stringify(tmp_rand));
	}, 500);

    ws.on('message', function(message) {
        console.log('received: %s', message);
    });

	ws.on('close', function(){
        console.log('Closed Socket');
		// stop sending
		clearInterval(interval);
	});

});