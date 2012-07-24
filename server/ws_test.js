
var fs = require('fs');
var os = require('os');
var data = require("./source.json");
var WebSocketServer = require('ws').Server;

wss = new WebSocketServer({port: 8080});

watch = fs.watchFile("./source.json", function(event){
	fs.readFile("./source.json", function(err, file_contents){
		if(err) throw err;
		data = JSON.parse(file_contents);
		console.log(data);
	});
});

console.log(data);

wss.on('connection', function(ws) {

	var interval = setInterval(function(){
		var tmp_rand = {};
		var random_entry = function(e){
			return {name : e,
					value: Math.floor(Math.random() * 450)
					};
				};

		for (var set in data){
			var random_set = data[set].map(random_entry);
			tmp_rand[set] = random_set;
		}

		tmp_rand["Memory"] = [];

		tmp_rand["Memory"].push({"name": "Used Mem", "value": Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)});
		tmp_rand["Memory"].push({"name": "Free Mem", "value": Math.round(os.freemem() / os.totalmem() * 100)});

		tmp_rand["Performance"] = [];
		tmp_rand["Performance"].push({"name": "Load 1", "value": Math.round(os.loadavg()[0] * 10)});
		tmp_rand["Performance"].push({"name": "Load 5", "value": Math.round(os.loadavg()[1]) * 10});
		tmp_rand["Performance"].push({"name": "Load 15", "value": Math.round(os.loadavg()[2]) * 10});


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
