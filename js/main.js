
var global = {
  yMax: 0,
  height: 250
}

var margin = { top: 0, right: 50, bottom: 25, left: 20 },
  width = 800 - margin.left - margin.right;



Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}


function responsivefy(svg) {
  var container = d3.select(svg.node().parentNode),
    width = parseInt(svg.style("width")),
    height = parseInt(svg.style("height")),
    aspect = width / height;
  svg.attr("viewBox", "0 0 " + width + " " + height)
      .attr("perserveAspectRatio", "xMinYMid")
      .call(resize);
  d3.select(window).on("resize." + container.attr("id"), resize);
  function resize() {
    var targetWidth = parseInt(container.style("width"));
    svg.attr("width", targetWidth);
    svg.attr("height", Math.round(targetWidth / aspect));
  }
}



var tooltip = d3.select("body").append("div").attr("class", "tooltip");


function makeChart(data, variable, selector) {

    var height = 0;
    var yMax = d3.max(data, function (d) { return Number(d[variable]); });;

    if (global.yMax == 0) {
      height = global.height - margin.top - margin.bottom;
    } else {      
      height = ( global.height - margin.top - margin.bottom )  * yMax / global.yMax ;    
    }
    global.yMax = yMax;

    
    var svg = d3
      .select(selector)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .call(responsivefy)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var parseDate = d3.timeParse("Confirmed Positive COVID Cases: %B %d, %Y as of 6 PM");

    var xScale = d3.scaleTime().range([0, width]),
      yScale = d3.scaleLinear().range([height, 0]);

    var xAxis = d3.axisBottom(xScale).ticks(d3.timeDay.every(4),  d3.timeDate, 1).tickFormat(d3.timeFormat('%b %e'));
    
    var yAxis = d3.axisLeft(yScale).ticks( yMax / 100 * 5);


    function colors(category) {
      var catNumbers = ["Students", "Staff"],
        catColors = ["#c00", "#f48f0f"];
      return catColors[catNumbers.indexOf(category) % catColors.length];
    }

    var mainChart = svg
      .append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.map(data, function (d) {
      d.thisDate = parseDate(d.Title);
    });

    var stack = d3.stack().keys([variable]);
    var series = stack(data);

    xScale.domain(
      d3.extent(data, function (d) {
        return d.thisDate;
      })
    );
    xScale.domain([ xScale.domain()[0].addDays(-1), xScale.domain()[1].addDays(1) ]);

    var time_difference = xScale.domain()[1] - xScale.domain()[0];  
    var days_difference = time_difference / (1000 * 60 * 60 * 24);  
    var barW = width / days_difference;

    yScale.domain([0, yMax]);

    var groups = mainChart.selectAll("g").data(series).enter().append("g");


    groups
      .selectAll("rect")
      .data(function (d) {
        return d;
      })
      .enter()
      .append("rect")
      .attr("id", "bar")
      .attr("fill", function (d) {
        return colors(d3.select(this.parentNode).datum().key);
      })
      .attr("x", function (d) {
        return xScale(d.data.thisDate);
      })
      .attr("y", function (d) {
        if (yScale(d[1])) {
          return yScale(d[1]);
        }
      })
      .attr("width", barW)
      .attr("height", function (d) {
        return yScale(d[0]) - yScale(d[1]);
      })
      .on("mouseover", function (d) {
        d3.select(this).attr("stroke", "black");
        d3.select(this).attr("stroke-width", "1");
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            d.data.thisDate.toLocaleString("default", { year: 'numeric', month: 'short', day: 'numeric' }) +             
            "<br>" + (d[1] - d[0]) + " Cases")
          .style("left", function() { 
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
            if ( d3.event.pageX > vw - 200 ) {
               return d3.event.pageX - 200 + "px"            
            } else {
               return d3.event.pageX + "px"
            }
          })
          .style("top", d3.event.pageY - 50 + "px")
          .attr("class", "tiptext");
      })
      .on("mouseout", function (d) {
        d3.select(this).attr("stroke-width", "0");
        tooltip.transition().duration(250).style("opacity", 0);
      });



    mainChart
      .append("g")
      .attr("id", "main-timeline")
      .attr("class", "axis axis--xScale")
      .attr("transform", "translate("+ barW / 2 +"," + height + ")")
      .call(xAxis);

    mainChart.append("g").attr("class", "axis axis--yScale").call(yAxis);


  function make_y_gridlines() {		
      return d3.axisLeft(yScale)
          .ticks( yMax / 100 * 5 )
  }
  
  // add the X gridlines
  mainChart.append("g")			
      .attr("class", "grid")
      .call(
        make_y_gridlines()
          .tickSize(-width)
          .tickFormat("")
      )


  function addLine(theDate) {
    mainChart
      .append("rect")
      .attr("class", "grid")
      .attr("x", function (d) {
        return xScale(new Date(theDate));
      })
      .attr("y", 0)
      .attr("width", 1)
      .attr("height", function (d) {
        return yScale(0) - yScale(global.yMax);
      })
      .style("opacity", 0.3);
  }

  if (variable == 'Students') {
    addLine('2021-09-13T00:00:00');
  }
  if (variable == 'Staff') {
    addLine('2021-09-09T00:00:00');
  }

}


d3.csv("https://raw.githubusercontent.com/pressnyc/nyc-doe-covid-interventions/main/csv/confirmed-cases-daily.csv", function (data) {
  makeChart(data,'Students','#students');
  makeChart(data,'Staff','#staff');
});






function makeAttendance(data, variable, selector) {

    var height = global.height * .5;
    var yMax = 110;
    
    var svg = d3
      .select(selector)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .call(responsivefy)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var parseDate = d3.timeParse("%m/%d/%Y");

    var xScale = d3.scaleTime().range([0, width]),
      yScale = d3.scaleLinear().range([height, 0]);

    var xAxis = d3.axisBottom(xScale).ticks(d3.timeDay.every(4),  d3.timeDate, 1).tickFormat(d3.timeFormat('%b %e'));
    
    var yAxis = d3.axisLeft(yScale).ticks( yMax / 100 * 5);


    function colors(category) {
      var catNumbers = ["Attendance"],
        catColors = ["#c00",];
      return catColors[catNumbers.indexOf(category) % catColors.length];
    }

    var mainChart = svg
      .append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.map(data, function (d) {
      d.thisDate = parseDate(d.Date);
    });

    var stack = d3.stack().keys([variable]);
    var series = stack(data);

    xScale.domain(
      d3.extent(data, function (d) {
        return d.thisDate;
      })
    );
    xScale.domain([ xScale.domain()[0].addDays(-1), xScale.domain()[1].addDays(1) ]);

    var time_difference = xScale.domain()[1] - xScale.domain()[0];  
    var days_difference = time_difference / (1000 * 60 * 60 * 24);  
    var barW = width / days_difference;

    yScale.domain([0, yMax]);

    var groups = mainChart.selectAll("g").data(series).enter().append("g");


    groups
      .selectAll("rect")
      .data(function (d) {
        return d;
      })
      .enter()
      .append("rect")
      .attr("id", "bar")
      .attr("fill", function (d) {
        return colors(d3.select(this.parentNode).datum().key);
      })
      .attr("x", function (d) {
        return xScale(d.data.thisDate);
      })
      .attr("y", function (d) {
        if (yScale(d[1])) {
          return yScale(d[1]);
        }
      })
      .attr("width", barW)
      .attr("height", function (d) {
        return yScale(d[0]) - yScale(d[1]);
      })
      .on("mouseover", function (d) {
            
        d3.select(this).attr("stroke", "black");
        d3.select(this).attr("stroke-width", "1");
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            d.data.thisDate.toLocaleString("default", { year: 'numeric', month: 'short', day: 'numeric' }) +             
            "<br>" + Number.parseFloat(d[1]).toPrecision(4)  + "%"
            )
          .style("left", function() { 
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
            if ( d3.event.pageX > vw - 200 ) {
               return d3.event.pageX - 200 + "px"            
            } else {
               return d3.event.pageX + "px"
            }
          })
          .style("top", d3.event.pageY - 50 + "px")
          .attr("class", "tiptext");
      })
      .on("mouseout", function (d) {
        d3.select(this).attr("stroke-width", "0");
        tooltip.transition().duration(250).style("opacity", 0);
      });

    mainChart
      .append("g")
      .attr("id", "main-timeline")
      .attr("class", "axis axis--xScale")
      .attr("transform", "translate("+ barW / 2 +"," + height + ")")
      .call(xAxis);

  function make_y_gridlines() {		
      return d3.axisLeft(yScale)
          .ticks( yMax / 100 * 5 )
          .tickSize(-width)
          .tickFormat(d => d + "%")
  }
  
  // add the X gridlines
  mainChart.append("g")			
      .attr("class", "grid")
      .call( make_y_gridlines() )

}


d3.csv("https://raw.githubusercontent.com/pressnyc/nyc-doe-covid-interventions/main/csv/daily-attendance-mean.csv", function (data) {
  makeAttendance(data,'Attendance','#attendance');
});






function makeIncidence(data, selector) {

    var height = global.height;
    var yMax = 110;
    
    var svg = d3
      .select(selector)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .call(responsivefy)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var parseDate = d3.timeParse("%m/%d/%Y");

    var xScale = d3.scaleTime().range([0, width]),
      yScale = d3.scaleLinear().range([height, 0]);

    var xAxis = d3.axisBottom(xScale).ticks(d3.timeDay.every(4),  d3.timeDate, 1).tickFormat(d3.timeFormat('%b %e'));
    
    var yAxis = d3.axisLeft(yScale).ticks( yMax / 100 * 5);

    var mainChart = svg
      .append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.map(data, function (d) {
      d.thisDate = parseDate(d.week_ending);
    });


    xScale.domain(
      d3.extent(data, function (d) {
        return d.thisDate;
      })
    );
    xScale.domain([ new Date('09/01/2021'), xScale.domain()[1] ]);

    var yScale = d3.scaleLinear()
        .domain([0, 260]) // input 
        .range([height, 0]); // output 



   ['age_all_ages','age_0_4','age_5_12','age_13_17','age_18_24'].forEach( function(age) {
  
    var line = d3.line()
        .x(function(d, i) { return xScale( d.thisDate ); })
        .y(function(d) { return yScale(d[age]); })
        .curve(d3.curveMonotoneX)

    svg.append("path")
        .datum(data)
        .attr("class", "line " + age)
        .attr("d", line);

    svg.selectAll("dot")
        .data(data)
      .enter().append("circle")
        .attr("stroke", "#ffffff")
        .attr("class", "dot " + age)
        .attr("cx", function(d, i) { return xScale( d.thisDate ) })
        .attr("cy", function(d) { return yScale(d[age]) })
        .attr("r", 3)
        .on("mouseover", function (d) {
          d3.select(this).attr("stroke", "#000000");
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(
              '<strong>' + age.replace('age_','Ages ').replace('_','–').replace('Ages all–ages','All of NYC') + 
              "</strong><br>Week ending " + d.thisDate.toLocaleString("default", { year: 'numeric', month: 'short', day: 'numeric' }) +             
              "<br>" + d[age] + " per 100K"
              )
            .style("left", function() { 
              const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
              if ( d3.event.pageX > vw - 200 ) {
                 return d3.event.pageX - 200 + "px"            
              } else {
                 return d3.event.pageX + "px"
              }
            })
            .style("top", d3.event.pageY - 50 + "px")
            .attr("class", "tiptext");
        })
        .on("mouseout", function (d) {
          d3.select(this).attr("stroke", "#ffffff");
          tooltip.transition().duration(250).style("opacity", 0);
        });

  });



    var xAxis = d3.axisBottom(xScale).ticks(d3.timeDay.every(7),  d3.timeDate, 1).tickFormat(d3.timeFormat('%b %e'));

    svg
      .append("g")
      .attr("id", "main-timeline")
      .attr("class", "axis axis--xScale")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  function make_y_gridlines() {		
      return d3.axisLeft(yScale)
          .ticks( yMax / 100 * 5 )
          .tickSize(-width)
          .tickFormat(d => d)
  }
  
  // add the X gridlines
  mainChart.append("g")			
      .attr("class", "grid")
      .call( make_y_gridlines() )


  function addLine(theDate) {
    mainChart
      .append("rect")
      .attr("class", "grid")
      .attr("x", function (d) {
        return xScale(new Date(theDate));
      })
      .attr("y", 0)
      .attr("width", 1)
      .attr("height", function (d) {
        return height;
      })
      .style("opacity", 0.3);
  }
  addLine('2021-09-13T00:00:00');

}

d3.csv("https://raw.githubusercontent.com/nychealth/coronavirus-data/master/trends/weekly-case-rate-age.csv", function (data) {
  makeIncidence(data,'#incidence');
});





