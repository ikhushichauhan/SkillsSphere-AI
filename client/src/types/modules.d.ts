declare module '*.jsx' {
  import React from 'react';
  const component: React.ComponentType<Record<string, unknown>>;
  export default component;
}

declare module '*.js' {
  const module: unknown;
  export default module;
  export const configureStore: unknown;
  export const fetchCurrentUser: unknown;
  export const logoutUser: unknown;
}
