const validate = require('../validate')
const { ConnectionError, HttpError } = require('../errors')



async function call(url, options = {}) {
    const { method = 'GET', headers, data } = options

    validate.arguments([
        { name: 'url', value: url, type: String, notEmpty: true },
        { name: 'method', value: method, type: String, notEmpty: true },
        { name: 'headers', value: headers, type: Object, optional: true },
        { name: 'data', value: data, type: Object, optional: true }
    ])

    validate.url(url)

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined
        })

        if (!response.ok) {
            const err = new HttpError()
            err.status = response.status
            try {
                const body = await response.json()
                err.message = body.error
            } catch {
                // noop — body may not be JSON
            }
            throw err
        }

        return response.json()
    } catch (error) {
        if (error instanceof HttpError) throw error

        // Network/connection failures (DNS, refused, etc.)
        if (error instanceof TypeError) throw new ConnectionError('cannot connect')

        throw error
    }
}


module.exports = call
