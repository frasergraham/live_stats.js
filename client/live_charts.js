// module to use d3 to generate live updating charts over a websocket connection
// Copyright 2012 Fraser Graham 
// This module requires d3.js (www.d3js.org)

var live_charts = function(my) {
  
  // Store which data sources refresh which graphs
  my.source_mappings = {};

  my.connect_to_data_source = function(websocket_server, default_chart_factory, default_selector){
      my.source_mappings[websocket_server] = {};
      
      var establish_connection = function establish_connection(){

        my.connection = new WebSocket(websocket_server, null);

        my.connection.onopen = function(){
          console.log("Connected to " + websocket_server);
        };

        my.connection.onclose = function(){
          console.log("Lost Connection: " + websocket_server);
          setTimeout(function(){
            establish_connection();
          }, 5000);
        };

        my.connection.onmessage = function (e) {
          new_data = JSON.parse(e.data);
          for (set in new_data){
            if (typeof my.source_mappings[websocket_server][set] !== 'undefined'){
              for (draw_func in my.source_mappings[websocket_server][set]){
                my.source_mappings[websocket_server][set][draw_func](new_data[set]);
              }
            } 
            else{
              // This data is unhandled, if we have specified a chart factory use it to 
              // make a chart for this data now.

              if (typeof default_chart_factory !== 'undefined'){
                default_chart_factory(websocket_server, default_selector || "body", set);
              }
            }
          }
        };

      }();

  };

  my.register_data_source = function(websocket_server, source_set, draw_callback){

    if (typeof my.source_mappings[websocket_server] === 'undefined'){
      throw websocket_server + " is not connected, call connect_to_data_source() first";
      return;
    }

    if (typeof my.source_mappings[websocket_server][source_set] === 'undefined'){
      my.source_mappings[websocket_server][source_set] = [];
    }
    my.source_mappings[websocket_server][source_set].push(draw_callback);
  }

  // Charts are created with a server and a place in the DOM to put them
  // All the contents of the chart will come from the server
  // A chart will manage it's own 
  my.new_bar_chart = function(websocket_server, selector, source_set, width, height){
    
    var my_chart = {}

    if (typeof my.source_mappings[websocket_server] === 'undefined'){
      throw websocket_server + " is not connected, call connect_to_data_source() first";
      return;
    }

    var width = typeof width !== 'undefined' ? width : 400;
    var height = typeof height !== 'undefined' ? height : 400;

    var margin_padding = 60;

    var data;
    var chart, x, y;
    color = d3.scale.category20();

    chart = d3.select(selector)
     .append("svg:svg")
     .attr("class", "chart")
     .attr("width", width)
     .attr("height", height)
     .append("g")        // this is a group tag
     .attr("transform", "translate(" + margin_padding + ",20)"); // translate the group together

    x = d3.scale.linear()
       .domain([0, 100])
       .range([0, width - margin_padding - 10]);
     
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

    my_chart.redraw = function (data_src) {
       
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
            .text(function(d,i){return String(d.value)});
      };

      var build_axis = function(d){
        return d.append("svg:text")
            .attr("x", -margin_padding)
            .attr("y", function(d) { return y(d.name) + y.rangeBand() / 2; })
            .attr("dx", 0) // padding-right
            .attr("dy", ".35em") // vertical-align: middle
            .attr("class", "yAxis")
            .text(function(d,i){return String(d.name)});
      };

      data = data_src;

      var bars = chart.selectAll("rect").data(data);
      var labels = chart.selectAll("text.label").data(data);
      var axis = chart.selectAll("text.yAxis").data(data);

      y.domain(data.map(function (d){ return d.name;}));

      // BARS
      bars.transition()
        .duration(500)
        .attr("width", function(d){return x(d.value)})
        .attr("y", function(d,i){ return y(d.name);})
        .attr("height", y.rangeBand());          

      build_node(bars.enter());
      bars.exit().remove();

      // LABELS
      labels.transition()
        .duration(500)
        .text(function(d){return String(d.value)})
        .attr("y", function(d,i){ return y(d.name) + y.rangeBand() / 2;})
        .attr("x", function(d){return x(d.value)});

      build_label(labels.enter());
      labels.exit().remove();

      // AXIS
      axis.transition()
        .duration(500)
        .attr("y", function(d,i){ return y(d.name) + y.rangeBand() / 2;})

      build_axis(axis.enter());
      axis.exit().remove();

    };  

    my.register_data_source(websocket_server, source_set, my_chart.redraw);
    return my_chart;
  };

  my.new_line_chart = function(websocket_server, selector, source_set, width, height){
    var my_chart = {}

    if (typeof my.source_mappings[websocket_server] === 'undefined'){
      throw websocket_server + " is not connected, call connect_to_data_source() first";
      return;
    }

    var width = typeof width !== 'undefined' ? width : 400;
    var height = typeof height !== 'undefined' ? height : 400;

    var margin = 0;
    var data = [{value:50}];
    var chart, x, y;
    color = d3.scale.category20();

    chart = d3.select(selector)
      .append("svg:svg")
      .attr("class", "chart")
      .attr("width", width)
      .attr("height", height)
      .append("g")        // this is a group tag
      .attr("transform", "translate(" + margin + ",00)"); // translate the group together

    // define scales
    x = d3.scale.linear()
      .domain([0, 20])
      .range([margin, width]);

    y = d3.scale.linear()
      .domain([0,100])
      .range([0, height]);

		var line = d3.svg.line()
								.x(function(d,i){ return x(i); })
								.y(function(d){ return -1.0 * y(d.value) + height; })
								.interpolate("cardinal");

		chart.selectAll("path")
			.data([data])
			.enter()
			.append("svg:path")
			.attr("class", "line_chart")
			.attr('d', line);

    // data storage, we're going to want to store the last X values of everything
    my_chart.historical_values = [];

    // draw function
    my_chart.redraw = function(data_src){

      // append new values to historicals
      my_chart.historical_values.push(data_src[0]);

      if (my_chart.historical_values.length > 20){
      	my_chart.historical_values.shift();
				chart.selectAll("path")
					.data([my_chart.historical_values])
					.attr("transform", "translate(" + x(1) + ")") 
					.attr("d", line) 
					.transition(500) 
					.attr("transform", "translate(" + x(0) + ")"); 	
      }
			else {
				chart.selectAll("path")
					.data([my_chart.historical_values])
					.attr("d", line) 
			}
    };

    my.register_data_source(websocket_server, source_set, my_chart.redraw);
    return my_chart;
  };

  my.new_pie_chart = function(websocket_server, selector, source_set, width, height){
    var my_chart = {};

    var width = typeof width !== 'undefined' ? width : 400;
    var height = typeof height !== 'undefined' ? height : 400;

    outerRadius = Math.min(width, height) / 2,
    innerRadius = outerRadius * .0,
    color = d3.scale.category20(),
    donut = d3.layout.pie().value(function(d){ return d.value;}).sort(null),
    arc = d3.svg.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

    label_arc = d3.svg.arc()
            .innerRadius(outerRadius * .6)
            .outerRadius(outerRadius);
    
    data = [];

    var vis = d3.select("body")
      .append("svg")
        .data([data])
        .attr("class", "smooth_chart")
        .attr("width", width)
        .attr("height", height);

    my_chart.redraw = function(data_src){

      vis.data([data_src]);

      var e = vis.selectAll("g.arc")
        .data(donut)
        .enter()
      
      e.append("g")
        .attr("class", "arc")
        .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")")
      .append("path")
        .attr("fill", function(d, i) { return color(i); })
        .attr("d", arc)
      .each(function(d) { this._current = d;})

      e.append("g")
        .attr("class", "label")
        .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")")
      .append("svg:text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("transform", function(d){
            d.innerRadius = innerRadius
            d.outerRadius = outerRadius;
            return "translate(" + label_arc.centroid(d) + ")";})
        .text(function(d){return d.data.name});


      vis.selectAll("g.arc")
        .data(donut)
      .select("path")
        .transition()
        .duration(500)
        .attrTween("d", arcTween)
      
      vis.selectAll("g.label")
        .data(donut)
        .select("text")
        .transition()
        .duration(500)
        .attr("transform", function(d){ return "translate(" + label_arc.centroid(d) + ")";})
        .text(function(d){return d.data.name});

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

    my.register_data_source(websocket_server, source_set, my_chart.redraw);
    return my_chart;    
  };

  return my;

}(live_charts || {});






