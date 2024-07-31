import {Emitter, EventsMap} from './emitter';
import type { UserData, EmptyRequests, PayloadRequests, MessageFromServer } from './types';

const urlsThatHavePayload = ['openURL'];

type RequestUrl = Parameters<typeof fetch>[0];
type RequestOptions = Parameters<typeof fetch>[1];
export class SPMini extends Emitter<MessageFromServer> {
  isReady: boolean = false;
  user: UserData | null = null;
  fetch = fetch;

  #send<T extends keyof PayloadRequests>(type: T, payload: PayloadRequests[T]): void;
  #send<T extends keyof EmptyRequests>(type: T): void;
  #send<T extends keyof PayloadRequests | keyof EmptyRequests>(
    type: T,
    payload?: PayloadRequests[T & keyof PayloadRequests]
  ): void {
    if (payload) return window.parent.postMessage({ type, payload }, '*');
    return window.parent.postMessage({ type }, '*');
  }

  #handleMessage({ data }: { data: any }) {
    if (!data || typeof data !== 'object') return;

    if (!data.type) return;
    if (urlsThatHavePayload.includes(data.type)) {
      if (data.payload === undefined) return;
      this.emit(data.type, data.payload);
      return;
    }

    this.emit(data.type, null);
  }

  constructor(autoinit = true) {
    super();
    if (autoinit) this.initialize();

    this.once('initResponse', user => {
      this.isReady = true;
      this.user = user;
      if (this.isReady) this.emit('ready');
    });
  }

  initialize() {
    window.addEventListener('message', this.#handleMessage.bind(this));
    this.#send('init');
  }

  validate(url: RequestUrl, init: RequestOptions = {}) {
    return new Promise<boolean>((resolve, reject) => {
      if (!init.method) init.method = 'POST';
      if (!init.headers) init.headers = {};

      // @ts-expect-error
      init.headers['Content-Type'] = 'application/json';

      this.fetch(url, {
        ...init,
        body: JSON.stringify(this.user)
      })
        .then(r => {
          console.log(r.body, String(r.body));
          if (r.status === 200) return resolve(String(r.body) === '0');
        })
        .catch(reject);
    });
  }

  dispose() {
    return window.removeEventListener('message', this.#handleMessage);
  }

  openURL(url: string) {
    return new Promise<void>((resolve, reject) => {
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (e) {
        return reject('Невалидный URL');
      }
      if (parsedUrl.protocol !== 'https:') return reject('Неверный протокол');

      this.#send('openURL', url);
      resolve();
    });
  }
}
