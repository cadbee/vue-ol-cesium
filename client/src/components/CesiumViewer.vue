<template>
    <v-row class="pa-3 ma-0" justify="space-between" align="center">
        <v-btn
            class="mr-3"
            size="small"
            @click="saveAsGeoJSON"
        >
            Save as GeoJSON
        </v-btn>
        <v-btn
            size="small"
            @click="onGeoJSONUploadButtonClicked"
        >
            Import from GeoJSON
        </v-btn>
        <input
            style="display: none"
            ref="uploadGeoJSONInput"
            type="file"
            @change="uploadGeoJSON"
        />
        <v-spacer/>
        <v-select
            v-model="drawType"
            :items="drawTypes"
            label="Draw"
            density="compact"
            variant="solo"
            :hide-details="true"
            @update:modelValue="enableDrawing"
        />
        <v-spacer/>
        <v-btn
            class="mr-3"
            size="small"
            @click="addRandomPoint"
        >
            Add Random Point
        </v-btn>
        <v-btn
            class="mr-3"
            size="small"
            @click="removeRandomPoint"
        >
            Remove Random Point
        </v-btn>
        <v-btn
            id="trackLocation"
            size="small"
            @click="trackLocation"
        >
            Track Location
        </v-btn>
    </v-row>
<!--    <ApolloQuery :query="require('../graphql/Layers.gql')">-->
<!--        <template v-slot="{ result: { loading, error, data } }">-->
<!--            <div-->
<!--                    class="loading apollo"-->
<!--                    v-if="loading"-->
<!--            >-->
<!--                Loading...-->
<!--            </div>-->
<!--            &lt;!&ndash; Error &ndash;&gt;-->
<!--            <div-->
<!--                    class="error apollo"-->
<!--                    v-else-if="error"-->
<!--            >-->
<!--                An error occurred-->
<!--            </div>-->
<!--            <el-select v-else-if="data">-->
<!--                <el-option-->
<!--                    v-for="layer in data.allLayers"-->
<!--                    :key="layer.id"-->
<!--                    :label="layer.title"-->
<!--                    :value="layer.title"-->
<!--                />-->
<!--            </el-select>-->
<!--        </template>-->
<!--    </ApolloQuery>-->
    <v-container id="map2d" class="pa-0"/>

    <v-container id="map3d" class="pa-0">
        <v-btn
            class="cesium-buttons cesium-fs-button"
            size="x-small"
            @click="enableCesiumFs"
        >
            Cesium Fs
        </v-btn>
        <v-btn
            class="cesium-buttons cesium-enable-button"
            size="x-small"
            @click="onEnableCesiumButtonClick"
        >
            {{ isCesiumEnabled ? "Disable" : "Enable" }}
        </v-btn>
    </v-container>
</template>

<script>
import "cesium/Build/Cesium/Widgets/widgets.css"
import * as Cesium from 'cesium'

window.Cesium = Cesium
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhN2FjYTI2NC1jOGMwLTQzMTgtYjM1Zi05Y2QxMjBjZWMyZmEiLCJpZCI6MTQxNjc5LCJpYXQiOjE2ODUwOTMxNjl9.b0uZ3zsVeASjaYccL8obTVZFwAmnJm5ZgEE_t_JM-gk'
import OLCesium from 'olcs/OLCesium.js'

import 'ol-ext/dist/ol-ext.css'
import LayerSwitcherImage from 'ol-ext/control/LayerSwitcherImage'

import Map from 'ol/Map'
import View from 'ol/View'
import Draw from 'ol/interaction/Draw'
import {fromLonLat} from 'ol/proj'
import TileLayer from "ol/layer/Tile";
import {Vector as VectorLayer} from "ol/layer";
import {BingMaps, Vector as SourceVector} from "ol/source";
import {Feature} from "ol";
import {Point} from "ol/geom";
import {FullScreen, defaults as defaultControls, MousePosition} from 'ol/control';
import {createStringXY} from "ol/coordinate";
import {Geolocation} from "ol";
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';
import {GeoJSON} from "ol/format";

import {ref, onMounted} from "vue";

export default {
    name: 'CesiumViewer',
    setup() {
        const bingMapsKey = 'AmVsq9RuMAPsJd1ASWEyfQEU5izCXRwGG1vaIw5eZ_nKoiCxZqN9PPZYoYYsFGQS';

        const isCesiumEnabled = ref(false);
        const isCesiumFs = ref(false);
        let ol3d = undefined;

        const map2d = ref(null);
        const bingMapsLayers = [
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
        ];
        const draw = ref(null);
        const drawTypes = ref(['None', 'LineString', 'Polygon', 'Circle', 'Point']);
        const drawType = ref('None');
        const uploadGeoJSONInput = ref(null);
        let view = undefined;
        let drawingLayer = undefined;
        let drawingVector = undefined;
        let geolocation = undefined;

        onMounted(async () => {
            const mapLayers = [];
            for (let layer of bingMapsLayers) {
                mapLayers.push(
                    new TileLayer({
                        title: layer.imagerySet,
                        visible: layer.isVisible,
                        baseLayer: true,
                        source: new BingMaps({
                            key: bingMapsKey,
                            imagerySet: layer.imagerySet,
                            projection: 'EPSG:3857',
                            culture: 'ru',
                            maxZoom: 22
                        })
                    })
                );
            }

            view = new View({
                center: [-11158582, 4813697],
                zoom: 4
            });
            map2d.value = new Map({
                layers: mapLayers,
                controls: defaultControls().extend([
                    new FullScreen(),
                    new MousePosition({
                        coordinateFormat: createStringXY(4),
                        projection: 'EPSG:3857'
                    })
                ]),
                target: 'map2d',
                view: view,
                loadTilesWhileAnimating: true,
                loadTilesWhileInteracting: true
            })

            drawingVector = new SourceVector({
                features: [],
                wrapX: false
            });
            drawingLayer = new VectorLayer({
                title: 'Custom Drawings',
                source: drawingVector,
            });
            drawingLayer.set('name', 'drawingVector');
            map2d.value.addLayer(drawingLayer);

            geolocation = new Geolocation({
                trackingOptions: {
                    enableHighAccuracy: true,
                },
                projection: view.getProjection()
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
            drawingVector.addFeatures([accuracyFeature, positionFeature]);

            // Cesium setup
            ol3d = new OLCesium({map: map2d.value, target: 'map3d'});
            const scene = ol3d.getCesiumScene();
            scene.shadowMap.enabled = true;
            scene.debugShowFramesPerSecond = true;
            scene.terrainProvider = await Cesium.createWorldTerrainAsync();
            // scene.imageryLayers.addImageryProvider(Cesium.createWorldImagery());
            const osmBuildingsTileset = await Cesium.createOsmBuildingsAsync();
            osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
                color: {
                    conditions: [
                        [true, "color('white', 0.85)"]
                    ]
                }
            });
            scene.primitives.add(osmBuildingsTileset);
            ol3d.setEnabled(isCesiumEnabled.value);

            // Sources need to become 'ready' before the tiles can be accessed and layer.getPreview working
            map2d.value.addControl(new LayerSwitcherImage());
        })

        const onEnableCesiumButtonClick = () => {
            ol3d.setEnabled(!ol3d.getEnabled())
            isCesiumEnabled.value = !isCesiumEnabled.value
        }

        const enableCesiumFs = () => {
            isCesiumFs.value = !isCesiumFs.value;
            if (isCesiumFs.value) {
                Cesium.Fullscreen.requestFullscreen(document.getElementById('map3d'));
            } else {
                Cesium.Fullscreen.exitFullscreen();
            }
        }

        const getRandomFloat = (min, max) => {
            return Math.random() * (max - min) + min;
        }

        const addRandomPoint = () => {
            drawingVector.addFeature(new Feature({
                geometry: new Point(fromLonLat([getRandomFloat(0, 50), getRandomFloat(0, 50)]))
            }));
        }

        const removeRandomPoint = () => {
            let features = drawingVector.getFeatures();
            if (features) {
                drawingVector.removeFeature(features[0]);
            }
        }

        const enableDrawing = () => {
            map2d.value.removeInteraction(draw.value);
            if (drawType.value !== 'None') {
                draw.value = new Draw({
                    source: drawingVector,
                    type: drawType.value
                });
                map2d.value.addInteraction(draw.value);
            }
        }

        const trackLocation = () => {
            geolocation.setTracking(!geolocation.getTracking());
            map2d.value.getView().setCenter(geolocation.getPosition());
            map2d.value.getView().setZoom(15);
        }

        const saveAsGeoJSON = () => {
            const geoJson = new GeoJSON().writeFeatures(drawingVector.getFeatures());
            let a = document.createElement('a');
            let file = new Blob([JSON.stringify(geoJson)], {type: 'application/json'});
            a.href = URL.createObjectURL(file);
            a.download = 'GeoJSON_Example.json';
            a.click();
            a.remove();
        }

        const uploadGeoJSON = (event) => {
            const geoJsonFile = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (res) => {
                const geojson = JSON.parse(res.target.result);
                map2d.value.addLayer(new VectorLayer({
                    title: 'Imported',
                    source: new SourceVector({
                        features: new GeoJSON().readFeatures(geojson)
                    })
                }));
            }
            reader.readAsText(geoJsonFile);
        }

        const onGeoJSONUploadButtonClicked = () => {
            uploadGeoJSONInput.value.click();
        }

        return {
            isCesiumEnabled,
            isCesiumFs,
            drawType,
            drawTypes,
            uploadGeoJSONInput,
            enableCesiumFs,
            addRandomPoint,
            removeRandomPoint,
            enableDrawing,
            trackLocation,
            onEnableCesiumButtonClick,
            saveAsGeoJSON,
            onGeoJSONUploadButtonClicked,
            uploadGeoJSON
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

#map3d {
    background-color: #c0c0c0;
}

.cesium-buttons {
    position: absolute;
    z-index: 1;
}

.cesium-enable-button {
    right: 10px;
    top: 10px;
}

.cesium-fs-button {
    left: 10px;
    top: 10px;
}

.centerRow {
    display: flex;
    align-items: center;
}

</style>
