<template>
  <section class="panel">
    <header v-if="title || $slots.header || $slots.actions" class="panel-header">
      <slot name="header">
        <h3 class="panel-title">
          {{ title }}<small v-if="count !== null">{{ count }}</small>
        </h3>
      </slot>
      <div v-if="$slots.actions" class="page-actions">
        <slot name="actions" />
      </div>
    </header>
    <div :class="{ 'panel-body': !flush }">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="panel-footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script>
// Tarjeta estándar con cabecera opcional. `flush` quita el padding (tablas, listas).
export default {
  name: 'AppPanel',
  props: {
    title: { type: String, default: '' },
    count: { type: [Number, String], default: null },
    flush: { type: Boolean, default: false },
  },
}
</script>
