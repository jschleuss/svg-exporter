require("babel-polyfill");

var express = require('express');
var router = express.Router();
var fs = require('fs');
var jsdom = require('jsdom');

var d3 = require('d3');
var XMLHttpRequest = require('xhr2')



// zoom level needs to be one higher than map.getZoom()
var mapOptions = {"startLat":34.108859554551266,"startLon":-118.10716241483492,"endLat":33.80361844536487,"endLon":-118.48524322955491,"zoomLevel":11,"layers_visible":["sources","roads_visible","roads_visible_highways","roads_visible_highway_ramps","roads_visible_major","roads_visible_ferry_route","roads_visible_taxi_and_runways","borders_visible","borders_visible_countries","borders_visible_disputed","borders_visible_states","borders_visible_counties","landuse_visible","landuse_visible_airports","landuse_visible_beach","landuse_visible_cemetery","landuse_visible_college","landuse_visible_forest","landuse_visible_hospital","landuse_visible_military","landuse_visible_park","landuse_visible_prison","landuse_visible_resort","landuse_visible_school","landuse_visible_stadium","landuse_visible_wetland","water_visible","water_visible_ocean","water_visible_inland_water"],"custom_labels":[],"lineFeatures":[{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[-118.18817138671875,33.963294809320224],[-118.31932067871094,33.887517493601685],[-118.27674865722655,33.81509581951251],[-118.23623657226562,33.86015274030232],[-118.26644897460938,33.87497640410958],[-118.21495056152342,33.89834695102012]]}}],"pointFeatures":[{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[-118.27606201171874,34.04924594193161]}},{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[-118.26850891113281,33.97582290387967]}},{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[-118.21289062499999,33.94392957889264]}},{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[-118.32412719726561,33.892647407997345]}},{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[-118.377685546875,33.99859652858635]}},{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[-118.25614929199219,33.85159945579106]}}],"polygonFeatures":[{"type":"Feature","properties":{"kind":"L.A. County Neighborhood (Current)","external_id":"east-hollywood","name":"East Hollywood","slug":"east-hollywood-la-county-neighborhood-current","set":"/1.0/boundary-set/la-county-neighborhoods-current/","metadata":{"sqmi":2.3787363778,"type":"segment-of-a-city","name":"East Hollywood","slug":"east-hollywood"},"resource_uri":"/1.0/boundary/east-hollywood-la-county-neighborhood-current/"},"geometry":{"type":"MultiPolygon","coordinates":[[[[-118.293009,34.10170899912326],[-118.289308,34.099508999123266],[-118.284208,34.09590899912338],[-118.284808,34.09590899912351],[-118.28450800000012,34.076809999123604],[-118.28570800000014,34.07680999912369],[-118.286908,34.07650999912369],[-118.289608,34.07640999912368],[-118.309309,34.07640999912364],[-118.309409,34.10160899912327],[-118.29460900000011,34.10180899912332],[-118.293009,34.10170899912326]]]]}}],"backgroundImg":"","coord-submit":"submit"};

// get mapzen api key from console
process.argv.forEach(function(val, index, array){
    if (val.indexOf('mapzen-') != -1) {
        mapOptions['apikey'] = val;
    }
});

// exports.handler = function(event, context, callback) {
    console.log(mapOptions);

    parseJSON(JSON.stringify(mapOptions));

    // set up land use groups for LAT
    var landusePark = ['national_park', 'battlefield', 'protected_area', 'nature_reserve', 'park', 'golf_course', 'recreation_ground', 'camp_site', 'garden', 'allotments', 'pitch', 'meadow', 'village_green', 'farmland', 'playground', 'attraction', 'artwork', 'wilderness_hut', 'hanami'],
        landuseForest = ['forest', 'wood', 'natural_wood', 'natural_forest'],
        landuseAirport = ['aerodrome'],
        landuseMilitary = ['military'],
        landuseUniversity = ['university', 'college'],
        landuseSchool = ['school'],
        landuseCemetery = ['cemetery', 'place_of_worship'],
        landuseHospital = ['hospital'],
        landuseStadium = ['stadium'],
        landuseResort = ['theme_park', 'resort', 'aquarium', 'winery', 'maze'],
        landuseBeach = ['beach'];

    function setupJson(dKinds) {
        // console.log(dKinds);

        var formattedJson = {};
        var dataKind = dKinds.join(',');

        // ocean
        if (mapOptions.layers_visible.indexOf('water_visible_ocean') != -1) {
            formattedJson['ocean'] = {
                ocean: {
                    features: []
                }
            }
        }

        // earth
        formattedJson['earth'] = {
            earth: {
                features: []
            }
        }

        // landuse
        if (mapOptions.layers_visible.indexOf('landuse_visible') != -1) {
            formattedJson['landuse'] = {}

            if (mapOptions.layers_visible.indexOf('landuse_visible_airports') != -1) {
                formattedJson['landuse']['airport'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('landuse_visible_beach') != -1) {
                formattedJson['landuse']['beach'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('landuse_visible_cemetery') != -1) {
                formattedJson['landuse']['cemetery'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('landuse_visible_college') != -1) {
                formattedJson['landuse']['university'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('landuse_visible_forest') != -1) {
                formattedJson['landuse']['forest'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('landuse_visible_hospital') != -1) {
                formattedJson['landuse']['hospital'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('landuse_visible_military') != -1) {
                formattedJson['landuse']['military'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('landuse_visible_park') != -1) {
                formattedJson['landuse']['park'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('landuse_visible_resort') != -1) {
                formattedJson['landuse']['resort'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('landuse_visible_school') != -1) {
                formattedJson['landuse']['school'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('landuse_visible_stadium') != -1) {
                formattedJson['landuse']['stadium'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('landuse_visible_prison') != -1) {
                formattedJson['landuse']['prison'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('landuse_visible_wetland') != -1) {
                formattedJson['landuse']['wetland'] = { features: [] }
            }
        } // landuse

        // borders
        if (mapOptions.layers_visible.indexOf('borders_visible') != -1) {
            formattedJson['boundaries'] = {}

            if (mapOptions.layers_visible.indexOf('borders_visible_countries') != -1) {
                formattedJson['boundaries']['country'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('borders_visible_disputed') != -1) {
                formattedJson['boundaries']['disputed'] = { features: [] }
                formattedJson['boundaries']['indefinite'] = { features: [] }
                formattedJson['boundaries']['interminate'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('borders_visible_states') != -1) {
                formattedJson['boundaries']['region'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('borders_visible_counties') != -1) {
                formattedJson['boundaries']['county'] = { features: [] }
            }
        }

        // water
        if (mapOptions.layers_visible.indexOf('water_visible') != -1) {
            formattedJson['water'] = {}

            if (mapOptions.layers_visible.indexOf('water_visible_inland_water') != -1) {
                formattedJson['water']['bay'] = { features: [] }
                formattedJson['water']['lake'] = { features: [] }
                formattedJson['water']['river'] = { features: [] }
                formattedJson['water']['riverbank'] = { features: [] }
                formattedJson['water']['stream'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('water_visible_swimming_pools') != -1) {
                formattedJson['water']['swimming_pool'] = { features: [] }
            }

            // need etc to grab other water
            formattedJson['water']['etc'] = { features: [] }
        }

        // buildings
        if (mapOptions.layers_visible.indexOf('buildings_visible') != -1) {
            formattedJson['buildings'] = {
                building: {
                    features: []
                }
            }
        }

        // roads
        if (mapOptions.layers_visible.indexOf('roads_visible') != -1) {
            formattedJson['roads'] = {}

            if (mapOptions.layers_visible.indexOf('roads_visible_ferry_route') != -1) {
                formattedJson['roads']['ferry'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('roads_visible_taxi_and_runways') != -1) {
                formattedJson['roads']['taxiway'] = { features: [] }
                formattedJson['roads']['runway'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('roads_visible_service') != -1) {
                formattedJson['roads']['service'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('roads_visible_minor') != -1) {
                formattedJson['roads']['minor_road'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('roads_visible_major') != -1) {
                formattedJson['roads']['major_road'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('roads_visible_highway_ramps') != -1) {
                formattedJson['roads']['highway_link'] = { features: [] }
            }
            if (mapOptions.layers_visible.indexOf('roads_visible_highways') != -1) {
                formattedJson['roads']['highway'] = { features: [] }
            }

        } // roads

        // check for uploaded features
        if (mapOptions['polygonFeatures'].length > 0) {
            formattedJson['polygonFeatures'] = {
                polygonFeatures: {
                    features: mapOptions['polygonFeatures']
                }
            }
        }
        if (mapOptions['lineFeatures'].length > 0) {
            formattedJson['lineFeatures'] = {
                lineFeatures: {
                    features: mapOptions['lineFeatures']
                }
            }
        }
        if (mapOptions['pointFeatures'].length > 0) {
            formattedJson['pointFeatures'] = {
                pointFeatures: {
                    features: mapOptions['pointFeatures']
                }
            }
        }

        return formattedJson;
    } // setupJson()

    function getTilesToFetch(startLat, endLat, startLon, endLon) {
        const tilesToFetch = [];
        // for(let i = startLon; i <= endLon; i++) lonArr.push(i);
        for(let j = startLat; j <= endLat; j++) {
            const coords = [];
            for(let i = startLon; i <= endLon; i++) {
                coords.push({
                    lat: j,
                    lon: i
                });
            }
            tilesToFetch.push(coords);
        }
        return tilesToFetch;
    }


    // function to fire up tile maker based on json options
    function parseJSON(req) {
        var options = JSON.parse(req);

        var zoom = parseInt(options.zoomLevel);

        var lat1 = lat2tile(parseFloat(options.startLat), zoom)
        var lat2 = lat2tile(parseFloat(options.endLat), zoom)

        var lon1 = long2tile(parseFloat(options.startLon), zoom)
        var lon2 = long2tile(parseFloat(options.endLon), zoom)

        if(lat1 > lat2) {
            startLat = lat2;
            endLat = lat1;
        } else {
            startLat = lat1;
            endLat = lat2;
        }

        if(lon1 > lon2) {
            startLon = lon2;
            endLon = lon1;
        } else {
            startLon = lon1;
            endLon = lon2;
        }

        var tileWidth = 100;

        // set up list of layers
        var dKinds = [];

        // push parent layers into array
        if (mapOptions.layers_visible.indexOf('water_visible_ocean') != -1) dKinds.push('ocean');
        dKinds.push('earth');
        if (mapOptions.layers_visible.indexOf('landuse_visible') != -1) dKinds.push('landuse');
        if (mapOptions.layers_visible.indexOf('water_visible') != -1) dKinds.push('water');
        if (mapOptions.layers_visible.indexOf('roads_visible') != -1) dKinds.push('roads');
        if (mapOptions.layers_visible.indexOf('buildings_visible') != -1) dKinds.push('buildings');


        var tilesToFetch = getTilesToFetch(startLat, endLat, startLon, endLon);

        var key = options.apikey || config.key;

        var delayTime = 100;

        var outputLocation = 'svgmap'+ tilesToFetch[0][0].lon +'-'+tilesToFetch[0][0].lat +'-'+zoom +'.svg';

        var data;

        var xCount = tilesToFetch.length-1;//latArr.length - 1;
        var yCount = tilesToFetch[0].length-1;//lonArr.length - 1;
        var originalYCount = yCount;

        function getURL(x, y) {
            var xc = x;
            var yc = y;
            if (x < 0) xc = 0;
            if (y < 0) yc = 0;

            return "https://tile.mapzen.com/mapzen/vector/v1/all/"+zoom+"/"+tilesToFetch[xc][yc].lon + "/" + tilesToFetch[xc][yc].lat + ".json?api_key="+key;
        }


        var jsonArray = [];

        function makeCall() {
            var request = new XMLHttpRequest();
            var url = getURL(xCount, yCount);
            console.log(url);
            request.open('GET', url, true);

            request.onload = function(e) {
                if (request.status >= 200 && request.status < 400) {
                    // Success!
                    var data = JSON.parse(request.responseText);
                    jsonArray.push(data);

                    if (xCount > 0) {
                        if (yCount > 0) {
                            yCount--;
                        } else {
                            xCount--;
                            yCount = originalYCount;
                        }
                        setTimeout(makeCall, delayTime);
                    } else {
                        if (xCount === 0) {
                            if (yCount > 0) {
                                yCount--;
                                setTimeout(makeCall, delayTime);
                            } else {
                                bakeJson(jsonArray);
                            }
                        }
                    }
                } else {
                    console.log('We reached our target server, but it returned an error')
                    console.log(e);
                    makeCall(); // try again if error
                }
            };

            request.onerror = function() {
                console.log('There was a connection error of some sort');
                // There was a connection error of some sort
            };
            request.send();
        }


        function bakeJson(resultArray) {
            var ids = [];

            console.log('bakeJson()');
            var geojsonToReform = setupJson(dKinds);
            // console.log(geojsonToReform);
            // response geojson array
            for (let result of resultArray) {
                // inside of one object
                for (let response in result) {
                    // console.log(response)
                    // if the property is one of dataKinds that user selected
                    if (dKinds.indexOf(response) > -1) {
                        let responseResult = result[response];
                        for (let feature of responseResult.features) {
                            // console.log(feature.properties);

                            // skip if a water tunnel or water intermittent
                            if (feature.properties.kind == 'stream' || feature.properties.kind == 'river') {
                                if (feature.properties.intermittent == true || feature.properties.is_tunnel == true) {
                                    break;
                                }
                            }

                            // segment off motorway_link
                            if (feature.properties.kind_detail == "motorway_link") {
                                var dataKindTitle = 'highway_link';
                            } else if (feature.properties.kind_detail == "service") {
                            // segment off service roads
                                var dataKindTitle = 'service';
                            } else if (feature.properties.kind_detail == "runway") {
                            // aeroway roads
                                var dataKindTitle = 'runway';
                            } else if (feature.properties.kind_detail == "taxiway") {
                                var dataKindTitle = 'taxiway';
                            } else if (landusePark.indexOf(feature.properties.kind) !== -1 ) {
                            // land uses
                                var dataKindTitle = 'park';
                            } else if (landuseForest.indexOf(feature.properties.kind) !== -1 ) {
                                var dataKindTitle = 'forest';
                            } else if (landuseAirport.indexOf(feature.properties.kind) !== -1 ) {
                                var dataKindTitle = 'airport';
                            } else if (landuseMilitary.indexOf(feature.properties.kind) !== -1 ) {
                                var dataKindTitle = 'military';
                            } else if (landuseUniversity.indexOf(feature.properties.kind) !== -1 ) {
                                var dataKindTitle = 'university';
                            } else if (landuseSchool.indexOf(feature.properties.kind) !== -1 ) {
                                var dataKindTitle = 'school';
                            } else if (landuseCemetery.indexOf(feature.properties.kind) !== -1 ) {
                                var dataKindTitle = 'cemetery';
                            } else if (landuseHospital.indexOf(feature.properties.kind) !== -1 ) {
                                var dataKindTitle = 'hospital';
                            } else if (landuseStadium.indexOf(feature.properties.kind) !== -1 ) {
                                var dataKindTitle = 'stadium';
                            } else if (landuseResort.indexOf(feature.properties.kind) !== -1 ) {
                                var dataKindTitle = 'resort';
                            } else if (landuseBeach.indexOf(feature.properties.kind) !== -1 ) {
                                var dataKindTitle = 'beach';
                            } else {
                                var dataKindTitle = feature.properties.kind;
                            }

                            if (geojsonToReform[response].hasOwnProperty(dataKindTitle)) {
                                geojsonToReform[response][dataKindTitle].features.push(feature);
                            } else if (feature.properties.kind == 'ocean') {
                                geojsonToReform['ocean']['ocean'].features.push(feature);
                            } else if (geojsonToReform[response].hasOwnProperty('etc')) {
                                geojsonToReform[response]['etc'].features.push(feature)
                            }
                            // else {
                            //     geojsonToReform[response]['etc'].features.push(feature)
                            // }
                        }
                    }
                }
            }
            console.log(geojsonToReform);
            writeSVGFile(geojsonToReform);
        }

        function writeSVGFile(reformedJson) {
            console.log('writeSVGFile()');
            //d3 needs query selector from dom
            jsdom.env({
                html: '',
                features: { QuerySelector: true }, //you need query selector for D3 to work
                done: function(errors, window) {

                    window.d3 = d3.select(window.document);

                    var svg = window.d3.select('body')
                                .append('div').attr('class','container') //make a container div to ease the saving process
                                .append('svg')
                                .attr({
                                    xmlns: 'http://www.w3.org/2000/svg',
                                    width: tileWidth * tilesToFetch[0].length,
                                    height: tileWidth* tilesToFetch.length
                                })

                    var previewProjection = d3.geo.mercator()
                                                    .center([tile2Lon(startLon, zoom), tile2Lat(startLat, zoom)])
                                                    //this are carved based on zoom 16, fit into 100px * 100px rect
                                                    .scale(600000* tileWidth/57.5 * Math.pow(2,(zoom-16)))
                                                    .precision(.0)
                                                    .translate([0, 0])

                    var previewPath = d3.geo.path().projection(previewProjection);

                    for (let dataK in reformedJson) {
                        let oneDataKind = reformedJson[dataK];
                        let g = svg.append('g')
                        g.attr('id',dataK)

                        for(let subKinds in oneDataKind) {
                            let tempSubK = oneDataKind[subKinds]
                            let subG = g.append('g')
                            subG.attr('id',subKinds.replace('_',''))
                            for(let f in tempSubK.features) {
                                let geoFeature = tempSubK.features[f]
                                let previewFeature = previewPath(geoFeature);

                                if(previewFeature && previewFeature.indexOf('a') > 0) ;
                                else {
                                    subG.append('path')
                                    .attr('d', previewFeature)
                                    .attr('fill','none')
                                    .attr('stroke','black')
                                }
                            }
                        }
                    }
                    // for (let dataK in reformedJson) {
                    //     let oneDataKind = reformedJson[dataK];
                    //     let g = svg.append('g')
                    //     g.attr('id',dataK)

                    //     for(let subKinds in oneDataKind) {
                    //         let tempSubK = oneDataKind[subKinds]
                    //         let subG = g.append('g')
                    //         subG.attr('id',slugify(subKinds))

                    //         for(let f in tempSubK.features) {

                    //             let geoFeature = tempSubK.features[f]
                    //             let previewFeature = previewPath(geoFeature);

                    //             // if(previewFeature && previewFeature.indexOf('a') > 0) ;
                    //             // else {
                    //             //   subG.append('path')
                    //             //     .attr('d', previewFeature)
                    //             //     .attr('fill','none')
                    //             //     .attr('stroke','black')
                    //             // }
                    //             // group by name
                    //             if (tempSubK.features[f].properties.hasOwnProperty('name')) {
                    //                 let featSlug = slugify(tempSubK.features[f].properties.name);

                    //                 // console.log(featSlug);
                    //                 // console.log(tempSubK.features[f].properties);
                    //                 // console.log(window.d3.select("#"+slugify(subKinds)).empty())

                    //                 // check if name group doesn't exist
                    //                 if (window.d3.select("#"+slugify(subKinds)+" #"+featSlug).empty()) {

                    //                     var nameG = subG.append('g');
                    //                     nameG.attr('id',featSlug);

                    //                 } else {
                    //                     // if group does exist
                    //                     nameG = window.d3.select("#"+slugify(subKinds)+" #"+featSlug);

                    //                 }
                    //                 if(previewFeature && previewFeature.indexOf('a') > 0) ;
                    //                 else {
                    //                     nameG.append('path')
                    //                         .attr('d', previewFeature)
                    //                         .attr('fill','none')
                    //                         .attr('stroke','black')
                    //                         .attr('stroke-width','1px');
                    //                 }

                    //             } else {
                    //                     if(previewFeature && previewFeature.indexOf('a') > 0) ;
                    //                     else {
                    //                         subG.append('path')
                    //                             .attr('d', previewFeature)
                    //                             .attr('fill','none')
                    //                             .attr('stroke','black')
                    //                             .attr('stroke-width','1px');
                    //                     }
                    //             }



                    //         }
                    //     }
                    // }

                    // // combine all earth tiles
                    var earthTiles = "";
                    window.d3.selectAll("#earth path").each(function(){
                        earthTiles += d3.select(this).attr("d");
                    });
                    // window.d3.selectAll("#earth").append("path").attr("d",earthTiles);

                    // // combine all riverbank tiles
                    // var riverbankPaths = "";
                    // window.d3.selectAll("#riverbank path").each(function(){
                    //     riverbankPaths += d3.select(this).attr("d");
                    //     d3.select(this).remove();
                    // });
                    // window.d3.selectAll("#riverbank").append("path").attr("d",riverbankPaths);


                    /* restyle anything in groups */

                    // roads
                    window.d3.selectAll('#highway path')
                        .attr('stroke','#A6A6A6')
                        .attr('stroke-width','2px');

                    window.d3.selectAll('#highwaylink path')
                        .attr('stroke','#BCBEC0 device-cmyk(0, 0, 0, 0.30)')
                        .attr('stroke-width','1px');

                    window.d3.selectAll('#majorroad path')
                        .attr('stroke','#BCBEC0 device-cmyk(0, 0, 0, 0.30)')
                        .attr('stroke-width','1px');

                    window.d3.selectAll('#minorroad path')
                        .attr('stroke','#CDCFD0')
                        .attr('stroke-width','0.65px');

                    window.d3.selectAll('#service path')
                        .attr('stroke','#CDCFD0')
                        .attr('stroke-width','0.65px');

                    window.d3.selectAll('#path path')
                        .attr('stroke','none')
                        .attr('stroke-width','0');

                    window.d3.selectAll('#rail path')
                        .attr('stroke','#CDCFD0')
                        .attr('stroke-width','0.65px');

                    window.d3.selectAll('#aerialway path')
                        .attr('stroke','#CDCFD0')
                        .attr('stroke-width','0.65px');

                    window.d3.selectAll('#ferry path')
                        .attr('stroke','#8AB1CD')
                        .attr('stroke-width','0.5px')
                        .attr('stroke-dasharray','1,1');

                    window.d3.selectAll('#etc path')
                        .attr('stroke','#CDCFD0')
                        .attr('stroke-width','0.65px');

                    window.d3.selectAll('#runway path')
                        .attr('stroke','#CDCFD0')
                        .attr('stroke-width','2px');

                    window.d3.selectAll('#taxiway path')
                        .attr('stroke','#CDCFD0')
                        .attr('stroke-width','0.65px');

                    // landuse styles
                    window.d3.selectAll('#university path')
                        .attr('fill','#F2F0E7')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');
                    window.d3.selectAll('#stadium path')
                        .attr('fill','#F9F3D6')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');
                    window.d3.selectAll('#school path')
                        .attr('fill','#F2F0E7')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');
                    window.d3.selectAll('#resort path')
                        .attr('fill','#F9F3D6')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');
                    window.d3.selectAll('#park path')
                        .attr('fill','#E7F1CA')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');
                    window.d3.selectAll('#wetland path')
                        .attr('fill','#e1e9db')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');                        
                    window.d3.selectAll('#military path')
                        .attr('fill','#eff0ef')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');
                    window.d3.selectAll('#prison path')
                        .attr('fill','#eff0ef')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');                        
                    window.d3.selectAll('#hospital path')
                        .attr('fill','#E2EDEF')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');
                    window.d3.selectAll('#forest path')
                        .attr('fill','#E7F1CA')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');
                    window.d3.selectAll('#cemetery path')
                        .attr('fill','#E4E4D5')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');
                    window.d3.selectAll('#beach path')
                        .attr('fill','#F8F4E1')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');
                    window.d3.selectAll('#airport path')
                        .attr('fill','#eff0ef')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');
                    window.d3.selectAll('#etc path')
                        .attr('fill','none')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');

                    // water
                    window.d3.selectAll('#water path')
                        .attr('fill','#A9D7F4')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');
                    window.d3.selectAll('#ocean path')
                        .attr('fill','#A9D7F4')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');                    
                    window.d3.selectAll('#riverbank path')
                        .attr('fill','none')
                        .attr('stroke','#A9D7F4')
                        .attr('stroke-width','0.5px');
                    window.d3.selectAll('#river path')
                        .attr('fill','none')
                        .attr('stroke','#A9D7F4')
                        .attr('stroke-width','0.5px');
                    window.d3.selectAll('#stream path')
                        .attr('fill','none')
                        .attr('stroke','#A9D7F4')
                        .attr('stroke-width','0.35px');

                    // earth
                    window.d3.selectAll('#earth #earth path')
                        .attr('fill','#fff')
                        .attr('stroke','#fff')
                        .attr('stroke-width','0px');


                    // buildings
                    window.d3.selectAll('#buildings #building path')
                        .attr('fill','#f7f9fc')
                        .attr('stroke','none');

                    // uploaded geojson polygons
                    window.d3.selectAll('#polygonFeatures path')
                        .attr('fill','none')
                        .attr('stroke','#cd7139')
                        .attr('stroke-width','1px');

                    // uploaded geojson polylines
                    window.d3.selectAll('#lineFeatures path')
                        .attr('fill','none')
                        .attr('stroke','#cd7139')
                        .attr('stroke-width','1px');


                    // // loop through custom geojson uploads
                    // for (var i = 0; i < mapOptions['polygonFeatures'].length; i++) {
                    //     svg.append('path')
                    //         .attr('id','hello')
                    //         .attr('d',mapOptions['polygonFeatures'][i])
                    //         .attr('fill','none')
                    //         .attr('stroke','#cd7139')
                    //         .attr('stroke-width','4px');
                    // }
                        // svg.append('path')
                        //     .attr('id','hello')
                        //     .attr('d','M613.5,359a10.5,10.5 0 1,0 21,0 a10.5,10.5 0 1,0 -21,0 ')
                        //     .attr('fill','blue')
                        //     .attr('stroke','#cd7139')
                        //     .attr('stroke-width','4px');

                    // mask landuse with another earth
                    // svg.append('defs').append('clipPath').attr('id','earth-clip');
                    // window.d3.select('#earth-clip').append('path').attr('d',earthTiles);

                    // window.d3.select('#landuse').attr('clip-path','url(#earth-clip)');



                    // /tmp
                    fs.writeFile(outputLocation, window.d3.select('.container').html(),(err)=> {
                        if(err) throw err;
                        console.log('yess svg is there')
                    })

                //jsdom done function done
                }
            })
        }

        makeCall();

    } // parseJSON


    // here all maps spells are!
    // convert lat/lon to mercator style number or reverse.
    function long2tile(lon,zoom) {
        return (Math.floor((lon+180)/360*Math.pow(2,zoom)));
    }
    function lat2tile(lat,zoom)  {
        return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
    }

    function tile2Lon(tileLon, zoom) {
        return (tileLon*360/Math.pow(2,zoom)-180).toFixed(10);
    }

    function tile2Lat(tileLat, zoom) {
        return ((360/Math.PI) * Math.atan(Math.pow( Math.E, (Math.PI - 2*Math.PI*tileLat/(Math.pow(2,zoom)))))-90).toFixed(10);
    }

    function slugify(str) {
        return str.replace(/[\s]|[,\s]+/g, '-').replace(/[^a-zA-Z-]/g, '').toLowerCase();
    }

    module.exports = router;

// }