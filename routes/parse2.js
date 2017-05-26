require("babel-polyfill");

var express = require('express');
var router = express.Router();
var fs = require('fs');
var jsdom = require('jsdom');

var d3 = require('d3');
var XMLHttpRequest = require('xhr2')

// zoom level needs to be one higher than map.getZoom()

// temp options
var mapoptions = { 
    apikey: 'mapzen-uxhmqQc',
    startLat: '34.45674800347809',
    startLon: '-117.34771728515626',
    endLat: '34.15674800347809',
    // endLat: '33.62605502663528',
    endLon: '-118.13299560546876',
    // endLon: '-119.13299560546876',
    zoomLevel: '10',
    layers: {
    'roads_visible': ['highways','highway_ramps','major','minor','service','ferry_route','taxi_and_runways'],
    },
    // roads: 'on',
    'coord-submit': 'submit' 
};
var mapoptions = { 
    apikey: 'mapzen-uxhmqQc',
    startLat: '33.9228',
    startLon: '-118.3383',
    endLat: '34.1433',
    endLon: '-118.8758',
    zoomLevel: '10',
    layers: {
    'roads_visible': ['highways','highway_ramps','major','minor','service','ferry_route','taxi_and_runways'],
    },
    // roads: 'on',
    'coord-submit': 'submit' 
};

parseJSON(JSON.stringify(mapoptions));

// set up land use groups for LAT
var landusePark = ['national_park', 'battlefield', 'protected_area', 'nature_reserve', 'park', 'golf_course', 'recreation_ground', 'camp_site', 'garden', 'allotments', 'pitch', 'meadow', 'village_green', 'grass', 'farmland', 'playground', 'attraction', 'artwork', 'wilderness_hut', 'hanami'],
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

    for (var i = 0; i < dKinds.length; i++) {
        // this is sublayer for each data layer
        // should add more meaningful layers for each
        if(dKinds[i] === 'roads') {
            formattedJson[dKinds[i]] = {
                etc: {
                    features: []
                },
                path: {
                    features:[]
                },
                ferry: {
                    features:[]
                },
                service: {
                    features: []
                },
                minor_road: {
                    features: []
                },
                major_road: {
                    features: []
                },  
                aerialway: {
                    features: []
                },
                rail: {
                    features:[]
                },
                highway_link: {
                    features:[]
                }, 
                highway: {
                    features:[]
                }       
            }
        } else if (dKinds[i] === 'boundaries') {
            formattedJson[dKinds[i]] = {
                country: {
                    features: []
                },
                county: {
                    features: []
                },
                disputed: {
                    features: []
                },
                indefinite: {
                    features: []
                },
                interminate: {
                    features: []
                },
                lease_limit: {
                    features: []
                },
                line_of_control: {
                    features: []
                },
                locality: {
                    features: []
                },
                microregion: {
                    features: []
                },
                map_unit: {
                    features: []
                },
                region: {
                    features: []
                },
                etc: {
                    features: []
                }
            }
        } else if (dKinds[i] === 'water') {
            formattedJson[dKinds[i]] = {
                basin: {
                    features: []
                },
                bay: {
                    features: []
                },
                dock: {
                    features: []
                },
                lake: {
                    features: []
                },
                ocean: {
                    features: []
                },
                river: {
                    features: []
                },
                riverbank: {
                    features: []
                },
                swimming_pool: {
                    features: []
                },
                etc: {
                    features: []
                }
            }
        } else if (dKinds[i] === 'landuse') {
            formattedJson[dKinds[i]] = {
                etc: {
                    features: []
                },
                university: {
                    features: []
                },
                stadium: {
                    features: []
                },
                school: {
                    features: []
                },
                resort: {
                    features: []
                },
                park: {
                    features: []
                },
                military: {
                    features: []
                },
                hospital: {
                    features: []
                },
                forest: {
                    features: []
                },
                cemetery: {
                    features: []
                },
                beach: {
                    features: []
                },
                airport: {
                    features: []
                }
            }
        } else {
            formattedJson[dKinds[i]] = {
                etc: {
                    features: []
                }
            }
        }
    }
    // console.log(formattedJson);
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

    // check for available layers
    Object.keys(options.layers).forEach(function(key) {
        // if (key == 'roads_visible') dKinds.push({'roads':options.layers[key]});
        // if (key == 'roads_visible') dKinds.push('roads');
        dKinds.push('landuse');
        dKinds.push('water');
        dKinds.push('earth');
    });

    var tilesToFetch = getTilesToFetch(startLat, endLat, startLon, endLon);

    var key = options.apikey || config.key;

    var delayTime = 200;

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
                // if the property is one of dataKinds that user selected
                if (dKinds.indexOf(response) > -1) {
                    let responseResult = result[response];
                    for (let feature of responseResult.features) {
                        console.log(feature.properties);

                        // segment off motorway_link
                        if (feature.properties.kind_detail == "motorway_link") {
                            var dataKindTitle = 'highway_link';
                        } else if (feature.properties.kind_detail == "service") {
                        // segment off service roads
                            var dataKindTitle = 'service';
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
                        if(geojsonToReform[response].hasOwnProperty(dataKindTitle)) {
                            geojsonToReform[response][dataKindTitle].features.push(feature);
                        } else {
                            geojsonToReform[response]['etc'].features.push(feature)
                        }
                    }
                }
            }
        }
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
                console.log('hello');


                for (let dataK in reformedJson) {
                    let oneDataKind = reformedJson[dataK];
                    let g = svg.append('g')
                    g.attr('id',dataK)

                    for(let subKinds in oneDataKind) {
                        let tempSubK = oneDataKind[subKinds]
                        // console.log(tempSubK);
                        let subG = g.append('g')
                        subG.attr('id',subKinds)
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

                // restyle anything in groups
                window.d3.selectAll('#highway path')
                    .attr('stroke','#A6A6A6')
                    .attr('stroke-width','2px');

                window.d3.selectAll('#highwaylink path')
                    .attr('stroke','#A6A6A6')
                    .attr('stroke-width','1px');

                window.d3.selectAll('#majorroad path')
                    .attr('stroke','#A6A6A6')
                    .attr('stroke-width','1px');

                window.d3.selectAll('#minorroad path')
                    .attr('stroke','#CDCFD0')
                    .attr('stroke-width','0.65px');

                window.d3.selectAll('#service path')
                    .attr('stroke','#CDCFD0')
                    .attr('stroke-width','0.65px');

                window.d3.selectAll('#path path')
                    .attr('stroke','#CDCFD0')
                    .attr('stroke-width','0.65px');

                window.d3.selectAll('#rail path')
                    .attr('stroke','#CDCFD0')
                    .attr('stroke-width','0.65px');

                window.d3.selectAll('#aerialway path')
                    .attr('stroke','#CDCFD0')
                    .attr('stroke-width','0.65px');

                window.d3.selectAll('#ferry path')
                    .attr('stroke','#CDCFD0')
                    .attr('stroke-width','0.65px');

                window.d3.selectAll('#etc path')
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
                window.d3.selectAll('#military path')
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
                window.d3.selectAll('#riverbank path')
                    .attr('fill','none')
                    .attr('stroke','#A9D7F4')
                    .attr('stroke-width','0.5px');
                window.d3.selectAll('#river path')
                    .attr('fill','none')
                    .attr('stroke','#A9D7F4')
                    .attr('stroke-width','0.5px');

                // earth
                window.d3.selectAll('#earth path')
                    .attr('fill','#fff')
                    .attr('stroke','#fff')
                    .attr('stroke-width','0px');


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