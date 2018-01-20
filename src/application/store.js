import log from 'loglevel';
import { Map } from 'immutable';
import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';

import createHistory from 'history/createBrowserHistory';

import createSagaMiddleware from 'redux-saga';
import multi from 'redux-multi';

import rootReducer from './reducers';
import rootSaga from './sagas';

import config from '../config';

// MUST BE ONLY ONE INSTANCE (for middleware and sync)
const history = createHistory();

export default function configureStore(initialState = Map()) {
    // Create middlewares
    const sagaMiddleware = createSagaMiddleware();
    const routingMiddleware = routerMiddleware(history);

    // Initialization of middlewares
    const middleware = applyMiddleware(multi, sagaMiddleware, routingMiddleware);

    // enhancer for production mode
    let enhancer = compose(middleware);

    // DevTools by config
    if (config.devTools) {
        // eslint-disable-next-line no-underscore-dangle
        if (window.__REDUX_DEVTOOLS_EXTENSION__) {
            // enhancer for development mode with DevTool extension
            enhancer = compose(
                middleware,
                // eslint-disable-next-line no-underscore-dangle
                window.__REDUX_DEVTOOLS_EXTENSION__(),
            );
        } else {
            // enhancer for development mode without DevTool extension
            log.warn("You haven't devTools extension in browser!");
        }
    }

    // Create store
    const store = createStore(rootReducer, initialState, enhancer);
    // Run saga middleware with given root saga
    let sagaTask = sagaMiddleware.run(rootSaga);

    // Enable hot reload where available.
    if (module.hot) {
        // Enable Webpack hot module replacement for reducers.
        module.hot.accept('./reducers', () => {
            // eslint-disable-next-line global-require
            const newRootReducer = require('./reducers').default;

            store.replaceReducer(newRootReducer);
        });

        // Enable Webpack hot module replacement for sagas.
        module.hot.accept('./sagas', () => {
            // eslint-disable-next-line global-require
            const getNewSagas = require('./sagas').default;

            sagaTask.cancel();
            sagaTask.done.then(() => {
                sagaTask = sagaMiddleware.run(getNewSagas);
            });
        });
    }

    return {
        store,
        history,
    };
}
