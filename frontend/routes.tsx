import { TagsPage } from './pages/TagsPage';
import { TagDetailPage } from './pages/TagDetailPage';
import type { RouteObject } from 'react-router-dom';

const routes: RouteObject[] = [
  { path: '/apps/tags', element: <TagsPage /> },
  { path: '/apps/tags/:id', element: <TagDetailPage /> },
];

export default routes;
