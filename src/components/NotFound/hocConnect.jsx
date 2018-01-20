import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { replace } from 'react-router-redux';

function mapDispatchToProps(dispatch) {
    return bindActionCreators({ replace }, dispatch);
}

export default function (InnerComponent) {
    @connect(null, mapDispatchToProps)
    class HocConnect extends Component {

        render() {
            return (
                <InnerComponent
                    {...this.props}
                />
            );
        }

    }

    return HocConnect;
}
