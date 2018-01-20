import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import { LOCALE_PREFIX } from './constants';

import './style.scss';

export default class Error extends Component {

    onButtonClick = () => {
        window.location.reload(true);
    }

    render() {
        return (
            <div className={'error-page'}>
                <div className={'error-page-content'}>
                    <div className={'title'}>
                        <FormattedMessage id={`${LOCALE_PREFIX}.title`} />
                    </div>
                    <div className={'action-wrap'}>
                        <FormattedMessage id={`${LOCALE_PREFIX}.action`} />
                        <span className={'refresh-button'} onClick={this.onButtonClick}>
                            <FormattedMessage id={`${LOCALE_PREFIX}.button`} />
                        </span>
                    </div>
                </div>
            </div>
        );
    }

}
