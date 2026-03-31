import type { ModuleFrontend } from '@/shared/types/module';

const module: ModuleFrontend = {
  id: 'tags',
  routes: () => import('./routes'),
  navigation: {
    label: 'Tags',
    icon: 'Hash',
    section: 'apps',
    path: '/apps/tags',
    order: 55,
  },
};

export default module;
