import { delay, buffers } from 'redux-saga';
import { call, take, fork, cancel, actionChannel } from 'redux-saga/effects';

import _ from 'lodash';

const FOREVER = true;

export function createResultAction(originAction, resultType, payload = {}) {
    return {
        type: `${originAction.type}_${resultType}`,
        payload: {
            ...payload,
            originAction,
        },
    };
}

/**
 * Redux-saga take type latest helper with debounce effect (for autocomplete, etc.)
 * For debounce effect action must have meta properties:
 *
 *  meta: {
 *      debounce: {
 *          delay: 2000, // mandatory, must be more than 0
 *          leading: true, // optional (default true)
 *          trailing: false, // optional (default false)
 *      }
 *  }
 *
 * explain of debounce effect:      https://css-tricks.com/debouncing-throttling-explained-examples/
 * lodash debounce implementation:  https://lodash.com/docs/4.17.4#debounce
 */
export function* takeTypeLatestDebounce(pattern, saga, ...args) {
    // local settings of effect
    const metaPrefix = 'meta.debounce';

    // saga for actions with debounce trailing parameter
    function* debounceTrailingSaga(action, time) {
        yield call(delay, time);
        yield call(saga, action, ...args);
    }

    // eslint-disable-next-line func-names
    const foreverTask = yield fork(function* () {
        // hash map for action types
        const hashTasks = {};

        while (FOREVER) {
            // wait for action
            const action = yield take(pattern);

            // get debounce settings
            const time = _.get(action, `${metaPrefix}.delay`, 0);
            const trailing = _.get(action, `${metaPrefix}.trailing`, true);
            const leading = _.get(action, `${metaPrefix}.leading`, false);

            // create empty object for action type
            if (!hashTasks[action.type]) {
                hashTasks[action.type] = {};
            }

            // use debounce settings if time is more than 0 and one of flags is set to true
            if (time > 0 && (leading || trailing)) {
                // trailing debounce flag branch
                if (trailing) {
                    // cancel running trailing task, if it exists and is running
                    if (hashTasks[action.type].taskTrailing && hashTasks[action.type].taskTrailing.isRunning()) {
                        yield cancel(hashTasks[action.type].taskTrailing);
                    }

                    // if trailing and leading flags are true, imitate lodash implementation
                    // trailing task is triggered only if action was taken twice in delay duration
                    if (leading) {
                        if (hashTasks[action.type].timerLeading && hashTasks[action.type].timerLeading.isRunning()) {
                            hashTasks[action.type].taskTrailing = yield fork(debounceTrailingSaga, action, time, ...args);
                        }
                        // else use standard behavior of trailing flag
                        // rewrite trailing cancelled task with new one
                    } else {
                        hashTasks[action.type].taskTrailing = yield fork(debounceTrailingSaga, action, time, ...args);
                    }
                }

                // leading debounce flag branch
                if (leading) {
                    // if leading delay timer exist and running, cancel that timer
                    if (hashTasks[action.type].timerLeading && hashTasks[action.type].timerLeading.isRunning()) {
                        yield cancel(hashTasks[action.type].timerLeading);
                        // else fork action
                    } else {
                        hashTasks[action.type].taskLeading = yield fork(saga, ...args.concat(action));
                    }

                    // and finally fork new leading delay timer
                    hashTasks[action.type].timerLeading = yield fork(delay, time);
                }
                // else use standard takeTypeLatest effect behavior
            } else {
                // if task exists and is running, cancael thaty task
                if (hashTasks[action.type].task && hashTasks[action.type].task.isRunning()) {
                    yield cancel(hashTasks[action.type].task);
                }

                // rewrite old task with new action task
                hashTasks[action.type].task = yield fork(saga, action, ...args);
            }
        }
    });

    return foreverTask;
}

/**
 * Redux-saga take type latest helper with ONLY trailing debounce effect (for autocomplete, etc.)
 * For debounce effect action must have meta properties:
 *
 *  meta: {
 *      debounce: {
 *          delay: 2000, // mandatory, must be more than 0
 *      }
 *  }
 *
 * explain of debounce effect:      https://css-tricks.com/debouncing-throttling-explained-examples/
 * lodash debounce implementation:  https://lodash.com/docs/4.17.4#debounce
 */
export function* takeTypeLatestTrailingDebounce(pattern, saga, ...args) {
    // local settings of effect
    const metaPrefix = 'meta.debounce';

    // saga for actions with debounce parameter
    function* debounceSaga(action, time) {
        yield call(delay, time);
        yield call(saga, action, ...args);
    }

    // eslint-disable-next-line func-names
    const foreverTask = yield fork(function* () {
        // hash map for action types
        const hashTasks = {};

        while (FOREVER) {
            // wait for action
            const action = yield take(pattern);

            // get debounce settings
            const time = _.get(action, `${metaPrefix}.delay`, 0);

            // if there is same type running task => cancel that task
            if (hashTasks[action.type] && hashTasks[action.type].isRunning()) {
                yield cancel(hashTasks[action.type]);
            }

            // use debounce settings if time is more than 0
            if (time > 0) {
                // fork debounce saga and save task to hash object
                hashTasks[action.type] = yield fork(debounceSaga, action, time, ...args);
            } else {
                // fork saga and save task to hash object
                hashTasks[action.type] = yield fork(saga, action, ...args);
            }
        }
    });

    return foreverTask;
}

/**
 * Redux-saga takeEvery effect implemetation
 * From redux-saga documentation https://redux-saga.github.io/redux-saga/docs/api/index.html#takeeverypattern-saga-args
 */
function* takeEvery(pattern, saga, ...args) {
    // eslint-disable-next-line func-names
    const task = yield fork(function* () {
        while (FOREVER) {
            const action = yield take(pattern);

            yield fork(saga, ...args.concat(action));
        }
    });

    return task;
}

/**
 * Redux-saga takeEvery effect implemetation
 * From redux-saga documentation https://redux-saga.github.io/redux-saga/docs/api/index.html#takelatestpattern-saga-args
 */
function* takeLatest(pattern, saga, ...args) {
    // eslint-disable-next-line func-names
    const task = yield fork(function* () {
        let lastTask = null;

        while (FOREVER) {
            const action = yield take(pattern);

            if (lastTask) {
                yield cancel(lastTask); // cancel is no-op if the task has already terminated
            }

            lastTask = yield fork(saga, ...args.concat(action));
        }
    });

    return task;
}

/**
 * Redux-saga throttle effect implemetation
 * From redux-saga documentation https://redux-saga.github.io/redux-saga/docs/api/index.html#throttlems-pattern-saga-args
 */
function* throttle(ms, pattern, task, ...args) {
    const throttleChannel = yield actionChannel(pattern, buffers.sliding(1));

    while (FOREVER) {
        const action = yield take(throttleChannel);

        yield fork(task, ...args, action);
        yield call(delay, ms);
    }
}

/**
 * Create unique hash of given object
 * From http://stackoverflow.com/questions/194846/is-there-any-kind-of-hash-code-function-in-javascript
 */
function getHashCode(obj) {
    let hashCode = '';

    if (typeof obj !== 'object') {
        return hashCode + obj;
    }

    // eslint-disable-next-line
    for (const prop in obj) { // No hasOwnProperty needed
        hashCode += prop + getHashCode(obj[prop]); // Add key + value to the result string
    }

    return hashCode;
}

export default {
    takeTypeLatestDebounce,
    takeTypeLatestTrailingDebounce,
    takeEvery,
    takeLatest,
    throttle,
    getHashCode,
};
