const server = Bun.serve({
  port: 3001,
  routes: {
    '/api/health': () => Response.json({ status: 'ok' }),
    '/*': () => new Response('Not found', { status: 404 }),
  },
});

console.log(`Backend running at ${server.url}`);
