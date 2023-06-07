<template>
  <v-container class="fill-height pa-0" :fluid="true">
    <CesiumViewer />
  </v-container>
</template>

<script>
// @ is an alias to /src
import CesiumViewer from '@/components/CesiumViewer.vue'

export default {
  name: 'HomeView',
  components: {
    CesiumViewer
  }
}
</script>

<style scoped>
/*.home {*/
/*  position: relative;*/
/*  height: 100%;*/
/*  width: 100%;*/
/*}*/
</style>
