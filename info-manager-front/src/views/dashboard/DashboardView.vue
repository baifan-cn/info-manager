<template>
  <div class="dashboard-view">
    <t-card title="控制台" bordered>
      <p>欢迎使用信息管理系统，请在此构建仪表盘内容。</p>
    </t-card>
  </div>
</template>

<style scoped>
.dashboard-view {
  padding: 24px;
  background: var(--td-bg-color-page);
  min-height: 100vh;
}

.dashboard-view :deep(.t-card) {
  max-width: 960px;
  margin: 0 auto;
}
</style>
