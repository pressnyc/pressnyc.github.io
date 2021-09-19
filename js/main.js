
var global = {
  yMax: 0,
  height: 250
}


function makeChart(data, variable, selector) {

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




    var margin = { top: 0, right: 50, bottom: 50, left: 20 },
      width = 800 - margin.left - margin.right;

    var height = 0;
    var yMax = d3.max(data, function (d) { return Number(d[variable]); });;

    if (global.yMax == 0) {
      height = global.height - margin.top - margin.bottom;
    } else {      
      height = ( global.height * yMax / global.yMax ) - margin.top - margin.bottom;    
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

    var xAxis = d3.axisBottom(xScale),
      yAxis = d3.axisLeft(yScale);

    function colors(category) {
      var catNumbers = ["Students", "Staff"],
        catColors = ["red", "orange"];
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

    var time_difference = xScale.domain()[1] - xScale.domain()[0];  
    var days_difference = time_difference / (1000 * 60 * 60 * 24);  
    var barW = width / days_difference;

    yScale.domain([0, yMax]);

    var div = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

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
        div.transition().duration(200).style("opacity", 0.9);
        div
          .html(
            d.data.thisDate.toLocaleString("default", { year: 'numeric', month: 'short', day: 'numeric' }) +             
            "<br>" + (d[1] - d[0]) + " Cases")
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY - 50 + "px")
          .attr("class", "tiptext");
      })
      .on("mouseout", function (d) {
        d3.select(this).attr("stroke-width", "0");
        div.transition().duration(250).style("opacity", 0);
      });


    mainChart
      .append("g")
      .attr("id", "main-timeline")
      .attr("class", "axis axis--xScale")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    mainChart.append("g").attr("class", "axis axis--yScale").call(yAxis);

}


d3.csv("https://raw.githubusercontent.com/pressnyc/nyc-doe-covid-interventions/main/csv/confirmed-cases-daily.csv", function (data) {
  makeChart(data,'Students','#students');
  makeChart(data,'Staff','#staff');
});
