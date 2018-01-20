import _ from 'lodash';
import log from 'loglevel';

import languagesConfig from './languages';

/**
 * LOAD NODE_ENV CONFIG
 */
const envNode = process.env.NODE_ENV;
// eslint-disable-next-line import/no-dynamic-require
const envNodeConfig = require(`./enviromentNode/${envNode}.js`).default;

// Get apiBase from NODE_ENV config
const apiBase = _.get(envNodeConfig, 'api.base');

/**
 * DEFAULT CONFIG
 */
const defaults = {
    // default configuration goes here
    devTools: true,
    logLevel: log.levels.TRACE,
    api: {
        testRequest: {
            uri: `${apiBase}/test`,
        },
    },
};

/**
 * MERGE ALL CONFIGS TOGETHER
 */
const config = _.merge(
    defaults,
    languagesConfig,
);

export default config;
