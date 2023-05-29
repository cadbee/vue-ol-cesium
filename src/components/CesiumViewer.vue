<template>
    <el-row
            class="el-header centerRow"
            style="background-color: rgba(199,198,198,0.22)"
            justify="end"
    >
        <el-space>
            <p>Draw: </p>
            <el-select
                v-model="drawType"
                placeholder="Select"
                size="large"
                @change="enableDrawing"
            >
                <el-option
                    v-for="item of drawTypes"
                    :key="item"
                    :label="item"
                    :value="item"
                />
            </el-select>
            <el-button
                type="primary"
                size="large"
                plain
                @click="addRandomPoint"
            >
                Add Random Point
            </el-button>
            <el-button
                type="danger"
                size="large"
                plain
                @click="removeRandomPoint"
            >
                Remove Random Point
            </el-button>
            <el-button
                type="warning"
                size="large"
                plain
                id="trackLocation"
                @click="trackLocation"
            >
                Track Location
            </el-button>
        </el-space>
    </el-row>
    <el-container id="map2d">
        <el-select
                class="layer_select"
                v-model="pickedStyle"
                placeholder="Select layer"
                size="large"
                @change="onLayerChange"
        >
            <el-option
                    v-for="item in layers"
                    :key="item"
                    :label="item.imagerySet"
                    :value="item.imagerySet"
            />
        </el-select>
    </el-container>
    <el-container id="map3d">
        <el-button
                class="fs-button"
                @click="enableCesiumFs"
        >
            Cesium Fs
        </el-button>
        <el-button
                id="enable"
        >
            {{ isEnabled ? "Disable" : "Enable" }}
        </el-button>
    </el-container>
</template>

<script>
import "cesium/Build/Cesium/Widgets/widgets.css"
import * as Cesium from 'cesium'

window.Cesium = Cesium

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhN2FjYTI2NC1jOGMwLTQzMTgtYjM1Zi05Y2QxMjBjZWMyZmEiLCJpZCI6MTQxNjc5LCJpYXQiOjE2ODUwOTMxNjl9.b0uZ3zsVeASjaYccL8obTVZFwAmnJm5ZgEE_t_JM-gk'

import OLCesium from 'olcs/OLCesium.js'
import Map from 'ol/Map'
import View from 'ol/View'
import Draw from 'ol/interaction/Draw'
import {fromLonLat} from 'ol/proj'
import TileLayer from "ol/layer/Tile";
import {Vector as LayerVector} from "ol/layer";
import {BingMaps, Vector as SourceVector} from "ol/source";
import {Feature} from "ol";
import {Point} from "ol/geom";
import {FullScreen, defaults as defaultControls, MousePosition} from 'ol/control';
import {createStringXY} from "ol/coordinate";
import {Geolocation} from "ol";
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';
export default {
    name: 'CesiumViewer',
    data() {
        return {
            layer: '',
            isEnabled: false,
            pickedStyle: 'RoadOnDemand',
            map: undefined,
            layers: [
                {
                    isVisible: true,
                    imagerySet: 'RoadOnDemand',
                },
                {
                    isVisible: false,
                    imagerySet: 'Aerial',
                },
                {
                    isVisible: false,
                    imagerySet: 'AerialWithLabelsOnDemand',
                },
                {
                    isVisible: false,
                    imagerySet: 'CanvasDark',
                },
                {
                    isVisible: false,
                    imagerySet: 'CanvasLight',
                },
                {
                    isVisible: false,
                    imagerySet: 'CanvasGray',
                }
            ],
            ol3d: undefined,
            isCesiumFs: false,
            pointsVector: undefined,
            draw: undefined,
            drawTypes: ['None', 'LineString', 'Polygon', 'Circle', 'Point'],
            drawType: 'None',
            geolocation: undefined
        }
    },
    mounted() {
        const layers = [];
        for (let layer of this.layers) {
            layers.push(
                new TileLayer({
                    visible: layer.isVisible,
                    preload: Infinity,
                    source: new BingMaps({
                        key: 'AmVsq9RuMAPsJd1ASWEyfQEU5izCXRwGG1vaIw5eZ_nKoiCxZqN9PPZYoYYsFGQS',
                        imagerySet: layer.imagerySet,
                        culture: 'ru',
                        maxZoom: 20
                    })
                })
            );
        }
        let view = new View({
            center: [-11158582, 4813697],
            zoom: 4
        });
        this.map = new Map({
            controls: defaultControls().extend([
                new FullScreen(),
                new MousePosition({
                    coordinateFormat: createStringXY(4),
                    projection: 'EPSG:3857'
                })
            ]),
            layers: layers,
            target: 'map2d',
            view: view
        })

        this.pointsVector = new SourceVector({
            features: [
                new Feature({
                    geometry: new Point(fromLonLat([16.62662018, 49.2125578]))
                })
            ],
            wrapX: false
        });
        let layer = new LayerVector({
            source: this.pointsVector,
        });
        layer.set('name', 'pointsVector');
        this.map.addLayer(layer);
        const geolocation = new Geolocation({
            trackingOptions: {
                enableHighAccuracy: true,
            },
            projection: view.getProjection()
        });
        document.getElementById('trackLocation').addEventListener('click', function () {
            // geolocation.setTracking(true);
        });
        const accuracyFeature = new Feature();
        geolocation.on('change:accuracyFeature', function () {
            accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
        });
        const positionFeature = new Feature();
        positionFeature.setStyle(
            new Style({
                image: new CircleStyle({
                    radius: 6,
                    fill: new Fill({
                        color: '#3399CC',
                    }),
                    stroke: new Stroke({
                        color: '#fff',
                        width: 2,
                    }),
                }),
            })
        );
        geolocation.on('change:position', function () {
            const coordinates = geolocation.getPosition();
            positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
        });
        this.geolocation = geolocation;
        this.pointsVector.addFeatures([accuracyFeature, positionFeature]);

        const ol3d = new OLCesium({map: this.map, target: 'map3d'});
        const scene = ol3d.getCesiumScene();
        scene.shadowMap.enabled = true;
        scene.terrainProvider = Cesium.createWorldTerrain();
        // scene.imageryLayers.addImageryProvider(Cesium.createWorldImagery());
        scene.primitives.add(Cesium.createOsmBuildings());
        ol3d.setEnabled(this.isEnabled);
        this.ol3d = ol3d;

        document.getElementById('enable').addEventListener('click', () => {
            ol3d.setEnabled(!ol3d.getEnabled())
            this.isEnabled = !this.isEnabled
            console.log(this.isEnabled)
        })
        console.log(this.$refs.toggleOlFsButton);
    },
    methods: {
        onLayerChange() {
            this.map.getLayers().forEach((layer, index) => {
                layer.setVisible(this.pickedStyle === this.layers[index]?.imagerySet);
            });
            this.map.getLayers().getArray().find(layer => layer.get('name') === 'pointsVector').setVisible(true);
        },
        enableCesiumFs() {
            this.isCesiumFs = !this.isCesiumFs;
            if (this.isCesiumFs) {
                Cesium.Fullscreen.requestFullscreen(document.getElementById('map3d'));
            } else {
                Cesium.Fullscreen.exitFullscreen();
            }
        },
        getRandomFloat(min, max) {
            return Math.random() * (max - min) + min;
        },
        addRandomPoint() {
            this.pointsVector.addFeature(new Feature({
                geometry: new Point(fromLonLat([this.getRandomFloat(0, 50), this.getRandomFloat(0, 50)]))
            }));
        },
        removeRandomPoint() {
            let features = this.pointsVector.getFeatures();
            if (features) {
                this.pointsVector.removeFeature(features[0]);
            }
        },
        enableDrawing() {
            this.map.removeInteraction(this.draw);
            if (this.drawType !== 'None') {
                this.draw = new Draw({
                    source: this.pointsVector,
                    type: this.drawType
                });
                this.map.addInteraction(this.draw);
            }
        },
        trackLocation() {
           this.geolocation.setTracking(!this.geolocation.getTracking());
            console.log(this.geolocation.getPosition());
            this.map.getView().setCenter(this.geolocation.getPosition());
            this.map.getView().setZoom(15);
        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#map2d,
#map3d {
    position: relative;
    float: left;
    width: 50%;
    height: 95%;
}

.layer_select {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 1;
}

#map3d {
    background-color: #c0c0c0;
}

#enable {
    position: absolute;
    right: 10px;
    top: 10px;
    z-index: 1;
}

.fs-button {
    position: absolute;
    left: 10px;
    top: 10px;
    z-index: 1;
}

.centerRow {
    display: flex;
    align-items: center;
}

</style>

// or you can use url: https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png
// new TileLayer({
//     title: 'OSM',
//     type: 'base',
//     visible: true,
//     source: new XYZ({
//         attributions: 'Tiles © <a href="https://opentopomap.org/">OpenTopoMap</a>',
//         url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${mapTilerKey}`,
//         tileSize: 512,
//         format: 'image/png',
//         projection,
//         style: 'default',
//         tileGrid: new WMTSTileGrid({
//             matrixIds,
//             resolutions,
//             origin: getTopLeft(projectionExtent)
//         }),
//         wrapX: true,
//         crossOrigin: 'anonymous'
//     })
// }),
