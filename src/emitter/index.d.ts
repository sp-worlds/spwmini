/**
 * An events map is an interface that maps event names to their value, which
 * represents the type of the `on` listener.
 */
export interface EventsMap {
  [event: string]: any;
}

/**
 * Returns a union type containing all the keys of an event map.
 */
export type EventNames<Map extends EventsMap> = keyof Map & (string | symbol);

/**
 * Type of a listener of a user event or a reserved event. If `Ev` is in
 * `ReservedEvents`, the reserved event listener is returned.
 */
export type ReservedListener<
  ReservedEvents extends EventsMap,
  Ev extends EventNames<ReservedEvents>
> = FallbackToUntypedListener<ReservedEvents[Ev]>;

/**
 * Returns an untyped listener type if `T` is `never`; otherwise, returns `T`.
 *
 * This is a hack to mitigate https://github.com/socketio/socket.io/issues/3833.
 * Needed because of https://github.com/microsoft/TypeScript/issues/41778
 */
type FallbackToUntypedListener<T> = [T] extends [never]
  ? () => void | Promise<void>
  : (data: T) => void | Promise<void>;

/**
 * Strictly typed version of an `EventEmitter`. A `TypedEventEmitter` takes type
 * parameters for mappings of event names to event data types, and strictly
 * types method calls to the `EventEmitter` according to these event maps.
 *
 * @typeParam ListenEvents - `EventsMap` of user-defined events that can be
 * listened to with `on` or `once`
 * @typeParam EmitEvents - `EventsMap` of user-defined events that can be
 * emitted with `emit`
 * @typeParam ReservedEvents - `EventsMap` of reserved events, that can be
 * emitted by socket.io with `emitReserved`, and can be listened to with
 * `listen`.
 */
export class Emitter<ReservedEvents extends EventsMap = {}> {
  /**
   * Adds the `listener` function as an event listener for `event`.
   *
   * @param event Name of the event
   * @param listener Callback function
   */
  on<Ev extends EventNames<ReservedEvents>>(
    event: Ev,
    listener: ReservedListener<ReservedEvents, Ev>
  ): this;

  /**
   * Adds a one-time `listener` function as an event listener for `event`.
   *
   * @param event Name of the event
   * @param listener Callback function
   */
  once<Ev extends EventNames<ReservedEvents>>(
    event: Ev,
    listener: ReservedListener<ReservedEvents, Ev>
  ): this;

  /**
   * Removes the `listener` function as an event listener for `event`.
   *
   * @param event Name of the event
   * @param listener Callback function
   */
  off<Ev extends EventNames<ReservedEvents>>(
    event?: Ev,
    listener?: ReservedListener<ReservedEvents, Ev>
  ): this;

  /**
   * Emits an event.
   *
   * @param event Name of the event
   * @param args Values to send to listeners of this event
   */
  protected emit<Ev extends EventNames<ReservedEvents>>(
    event: Ev,
    ...data: ReservedEvents[Ev] extends never ? [undefined?] : [ReservedEvents[Ev]]
  ): this;

  /**
   * Returns the listeners listening to an event.
   *
   * @param event Event name
   * @returns Array of listeners subscribed to `event`
   */
  listeners<Ev extends EventNames<ReservedEvents>>(
    event: Ev
  ): ReservedListener<ReservedEvents, Ev>[];

  /**
   * Returns true if there is a listener for this event.
   *
   * @param event Event name
   * @returns boolean
   */
  hasListeners<Ev extends EventNames<ReservedEvents>>(event: Ev): boolean;

  /**
   * Removes the `listener` function as an event listener for `event`.
   *
   * @param event Name of the event
   * @param listener Callback function
   */
  removeListener<Ev extends EventNames<ReservedEvents>>(
    event?: Ev,
    listener?: ReservedListener<ReservedEvents, Ev>
  ): this;

  /**
   * Removes all `listener` function as an event listener for `event`.
   *
   * @param event Name of the event
   */
  removeAllListeners<Ev extends EventNames<ReservedEvents>>(event?: Ev): this;
}
