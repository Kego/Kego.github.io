import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', {
    state: () => ({
        isDarkMode: false
    })
})
