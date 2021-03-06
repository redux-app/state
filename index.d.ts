/* eslint-disable */

import { Component } from 'react';
import {
  KeysOfType,
  Omit,
  OptionalKeys,
  Overwrite,
  RequiredKeys,
} from 'typelevel-ts';
import { Param0, Param1 } from 'type-zoo';
import {
  compose,
  AnyAction,
  Action as ReduxAction,
  Dispatch as ReduxDispatch,
  Reducer as ReduxReducer,
  Store as ReduxStore,
  StoreEnhancer,
  Middleware,
} from 'redux';
import { string } from 'prop-types';

type AsyncActionTypes = Thunk<any, any, any, any, any>;

type ActionTypes = Action<any, any> | Thunk<any, any, any, any, any>;

type Meta = {
  path: string[];
  parent: string[];
};

export function actionName(action: Action<any, any>): string;

export function thunkStartName(action: Thunk<any, any, any, any, any>): string;

export function thunkCompleteName(
  action: Thunk<any, any, any, any, any>,
): string;

export function thunkFailName(action: Thunk<any, any, any, any, any>): string;

type FilterActionTypes<T extends object> = Omit<
  T,
  KeysOfType<
    T,
    | Array<any>
    | Date
    | RegExp
    | Reducer<any, any>
    | Select<any, any>
    | Listen<any, any, any>
  >
>;

type FilterStateTypes<T extends object> = Overwrite<
  Omit<
    T,
    KeysOfType<
      T,
      Action<any, any> | Listen<any, any, any> | Thunk<any, any, any, any, any>
    >
  >,
  Pick<T, KeysOfType<T, Select<any, any> | Reducer<any, any>>>
>;

/**
 * Filters a model into a type that represents the actions (and effects) only
 *
 * @example
 *
 * type OnlyActions = Actions<Model>;
 */
export type Actions<Model extends Object> = {
  [P in keyof FilterActionTypes<
    Pick<Model, KeysOfType<Model, object>>
  >]: Model[P] extends AsyncActionTypes
    ? (
        payload: Model[P]['payload'],
      ) => Model[P]['result'] extends Promise<any>
        ? Model[P]['result']
        : Promise<Model[P]['result']>
    : Model[P] extends Action<any, any>
    ? Param1<Model[P]> extends void
      ? () => void
      : (payload: Param1<Model[P]>) => void
    : Actions<Model[P]>
};

type RequiredOnly<Model extends Object> = Pick<Model, RequiredKeys<Model>>;
type OptionalOnly<Model extends Object> = Pick<Model, OptionalKeys<Model>>;

type RecursiveState<
  OtherModel extends Object,
  RequiredModel extends Object,
  OptionalModel extends Object
> = Overwrite<
  { [P in keyof OtherModel]: OtherModel[P] },
  Overwrite<
    {
      [P in keyof RequiredModel]: RequiredModel[P] extends Select<any, any>
        ? RequiredModel[P]['result']
        : RequiredModel[P] extends Reducer<any, any>
        ? RequiredModel[P]['result']
        : RequiredModel[P] extends object
        ? RequiredModel[P] extends Array<any> | RegExp | Date
          ? RequiredModel[P]
          : State<RequiredModel[P]>
        : RequiredModel[P]
    },
    {
      [P in keyof OptionalModel]?: OptionalModel[P] extends Select<any, any>
        ? OptionalModel[P]['result']
        : OptionalModel[P] extends Reducer<any, any>
        ? OptionalModel[P]['result']
        : OptionalModel[P] extends object
        ? OptionalModel[P] extends Array<any> | RegExp | Date
          ? OptionalModel[P]
          : State<OptionalModel[P]>
        : OptionalModel[P]
    }
  >
>;

/**
 * Filters a model into a type that represents the state only (i.e. no actions)
 *
 * @example
 *
 * type StateOnly = State<Model>;
 */
export type State<Model extends Object> = RecursiveState<
  FilterStateTypes<Omit<Model, RequiredKeys<Model> & OptionalKeys<Model>>>,
  FilterStateTypes<RequiredOnly<Model>>,
  FilterStateTypes<OptionalOnly<Model>>
>;

/**
 * Configuration interface for the createStore
 */
export interface EasyPeasyConfig<
  InitialState extends Object = {},
  Injections = any
> {
  compose?: typeof compose;
  devTools?: boolean;
  enhancers?: StoreEnhancer[];
  initialState?: InitialState;
  injections?: Injections;
  middleware?: Array<Middleware<any, any, any>>;
  mockActions?: boolean;
  reducerEnhancer?: (reducer: Reducer<any, any>) => Reducer<any, any>;
}

/**
 * Enhances the Redux Dispatch with actions
 *
 * @example
 *
 * type DispatchWithActions = Dispatch<StoreModel>;
 */
export type Dispatch<
  StoreModel,
  Action extends ReduxAction = ReduxAction<any>
> = Actions<StoreModel> & ReduxDispatch<Action>;

export interface ActionData {
  type: string;
  [key: string]: any;
}

/**
 * Represents a Redux store, enhanced by easy peasy.
 *
 * @example
 *
 * type EnhancedReduxStore = Store<StoreModel>;
 */
export type Store<
  StoreModel,
  StoreConfig extends EasyPeasyConfig<any, any> = any
> = Overwrite<
  ReduxStore<State<StoreModel>>,
  {
    dispatch: Dispatch<StoreModel>;
    getMockedActions: () => ActionData[];
    clearMockedActions: () => void;
  }
>;

/**
 * A thunk type.
 *
 * Useful when declaring your model.
 *
 * @example
 *
 * import { Thunk } from '@redux-app/state';
 *
 * interface TodosModel {
 *   todos: Array<string>;
 *   addTodo: Thunk<TodosModel, string>;
 * }
 */
export type Thunk<
  Model extends Object = {},
  Payload = void,
  Injections = any,
  StoreModel extends Object = {},
  Result = any
> = {
  (
    actions: Actions<Model>,
    payload: Payload,
    helpers: {
      dispatch: Dispatch<StoreModel>;
      getState: () => State<Model>;
      getStoreState: () => State<StoreModel>;
      injections: Injections;
      meta: Meta;
    },
  ): Result;
  type: 'thunk';
  payload: Payload;
  result: Result;
};

/**
 * Declares an thunk action type against your model.
 *
 * https://github.com/redux-app/state#thunkaction
 *
 * @example
 *
 * import { thunk } from '@redux-app/state';
 *
 * const store = createStore({
 *   login: thunk(async (actions, payload) => {
 *    const user = await loginService(payload);
 *    actions.loginSucceeded(user);
 *  })
 * });
 */
export function thunk<
  Model extends Object = {},
  Payload = void,
  Injections = any,
  StoreModel extends Object = {},
  Result = any
>(
  thunk: (
    actions: Actions<Model>,
    payload: Payload,
    helpers: {
      dispatch: Dispatch<StoreModel>;
      getState: () => State<Model>;
      getStoreState: () => State<StoreModel>;
      injections: Injections;
      meta: Meta;
    },
  ) => Result,
): Thunk<Model, Payload, Injections, StoreModel, Result>;

/**
 * Action listeners type.
 *
 * Useful when declaring your model.
 *
 * @example
 *
 * import { Listeners } from '@redux-app/state';
 *
 * interface Model {
 *   userListeners: Listeners<Model>;
 * }
 *
 * listen(on => {
 *   on()
 * })
 */
export type Listen<
  Model extends Object = {},
  Injections = any,
  StoreModel extends Object = {}
> = {
  type: 'listen';
};

/**
 * Declares action listeners against your model.
 *
 * https://github.com/redux-app/state#listenersattach
 *
 * @example
 *
 * import { listen } from '@redux-app/state';
 *
 * const store = createStore({
 *   users: userModel,
 *   audit: {
 *     logs: [],
 *     add: (state, payload) => {
 *       state.logs.push(payload)
 *     },
 *     userListeners: listen((on) => {
 *       on(userModel.login, (actions) => {
 *          actions.add('User logged in');
 *       });
 *     })
 *   }
 * });
 */
export function listen<
  Model extends Object = {},
  Injections = any,
  StoreModel extends Object = {}
>(
  attach: (
    on: <ListenAction extends ActionTypes | string>(
      action: ListenAction,
      handler:
        | Thunk<
            Model,
            ListenAction extends string
              ? any
              : ListenAction extends AsyncActionTypes
              ? ListenAction['payload']
              : Param1<ListenAction>,
            Injections,
            StoreModel
          >
        | Action<
            Model,
            ListenAction extends string
              ? any
              : ListenAction extends AsyncActionTypes
              ? ListenAction['payload']
              : Param1<ListenAction>
          >,
    ) => void,
  ) => void,
): Listen<Model, Injections, StoreModel>;

/**
 * An action type.
 *
 * Useful when declaring your model.
 *
 * @example
 *
 * import { Action } from '@redux-app/state';
 *
 * interface Model {
 *   todos: Array<Todo>;
 *   addTodo: Action<Model, Todo>;
 * }
 */
export type Action<Model extends Object = {}, Payload = void> = {
  (state: State<Model>, payload: Payload): void | State<Model>;
  type: 'action';
  payload: Payload;
  result: void | State<Model>;
};

/**
 * Declares an action type against your model.
 *
 * https://github.com/redux-app/state#action
 *
 * @example
 *
 * import { action } from '@redux-app/state';
 *
 * const store = createStore({
 *   count: 0,
 *   increment: action((state)) => {
 *    state.count += 1;
 *   })
 * });
 */
export function action<Model extends Object = {}, Payload = any>(
  action: (state: State<Model>, payload: Payload) => void | State<Model>,
): Action<Model, Payload>;

/**
 * A select type.
 *
 * Useful when declaring your model.
 *
 * @example
 *
 * import { Select } from '@redux-app/state';
 *
 * interface Model {
 *   products: Array<Product>;
 *   totalPrice: Select<Model, number>;
 * }
 */
export type Select<Model extends Object = {}, Result = any> = {
  (state: State<Model>): Result;
  type: 'select';
  result: Result;
};

/**
 * Allows you to declare derived state against your model.
 *
 * https://github.com/redux-app/state#selectselector
 *
 * @example
 *
 * import { select } from '@redux-app/state';
 *
 * const store = createStore({
 *   products: [],
 *   totalPrice: select(state =>
 *     state.products.reduce((acc, cur) => acc + cur.price, 0)
 *   )
 * });
 */
export function select<Model extends Object = {}, Result = any>(
  select: (state: State<Model>) => Result,
  dependencies?: Array<Select<any, any>>,
): Select<Model, Result>;

/**
 * A reducer type.
 *
 * Useful when declaring your model.
 *
 * @example
 *
 * import { Reducer } from '@redux-app/state';
 *
 * interface Model {
 *   router: Reducer<ReactRouterState>;
 * }
 */
export type Reducer<State = any, Action extends ReduxAction = AnyAction> = {
  (state: State, action: Action): State;
  type: 'reducer';
  result: State;
};

/**
 * Allows you to declare a custom reducer to manage a bit of your state.
 *
 * https://github.com/redux-app/state#reducerfn
 *
 * @example
 *
 * import { reducer } from '@redux-app/state';
 *
 * const store = createStore({
 *   counter: reducer((state = 1, action) => {
 *     switch (action.type) {
 *       case 'INCREMENT': return state + 1;
 *       default: return state;
 *     }
 *   })
 * });
 */
export function reducer<State extends Object = {}>(
  state: ReduxReducer<State>,
): Reducer<State>;

/**
 * Creates an @redux-app/state powered Redux store.
 *
 * https://github.com/redux-app/state#createstoremodel-config
 *
 * @example
 *
 * import { createStore } from '@redux-app/state';
 *
 * interface StoreModel {
 *   todos: {
 *     items: Array<string>;
 *   }
 * }
 *
 * const store = createStore<StoreModel>({
 *   todos: {
 *     items: [],
 *   }
 * })
 */
export function createStore<
  StoreModel extends Object = {},
  StoreConfig extends EasyPeasyConfig<any, any> = any
>(model: StoreModel, config?: StoreConfig): Store<StoreModel, StoreConfig>;

/**
 * A React Hook allowing you to use state within your component.
 *
 * https://github.com/redux-app/state#usestoremapstate-externals
 *
 * @example
 *
 * import { useStore, State } from '@redux-app/state';
 *
 * function MyComponent() {
 *   const todos = useStore((state: State<StoreModel>) => state.todos.items);
 *   return todos.map(todo => <Todo todo={todo} />);
 * }
 */
export function useStore<StoreState extends State<any> = {}, Result = any>(
  mapState: (state: StoreState) => Result,
  dependencies?: Array<any>,
): Result;

/**
 * A React Hook allowing you to use actions within your component.
 *
 * https://github.com/redux-app/state#useactionsmapactions
 *
 * @example
 *
 * import { useActions, Actions } from '@redux-app/state';
 *
 * function MyComponent() {
 *   const addTodo = useAction((actions: Actions<StoreModel>) => actions.todos.add);
 *   return <AddTodoForm save={addTodo} />;
 * }
 */
export function useActions<StoreModel extends Object = {}, Result = any>(
  mapActions: (actions: Actions<StoreModel>) => Result,
): Result;

/**
 * A React Hook allowing you to use the store's dispatch within your component.
 *
 * https://github.com/redux-app/state#usedispatch
 *
 * @example
 *
 * import { useDispatch } from '@redux-app/state';
 *
 * function MyComponent() {
 *   const dispatch = useDispatch();
 *   return <AddTodoForm save={(todo) => dispatch({ type: 'ADD_TODO', payload: todo })} />;
 * }
 */
export function useDispatch<StoreModel extends Object = {}>(): Dispatch<
  StoreModel
>;

/**
 * A utility function used to create pre-typed hooks.
 *
 * @example
 * const { useActions, useStore, useDispatch } = createTypedHooks<StoreModel>();
 *
 * useActions(actions => actions.todo.add); // fully typed
 */
export function createTypedHooks<StoreModel extends Object = {}>(): {
  useActions: <Result = any>(
    mapActions: (actions: Actions<StoreModel>) => Result,
  ) => Result;
  useAction: <Result = any>(
    mapAction: (actions: Dispatch<StoreModel>) => Result,
  ) => Result;
  useDispatch: () => Dispatch<StoreModel>;
  useStore: <Result = any>(
    mapState: (state: State<StoreModel>) => Result,
    dependencies?: Array<any>,
  ) => Result;
};

/**
 * Exposes the store to your app (and hooks).
 *
 * https://github.com/redux-app/state#storeprovider
 *
 * @example
 *
 * import { StoreProvider } from '@redux-app/state';
 *
 * ReactDOM.render(
 *   <StoreProvider store={store}>
 *     <App />
 *   </StoreProvider>
 * );
 */
export class StoreProvider<StoreModel = any> extends Component<{
  store: Store<StoreModel>;
}> {}
