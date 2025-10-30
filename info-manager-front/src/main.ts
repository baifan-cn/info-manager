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

// Multi-tab synchronization: listen for logout in other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    // When access_token is removed in another tab, logout locally
    if (event.key === 'access_token' && event.newValue === null) {
      authStore.localLogout()
      router.replace({ name: 'login' }).catch(() => {})
    }
  })
}

app.use(router)
app.use(TDesign)

app.mount('#app')
