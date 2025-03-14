
var global = {
  yMax: 0,
  height: 250
}

var margin = { top: 10, right: 50, bottom: 30, left: 20 },
  width = 800 - margin.left - margin.right;



Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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






function makeIncidence(data, selector) {

    var height = global.height;
    
    var svg = d3
      .select(selector)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + (margin.bottom ))
      .call(responsivefy)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var parseDate = d3.timeParse("%m/%d/%Y");

    var xScale = d3.scaleTime().range([0, width]);
    
    var mainChart = svg
      .append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.map(data, function (d) {
      d.thisDate = parseDate(d.week_ending);
    });



    var yMax = d3.extent(data, function (d) { 
        if (d.thisDate > parseDate('09/01/2021') ) {
          return Math.max(
            Number(d['age_all_ages']),
            Number(d['age_0_4']),
            Number(d['age_5_12']),
            Number(d['age_13_17']),
            Number(d['age_18_24'])
          );
        }
      })[1] + 10;
    
  
    xScale.domain(
      d3.extent(data, function (d) {
        return d.thisDate;
      })
    );
    xScale.domain([ new Date('09/01/2021'), xScale.domain()[1] ]);

    let endDate = xScale.domain()[1].toLocaleString("default", { year: 'numeric', month: 'long', day: 'numeric' } );
    
    d3.select('#week-end').html( endDate );

    var percent_5_12 = data[ data.length - 1 ]['age_5_12'] / data[ data.length - 1 ]['age_all_ages'] * 100;  
    percent_5_12 = percent_5_12.toPrecision(4) + '%';    
    d3.select('#week-percent').html( percent_5_12 );


    var yScale = d3.scaleSqrt()
        .domain([0, yMax]) // input 
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
        .attr("class", "dot " + age)
        .attr("cx", function(d, i) { return xScale( d.thisDate ) })
        .attr("cy", function(d) { return yScale(d[age]) })
        .attr("r", 2)
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


    var xAxis = d3.axisBottom(xScale).ticks().tickFormat( function(d) { 
      if ( d.getDate() < 29 ) return d3.timeFormat('%b \'%y')(d)
    });

    svg
      .append("g")
      .attr("id", "main-timeline")
      .attr("class", "axis axis--xScale")
      .attr("transform", "translate(0," + (height + (margin.bottom / 3)) + ")")
      .call(xAxis);

  function make_y_gridlines() {		
      return d3.axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(d => numberWithCommas(d) )
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







function makeWeeklyCases(data, selector) {

    var height = global.height;
    
    var svg = d3
      .select(selector)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .call(responsivefy)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var parseDate = d3.timeParse("%Y-%m-%d");

    var xScale = d3.scaleTime().range([0, width]);

    var xAxis = d3.axisBottom(xScale).ticks().tickFormat( function(d) { 
      if ( d.getDate() < 29 ) return d3.timeFormat('%b \'%y')(d)
    });
    

    var mainChart = svg
      .append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.map(data, function (d) {
      d.thisDate = parseDate(d['Week End']);
      d.Total = Number(d.Total);
      d.Students = Number(d.Students);
      d.Staff = Number(d.Staff);
    });


    xScale.domain([
      new Date('09/18/2021'),
      d3.max(data, function (d) {
        return d.thisDate;
      })
    ]);

    var yScale = d3.scaleSqrt()
        .range([height, 0]); // output 

    yScale.domain([0,
      d3.max(data, function (d) {
        return d.Total;
      }) + 110]
    );
    yMax = yScale.domain()[1];

   ['Total','Students','Staff'].forEach( function(age) {
  
    var line = d3.line()
        .x(function(d, i) { return xScale( d.thisDate ); })
        .y(function(d) { return yScale( d[age] ); })
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
        .attr("cy", function(d) { return yScale( d[age] ) })
        .attr("r", 3)
        .on("mouseover", function (d) {
          d3.select(this).attr("stroke", "#000000");
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(
              '<strong>' + age + 
              "</strong><br>Week ending " + d.thisDate.toLocaleString("default", { year: 'numeric', month: 'short', day: 'numeric' }) +             
              "<br>" + numberWithCommas( d[age] ) + " new cases"
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


    var xAxis = d3.axisBottom(xScale).ticks( d3.timeMonth.every(1),  d3.timeDate, 1 ).tickFormat( function(d) { 
      if ( d.getDate() < 29 ) return d3.timeFormat('%b \'%y')(d)
    });

    svg
      .append("g")
      .attr("id", "main-timeline")
      .attr("class", "axis axis--xScale")
      .attr("transform", "translate(0," + (height + (margin.bottom / 3)) + ")")
      .call(xAxis);

  function make_y_gridlines() {		
      return d3.axisLeft(yScale)
          .tickSize(-width)
  }
  
  // add the X gridlines
  mainChart.append("g")			
      .attr("class", "grid")
      .call( make_y_gridlines() )

}

d3.csv("https://raw.githubusercontent.com/pressnyc/nyc-doe-covid-interventions/main/csv/confirmed-cases-by-week.csv", function (data) {
  makeWeeklyCases(data,'#new-cases-by-week-chart');
});






  
  

function hospitalization(casedata, variable, selector, height, ticks, tiptext) {
    
    var parseCaseDate = d3.timeParse("%m/%d/%Y");

    d3.map(casedata, function (d) {
      var thisDate = parseCaseDate(d.Date);
      if (thisDate) {
        d.thisDate = thisDate;
        d.StudentsNum = Number( d[variable] );
      }
    });
    
    var yMax = d3.max(casedata, function (d) { return d.StudentsNum; });;
        
    var svg = d3
      .select(selector)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .call(responsivefy)
      .append("g")
      .attr("transform", "translate(" + margin.left + ",5)");

    var xScale = d3.scaleTime().range([0, width]),
      yScale = d3.scaleLinear().range([height, 0]);

    var xAxis = d3.axisBottom(xScale).ticks( ).tickFormat( function(d) { 
      if ( d.getDate() < 29 ) return d3.timeFormat('%b \'%y')(d)
    });
    
    var yAxis = d3.axisLeft(yScale).ticks( ticks );
    
    
    var mainChart = svg
      .append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    xScale.domain(
      d3.extent(casedata, function (d) {
        return d.thisDate;
      })
    );

    var previous_case_datum = null;

    var loopDate = new Date( xScale.domain()[0] );
    while(loopDate < xScale.domain()[1]){

       var case_data_exists = 0;
       casedata.forEach( function (d,i){
         if ( (d.thisDate) && (d.thisDate.valueOf() == loopDate.valueOf() ) ) {
            previous_case_datum = d;
            case_data_exists = 1;
            return true;
         }
       });

      if ((case_data_exists == 0) && (previous_case_datum !== null)) {
        var thisDatum = { ...previous_case_datum };
        thisDatum.thisDate = new Date( loopDate );
        casedata.push(thisDatum);
      }

      var newDate = loopDate.setDate(loopDate.getDate() + 1);
      loopDate = new Date(newDate);
    }
    
    var time_difference = xScale.domain()[1] - xScale.domain()[0];  
    var days_difference = time_difference / (1000 * 60 * 60 * 24);  
    var barW = width / days_difference;

    yScale.domain([0, yMax]);


    var stack = d3.stack().keys(['StudentsNum']);
    var series = stack(casedata);
  
    var groups = mainChart.selectAll("g").data(series).enter().append("g").attr('id','all_cases_id');

    groups
      .selectAll("rect")
      .data(function (d) {
        return d;
      })
      .enter()
      .append("rect")
      .attr("class", "cases_all")
      .attr("x", function (d,i) {
        if (d.data.thisDate) {
          return xScale(d.data.thisDate);
        }
      })
      .attr("y", function (d) {
        if (yScale(d[1])) {
          return yScale(d[1]);
        }
      })
      .attr("width", barW)
      .attr("height", function (d) {
          return yScale(0) - yScale(d[1]);
      })
      .on("mouseover", function (d) {
        d3.select(this).attr("stroke", "black");
        d3.select(this).attr("stroke-width", "1");
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            d.data.thisDate.toLocaleString("default", { year: 'numeric', month: 'short', day: 'numeric' }) +             
            "<br>" + numberWithCommas(d[1] - d[0]) + tiptext)
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
          .ticks( ticks )
  }
  
  // add the X gridlines
  mainChart.append("g")			
      .attr("class", "grid")
      .call(
        make_y_gridlines()
          .tickSize(-width)
          .tickFormat("")
      );
 
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
  d3.csv("https://raw.githubusercontent.com/pressnyc/coronavirus-data/master/pressnyc/csv/hospitalization-and-death.csv", function (casedata) {
    hospitalization(casedata, 'Hospitalization, 0-17', '#hospitalization', 175, 5, ' children hospitalized');
    hospitalization(casedata, 'Death Count, 0-17', '#death', 100, 3, ' child deaths');
});









function makeChart(data, variable, selector, limit) {

    var parseDate = d3.timeParse("Confirmed Positive COVID Cases, %B %d, %Y at 6 PM");

    d3.map(data, function (d) {
      d.thisDate = parseDate(d.Title);
    });



    if (limit) {      
        let cutoff = new Date();
        cutoff.setDate( cutoff.getDate() - limit );
        data = data.filter(d => d.thisDate >= cutoff);     
    }


    var height = 0;
    
    var yMax = d3.max(data, function (d) { return Number(d[variable]); });;

    if (global.yMax == 0) {
      height = global.height - margin.top - margin.bottom;
    } else {      
      height = ( global.height - margin.top - margin.bottom )  * yMax / global.yMax ;    
    }

    if (limit) {      
      height = 150;
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


    var xScale = d3.scaleTime().range([0, width]),
      yScale = d3.scaleSqrt().range([height, 0]);

    if (limit) {      
      yScale = d3.scaleLinear().range([height, 0]);
    }


    var xAxis = d3.axisBottom(xScale).ticks( ).tickFormat( function(d) { 
      if ( d.getDate() < 29 ) return d3.timeFormat('%b \'%y')(d)
    });
    
    var yAxis = d3.axisLeft(yScale).ticks( 10 );

    if (limit) {
        xAxis = d3.axisBottom(xScale).ticks( d3.timeDay.every(2),  d3.timeDate, 1 ).tickFormat( function(d) { 
              if ( d.getDate() < 29 ) return d3.timeFormat('%b %e')(d)
            });    
    }

    function colors(category) {
      var catNumbers = ["Students", "Staff"],
        catColors = ["#c00", "#f48f0f"];
      return catColors[catNumbers.indexOf(category) % catColors.length];
    }

    var mainChart = svg
      .append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
            "<br>" + numberWithCommas(d[1] - d[0]) + " Cases")
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
          .ticks( 10 )
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





// All Confirmed Positive COVID Student Cases (red) and Cases Found By In-School Testing (purple)

function schoolTestingCases(casedata, selector) {

    var height = 175;
    
    margin.left = 25;


    const startDate = new Date('2022-09-08T00:00:00');
    
    var parseCaseDate = d3.timeParse("Confirmed Cumulative Positive COVID Cases: September 13, 2021 - %B %d, %Y at 6 PM");
    var parseCaseDateAlt = d3.timeParse("Cumulative Reported Cases: September 13, 2021 - %B %d, %Y at 6 PM");

    d3.map(casedata, function (d) {
      var thisDate = parseCaseDate(d.Title);
      if (thisDate && thisDate >= startDate) {
        d.thisDate = thisDate;
        d.StudentsNum = Number( d.Students.replace(',','') );
      }
      thisDate = parseCaseDateAlt(d.Title);
      if (thisDate && thisDate >= startDate) {
        d.thisDate = thisDate;
        d.StudentsNum = Number( d.Students.replace(',','') );
      }
    });
          
    var last_date = parseCaseDateAlt( casedata[0]['Title']);
    if (last_date) {
      d3.select('#cumulative-date').html( last_date.toLocaleString("default", { year: 'numeric', month: 'long', day: 'numeric' }) );
    }

    var yMax = d3.max(casedata, function (d) { return d.StudentsNum; });;
        
    var svg = d3
      .select(selector)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .call(responsivefy)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var xScale = d3.scaleTime().range([0, width]),
      yScale = d3.scaleLinear().range([height, 0]);

    var xAxis = d3.axisBottom(xScale).ticks( d3.timeDay.every(7),  d3.timeDate, 1 ).tickFormat( function(d) { 
      if ( d.getDate() < 29 ) return d3.timeFormat('%b %e')(d)
    });
    
    var yAxis = d3.axisLeft(yScale).ticks( 10 );
    
    
    var mainChart = svg
      .append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    xScale.domain([startDate,
      d3.extent(casedata, function (d) {
        return d.thisDate;
      })[1] ]
    );


    

    var previous_case_datum = null;

    var loopDate = startDate;
    
    while(loopDate <= xScale.domain()[1]){


       var case_data_exists = 0;
       casedata.forEach( function (d,i){

         if (d.thisDate) {
          console.log( d.thisDate.valueOf(), loopDate.valueOf() );
         } 

         if ( (d.thisDate) && (d.thisDate.valueOf() == loopDate.valueOf() ) ) {
            previous_case_datum = d;
            case_data_exists = 1;
            return true;
         }
       });

      if ((case_data_exists == 0) && (previous_case_datum !== null)) {
        var thisDatum = { ...previous_case_datum };
        thisDatum.thisDate = new Date( loopDate );
        casedata.push(thisDatum);
      }
      
      loopDate = loopDate.addDays(1);
    }
    

    var time_difference = xScale.domain()[1] - xScale.domain()[0];  
    var days_difference = time_difference / (1000 * 60 * 60 * 24);  
    var barW = width / days_difference;

    yScale.domain([175000, yMax]);

    var stack = d3.stack().keys(['StudentsNum']);
    var series = stack(casedata);
    
    var groups = mainChart.selectAll("g").data(series).enter().append("g").attr('id','all_cases_id');

    groups
      .selectAll("rect")
      .data(function (d) {
        return d;
      })
      .enter()
      .append("rect")
      .attr("class", "cases_all")
      .attr("x", function (d,i) {
          return xScale(d.data.thisDate);
      })
      .attr("y", function (d) {
          return yScale(d[1]);
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
            "<br>" + numberWithCommas(d[1] - d[0]) + " COVID-19 cases")
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
            .ticks( 10 )
    }
  
  // add the X gridlines
  mainChart.append("g")			
      .attr("class", "grid")
      .call(
        make_y_gridlines()
          .tickSize(-width)
          .tickFormat("")
      )
}

  d3.csv("https://raw.githubusercontent.com/pressnyc/nyc-doe-covid-interventions/main/csv/confirmed-cases-cumulative.csv", function (casedata) {
    schoolTestingCases(casedata, '#school-testing-cases');
  });







function hospitalization_daily(casedata, selector, height, ticks) {
    
    var parseCaseDate = d3.timeParse("%m/%d/%Y");


    // https://www.d3-graph-gallery.com/graph/barplot_stacked_basicWide.html    
    // "Hospitalization, 0-4","Hospitalization, 5-12","Hospitalization, 13-17"

    d3.map(casedata, function (d) {
      var thisDate = parseCaseDate(d.Date);
      if (thisDate) { d.thisDate = thisDate; }
    });
        
    var svg = d3
      .select(selector)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .call(responsivefy)
      .append("g")
      .attr("transform", "translate(" + margin.left + ",5)");

    var xScale = d3.scaleTime().range([0, width]),
      yScale = d3.scaleSqrt().range([height, 0]);

    var xAxis = d3.axisBottom(xScale).ticks().tickFormat( function(d) { 
      if ( d.getDate() < 29 ) return d3.timeFormat('%b \'%y')(d)
    });
    
    var yAxis = d3.axisLeft(yScale).ticks( ticks );
    
    var mainChart = svg
      .append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    xScale.domain(
      d3.extent(casedata, function (d) {
        return d.thisDate;
      })
    );
    
    var time_difference = xScale.domain()[1] - xScale.domain()[0];  
    var days_difference = time_difference / (1000 * 60 * 60 * 24);  
    var barW = width / days_difference;

    var subgroups = casedata.columns.slice(4,5)

    yScale.domain(
      d3.extent(casedata, function (d) {
        return Number(d['Hospitalization, 0-17']);
      })
    );


    var stack = d3.stack().keys(subgroups)(casedata);
   
    mainChart.append("g")
    .selectAll("g")
    .data(stack)
    .enter().append("g")
      .selectAll("rect")       
      .data(function(d) { return d; })
      .enter()
        .append("rect")
        .attr("class", "cases_all")
        .attr("x", function (d,i) { return xScale( casedata[i].thisDate ) })
        .attr("y", function (d) { return yScale(d[1]) })
        .attr("width", barW)
        .attr("height", function(d) {
          return yScale(d[0]) - yScale(d[1]);  
        })
        .on("mouseover", function (d, i) {

          var tiptext = " children hospitalized";
          if (d.data["Hospitalization, 0-17"] == 1) {
            tiptext = " child hospitalized";          
          }
                    
          d3.select(this).attr("stroke", "black");
          d3.select(this).attr("stroke-width", "1");
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(
              d.data.thisDate.toLocaleString("default", { year: 'numeric', month: 'short', day: 'numeric' }) +             
              "<br>" + d.data["Hospitalization, 0-17"] + tiptext
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


/*
    var subgroups = casedata.columns.slice(1,4)

    var color = d3.scaleOrdinal()
      .domain(subgroups)
      .range(['#e44a1c','#377eb8','#4daf4a'])

    yScale.domain(
      d3.extent(casedata, function (d) {
        return Number(d['Hospitalization, 0-17']);
      })
    );


    var stack = d3.stack().keys(subgroups)(casedata);
   
    mainChart.append("g")
    .selectAll("g")
    .data(stack)
    .enter().append("g")
      .attr("fill", function(d) { return color(d.key); })
      .selectAll("rect")       
      .data(function(d) { return d; })
      .enter()
        .append("rect")
        .attr("x", function (d,i) { return xScale( casedata[i].thisDate ) })
        .attr("y", function (d) { return yScale(d[1]) })
        .attr("width", barW)
        .attr("height", function(d) {
          return yScale(d[0]) - yScale(d[1]);  
        })
        .on("mouseover", function (d, i) {
                    
          d3.select(this).attr("stroke", "black");
          d3.select(this).attr("stroke-width", "1");
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(
              d.data.thisDate.toLocaleString("default", { year: 'numeric', month: 'short', day: 'numeric' }) +             
//              "<br>" + numberWithCommas(d[1] - d[0]) 
              "<br>Age 0-4: " + d.data["Hospitalization, 0-4"] +
              "<br>Age 5-12: " + d.data["Hospitalization, 5-12"] +
              "<br>Age 13-17: " + d.data["Hospitalization, 13-17"] +         
              "<br>Age 0-17: " + d.data["Hospitalization, 0-17"]            
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
*/



    mainChart
      .append("g")
      .attr("id", "main-timeline")
      .attr("class", "axis axis--xScale")
      .attr("transform", "translate("+ barW / 2 +"," + height + ")")
      .call(xAxis);

    mainChart.append("g").attr("class", "axis axis--yScale").call(yAxis);

  function make_y_gridlines() {		
      return d3.axisLeft(yScale)
          .ticks( ticks )
  }
  
  // add the X gridlines
  mainChart.append("g")			
      .attr("class", "grid")
      .call(
        make_y_gridlines()
          .tickSize(-width)
          .tickFormat("")
      );
 
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
  d3.csv("https://raw.githubusercontent.com/pressnyc/coronavirus-data/master/pressnyc/csv/hospitalization-and-death-daily.csv", function (casedata) {
    hospitalization_daily(casedata, '#hospitalization-daliy', 175, 5);
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

    var xAxis = d3.axisBottom(xScale).ticks( d3.timeDay.every(14), d3.timeDate, 1 ).tickFormat( function(d) { 
      if ( d.getDate() < 29 ) return d3.timeFormat('%b %e')(d)
    });
    
    
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
    xScale.domain([ parseDate('9/12/2022'), xScale.domain()[1].addDays(1) ]);

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

