;(function ($, d3, L, console, window, undefined) {
  'use strict';

  var $doc = $(document),
      Modernizr = window.Modernizr;


  var result;
  var stimmbezirke;
  var svg;
  var metricLabels = {};
  var xOption, yOption;


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
      xOption = $('#x').val();
      yOption = $('#y').val();
      renderData(stimmbezirke, result);
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
  var w = 500 - margin.l - margin.r;
  var h = 540 - margin.t - margin.b;
  var x = d3.scale.linear().range([0, w]);
  var y = d3.scale.linear().range([h - 60, 0]);
  //colors that will reflect geographical regions
  //var color = d3.scale.category10();
  var radius = 3;
  var dotAlpha = 0.3;


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


  // what happens when we leave a bubble?
  var resetCircleHighlights = function() {
    $('#tooltip').empty();
    d3.select('circle.highlight')
      .classed('highlight', false)
      .transition()
      .duration(800)
      .style("opacity", dotAlpha)
      .attr("r", radius)
      .ease("elastic");
  };

  // what to do when we mouse over a bubble
  var mouseOn = function() {
    resetCircleHighlights();
    var circle = d3.select(this);
    // transition to increase size/opacity of bubble
    circle.classed('highlight', true)
      .transition()
      .duration(800)
      .style("opacity", 1)
      .attr("r", radius + 5)
      .ease("elastic");

    var currentAreaId = $(circle[0]).attr('id');
    var tooltipHtml = '<p><b>Stadtbezirk '+ result[currentAreaId].StadtbezirkName +', Stadtteil '+ result[currentAreaId].StadtteilName +', Stimmbezirk ' + currentAreaId + '</b></p>';
    tooltipHtml += '<p>'+ metricLabels[xOption]+': <b>'+ result[currentAreaId][xOption] +'</b><br>';
    tooltipHtml += metricLabels[yOption]+': <b>'+ result[currentAreaId][yOption] +'</b></p>';
    $('#tooltip').append(tooltipHtml);
    showMap('#tooltip', currentAreaId);

    // function to move mouseover item to front of SVG stage, in case
    // another bubble overlaps it
    d3.selection.prototype.moveToFront = function() {
      return this.each(function() {
        this.parentNode.appendChild(this);
      });
    };

  };

  // bring in the data, and do everything that is data-driven
  var renderData = function(areas, results) {
    $('#chart').empty();
    svg = d3.select("#chart").append("svg")
      .attr("width", w + margin.l + margin.r)
      .attr("height", h + margin.t + margin.b);

    var xminmax = d3.extent(areas, function(d) { return results[d][xOption]; });
    var yminmax = d3.extent(areas, function(d) { return results[d][yOption]; });

    // set scale range
    x.domain([xminmax[0] - (xminmax[1] - xminmax[0]) * 0.05, xminmax[1] + (xminmax[1] - xminmax[0]) * 0.05]);
    y.domain([yminmax[0] - (yminmax[1] - yminmax[0]) * 0.05, yminmax[1] + (yminmax[1] - yminmax[0]) * 0.05]);

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
        id: function(d) { return d; },
        opacity: dotAlpha
      })
      .style('fill', '#0e6399');

    
    // run the mouseon/out functions
    circles.on("mouseover", mouseOn);
    //circles.on("mouseout", mouseOff);

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
      .text(xOption);

    svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("x", -20)
      .attr("y", 45)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text(yOption);
  };

  /**
   * Add a map to the target selection
   * centered on lon, lat
   */
  var showMap = function(selection, areaId){
    $(selection).append('<div id="map" style="height: 250px"></div>');
    var map = L.map('map').setView([result[areaId].Y, result[areaId].X], 13);
    L.tileLayer('http://{s}.ok.mycdn.de/tiles/v3/{z}/{x}/{y}.png', {
      attribution: 'Geodaten &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> Mitwirkende',
      maxZoom: 17
    }).addTo(map);
    var url = 'data/geojson/' + areaId + '.geojson';
    $.ajax({
      dataType: "json",
      url: url,
      cache: true,
      data: {},
      success: function(feature){
        var shape = L.geoJson(feature).addTo(map);
        map.fitBounds(shape.getBounds());
      }
    });
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
                  val = undefined;
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

    // fill selection and create labels
    $('select.selection').empty();
    var processed = false;
    var metrics = [];
    $.each(result[stimmbezirke[0]], function(key, val){
      // add label
      if (key.indexOf('Z_') === 0) {
        if (key.indexOf('_Proz') !== -1) {
          metricLabels[key] = 'Bundestagswahl 2013 > Anteil Zweitstimmen > ' + key.substr(2, key.length - 7);
        }
      } else if (key.indexOf('_Proz') !== -1) {
        metricLabels[key] = 'Bundestagswahl 2013 > Anteil Erststimmen > ' + key.substr(0, key.length - 5);
      }
      metrics.push(key);
    });
    metricLabels['Wahlbeteiligung'] = 'Bundestagswahl 2013 > Wahlbeteiligung';
    metricLabels['Wahlbeteiligung2009'] = 'Bundestagswahl 2009 > Wahlbeteiligung';
    metricLabels['X'] = 'Allgemein > Position > Längengrad';
    metricLabels['Y'] = 'Allgemein > Position > Breitengrad';
    metricLabels['AnteilAusländer'] = 'Allgemein > Ausländeranteil';
    metricLabels['AnteilFrauen'] = 'Allgemein > Frauenanteil';
    metricLabels['AnteilWahlberechtigte'] = 'Allgemein > Anteil Wahlberechtigte';
    metricLabels['Anteil18bis24Jahre'] = 'Allgemein > Anteil Wahlberechtige von 18 bis 24 Jahre';
    metricLabels['Anteil25bis34Jahre'] = 'Allgemein > Anteil Wahlberechtige von 25 bis 34 Jahre';
    metricLabels['Anteil35bis44Jahre'] = 'Allgemein > Anteil Wahlberechtige von 35 bis 44 Jahre';
    metricLabels['Anteil45bis59Jahre'] = 'Allgemein > Anteil Wahlberechtige von 45 bis 59 Jahre';
    metricLabels['AnteilAb60Jahre'] = 'Allgemein > Anteil Wahlberechtige ab 60 Jahre';
    metricLabels['ErststimmenAnteil_Sonstige_2009'] = 'Bundestagswahl 2009 > Anteil Erststimmen > Sonstige';
    metricLabels['ErststimmenAnteil_DIE_LINKE_2009'] = 'Bundestagswahl 2009 > Anteil Erststimmen > DIE LINKE';
    metricLabels['ErststimmenAnteil_FDP_2009'] = 'Bundestagswahl 2009 > Anteil Erststimmen > FDP';
    metricLabels['ErststimmenAnteil_GRUENE_2009'] = 'Bundestagswahl 2009 > Anteil Erststimmen > GRUENE';
    metricLabels['ErststimmenAnteil_CDU_2009'] = 'Bundestagswahl 2009 > Anteil Erststimmen > CDU';
    metricLabels['ErststimmenAnteil_SPD_2009'] = 'Bundestagswahl 2009 > Anteil Erststimmen > SPD';
    metricLabels['ZweitstimmenAnteil_Sonstige_2009'] = 'Bundestagswahl 2009 > Anteil Zweitstimmen > Sonstige';
    metricLabels['ZweitstimmenAnteil_DIE_LINKE_2009'] = 'Bundestagswahl 2009 > Anteil Zweitstimmen > DIE LINKE';
    metricLabels['ZweitstimmenAnteil_FDP_2009'] = 'Bundestagswahl 2009 > Anteil Zweitstimmen > FDP';
    metricLabels['ZweitstimmenAnteil_SPD_2009'] = 'Bundestagswahl 2009 > Anteil Zweitstimmen > SPD';
    metricLabels['ZweitstimmenAnteil_CDU_2009'] = 'Bundestagswahl 2009 > Anteil Zweitstimmen > CDU';
    metricLabels['ZweitstimmenAnteil_GRUENE_2009'] = 'Bundestagswahl 2009 > Anteil Zweitstimmen > GRUENE';

    metrics.sort(function(a, b){
      if (metricLabels[a] < metricLabels[b]) {
        return 1;
      } else if (metricLabels[a] > metricLabels[b]) {
        return -1;
      }
      return 0;
    });

    $.each(metrics, function(i, metric){
      if (metricLabels[metric]) {
        $('select.selection').append('<option value="'+ metric +'">'+ metricLabels[metric] +'</option>');
      }
    });

    // default selection
    $('#x').val('X');
    $('#y').val('Y');

    // render initial graph
    xOption = 'X';
    yOption = 'Y';
    renderData(stimmbezirke, result);
  });

  

})(jQuery, d3, L, console, this);
