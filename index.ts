import { app } from '../server.ts';

export default function handler(req: any, res: any) {
  const originalPath = req.query?.path;

  if (
    typeof originalPath === 'string' &&
    originalPath.startsWith('/api/')
  ) {
    req.url = originalPath;
  }

  return app(req, res);
}