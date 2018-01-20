import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { IntlProvider } from 'react-intl';

import messages from './intl';

function mapStateToProps(state) {
    return {
        locale: state.getIn(['translate', 'locale']),
    };
}

export default function (InnerComponent) {
    @connect(mapStateToProps)
    class Translation extends Component {

        static propTypes = {
            locale: PropTypes.string.isRequired,
        };

        render() {
            const { locale, ...hocProps } = this.props;

            return (
                <IntlProvider key={locale} locale={locale} messages={messages[locale]}>
                    <InnerComponent {...hocProps} />
                </IntlProvider>
            );
        }

    }

    return Translation;
}
