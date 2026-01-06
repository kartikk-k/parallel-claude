export const ROUTES = {
  HOME: '/',
  WORKSTATION: '/repository/:repositoryId',
} as const;

export const getWorkstationRoute = (repositoryId: string) =>
  `/repository/${repositoryId}`;
