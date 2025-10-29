import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { pinia } from '../stores'
import { useAuthStore } from '../stores/auth'
import { useUserStore } from '../stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: {
      layout: 'auth',
      requiresAuth: false,
    },
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('../views/auth/SignupView.vue'),
    meta: {
      layout: 'auth',
      requiresAuth: false,
    },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('../views/auth/ForgotPassword.vue'),
    meta: {
      layout: 'auth',
      requiresAuth: false,
    },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('../views/auth/ResetPassword.vue'),
    meta: {
      layout: 'auth',
      requiresAuth: false,
    },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/dashboard/DashboardView.vue'),
    meta: {
      layout: 'main',
      requiresAuth: true,
    },
  },
  {
    path: '/items',
    name: 'items',
    component: () => import('../views/item/ItemListView.vue'),
    meta: {
      layout: 'main',
      requiresAuth: true,
    },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/user/ProfileView.vue'),
    meta: {
      layout: 'main',
      requiresAuth: true,
    },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('../views/user/UsersManagementView.vue'),
    meta: {
      layout: 'main',
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore(pinia)
  const userStore = useUserStore(pinia)

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.requiresAuth === false && authStore.isAuthenticated && to.name !== 'dashboard') {
    next({ name: 'dashboard' })
    return
  }

  if (to.meta.requiresAdmin) {
    try {
      if (!userStore.profile) {
        await userStore.fetchProfile(true)
      }
    } catch (error) {
      console.warn('Failed to fetch user profile before admin route', error)
    }

    if (!userStore.profile?.is_superuser) {
      next({ name: 'dashboard' })
      return
    }
  }

  next()
})

export default router
