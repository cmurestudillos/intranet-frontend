<template>
  <div class="stat">
    <span class="stat-icon" :class="tone ? 'tone-' + tone : ''"><i :class="icon"></i></span>
    <div>
      <div class="stat-value">{{ value }}</div>
      <div class="stat-label">{{ label }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatCard',
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], required: true },
    icon: { type: String, default: 'fas fa-circle' },
    tone: { type: String, default: '' },
  },
}
</script>
