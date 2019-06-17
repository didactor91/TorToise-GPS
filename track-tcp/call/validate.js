const{ ValueError, RequirementError, FormatError } = require ('./errors')

const validate = {
    arguments(args) {
        args.forEach(({ name, value, type, notEmpty, optional }) => {
            if (value != undefined) {
                if(value.constructor !== type) throw TypeError(`${name} ${value} is not a ${type.name}`)

                if (notEmpty)
                    switch (type) {
                        case String:
                            if (!value.trim().length) throw new ValueError(`${name} is empty`)
                            break;
                        case Array:
                            if(!value.length) throw new ValueError(`${name} is empty`)
                            break;
                        case Object:
                            if (!Object.keys(value).length) throw new ValueError(`${name} is empty`)
                    }
            } else if (!optional) throw new RequirementError(`${name} is not optional`)
        })
    },

    email(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (!re.test(String(email))) throw new FormatError(`${email} is not an e-mail`)
    },

    url(url) {
        const re = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/

        if (!re.test(String(url))) throw new FormatError(`${url} is not a url`)
    }
}

module.exports = validate