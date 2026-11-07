export type ChatGPTRouteId = 'overview' | 'showcase';

export type ChatGPTRouteMeta = {
  id: ChatGPTRouteId;
  relativePath: string;
  title: string;
  breadcrumb: string;
  group: 'Operations' | 'Design System';
};

export const chatgptRouteMeta: Record<ChatGPTRouteId, ChatGPTRouteMeta> = {
  overview: { id: 'overview', relativePath: '', title: 'Operations workspace', breadcrumb: 'Overview', group: 'Operations' },
  showcase: { id: 'showcase', relativePath: 'showcase', title: 'Design System showcase', breadcrumb: 'Showcase', group: 'Design System' }
};

export function chatgptPath(id: ChatGPTRouteId): string {
  const relative = chatgptRouteMeta[id].relativePath;
  return relative ? `/chatgpt/${relative}` : '/chatgpt';
}
