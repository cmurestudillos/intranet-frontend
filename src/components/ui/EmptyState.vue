<template>
  <div class="empty-state">
    <i :class="icon" aria-hidden="true"></i>
    <h4>{{ title }}</h4>
    <p v-if="text">{{ text }}</p>
    <slot />
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    title: { type: String, required: true },
    text: { type: String, default: '' },
    icon: { type: String, default: 'fas fa-inbox' },
  },
}
</script>
