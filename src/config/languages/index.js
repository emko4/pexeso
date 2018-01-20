/**
 * Config for languages
 * Shape of config object
 *
 *  languageKey: {
 *      key: languageKey, // mandatory, must be same as property key
 *      fullKey: languageFullKey, // mandatory, long key of language
 *      initial: true, // optional, only first found is default language
 *  }
 */

// because webpack config need this config too
module.exports = {
    languages: {
        cs: {
            key: 'cs',
            fullKey: 'czech',
            requestKey: 'cz',
            initial: true,
        },
        en: {
            key: 'en',
            fullKey: 'english',
            requestKey: 'en',
        },
    },
};
