// module to use d3 to generate live updating charts over a websocket connection
// Copyright 2012 Fraser Graham 
// This module requires d3.js (www.d3js.org)

var live_charts = function(my) {
  
  // Store which data sources refresh which graphs
  my.source_mappings = {};

  // default_selector
  var default_transition_delay = 500;
  var default_width = 400;
  var default_height = 400;

  var default_chart_factory = null;
  var default_selector = 'body';

  // Functions to set or retrieve the defaults for all charts
  my.default_width = function(width){
    if (!arguments.length) return default_width;
    default_width = width;
    return my;
  }

  my.default_height = function(height){
    if (!arguments.length) return default_height;
    default_height = height;
    return my;
  }

  my.default_transition_delay = function(delay){
    if (!arguments.length) return default_transition_delay;
    default_transition_delay = delay;
    return my;
  }

  my.default_chart_factory = function(chart_factory){
    default_chart_factory = chart_factory;
    return my;
  }

  my.default_selector =  function(selector){
    default_selector = selector;
    return my;
  }

  // base object to construct all our data source objects from
  var Connection = function(server){
    this.server = server;  
  };

  // Data Source management, connect to a WebSocket Server and 
  my.connect_to_data_source = function(websocket_server, callback){
      var my_connection = new Connection(websocket_server);
      my_connection.data_groups = [];

      my.source_mappings[websocket_server] = {};
      
      var establish_connection = function establish_connection(){

        my_connection.connection = new WebSocket(websocket_server, null);

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

          for (group in new_data){
            var exists = false;
            
            for (existing_group in my_connection.data_groups){
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
      }

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


  // Charts are created with a server and a place in the DOM to put them
  // All the contents of the chart will come from the server
  Connection.prototype.bar_chart = function bar_chart(){
    var width = default_width
    var height = default_height;
    var transition_delay = default_transition_delay;
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
  }

  Connection.prototype.line_chart = function line_chart(){
    var width = default_width
    var height = default_height;
    var transition_delay = default_transition_delay;
    var data_source = null;
    var server = this.server;

    var my_chart = function my_chart(selector){
      var my_line_chart = {};
      var stacked = true;
      var saved_points = 100;
      var margin = 80;
      var data = [];
      var chart, x, y;
      color = d3.scale.category20();

      chart = d3.select(selector)
        .append("svg:svg")
        .attr("class", "chart")
        .attr("id", "linechart_" + data_source)
        .attr("width", width + 10)
        .attr("height", height + 10)
        .append("g")        // this is a group tag
        .attr("transform", "translate(" + margin + ",5)"); // translate the group together

      // define scales
      var x = d3.scale.linear()
        .domain([0, saved_points])
        .range([0, width - margin]); 

      var y = d3.scale.linear()
        .domain([0,100])
        .range([0, height]);

      var y_bands;

      if (stacked){
        // make some more Y scales
        y_bands = d3.scale.ordinal()
                    .rangeBands([0,height]);

      }


      var line = d3.svg.line()
                  .x(function(d,i){ return x(i); })
                  .y(function(d,i){ 
                      if (stacked){
                        return -1.0 * (y(d.value) / y_bands.domain().length) + height - y_bands(d.name); 
                      } 
                      else{
                        return -1.0 * y(d.value) + height;                  
                      }
                    })
                  .interpolate("monotone");

      chart.selectAll("path") 
        .data(data)
        .enter()
        .append("svg:path")
        .attr("class", "line_chart")
        .attr("stroke", function(d, i) { return color(i); })
        .attr('d', function(d,i){ return line(data[i]);} );

      // data storage, we're going to want to store the last X values of everything
      my_line_chart.historical_values = [];

      // draw function
      my_line_chart.redraw = function(data_src){
        
        d3.select(selector)
          .select("svg#linechart_" + data_source)
          .transition()
          .duration(transition_delay)
          .attr("width", width + 10)
          .attr("height", height + 10);
        
        x.domain([0, saved_points])
         .range([0, width - margin]); 

        y.domain([0,100])
         .range([0, height]);

        if (stacked){
          y_bands.domain(my_line_chart.historical_values.map(function (d, i){return d[0].name;}))
                    .rangeBands([0,height]);
        }

        chart.selectAll("path")
          .data(my_line_chart.historical_values)
          .enter()
          .append("svg:path")
          .attr("id", function(d, i) { return "Path-" + i; })
          .attr("class", "line_chart")
          .attr("stroke", function(d, i) { return color(i); })
          .attr('d', function(d,i){ return line(my_line_chart.historical_values[i]);} );

        chart.selectAll("path")
          .data(my_line_chart.historical_values)
          .exit()
          .remove();

        if (stacked){
          chart.selectAll("line")
            .data(my_line_chart.historical_values)
            .enter().append("line")
            .attr("x1", 0)
            .attr("x2", width - margin)
            .attr("y1", function(d,i){ return -1.0 * y_bands(d[0].name) + height;})
            .attr("y2", function(d,i){ return -1.0 * y_bands(d[0].name) + height;})
            .style("stroke", "#ccc");        

          chart.selectAll("line")
            .data(my_line_chart.historical_values)
            .transition()
            .duration(default_transition_delay)
            .attr("x1", 0)
            .attr("x2", width - margin)
            .attr("y1", function(d,i){ return -1.0 * y_bands(d[0].name) + height;})
            .attr("y2", function(d,i){ return -1.0 * y_bands(d[0].name) + height;});

          chart.selectAll("line")
            .data(my_line_chart.historical_values)
            .exit()
            .remove();

          chart.selectAll("text.yAxis")
            .data(my_line_chart.historical_values)
            .enter()
            .append("svg:text")
            .attr("x", -margin)
            .attr("y", function(d) {return -1.0 * ( y_bands(d[0].name) + y_bands.rangeBand() / 2) + height; })
            .attr("dx", 0) // padding-right
            .attr("dy", ".35em") // vertical-align: middle
            .attr("class", "yAxis")
            .text(function(d,i){return String(d[0].name);});

          chart.selectAll("text.yAxis")
            .data(my_line_chart.historical_values)
            .transition()
            .duration(default_transition_delay)
            .attr("y", function(d) {return -1.0 * ( y_bands(d[0].name) + y_bands.rangeBand() / 2) + height; });

          chart.selectAll("text.yAxis")
            .data(my_line_chart.historical_values)
            .exit()
            .remove();
        }

        var updated = [];

        for (var data_set in data_src){
          
          // If this is new data, then make an array for it in the historicals and
          // pre-fill it with zeroes to that we always slide in from the left
          if (!my_line_chart.historical_values[data_set]){
            my_line_chart.historical_values[data_set] = [];
            var len = saved_points;
            while (len--){
               my_line_chart.historical_values[data_set][len] = {name:data_src[data_set].name, value:0};
            }
          }
          
          // append new values to historicals, slide old ones off the end
          my_line_chart.historical_values[data_set].push(data_src[data_set]);
          my_line_chart.historical_values[data_set].shift();

          // track the ones we have updated, if something isn't being updated then
          // the data source has stopped and it needs empty data until we run out
          updated.push(data_set);
        }

        for (var set in my_line_chart.historical_values){
          
          // Provice empty data for sets that have stopped sending
          if (set in updated){
            continue;
          }
          else{
            var last_entry = my_line_chart.historical_values[set].shift();
            my_line_chart.historical_values[set].push({name:last_entry.name, value:0});
           
            // If a data set has stopped sending, 
            // once all the values are zero then we should remove it entirely
            var sum = 0, index =  my_line_chart.historical_values[set].length;
            while (index--){
              sum +=  my_line_chart.historical_values[set][index].value;
            }

            if (sum === 0){
              my_line_chart.historical_values.splice(set);
            }
          }
        }

        chart.selectAll("path")
          .data(my_line_chart.historical_values)
          .attr("transform", "translate(" + x(1) + ")") 
          .attr("d", function(d,i){ return line(my_line_chart.historical_values[i]);})  
          .transition()
          .ease("linear")
          .duration(default_transition_delay) 
          .attr("transform", "translate(" + x(0) + ")");  
      };

      my.register_data_source(server, data_source, my_line_chart.redraw);
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
  }

  Connection.prototype.pie_chart = function pie_chart(){
    var width = default_width
    var height = default_height;
    var transition_delay = default_transition_delay;
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
  }

  return my;

}(live_charts || {});






