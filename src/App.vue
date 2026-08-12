<script setup lang="ts">
import { ref } from 'vue'
import A4LayoutPage from './pages/A4LayoutPage.vue'
import BeanCardPage from './pages/BeanCardPage.vue'

const page = ref(location.hash === '#bean-card' ? 'bean-card' : 'layout')
function openBeanCard() { page.value = 'bean-card'; location.hash = 'bean-card' }
function openLayout() { page.value = 'layout'; history.replaceState(null, '', location.pathname) }
</script>

<template>
  <A4LayoutPage v-if="page === 'layout'" @open-bean-card="openBeanCard" />
  <BeanCardPage v-else @back="openLayout" />
</template>
