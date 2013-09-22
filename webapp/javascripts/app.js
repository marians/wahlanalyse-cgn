;(function ($, d3, console, window, undefined) {
  'use strict';

  var $doc = $(document),
      Modernizr = window.Modernizr;


  var result;
  var stimmbezirke;
  var svg;

  $(document).ready(function() {
    $.fn.foundationAlerts           ? $doc.foundationAlerts() : null;
    $.fn.foundationButtons          ? $doc.foundationButtons() : null;
    $.fn.foundationAccordion        ? $doc.foundationAccordion() : null;
    $.fn.foundationNavigation       ? $doc.foundationNavigation() : null;
    $.fn.foundationTopBar           ? $doc.foundationTopBar() : null;
    $.fn.foundationCustomForms      ? $doc.foundationCustomForms() : null;
    $.fn.foundationMediaQueryViewer ? $doc.foundationMediaQueryViewer() : null;
    $.fn.foundationTabs             ? $doc.foundationTabs({callback : $.foundation.customForms.appendCustomMarkup}) : null;
    $.fn.foundationTooltips         ? $doc.foundationTooltips() : null;
    $.fn.foundationMagellan         ? $doc.foundationMagellan() : null;
    $.fn.foundationClearing         ? $doc.foundationClearing() : null;
    $.fn.placeholder                ? $('input, textarea').placeholder() : null;

    // select listener
    $('select.selection').change(function(evt){
      var el = $(this);
      var id = el.attr('id');
      var val = el.val();
      renderData(stimmbezirke, result, $('#x').val(), $('#y').val());
    });
  });

  // Hide address bar on mobile devices (except if #hash present, so we don't mess up deep linking).
  if (Modernizr.touch && !window.location.hash) {
    $(window).load(function () {
      setTimeout(function () {
        window.scrollTo(0, 1);
      }, 0);
    });
  }

  // set the stage
  var margin = {t:30, r:20, b:20, l:40 };
  var w = $('#chart').width() - margin.l - margin.r;
  var h = 600 - margin.t - margin.b;
  var x = d3.scale.linear().range([0, w]);
  var y = d3.scale.linear().range([h - 60, 0]);
  //colors that will reflect geographical regions
  var color = d3.scale.category10();
  var radius = 4;


  // set axes, as well as details on their ticks
  var xAxis = d3.svg.axis()
    .scale(x)
    .ticks(20)
    .tickSubdivide(true)
    .tickSize(6, 3, 0)
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(y)
    .ticks(20)
    .tickSubdivide(true)
    .tickSize(6, 3, 0)
    .orient("left");


  // what to do when we mouse over a bubble
  var mouseOn = function() {
    var circle = d3.select(this);
    // transition to increase size/opacity of bubble
    circle.transition()
    .duration(800).style("opacity", 1)
    .attr("r", radius + 5).ease("elastic");

    var currentAreaId = $(circle[0]).attr('id');
    var tooltipHtml = '<h4>Stimmbezirk ' + currentAreaId + '</h4>';
    tooltipHtml += '<p>Stadtbezirk '+ result[currentAreaId].StadtbezirkName +', Stadtteil '+ result[currentAreaId].StadtteilName +'</p>';
    $('#tooltip').append(tooltipHtml);

    // append lines to bubbles that will be used to show the precise data points.
    // translate their location based on margins
    //svg.append("g")
    //    .attr("class", "guide")
    //.append("line")
    //    .attr("x1", circle.attr("cx"))
    //    .attr("x2", circle.attr("cx"))
    //    .attr("y1", +circle.attr("cy") + 26)
    //    .attr("y2", h - margin.t - margin.b)
    //    .attr("transform", "translate(40,20)")
    //    .style("stroke", circle.style("fill"))
    //    .transition().delay(200).duration(400).styleTween("opacity",
    //                function() { return d3.interpolate(0, 0.5); });
//
    //svg.append("g")
    //    .attr("class", "guide")
    //.append("line")
    //    .attr("x1", +circle.attr("cx") - 16)
    //    .attr("x2", 0)
    //    .attr("y1", circle.attr("cy"))
    //    .attr("y2", circle.attr("cy"))
    //    .attr("transform", "translate(40,30)")
    //    .style("stroke", circle.style("fill"))
    //    .transition().delay(200).duration(400).styleTween("opacity",
    //                function() { return d3.interpolate(0, 0.5); });

    // function to move mouseover item to front of SVG stage, in case
    // another bubble overlaps it
    d3.selection.prototype.moveToFront = function() {
      return this.each(function() {
        this.parentNode.appendChild(this);
      });
    };

  };

  // what happens when we leave a bubble?
  var mouseOff = function() {
    var circle = d3.select(this);

    // go back to original size and opacity
    circle.transition()
    .duration(800).style("opacity", 0.5)
    .attr("r", radius).ease("elastic");

    // fade out guide lines, then remove them
    //d3.selectAll(".guide")
    //  .transition()
    //  .duration(100)
    //  .styleTween(
    //    "opacity",
    //    function() { return d3.interpolate(0.5, 0); }
    //  )
    //  .remove();
    $('#tooltip').empty();
  };

  // bring in the data, and do everything that is data-driven
  var renderData = function(areas, results, xOption, yOption) {
    $('#chart').empty();
    svg = d3.select("#chart").append("svg")
      .attr("width", w + margin.l + margin.r)
      .attr("height", h + margin.t + margin.b);

    var xminmax = d3.extent(areas, function(d) { return results[d][xOption]; });
    var yminmax = d3.extent(areas, function(d) { return results[d][yOption]; });

    // set scale range
    x.domain([xminmax[0] - (xminmax[1] - xminmax[0]) * 0.03, xminmax[1] + (xminmax[1] - xminmax[0]) * 0.03]);
    y.domain([yminmax[0] - (yminmax[1] - yminmax[0]) * 0.03, yminmax[1] + (yminmax[1] - yminmax[0]) * 0.03]);

    // group that will contain all of the plots
    var groups = svg.append("g").attr("transform", "translate(" + margin.l + "," + margin.t + ")");

    // style the circles, set their locations based on data
    var circles = groups.selectAll("circle")
      .data(areas)
      .enter().append("circle")
      .attr("class", "circles")
      .attr({
        cx: function(d) { return x(results[d][xOption]); },
        cy: function(d) { return y(results[d][yOption]); },
        r: radius,
        id: function(d) { return d; }
      })
      .style('fill', '#f13e00');

    
    // run the mouseon/out functions
    circles.on("mouseover", mouseOn);
    circles.on("mouseout", mouseOff);

    // render raw graph background

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(" + margin.l + "," + (h - 60 + margin.t) + ")")
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + margin.l + "," + margin.t + ")")
      .call(yAxis);

    svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", w + 50)
      .attr("y", h - margin.t - 5)
      .text(yOption);

    svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("x", -20)
      .attr("y", 45)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text(xOption);
  };

  
  var ElectionResults = function(type) {
    // distinguishes between "stimmbezirk" and "stadtteil" results
    var resultType = type;
    // Strukturdaten
    var structureData = {};
    // will contain result data after loading
    var resultData = {};
    // list of parties which have been found in the result set
    var candidates = [];
    var reservedHeaders = [
      'Nr',
      'Name',
      'MaxSchnellmeldungen',
      'AnzSchnellmeldungen',
      'Wahlberechtigte',
      'abgegeben',
      'Wahlbeteiligung',
      'gültigeStimmzettel',
      'gültig',
      'ungültigeStimmzettel',
      'ungültig',
      'gültig2',
      'ungültig2'
    ];
    
    this.loadData = function(callback) {
      d3.csv('data/struktur_stimmbezirk.csv', function(d){
        $.each(d, function(i, item){
          structureData[item['StimmbezirkNr']] = {};
          $.each(item, function(key, val) {
            // manipulate value types
            if (key !== 'StimmbezirkNr') {
              if (val === '' || typeof val === 'undefined') {
                val = 0;
              } else if (val.indexOf('.') !== -1) {
                val = parseFloat(val);
              } else if (val.match(/^\d+$/)) {
                val = parseInt(val, 10);
              }
            }
            structureData[item['StimmbezirkNr']][key] = val;
          });
        });
        // now load 2013 result data
        var url = 'data/result_stadtteil.csv';
        if (resultType == 'stimmbezirk') {
          url = 'data/result_stimmbezirk.csv';
        }
        var dsv = d3.dsv(';', 'text/plain');
        var headersParsed = false;
        dsv(url, function(d){
          $.each(d, function(i, item){
            // parse headers for candidates in the first run
            if (!headersParsed) {
              headersParsed = true;
              $.each(item, function(key, val) {
                var found = $.inArray(key, reservedHeaders) > -1;
                if (!found) {
                  if (key.indexOf('_Proz') == -1 &&
                    key.indexOf('Z_') !== 0) {
                    candidates.push(key);
                  }
                }
              });
              candidates.sort();
            }
            resultData[item['Nr']] = {};
            $.each(item, function(key, val) {
              //console.log(key, val);
              if (key !== 'Nr') {
                if (val === '' || typeof val === 'undefined') {
                  val = 0;
                } else if (val.indexOf(',') !== -1) {
                  val = parseFloat(val.replace(',', '.'));
                } else {
                  val = parseInt(val, 10);
                }
              }
              resultData[item['Nr']][key] = val;
            });
          });
          if (typeof callback !== 'undefined') {
            callback();
          }
        });
      });
    };

    /**
     * Return combined structure and result data
     */
    this.getCombinedResults = function(){
      var result = [];
      var ret = {};
      $.each(structureData, function(stimmbezirkId, item){
        ret[stimmbezirkId] = item;
        //console.log(stimmbezirkId, resultData[stimmbezirkId]);
        if (typeof resultData[stimmbezirkId] !== 'undefined') {
          $.each(resultData[stimmbezirkId], function(key, val){
            ret[stimmbezirkId][key] = val;
          });
        }
      });
      return ret;
    };

    /**
     * Return keys of Stimmbezirke
     */
    this.getAreas = function(){
      return Object.keys(structureData);
    };

  };

  var result_stimmbezirk = new ElectionResults('stimmbezirk');
  result_stimmbezirk.loadData(function(){
    stimmbezirke = result_stimmbezirk.getAreas();
    result = result_stimmbezirk.getCombinedResults();
    // fill selection
    $('select.selection').empty();
    var processed = false;
    $.each(result, function(stimmbezirkId, item){
      if (!processed) {
        var labels = [];
        $.each(item, function(key, val){
          labels.push(key);
        });
        labels.sort();
        $.each(labels, function(i, label){
          $('select.selection').append('<option value="'+ label +'">'+ label +'</option>');
        });
        $('#x').val('X');
        $('#y').val('Y');
        processed = true;
      }
    });
    //console.log(result);
    renderData(stimmbezirke, result, 'X', 'Y');
  });
  

})(jQuery, d3, console, this);
