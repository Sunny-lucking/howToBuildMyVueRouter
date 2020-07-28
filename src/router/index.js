//router/index.js
import Vue from 'vue'
import VueRouter from './myVueRouter'
import Home from '../views/Home.vue'
import About from "../views/About.vue"
Vue.use(VueRouter)
  const routes = [
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
];
const router = new VueRouter({
  mode:"hash",
  routes
})
export default router
