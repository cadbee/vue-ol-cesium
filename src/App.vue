<template>
    <el-header id="nav" style="padding-top: 10px; background-color: rgba(199,198,198,0.22)">
        <router-link to="/">Map</router-link> |
        <router-link to="/about">About</router-link>
    </el-header>
    <el-container id="main">
        <router-view />
    </el-container>
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
