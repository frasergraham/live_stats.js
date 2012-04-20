// module to use d3 to generate live updating charts over a websocket connection
// Copyright 2012 Fraser Graham 
// This module requires d3.js (www.d3js.org)

var live_charts = function(my) {
  
  // Store which data sources refresh which graphs
  my.source_mappings = {};

  my.connect_to_data_source = function(websocket_server, default_chart_factory, default_selector){
      my.source_mappings[websocket_server] = {};
      
      var establish_connection = function(){

        connection = new WebSocket(websocket_server, null);

        connection.onopen = function(){
          console.log("Connected to " + websocket_server);
          clearInterval(ping);
        };

        connection.onclose = function(){
          console.log("Disconnected from " + websocket_server);
          setTimeout(function(){
            establish_connection();
          }, 5000);
        };

      }();

      connection.onmessage = function (e) {
        new_data = JSON.parse(e.data);
        for (set in new_data){
          if (typeof my.source_mappings[websocket_server][set] !== 'undefined'){
            my.source_mappings[websocket_server][set](new_data[set]);
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
  };

  my.register_data_source = function(websocket_server, source_set, draw_callback){

    if (typeof my.source_mappings[websocket_server] === 'undefined'){
      throw websocket_server + " is not connected, call connect_to_data_source() first";
      return;
    }

    my.source_mappings[websocket_server][source_set] = draw_callback;
  }

  // Charts are created with a server and a place in the DOM to put them
  // All the contents of the chart will come from the server
  // A chart will manage it's own 
  my.new_bar_chart = function(websocket_server, selector, source_set, width, height){
    
    if (typeof my.source_mappings[websocket_server] === 'undefined'){
      throw websocket_server + " is not connected, call connect_to_data_source() first";
      return;
    }

    var width = typeof width !== 'undefined' ? width : 400;
    var height = typeof height !== 'undefined' ? height : 400;

    var margin_padding = 60;

    var data;
    var chart, x, y;
    var connection;
    var ping;

    chart = d3.select(selector)
     .append("svg:svg")
     .attr("class", "chart")
     .attr("width", width)
     .attr("height", height)
     .append("g")        // this is a group tag
     .attr("transform", "translate(60,0)"); // translate the group together

    x = d3.scale.linear()
       .domain([0, 100])
       .range([0, width - margin_padding - 10]);
     
    y = d3.scale.ordinal()
        .rangeBands([0, height]);

    chart.selectAll("line")
        .data(x.ticks(10))
        .enter().append("line")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", 0)
        .attr("y2", height)
        .style("stroke", "#ccc");


    var draw = function (data_src) {
       
      var build_node = function(d){
        return d.append("svg:rect")
            .attr("y", function(d,i){ return y(d.name);})
            .attr("width", function(d,i){ return x(d.value);})
            .attr("height", y.rangeBand());
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

    my.register_data_source(websocket_server, source_set, draw);
  };

  return my;

}(live_charts || {});





