import _ from 'lodash';

import AppError from '../../errors/appError';

function getHeaders(_response) {
    const headers = {};

    _response.headers.forEach((value, key) => {
        headers[key] = value;
    });

    return headers;
}

export function getParamObject(paramsArray, param) {
    return _.merge({}, ..._.map(paramsArray, (p) => {
        const paramObject = _.get(p, param, {});
        if (typeof paramObject !== 'object') return {};

        return paramObject;
    }));
}

export function getParamString(paramsArray, param) {
    return _.get(_.find(paramsArray, (p) => (p[param])), param, '');
}

export function parametrize(string, params) {
    let res = string;
    _.forEach(params, (value, key) => {
        res = res.replace(`:${key}`, value);
    });
    return res;
}

export function getJsonResult(_response) {
    return _response.json()
        .then((_json) => (
            {
                body: _json,
                headers: getHeaders(_response),
            }
        ))
        .catch(() => {
            throw new AppError('Failed to parse JSON', null, _response.status);
        });
}

export function getBlobResult(_response) {
    return _response.blob()
        .then((_blob) => (
            {
                body: _blob,
                headers: getHeaders(_response),
            }
        ))
        .catch(() => {
            throw new AppError('Failed to blob', null, _response.status);
        });
}
