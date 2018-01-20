import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import hocConnect from './hocConnect';

import './style.scss';

@hocConnect
export default class NotFound extends Component {

    static propTypes = {
        replace: PropTypes.func.isRequired,
    };

    onBackHandler = () => {
        const { replace } = this.props;

        replace('/');
    };

    render() {
        return (
            <div className={'not-found'}>
                <FormattedMessage id={'components.NotFound.text'} />
                <button onClick={this.onBackHandler}>
                    <FormattedMessage id={'components.NotFound.button'} />
                </button>
            </div>
        );
    }

}
