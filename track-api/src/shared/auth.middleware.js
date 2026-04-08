const { errors: { UnauthorizedError } } = require('track-utils')
const jwt = require('jsonwebtoken')

const { env: { JWT_SECRET } } = process

module.exports = function authMiddleware(req, res, next) {
    try {
        const { headers: { authorization } } = req

        if (!authorization) throw new UnauthorizedError()

        const token = authorization.slice(7)

        const { sub } = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })

        req.userId = sub

        next()
    } catch (err) {
        // Wrap all JWT-specific errors as UnauthorizedError so the centralized
        // error middleware maps them to 401 instead of 500.
        if (err.name === 'JsonWebTokenError' ||
            err.name === 'TokenExpiredError' ||
            err.name === 'NotBeforeError') {
            next(new UnauthorizedError(err.message))
        } else {
            next(err)
        }
    }
}
