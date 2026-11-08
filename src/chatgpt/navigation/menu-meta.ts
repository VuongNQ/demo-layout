import { chatgptPath, chatgptRouteMeta, type ChatGPTRouteId } from '../routes/route-meta';

export const chatgptMenuGroups: { label: string; items: ChatGPTRouteId[] }[] = [
  { label: 'operations', items: ['overview'] },
  { label: 'products', items: ['productLabels', 'promotionTypes', 'promotions'] },
  { label: 'designSystem', items: ['showcase'] }
];

export function chatgptMenuItem(id: ChatGPTRouteId) {
  return { ...chatgptRouteMeta[id], path: chatgptPath(id) };
}
