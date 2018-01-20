import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { ConnectedRouter as Router } from 'react-router-redux';

import App from '../App';

class Root extends Component {

    static propTypes = {
        history: PropTypes.object.isRequired,
        store: PropTypes.object.isRequired,
    };

    render() {
        const { store, history } = this.props;

        return (
            <Provider store={store}>
                <Router history={history}>
                    <App />
                </Router>
            </Provider>
        );
    }

}

export default Root;
