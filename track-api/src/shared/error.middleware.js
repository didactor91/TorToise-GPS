const { errors: { LogicError, InputError, UnauthorizedError } } = require('track-utils')

module.exports = function errorMiddleware(err, req, res, next) {
    let status = 500

    if (err instanceof UnauthorizedError) status = 401
    else if (err instanceof LogicError) status = 409
    else if (err instanceof InputError) status = 400
    else if (err.status) status = err.status

    const message = err.message || 'Internal server error'
    res.status(status).json({ error: message })
}
