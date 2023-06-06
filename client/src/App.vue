<template>
    <v-app>
        <v-main>
            <div class="fill-height pa-2 d-flex flex-column" :fluid="true">
                <v-row justify="center" class="ma-0 mb-2 pa-2">
                    <router-link to="/">Map</router-link> |
                    <router-link to="/about">About</router-link>
                </v-row>
                <v-container class="fill-height pa-2" :fluid="true">
                    <router-view></router-view>
                </v-container>
            </div>
        </v-main>
    </v-app>
<!--    <el-header id="nav" style="padding-top: 10px; background-color: rgba(199,198,198,0.22)">-->
<!--        -->
<!--    </el-header>-->
<!--    <el-container id="main">-->
<!--        <router-view />-->
<!--    </el-container>-->
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
}

#nav {
  height: 3.5%;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #0093d1;
    }
  }
}
#main {
  height: 96.5%;
  width: 100%;
  position: relative;
}
</style>
<script setup>
</script>