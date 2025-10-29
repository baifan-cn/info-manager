<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AuthLayout from './layouts/AuthLayout.vue'
import MainLayout from './layouts/MainLayout.vue'

const route = useRoute()

const layoutComponent = computed(() => {
  return route.meta.layout === 'auth' ? AuthLayout : MainLayout
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="layoutComponent">
      <component :is="Component" />
    </component>
  </RouterView>
</template>
