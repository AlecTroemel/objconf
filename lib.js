const fs = require('fs');

class Config {
    constructor() {
        this.conf = {};
    }

    _is_object(item) {
        return item && typeof item === 'object' && !Array.isArray(item) && item !== null;
    }

    _convert(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        if (value === 'undefined') return undefined;
        let number = Math.trunc(value);
        return isNaN(number) ? value : number;
    }

    _merge(target, source) {
        if (this._is_object(target) && this._is_object(source)) {
            for (const key in source) {
                if (this._is_object(source[key])) {
                    if (!target[key]) {
                        Object.assign(target, { [key]: {} });
                    }
                    this._merge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
    }

    merge_defaults(source) {
        this._merge(this.conf, source);
    }

    merge_file(path, required = false) {
        try {
            const source = Object.assign(JSON.parse(fs.readFileSync(path, 'utf8')));
            this._merge(this.conf, source);
        } catch (err) {
            if (required) {
                throw err;
            }
        }
    }

    merge_env(prefix) {
        prefix = `${prefix.toLowerCase()}_`;

        for (let key in process.env) {
            let key_lowercase = key.toLowerCase();
            if (key_lowercase.includes(prefix)) {
                let value = process.env[key];
                this._set(
                    this.conf,
                    key_lowercase.replace(prefix, '').split('_'),
                    this._convert(value)
                );
            }
        }
    }

    _set(target, path_array, value) {
        if (path_array.length > 1) {
            const key = path_array.shift();
            if (target[key] === undefined) {
                target[key] = {};
            }
            this._set(target[key], path_array, value);
        } else {
            target[path_array[0]] = value;
        }
    }

    _validate_recursively(target, schema, path = '') {
        if (this._is_object(target) && this._is_object(schema)) {
            for (const key in schema) {
                if (this._is_object(schema[key])) {
                    if (this._is_object(target[key])) {
                        this._validate_recursively(target[key], schema[key], `${path}${key}.`);
                    } else {
                        throw new TypeError(
                            `expected ${path}${key} to be an object, was ${typeof target[key]}`
                        );
                    }
                } else {
                    // need to special case null since its type is 'object'
                    if (schema[key] === 'null') {
                        if (target[key] !== null) {
                            throw new TypeError(
                                `expected ${path}${key} to be null, was ${typeof target[key]}`
                            );
                        }
                    } else {
                        if (typeof target[key] !== schema[key]) {
                            throw new TypeError(
                                `expected ${path}${key} to be a ${schema[key]}, was ${typeof target[
                                    key
                                ]}`
                            );
                        }
                    }
                }
            }
        }
    }

    validate(schema) {
        this._validate_recursively(this.conf, schema);
    }

    get() {
        return { ...this.conf };
    }
}

module.exports = Config;
module.exports.default = Config;
