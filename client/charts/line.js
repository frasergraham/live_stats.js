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
//
// Line Chart Extension Module


var live_charts = (function(my) {
    var _settings = my._settings = my._settings || {};

    my.Connection.prototype.line_chart = function line_chart(){
        var width = _settings.default_width;
        var height = _settings.default_height;
        var width_changed = false;
        var height_changed = false;
        var transition_delay = _settings.default_transition_delay;
        var saved_points = 100;
        var data_source = null;
        var server = this.server;
        var stacked = true;
        var paused = false;
        var chart;
        var my_line_chart = {};
        var line;

        var my_chart = function my_chart(selector){
            var margin = 0;
            var right_margin = 100;
            var data = [];

            color = d3.scale.category20();

            chart = d3.select(selector)
                .append("svg:svg")
                .attr("class", "chart")
                .attr("id", "linechart_" + data_source)
                .attr("width", width + right_margin)
                .attr("height", height + 10)
                .append("g")        // this is a group tag
                .attr("transform", "translate(" + margin + ",5)");

            // define scales
            var x = d3.scale.linear()
                .domain([0, saved_points])
                .range([0, width - margin]);

            var y = d3.scale.linear()
                .domain([0,100])
                .range([0, height]);

            var y_bands;

            chart.append("defs")
                .append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("width", width - margin - x(2))
                .attr("height", height);

            y_bands = d3.scale.ordinal().rangeBands([0,height]);

            line = d3.svg.line()
                .x(function(d,i){ return x(i); })
                .y(function(d,i){
                    if (stacked){
                        var a = -1.0 * (y(d.value) / y_bands.domain().length);
                        var b = y_bands(d.name);
                        var result = a + height - b;
                        return result;
                    }
                    else{
                        return -1.0 * y(d.value) + height;
                    }
                })
                .interpolate("monotone");

            // data storage, we're going to want to store the last X values of everything
            my_line_chart.historical_values = [];
            my_line_chart.index_map = {};

            // draw function
            my_line_chart.redraw = function(data_src){

                // Manage the data update, appending new data to the historical and shifting
                // old data off the end.
                var updated = [];
                for (var data_set in data_src){
                    var name = data_src[data_set].name;

                    // If this is new data, then make an array for it in the historicals and
                    // pre-fill it with zeroes to that we always slide in from the left
                    if (!my_line_chart.historical_values[my_line_chart.index_map[name]]){
                        var new_set = [];
                        var new_index = my_line_chart.historical_values.push(new_set) - 1;
                        var len = saved_points;
                        while (len--){
                             my_line_chart.historical_values[new_index][len] = {name:data_src[data_set].name, value:1};
                        }
                        console.log("New Data " + name + " added at index " + new_index);
                        my_line_chart.index_map[name] = new_index;
                        height_changed = true;
                    }

                    // append new values to historicals, slide old ones off the end
                    my_line_chart.historical_values[my_line_chart.index_map[name]].push(data_src[data_set]);

                    // We shift until we're at saved point size, this serves to truncate if we adjust saved
                    // point size and have too much data.
                    while (my_line_chart.historical_values[my_line_chart.index_map[name]].length > saved_points){
                        my_line_chart.historical_values[my_line_chart.index_map[name]].shift();
                    }

                    // track the ones we have updated, if something isn't being updated then
                    // the data source has stopped and it needs empty data until we run out
                    updated.push(name);
                }

                // Check for dead data, as soon as everything is 0 then that data entry goes away
                for (var set in my_line_chart.index_map){
                    var set_index = my_line_chart.index_map[set];
                    // Provice empty data for sets that have stopped sending
                    if (updated.indexOf(set) >= 0){
                        continue;
                    }
                    else{
                        console.log(set + set_index + " was not updated");
                        var last_entry = my_line_chart.historical_values[set_index].shift();

                        my_line_chart.historical_values[set_index].push({name:set, value:0});

                        // If a data set has stopped sending,
                        // once all the values are zero then we should remove it entirely
                        var sum = 0, index =  my_line_chart.historical_values[set_index].length;
                        while (index--){
                            sum +=  my_line_chart.historical_values[set_index][index].value;
                        }

                        if (sum === 0){
                            console.log(set + " is ZERO");
                            my_line_chart.historical_values.splice(set_index, 1);
                            delete my_line_chart.index_map[set];
                            height_changed = true;

                            // I've altered the indeces of the data I need to fix them
                            for (i=set_index; i < my_line_chart.historical_values.length; i++){
                                var chart_name = my_line_chart.historical_values[i][0].name;
                                my_line_chart.index_map[chart_name] = i;
                                console.log(chart_name + " moved to index " + i);
                            }
                        }
                    }
                }

                d3.select(selector)
                    .select("svg#linechart_" + data_source)
                    .transition()
                    .duration(transition_delay)
                    .attr("width", width + right_margin)
                    .attr("height", height + 10);


                d3.select("#clip")
                    .select("rect")
                    .transition()
                    .duration(transition_delay)
                    .attr("width", width - margin - x(2))
                    .attr("height", height);

                x.domain([0, my_line_chart.historical_values[my_line_chart.index_map[name]].length])
                 .range([0, width - margin]);

                y.domain([0,100])
                 .range([0, height]);


                var bands = [];
                for (var band_name in my_line_chart.index_map){
                    bands.push(band_name);
                }

                y_bands.domain(bands)
                    .rangeBands([0,height]);

                // Horizontal bars between graphs
                chart.selectAll("line")
                    .data(my_line_chart.historical_values)
                    .enter().append("line")
                    .attr("x1", 0)
                    .attr("x2", width - margin - x(2))
                    .attr("y1", function(d,i){ return -1.0 * y_bands(d[0].name) + height;})
                    .attr("y2", function(d,i){ return -1.0 * y_bands(d[0].name) + height;})
                    .style("stroke", "#ccc");

                chart.selectAll("line")
                    .data(my_line_chart.historical_values)
                    .transition()
                    .duration(transition_delay)
                    .attr("x1", 0)
                    .attr("x2", width - margin - x(2))
                    .attr("y1", function(d,i){ return -1.0 * y_bands(d[0].name) + height;})
                    .attr("y2", function(d,i){ return -1.0 * y_bands(d[0].name) + height;});

                chart.selectAll("line")
                    .data(my_line_chart.historical_values)
                    .exit()
                    .remove();


                // // Labels on each graph line
                // chart.selectAll("text.yAxis")
                //     .data(my_line_chart.historical_values)
                //     .enter()
                //     .append("svg:text")
                //     .attr("x", -margin)
                //     .attr("y", function(d) {return -1.0 * ( y_bands(d[0].name) + y_bands.rangeBand() / 2) + height; })
                //     .attr("dx", 0) // padding-right
                //     .attr("dy", ".35em") // vertical-align: middle
                //     .attr("class", "yAxis")
                //     .attr("fill", function(d, i) { return color(i); })
                //     .text(function(d,i){return String(d[0].name);});

                // chart.selectAll("text.yAxis")
                //     .data(my_line_chart.historical_values)
                //     .transition()
                //     .duration(transition_delay)
                //     .attr("fill", function(d, i) { return color(i); })
                //     .attr("y", function(d) {return -1.0 * ( y_bands(d[0].name) + y_bands.rangeBand() / 2) + height; });

                // chart.selectAll("text.yAxis")
                //     .data(my_line_chart.historical_values)
                //     .exit()
                //     .remove();

                // values displayed for most recent data point at end of line
                chart.selectAll("text.values")
                    .data(my_line_chart.historical_values)
                    .enter()
                    .append("svg:text")
                    .attr("x", width + right_margin - margin - x(1))
                    .attr("y", function(d) {return -1.0 * ( y_bands(d[0].name) + y_bands.rangeBand() / 2) + height; })
                    .attr("dx", 0) // padding-right
                    .attr("dy", ".35em") // vertical-align: middle
                    .attr("class", "values")
                    .attr("text-anchor", "end") // text-align: right
                    .attr("fill", function(d, i) { return color(i); })
                    .text(function(d,i){return String(d[0].name) + "  " + String(d[0].value);});

                chart.selectAll("text.values")
                    .data(my_line_chart.historical_values)
                    .transition()
                    .duration(transition_delay)
                    .attr("x", width + right_margin - margin - x(1))
                    .attr("y", function(d) {return -1.0 * ( y_bands(d[0].name) + y_bands.rangeBand() / 2) + height; })
                    .attr("fill", function(d, i) { return color(i); })
                    .text(function(d,i){return String(d[0].name) + "  " + String(d[d.length-1].value);});

                chart.selectAll("text.values")
                    .data(my_line_chart.historical_values)
                    .exit()
                    .remove();

                if (!paused){

                    // Finally update all the paths
                    chart.selectAll("path")
                        .data(my_line_chart.historical_values)
                        .enter()
                        .append("g")
                        .attr("clip-path", "url(#clip)")
                        .append("svg:path")
                        .attr("id", function(d, i) { return "Path-" + i; })
                        .attr("class", "line_chart")
                        .attr("stroke", function(d, i) { return color(i); })
                        .attr('d', function(d,i){ return line(my_line_chart.historical_values[i]);} );

                    if (width_changed || height_changed){
                        paused = true;
                        chart.selectAll("path")
                            .data(my_line_chart.historical_values)
                            .transition()
                            .duration(transition_delay)
                            .attr("d", function(d,i){ return line(my_line_chart.historical_values[i]);})
                            .each("end", function() { paused = false;});

                        width_changed = false;
                        height_changed = false;
                    } else {

                        chart.selectAll("path")
                            .data(my_line_chart.historical_values)
                            .attr("transform", "translate(0)")
                            .attr("d", function(d,i){ return line(my_line_chart.historical_values[i]);})
                            .on("mouseover", function(d,i){
                                var mouse_pos = d3.mouse(this);
                                // console.log(mouse_pos);
                                var pos = Math.floor(x.invert(mouse_pos[0]));
                                var data_val = d[pos].value;
                                console.log(d[pos].name + " " + data_val);
                            })
                            .transition()
                            .ease("linear")
                            .duration(_settings.default_transition_delay)
                        .attr("transform", "translate(" + -1 * x(1) + ")");
                    }

                    chart.selectAll("path")
                        .data(my_line_chart.historical_values)
                        .exit()
                        .remove();

                }
            };

            my.register_data_source(server, data_source, my_line_chart.redraw);
            return my_chart;

        };

        my_chart.transition_lines = function(){
            if (chart){
                paused = true;
                chart.selectAll("path")
                    .data(my_line_chart.historical_values)
                    .transition()
                    .ease("linear")
                    .duration(transition_delay)
                    .attr("d", function(d,i){ return line(my_line_chart.historical_values[i]);})
                    .each("end", function() { paused = false;});
            }
        };

        my_chart.stacked = function(value){
            if (!arguments.length) return stacked;

            if (stacked != value){
                stacked = value;
                this.transition_lines();
            }
            return this;
        };

        my_chart.width = function(value){
            if (!arguments.length) return width;
            width = value;
            width_changed = true;
            return this;
        };

        my_chart.height = function(value){
            if (!arguments.length) return height;
            height = value;
            height_changed = true;
            return this;
        };

        my_chart.pause = function(value){
            if (!arguments.length) return paused;
            paused = value;
            return this;
        };

        my_chart.transition_delay = function(value){
            if (!arguments.length) return transition_delay;
            if (value == "auto"){
                transition_delay = _settings.default_transition_delay;
            } else {
                transition_delay = value;
            }
            return this;
        };

        my_chart.saved_points = function(value){
            if (!arguments.length) return saved_points;
            saved_points = value;
            return this;
        };

        my_chart.data_source = function(value){
            if (!arguments.length) return my_chart.data_source;
            data_source = value;
            // TODO - deregister source and register new source
            return this;
        };

        // Create the chart in the specified location in the DOM
        my_chart.bind = function(selector){
            return this(selector);
        };

        return my_chart;
    };

    return my;

}(live_charts || {}));

