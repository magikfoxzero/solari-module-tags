import type { ModuleFrontend } from '@/shared/types/module';

const module: ModuleFrontend = {
  id: 'tags',
  pluginId: 'tags-mini-app',
  routes: () => import('./routes'),
  navigation: {
    label: 'Tags',
    icon: 'Hash',
    section: 'apps',
    path: '/apps/tags',
    order: 55,
  },
  dashboardCards: [
    { path: '/apps/tags', label: 'Tags', icon: 'Hash', color: 'from-rose-500 to-rose-600', order: 200 },
  ],
};

export default module;
