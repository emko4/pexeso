import _ from 'lodash';
import ls from 'local-storage';
import log from 'loglevel';
import { Record } from 'immutable';
import { addLocaleData } from 'react-intl';

import config from '../../config';

import { localeKey, SET_LOCALE } from './constants';

// add locale data of used languages
_.each(config.languages, (language) => {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const localeData = require(`react-intl/locale-data/${language.key}`);

    addLocaleData(localeData);
});

// default language from config
const defaultLanguage = _.get(_.find(config.languages, { initial: true }), 'key', 'cs');

// language from browser navigator
// eslint-disable-next-line no-undef
const browserLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;
const browserLanguageWithoutRegionCode = browserLanguage.toLowerCase().split(/[_-]+/)[0];

// saved language from locale storage
const localeStorageLanguage = ls(localeKey);

// selected language by priority
export const selectedLanguage = localeStorageLanguage || browserLanguageWithoutRegionCode || defaultLanguage;
log.info(`Selected language: ${localeStorageLanguage}`);

const TranslationRecord = Record({
    locale: selectedLanguage,
});

export default (state = new TranslationRecord(), action = {}) => {
    switch (action.type) {
        case SET_LOCALE: {
            const locale = _.get(action, 'data.locale', selectedLanguage);

            return state.set('locale', locale);
        }
        default:
            return state;
    }
};
