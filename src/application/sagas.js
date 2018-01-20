import { all } from 'redux-saga/effects';

import apiSaga from '../services/api/saga';
import translationsSaga from '../services/translations/saga';

/**
 * Root generator for all application sagas
 */
export default function* () {
    yield all([
        apiSaga(),
        translationsSaga(),
    ]);
}
