import type { ModuleFrontend } from '@/shared/types/module';
import { registerCapability } from '@/shared/capabilities';

const module: ModuleFrontend = {
  id: 'tags',
  pluginId: 'tags-mini-app',
  routes: () => import('./routes'),
  registerCapabilities: () => {
    registerCapability('search:provider', {
      id: 'tags',
      entityType: 'tag',
      search: async (query, params) => {
        const { searchTags } = await import('./api');
        const perPage = (params?.perPage as number) ?? 20;
        const result = await searchTags({ q: query, per_page: perPage });
        return (result.tags ?? []).map(t => ({
          record_id: t.record_id,
          name: t.name,
        }));
      },
      defaultRelationship: 'tagged_with',
      label: 'Tag',
      pluralLabel: 'Tags',
      icon: 'Hash',
      color: '#00BCD4',
      detailPath: '/apps/tags',
      pluginId: 'tags-mini-app',
      pluralEntityType: 'tags',
    });
  },
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
