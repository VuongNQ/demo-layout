import type { RouteObject } from 'react-router-dom';
import { ChatGPTLayout } from '../layout/ChatGPTLayout';
import { chatgptRouteMeta } from './route-meta';
import { ChatGPTRouteError } from './RouteError';

// Relative tree for the root-router owner. Page implementations load only on match.
export const chatgptRoutes: RouteObject[] = [{
  path: 'chatgpt',
  element: <ChatGPTLayout />,
  children: [
    { index: true, errorElement: <ChatGPTRouteError />, lazy: async () => ({ Component: (await import('../overview/ChatGPTOverviewPage')).ChatGPTOverviewPage }) },
    { path: chatgptRouteMeta.showcase.relativePath, errorElement: <ChatGPTRouteError />, lazy: async () => ({ Component: (await import('../showcase/ChatGPTShowcasePage')).ChatGPTShowcasePage }) }
  ]
}];
