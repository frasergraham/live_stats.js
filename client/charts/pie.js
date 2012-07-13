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
// Pie Chart Extension Module


var live_charts = (function(my) {
    var _settings = my._settings = my._settings || {};

    my.Connection.prototype.pie_chart = function pie_chart(){
        var width = _settings.default_width;
        var height = _settings.default_height;
        var transition_delay = _settings.default_transition_delay;
        var data_source = null;
        var server = this.server;

        var my_chart = function my_chart(selector){
            var my_pie_chart = {};

            outerRadius = Math.min(width, height) / 2;
            innerRadius = outerRadius * 0.0;
            color = d3.scale.category20();
            donut = d3.layout.pie().value(function(d){ return d.value;}).sort(null);

            arc = d3.svg.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius);

            label_arc = d3.svg.arc()
                .innerRadius(outerRadius * 0.6)
                .outerRadius(outerRadius);

            data = [];

            var vis = d3.select(selector)
                .append("svg")
                    .data([data])
                    .attr("class", "smooth_chart")
                    .attr("id", "piechart_" + data_source)
                    .attr("width", width)
                    .attr("height", height);


         my_pie_chart.redraw = function(data_src){
                outerRadius = Math.min(width, height) / 2;
                innerRadius = outerRadius * 0.0;

                arc.innerRadius(innerRadius)
                    .outerRadius(outerRadius);

                label_arc.innerRadius(outerRadius * 0.6)
                    .outerRadius(outerRadius);

                vis.data([data_src])
                    .transition()
                    .duration(transition_delay)
                    .attr("width", width)
                    .attr("height", height);

                var e = vis.selectAll("g.arc")
                    .data(donut)
                    .enter();

                e.append("g")
                    .attr("class", "arc")
                .append("path")
                    .attr("fill", function(d, i) { return color(i); })
                    .attr("d", arc)
                .each(function(d) { this._current = d;});

                e.append("g")
                    .attr("class", "label")
                    .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")")
                .append("svg:text")
                    .attr("class", "label")
                    .attr("text-anchor", "middle")
                    .attr("transform", function(d){
                            d.innerRadius = innerRadius;
                            d.outerRadius = outerRadius;
                            return "translate(" + label_arc.centroid(d) + ")";})
                    .text(function(d){return d.data.name;});


                vis.selectAll("g.arc")
                    .data(donut)
                .select("path")
                    .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")")
                    .transition()
                    .duration(transition_delay)
                    .attrTween("d", arcTween);

                vis.selectAll("g.label")
                    .data(donut)
                    .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")")
                    .select("text")
                    .transition()
                    .duration(transition_delay)
                    .attr("transform", function(d){ return "translate(" + label_arc.centroid(d) + ")";})
                    .text(function(d){return d.data.name;});

                vis.selectAll("g.arc")
                    .data(donut)
                    .exit()
                    .remove();

                vis.selectAll("g.label")
                    .data(donut)
                    .exit()
                    .remove();

            };

            // Store the currently-displayed angles in this._current.
            // Then, interpolate from this._current to the new angles.
            function arcTween(a) {
                var i = d3.interpolate(this._current, a);
                this._current = i(0);
                return function(t) {
                    return arc(i(t));
                };
            }

            my.register_data_source(server, data_source, my_pie_chart.redraw);
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
})(live_charts || {});
