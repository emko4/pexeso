import 'babel-polyfill';
import 'isomorphic-fetch';

import React from 'react';
import ReactDOM from 'react-dom';

import log from 'loglevel';

import configureStore from './store';
import config from '../config';

import Root from './Root';

// create store and sync browser history
// MUST be propagated by props, because of HOT RELOAD
const { store, history } = configureStore();

// set log level from config by NODE_ENV
log.setLevel(config.logLevel);

// eslint-disable-next-line no-undef
const app = document.getElementById('app');

ReactDOM.render(
    <Root
        store={store}
        history={history}
    />,
    app,
);

if (module.hot) {
    module.hot.accept('./Root', () => {
        // eslint-disable-next-line global-require
        const NewRoot = require('./Root').default;

        ReactDOM.render(
            <NewRoot
                store={store}
                history={history}
            />,
            app,
        );
    });
}
