import * as types from './constants';

// eslint-disable-next-line import/prefer-default-export
export function setLocale(locale) {
    return {
        type: types.SET_LOCALE,
        data: {
            locale,
        },
    };
}
