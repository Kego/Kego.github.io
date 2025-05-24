import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/home.vue'
import JsonFormatter from '../pages/json-formatter.vue'
import HashCalculator from '../pages/hash-calculator.vue'


const routes = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/json',
        name: 'json-formatter',
        component: JsonFormatter
    },
    {
        path: '/hash',
        name: 'hash-calculator',
        component: HashCalculator
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router