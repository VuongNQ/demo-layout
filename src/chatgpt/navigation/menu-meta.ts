import { chatgptPath, chatgptRouteMeta, type ChatGPTRouteId } from '../routes/route-meta';

export const chatgptMenuGroups: { label: string; items: ChatGPTRouteId[] }[] = [
  { label: 'Operations', items: ['overview'] },
  { label: 'Design System', items: ['showcase'] }
];

export function chatgptMenuItem(id: ChatGPTRouteId) {
  return { ...chatgptRouteMeta[id], path: chatgptPath(id) };
}
