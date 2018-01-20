// import { delay } from 'redux-saga';
import { call, put } from 'redux-saga/effects';

import { REQUEST, SUCCESS, FAILED, COMPLETE } from './constants';
import fetch from './fetch';
import { createResultAction, takeTypeLatestDebounce } from './helpers/saga';

const requestRegex = new RegExp(`^.*_${REQUEST}$`);

function isRequestAction(_action) {
    return _action.type && requestRegex.test(_action.type);
}

/**
 * Generator for redux-saga for api calls
 * @param {Object} _action - redux action for api call
 */
export function* requestCallSaga(_action) {
    try {
        // prepare header and call request
        const headers = {};
        const result = yield call(fetch, { headers }, _action.payload);

        // test slow requests
        // yield delay(2000);

        // dispatch success action
        yield put(createResultAction(_action, SUCCESS, { response: result }));
    } catch (_err) {
        // dispatch error action
        yield put(createResultAction(_action, FAILED, { error: _err }));
    } finally {
        // dispatch complete action
        yield put(createResultAction(_action, COMPLETE));
    }
    return null;
}

/**
 * Root generator for redux-saga for api calls to run them concurrently
 */
export default function* requestSaga() {
    yield takeTypeLatestDebounce(isRequestAction, requestCallSaga);
}
