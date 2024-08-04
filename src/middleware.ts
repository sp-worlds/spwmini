import type { Http2ServerRequest, Http2ServerResponse } from 'http2';
import type { User, UserData } from './types';
import { createHash, createHmac } from 'crypto';

const JSON_HEADER = { 'content-type': 'application/json' };

interface MiddlewareOptions {
  checkPostMethod?: boolean;
}

export const validate =
  (token: string, options?: MiddlewareOptions) =>
  (req: Http2ServerRequest, res: Http2ServerResponse) => {
    // checkPostMethod can be undefined - true
    const checkPostMethod = !options || options.checkPostMethod !== false;

    if (checkPostMethod && req.method !== 'POST') {
      res.writeHead(405).end('Method is not allowed');
      return;
    }

    let data = '';

    req.on('data', chunk => (data += String(chunk)));

    req.on('end', () => {
      if (!data)
        return res.writeHead(400, JSON_HEADER).end(JSON.stringify({ error: 'No user provided' }));
      try {
        const user = JSON.parse(data) as UserData;
        const isUserValid = checkUser(user, token);
        return res.writeHead(200).end(isUserValid ? '1' : '0');
      } catch (error) {
        if (error instanceof Error)
          res.writeHead(500, JSON_HEADER).end(JSON.stringify({ error: error.message }));
        else res.writeHead(500, JSON_HEADER).end(JSON.stringify({ error: String(error) }));

        console.error(error);
      }
    });
  };

export const checkUser = ({ hash, ...user }: UserData, token: string) => {
  const checkString = Object.keys(user)
    .sort()
    .filter(key => user[key as keyof User] && key !== 'hash')
    .map(key => `${key}=${user[key as keyof User]}`)
    .join('\n');

  const secret = createHash('sha256').update(token).digest();
  const hmac = createHmac('sha256', secret).update(checkString).digest('hex');

  return hmac === hash;
};
