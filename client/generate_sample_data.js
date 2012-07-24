var fs = require('fs');
var os = require('os');

fs.open("./test_data_generated.json", "w", 0666, function(err, fd){
    var data = [];

    for (var i = 0; i < 10; i++){
        data[i] = [];
        for (var p = 0; p < 50; p++){
            data[i].push({ "name" : "test_" + i, "value": Math.floor(Math.random() * 200)});
        }
    }

    var json_data = JSON.stringify(data, null, 4);
    console.log(json_data);
    fs.write(fd, json_data, 0, json_data.length);

});
