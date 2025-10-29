import { createApp } from 'vue'
import TDesign from 'tdesign-vue-next'
import 'tdesign-vue-next/es/style/index.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { pinia, setupStore } from './stores'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

setupStore(app)
const authStore = useAuthStore(pinia)
authStore.initialize()

app.use(router)
app.use(TDesign)

app.mount('#app')
