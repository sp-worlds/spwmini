type Requests = {
  init: string;
  openURL: string;
  payment: string;
};

export type EmptyRequests = {
  [K in keyof Requests as Requests[K] extends undefined ? K : never]: undefined;
};
export type PayloadRequests = Omit<Requests, keyof EmptyRequests>;

type Responses = {
  init: UserData;
  openURL: 'success';
  paymentOpen: 'success';
  payment: 'success' | 'cancel';
};

type SuccessResponses = {
  [K in keyof Responses as `${K}Response`]: Responses[K];
};

type ErrorResponses = {
  [K in keyof Responses as `${K}Error`]: string;
};

type PlainResponses = {
  ready: never;
}

export type MessageFromServer = SuccessResponses & ErrorResponses & PlainResponses;

export interface User {
  id: string;
  username: string;
  minecraftUUID: string;
}

export interface UserData extends User {
  hash: string;
}

type DoMessageData<T> = {
  [K in keyof T]: { type: K };
}[keyof T];
type DoMessageLoadedData<T> = {
  [K in keyof T]: { type: K; payload: T[K] };
}[keyof T];

export type RequestMessage = DoMessageData<EmptyRequests> | DoMessageLoadedData<PayloadRequests>;
