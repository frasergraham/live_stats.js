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
// Bar Chart Extension Module


var live_charts = (function(my) {
    var _settings = my._settings = my._settings || {};

    my.Connection.prototype.bar_chart = function bar_chart(){

        var width = _settings.default_width;
        var height = _settings.default_height;
        var transition_delay = _settings.default_transition_delay;
        var data_source = null;
        var server = this.server;

        var my_chart = function my_chart(selector){
            var my_bar_chart = {};
            var margin = 80;
            var data;
            var chart, x, y;
            color = d3.scale.category20();

            chart = d3.select(selector)
             .append("svg:svg")
             .attr("class", "chart")
             .attr("id", "barchart_" + data_source)
             .attr("width", width)
             .attr("height", height)
             .append("g")        // this is a group tag
             .attr("transform", "translate(" + margin + ",20)"); // translate the group together

            x = d3.scale.linear()
                 .domain([0, 100])
                 .range([0, width - margin - 10]);

            y = d3.scale.ordinal()
                    .rangeBands([0, height-20]);

            chart.selectAll("line")
                    .data(x.ticks(10))
                    .enter().append("line")
                    .attr("x1", x)
                    .attr("x2", x)
                    .attr("y1", 0)
                    .attr("y2", height)
                    .style("stroke", "#ccc");

            my_bar_chart.redraw = function (data_src) {

                d3.select(selector)
                    .select("svg#barchart_" + data_source)
                    .transition()
                    .duration(transition_delay)
                    .attr("width", width)
                    .attr("height", height);

                chart.selectAll("line")
                    .data(x.ticks(10))
                    .transition()
                    .duration(transition_delay)
                    .attr("x1", x)
                    .attr("x2", x)
                    .attr("y1", 0)
                    .attr("y2", height);

                var build_node = function(d){
                    return d.append("svg:rect")
                            .attr("y", function(d,i){ return y(d.name);})
                            .attr("width", function(d,i){ return x(d.value);})
                            .attr("height", y.rangeBand())
                            .attr("fill", function(d, i) { return color(i); });
                };

                var build_label = function(d){
                        return d.append("svg:text")
                            .attr("x", function(d,i){ return x(d.value);})
                            .attr("y", function(d) { return y(d.name) + y.rangeBand() / 2; })
                            .attr("dx", -3) // padding-right
                            .attr("dy", ".35em") // vertical-align: middle
                            .attr("text-anchor", "end") // text-align: right
                            .attr("class", "label")
                            .text(function(d,i){return String(d.value);});
                };

                var build_axis = function(d){
                    return d.append("svg:text")
                            .attr("x", -margin)
                            .attr("y", function(d) { return y(d.name) + y.rangeBand() / 2; })
                            .attr("dx", 0) // padding-right
                            .attr("dy", ".35em") // vertical-align: middle
                            .attr("class", "yAxis")
                            .text(function(d,i){return String(d.name);});
                };

                data = data_src;

                var bars = chart.selectAll("rect").data(data);
                var labels = chart.selectAll("text.label").data(data);
                var axis = chart.selectAll("text.yAxis").data(data);

                y.domain(data.map(function (d){ return d.name;}))
                 .rangeBands([0, height-20]);

                x.domain([0, 100])
                 .range([0, width - margin - 10]);

                // BARS
                bars.transition()
                    .duration(transition_delay)
                    .attr("width", function(d){return x(d.value);})
                    .attr("y", function(d,i){ return y(d.name);})
                    .attr("height", y.rangeBand());

                build_node(bars.enter());
                bars.exit().remove();

                // LABELS
                labels.transition()
                    .duration(transition_delay)
                    .text(function(d){return String(d.value);})
                    .attr("y", function(d,i){ return y(d.name) + y.rangeBand() / 2;})
                    .attr("x", function(d){return x(d.value);});

                build_label(labels.enter());
                labels.exit().remove();

                // AXIS
                axis.transition()
                    .duration(transition_delay)
                    .attr("y", function(d,i){ return y(d.name) + y.rangeBand() / 2;});

                build_axis(axis.enter());
                axis.exit().remove();

            };

            my.register_data_source(server, data_source, my_bar_chart.redraw);

            return my_chart;
        };

        my_chart.width = function(value){
            if (!arguments.length) return width;
            width = value;
            return this;
        };

        my_chart.height = function(value){
            if (!arguments.length) return height;
            height = value;
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
