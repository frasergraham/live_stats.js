// module to use d3 to generate live updating charts over a websocket connection
// Copyright 2012 Fraser Graham 
// This module requires d3.js (www.d3js.org)

var live_charts = function(my) {
  
  // Charts are created with a server and a place in the DOM to put them
  // All the contents of the chart will come from the server
  // A chart will manage it's own 
  my.new_bar_chart = function(websocket_server, selector){
    
    var data;
    var chart, x, y;
    var connection;
    var ping;

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

      connection.onmessage = function (e) {
       
        if  (!data){
          // we're getting new data for the first time
          data = JSON.parse(e.data);
          
          chart = d3.select(selector)
             .append("svg:svg")
             .attr("class", "chart")
             .attr("width", 700)
             .attr("height", 30 * data.length + 20)
             .append("g")        // this is a group tag
             .attr("transform", "translate(60,0)"); // translate the group together
           
          x = d3.scale.linear()
             .domain([0, 100])
             .range([0, 500]);
           
          y = d3.scale.ordinal()
              .domain(data.map(function (d){ return d.name;}))
              .rangeBands([0, 30 * data.length]);


          chart.selectAll("line")
              .data(x.ticks(10))
              .enter().append("line")
              .attr("x1", x)
              .attr("x2", x)
              .attr("y1", 0)
              .attr("y2", 30 * data.length)
              .style("stroke", "#ccc");
             
          chart.selectAll("rect")
              .data(data)
              .enter().append("svg:rect")
              .attr("y", function(d,i){ return y(d.name);})
              .attr("width", function(d,i){ return x(d.value);})
              .attr("height", y.rangeBand());
          
          chart.selectAll("text")
              .data(data)
              .enter().append("svg:text")
              .attr("x", function(d,i){ return x(d.value);})
              .attr("y", function(d) { return y(d.name) + y.rangeBand() / 2; })
              .attr("dx", -3) // padding-right
              .attr("dy", ".35em") // vertical-align: middle
              .attr("text-anchor", "end") // text-align: right
              .text(function(d,i){return String(d.value)});

          chart.selectAll("text.yAxis")
              .data(data)
              .enter().append("svg:text")
              .attr("x", -60)
              .attr("y", function(d) { return y(d.name) + y.rangeBand() / 2; })
              .attr("dx", 0) // padding-right
              .attr("dy", ".35em") // vertical-align: middle
              .text(function(d,i){return String(d.name)});

        }
        else{

          data = JSON.parse(e.data);
            
          chart.selectAll("rect")
            .data(data)
            .transition()
            .duration(500)
            .attr("width", function(d){return x(d.value)});          

          chart.selectAll("text")
            .data(data)
            .transition()
            .duration(500)
            .text(function(d){return String(d.value)})
            .attr("x", function(d){return x(d.value)});
        }
      };  

      return connection;
    };

    establish_connection();
  }


  return my;

}(live_charts || {});






