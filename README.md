Live Stats
------------

Javascript library utilizing d3.js to visualize a live stream of data coming from a WebSocket Connection.

It is currently a work in progress. Issues and future goals are listed in the GitHub Issues list.

Using live_stats.js
===================

Server
------

To serve up data to live_stats.js you need any WebSocket server tech and simply send a regular stream of data as JSON in the following format...

```
{
    "group_1" : [{"name" : "Sample A", "value": 10},
                 {"name" : "Sample B", "value": 20},
                 {"name" : "Sample C", "value": 35}],

    "group_2" : [{"name" : "Apples", "value": 100},
                 {"name" : "Bananas", "value": 2321}],

    "group_3" : [{"name" : "Beer", "value": 10},
                 {"name" : "Wine", "value": 200},
                 {"name" : "Whisky", "value": 100}],
}
```

Each "group" of data can be used to generate it's own chart and a group can have as many named numerical entries as you need.

Client
------

After you include live_stats.js in your application generating charts is a two step process, connect to the data source and then decide what type of chart you want for each of the groups being sent to you.

```
// Establish a connection to a WebSocket Server
var connection = live_charts.connect_to_data_source("ws://localhost:8080",
    // This function gets called once a stream of data starts
    //  with the names of the groups of data passed in.
    function(data_groups){

        // The data_source atribute determines which group from the data stream
        // is used, if the values in that group change the chart updates
        // The bind() function actually creates the chart in the selector specified
        test_line = connection.line_chart()
                              .width(400)
                              .height(500)
                              .data_source(data_groups[0])
                              .bind("#test_1");

        test_bar = connection.bar_chart()
                             .width(200)
                             .height(300)
                             .data_source(data_groups[1])
                             .bind("#test_2");

       test_pie = connection.pie_chart()
                             .width(300)
                             .height(300)
                             .data_source(data_groups[2])
                             .bind("#test_2");
    });
```

Currently three types of charts are supported

* Pie Charts
* Horizontal Bar Charts
* Stacked Line Charts

