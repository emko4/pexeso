import { IntlProvider } from 'react-intl';
import messages from './intl';

const intlProvider = null;
const cachedLocale = null;

const getIntl = (locale = cachedLocale) => {
    const provider = (!intlProvider || (cachedLocale !== locale)) ? new IntlProvider({ locale, messages: messages[locale] }) : intlProvider;

    return provider.getChildContext();
};

const formatMessage = (locale = cachedLocale, id = '', values = {}) => {
    const intl = getIntl(locale).intl;

    return intl.formatMessage({ id }, values);
};

const formatHTMLMessage = (locale = cachedLocale, id = '', values = {}) => {
    const intl = getIntl(locale).intl;

    return intl.formatHTMLMessage({ id }, values);
};

const formatNumber = (locale = cachedLocale, value = 0, options = {}) => {
    const intl = getIntl(locale).intl;

    return intl.formatNumber(value, options);
};

export default {
    formatMessage,
    formatHTMLMessage,
    formatNumber,
};
