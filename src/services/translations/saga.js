import { call, takeEvery } from 'redux-saga/effects';
import _ from 'lodash';
import ls from 'local-storage';

import { localeKey, SET_LOCALE } from './constants';

import { selectedLanguage } from './reducer';

function* saveLocaleCallSaga(_action) {
    const locale = _.get(_action, 'data.locale', selectedLanguage);

    yield call(ls, localeKey, locale);

    return null;
}

export default function* translationsSaga() {
    yield takeEvery(SET_LOCALE, saveLocaleCallSaga);
}
