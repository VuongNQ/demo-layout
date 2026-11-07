import type { RouteObject } from 'react-router-dom';

// Static matching topology; the workspace implementation loads on match.
export const compareRoute: RouteObject = {
  path: 'compare',
  lazy: async () => ({ Component: (await import('./CompareWorkspace')).CompareLayout }),
  children: [
    { index: true, lazy: async () => ({ Component: (await import('./CompareWorkspace')).CompareIndex }) },
    { path: ':scenarioId', lazy: async () => ({ Component: (await import('./CompareWorkspace')).CompareScenarioPage }) }
  ]
};
