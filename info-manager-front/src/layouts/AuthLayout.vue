<template>
  <div class="auth-layout">
    <div class="auth-layout__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--td-bg-color-page);
  padding: 24px;
}

.auth-layout__content {
  width: 100%;
  max-width: 420px;
}

:deep(.auth-view) {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

:deep(.auth-view__card) {
  box-shadow: var(--td-shadow-3);
  border-radius: 12px;
}

:deep(.auth-view__subtitle) {
  margin-bottom: 16px;
  color: var(--td-text-color-secondary);
}

:deep(.auth-view__actions) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

:deep(.auth-view__actions a) {
  color: var(--td-text-color-secondary);
  text-decoration: none;
}

:deep(.auth-view__actions a:hover) {
  color: var(--td-brand-color);
}
</style>
