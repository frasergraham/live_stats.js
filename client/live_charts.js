//     ___                    __               __
//    / (_)   _____     _____/ /_  ____ ______/ /______
//   / / / | / / _ \   / ___/ __ \/ __ `/ ___/ __/ ___/
//  / / /| |/ /  __/  / /__/ / / / /_/ / /  / /_(__  )
// /_/_/ |___/\___/   \___/_/ /_/\__,_/_/   \__/____/
//
//
// Module using d3.js to generate live updating charts over a websocket connection
// Copyright 2012 Fraser Graham
// This module requires d3.js (www.d3js.org)

var live_charts = function(my) {

    // Store which data sources refresh which graphs
    my.source_mappings = {};

    // default sizes
    var _settings = my._settings = my._settings || {};

    _settings.default_transition_delay = 500;
    _settings.default_width = 400;
    _settings.default_height = 400;

    var default_chart_factory = null;
    var default_selector = 'body';

    // Functions to set or retrieve the defaults for all charts
    my.default_width = function(width){
        if (!arguments.length) return _settings.default_width;
        _settings.default_width = width;
        return my;
    };

    my.default_height = function(height){
        if (!arguments.length) return _settings.default_height;
        _settings.default_height = height;
        return my;
    };

    my.default_transition_delay = function(delay){
        if (!arguments.length) return _settings.default_transition_delay;
        _settings.default_transition_delay = delay;
        return my;
    };

    my.default_chart_factory = function(chart_factory){
        default_chart_factory = chart_factory;
        return my;
    };

    my.default_selector =  function(selector){
        default_selector = selector;
        return my;
    };

    // base object to construct all our data source objects from
    my.Connection = function(server){
        this.server = server;
    };

    // Data Source management, connect to a WebSocket Server and
    my.connect_to_data_source = function(websocket_server, callback){
        var my_connection = new my.Connection(websocket_server);
        my_connection.data_groups = [];

        my.source_mappings[websocket_server] = {};

        var establish_connection = function establish_connection(){

            my_connection.connection = new WebSocket(websocket_server, null);

            my_connection.onerror = function (error) {
              console.log('WebSocket Error ' + error);
            };

            my_connection.connection.onopen = function(){
                console.log("Connected to " + websocket_server);
            };

            my_connection.connection.onclose = function(){
                console.log("Lost Connection: " + websocket_server);
                setTimeout(function(){
                    establish_connection();
                }, 5000);
            };

            my_connection.connection.onmessage = function (e) {
                new_data = JSON.parse(e.data);

                var num_groups = my_connection.data_groups.length;

                for (var group in new_data){
                    var exists = false;

                    for (var existing_group in my_connection.data_groups){
                        if (my_connection.data_groups[existing_group] == group){
                            exists = true;
                        }
                    }

                    if (!exists){
                        my_connection.data_groups.push(group);
                    }
                }

                // Callback happens when new groups are added
                if (my_connection.data_groups.length != num_groups && callback){
                    callback(my_connection.data_groups);
                }

                for (var set in new_data){
                    if (typeof my.source_mappings[websocket_server][set] !== 'undefined'){
                        for (var draw_func in my.source_mappings[websocket_server][set]){
                            my.source_mappings[websocket_server][set][draw_func](new_data[set]);
                        }
                    }
                    else{
                        // This data is unhandled, if we have specified a chart factory use it to
                        // make a chart for this data now.
                        if (default_chart_factory !== null){
                            default_chart_factory(my_connection, default_selector || "body", set);
                        }
                    }
                }
            };

        }();

        my_connection.data_sets = function(){
            return my_connection.data_groups;
        };

        return my_connection;
    };

    my.register_data_source = function(websocket_server, source_set, draw_callback){

        if (typeof my.source_mappings[websocket_server] === 'undefined'){
            throw websocket_server + " is not connected, call connect_to_data_source() first";
        }

        if (typeof my.source_mappings[websocket_server][source_set] === 'undefined'){
            my.source_mappings[websocket_server][source_set] = [];
        }
        my.source_mappings[websocket_server][source_set].push(draw_callback);
    };

    return my;

}(live_charts || {});






