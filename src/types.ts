export type Requests = {
  init: string;
  openURL: string;
};

export type EmptyRequests = {
  [K in keyof Requests as Requests[K] extends undefined ? K : never]: undefined;
};
export type PayloadRequests = Omit<Requests, keyof EmptyRequests>;

export type Responses = {
  init: UserData;
  openURL: 'success';
};

type SuccessResponses = {
  [K in keyof Responses as `${K}Response`]: Responses[K];
};

type ErrorResponses = {
  [K in keyof Responses as `${K}Error`]: string;
};

export type MessageFromServer = SuccessResponses & ErrorResponses & { ready: never };

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
