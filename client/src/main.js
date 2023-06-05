import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import elementPlus from './plugins/element-plus.js'
import OpenLayersMap from 'vue3-openlayers'
import 'vue3-openlayers/dist/vue3-openlayers.css'
import {apolloProvider} from "@/plugins/vue-apollo"
import VueApolloComponents from '@vue/apollo-components'
import {vuetify} from "@/plugins/vuetify"

createApp(App)
    .use(router)
    .use(store)
    .use(elementPlus)
    .use(apolloProvider)
    .use(OpenLayersMap)
    .use(VueApolloComponents)
    .use(vuetify)
    .mount('#app')
