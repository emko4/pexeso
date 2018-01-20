import AppError from './appError';

class ApiError extends AppError {

    constructor(message, title, code, res, uri) {
        super(message, title, code, res);

        this.uri = uri;
    }

}

export default ApiError;
