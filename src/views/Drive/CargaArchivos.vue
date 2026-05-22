<template>
  <div>
    <table class="table table-hover" v-if="tempAttachments.length > 0">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Tamaño</th>
          <th>Progreso</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tempAttachment in tempAttachments" :key="tempAttachment._id">
          <td>
            <p class="" ref="attachmentTitle">{{ tempAttachment.title }}</p>
          </td>
          <td>
            <span class="uploaded-date">
              {{ (tempAttachment.size / 1024 / 1024).toFixed(2) }} MB
            </span>
          </td>
          <td>
            <span v-if="checkProgress(tempAttachment)" class="upload-prgress">
              {{ `${tempAttachment.progress} %` }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  methods: {
    checkProgress(attachment) {
      return attachment.progress === null ? false : true
    },
  },
  props: {
    tempAttachments: {
      type: Array,
    },
    attachments: {
      type: Array,
    },
  },
}
</script>
