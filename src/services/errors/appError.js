class AppError extends Error {

    constructor(message, title, code, res) {
        super(message);
        this.name = this.constructor.name;
        this.caption = message || 'Application Error';
        this.title = title || null;
        this.timestamp = Date.now();
        this.code = code || 500;
        this.res = res;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor.name);
        }
    }

}

export default AppError;
