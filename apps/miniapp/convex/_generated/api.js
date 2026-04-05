const createApi = () => {
  const handler = () => {
    throw new Error('Convex functions are not available during SSR/build');
  };
  return new Proxy(handler, {
    get: () => handler,
  });
};

export const api = createApi();