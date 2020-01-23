var vueApp = new Vue({
    el: '#app',
    data: {
        photos: [],
        selected: null
    },
    methods: {
        onClick(photo) {
            this.selected = photo.name;
            this.$emit('photoClick', photo);
        },
    },
    computed: {
        photoItemClass: function() {
            return {
                active: this.isActive && !this.error,
                'text-danger': this.error && this.error.type === 'fatal'
            }
        }
    }
})


function animateMapTo(exifdata) {
    var altitude = exifdata.dji.relativeAltitude;
    map.animateTo({
        zoom: getZoomForAltitude(altitude),
        center: destinationPoint(exifdata.GPSLatitude, exifdata.GPSLongitude, (altitude / 5), exifdata.dji.gimbalYawDegree),
        pitch: 60,
        bearing: exifdata.dji.gimbalYawDegree + 10
    });
}


vueApp.$on('photoClick', function(photo) {
    animateMapTo(photo.exifdata);
})

var map = new maptalks.Map('map', {
    center: [32.05912497222222, 49.43518680555555],
    zoom: 14,
    pitch: 10,

    layerSwitcherControl: {
        'position': 'bottom-left',
        // title of base layers
        'baseTitle': 'Base Layers',
        // title of layers
        'overlayTitle': 'Layers',
        // layers you don't want to manage with layer switcher
        'excludeLayers': [],
        // css class of container element, maptalks-layer-switcher by default
        'containerClass': 'maptalks-layer-switcher'
    },

    baseLayer: new maptalks.GroupTileLayer('Base TileLayer', [
        new maptalks.TileLayerCollection.getGoogleTileLayer('Satellite', {style: 'Satellite'}),
        new maptalks.TileLayer('Terrain', {
            urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            subdomains: ['a', 'b', 'c', 'd'],
            attribution: '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
        })
    ])
});

map.on('zoomend', function(zoom) {
});

var photosLayer = new maptalks.VectorLayer('Markers', [], {
    enableAltitude: true,        // enable altitude
    altitudeProperty: 'altitude', // altitude property in properties, default by 'altitude',
    drawAltitude: {
        lineWidth: 1,
        lineColor: '#000'
    }
}).addTo(map);

var vectorsLayer = new maptalks.VectorLayer('Vectors', []).addTo(map);

var holder = document.getElementById('holder'),
    state = document.getElementById('status');

if (typeof window.FileReader === 'undefined') {
    state.className = 'fail';
} else {
    state.className = 'success';
    state.innerHTML = 'Dji photos map mapper';
}

holder.ondragover = function() {
    this.className = 'hover';
    return false;
};
holder.ondragend = function() {
    this.className = '';
    return false;
};
holder.ondrop = function(e) {
    this.className = '';
    e.preventDefault();
    var points = [];
    var vectors = [];
    var promises = [];
    vueApp.photos = [];

    Array.prototype.forEach.call(e.dataTransfer.files, function(file) {
        promises.push(new Promise(function(resolve, reject) {
            var parsed = EXIF.getData(file, function(img) {
                var exifdata = EXIF.getAllTags(this);
                if (exifdata.Make === 'DJI') {
                    // point with altitude
                    var altitude = exifdata.dji.relativeAltitude;

                    // console.log(exifdata.dji, exifdata.GPSLongitude, exifdata.GPSLatitude);
                    var point = new maptalks.Marker([exifdata.GPSLongitude, exifdata.GPSLatitude], {
                            'properties': {
                                'altitude': altitude,
                                'name': file.name
                            },
                            'symbol': [
                                {
                                    'markerFile': '1.png',
                                    'markerWidth': 28,
                                    'markerHeight': 40,
                                    'markerDx': 0,
                                    'markerDy': 0,
                                    'markerOpacity': 1
                                },
                                {
                                    'textFaceName': 'sans-serif',
                                    'textName': '{name}',
                                    'textSize': 10,
                                    'textDy': 0
                                }
                            ]

                        }
                    );
                    points.push(point);
                    var polyline = new maptalks.LineString([
                        [exifdata.GPSLongitude, exifdata.GPSLatitude],
                        destinationPoint(exifdata.GPSLatitude, exifdata.GPSLongitude, altitude / 5, exifdata.dji.gimbalYawDegree)
                    ], {
                        arrowStyle: 'classic', // we only have one arrow style now
                        arrowPlacement: 'vertex-last',
                        symbol: {
                            lineColor: '#1bbc9b',
                            lineWidth: 3
                        }
                    });


                    polyline.on('click', function(e) {
                        animateMapTo(exifdata);
                        vueApp.selected = file.name;
                    });

                    point.on('click', function(e) {
                        animateMapTo(exifdata);
                        vueApp.selected = file.name;
                    });

                    vectors.push(polyline);
                    vueApp.photos.push({
                        'name': file.name,
                        'exifdata': exifdata
                    });

                }
                resolve();
            })
            if (!parsed) {
                resolve();
            }
        }));
    });

    Promise.all(promises).then(function(values) {
        photosLayer.clear();
        vectorsLayer.clear();

        photosLayer.addGeometry(points, true);
        vectorsLayer.addGeometry(vectors, true);

        map.fitExtent(photosLayer.getExtent(), 0);

    });
    return false;
};
