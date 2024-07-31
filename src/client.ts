import { Emitter, EventsMap } from './emitter';
import type { UserData, EmptyRequests, PayloadRequests, MessageFromServer } from './types';

type RequestUrl = Parameters<typeof fetch>[0];
type RequestOptions = Parameters<typeof fetch>[1];

interface AppOptions {
  autoinit: boolean;
}
export class SPMini extends Emitter<MessageFromServer> {
  appId: string;
  isReady: boolean = false;
  user: UserData | null = null;
  customFetch: typeof fetch | null = null;

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
    this.emit(data.type, data.payload);
  }

  constructor(appId: string, options?: AppOptions) {
    super();
    this.appId = appId;

    // autoinit can be undefined - true
    const doAutoInit = !options || options.autoinit !== false;
    if (doAutoInit) this.initialize();

    this.once('initResponse', user => {
      this.isReady = true;
      this.user = user;
      if (this.isReady) this.emit('ready');
    });
  }

  initialize() {
    window.addEventListener('message', this.#handleMessage.bind(this));
    this.#send('init', this.appId);
  }

  validateUser(url: RequestUrl, init: RequestOptions = {}) {
    return new Promise<boolean>((resolve, reject) => {
      if (!init.method) init.method = 'POST';
      if (!init.headers) init.headers = {};

      // @ts-expect-error
      init.headers['Content-Type'] = 'application/json';

      const fetchFunction = this.customFetch || window.fetch;

      fetchFunction(url, {
        ...init,
        body: JSON.stringify(this.user)
      })
        .then(r => r.text())
        .then(v => resolve(v === '1'))
        .catch(reject);
    });
  }

  dispose() {
    return window.removeEventListener('message', this.#handleMessage);
  }

  openURL(url: string) {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      throw 'Невалидный URL';
    }
    if (parsedUrl.protocol !== 'https:') throw 'Неверный протокол';

    this.#send('openURL', url);
  }

  openPayment(code: string) {
    if (!code) throw 'Не указан код';
    this.#send('payment', code);
  }
}
