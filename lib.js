const fs = require('fs');

class Config {
    constructor(config) {
        this.conf = {};
        this.schema = {};
        this.preserveCase = config ? config.preserveCase === true : false;
    }

    _is_object(item) {
        return item && typeof item === 'object' && !Array.isArray(item) && item !== null;
    }

    _convert_to_bool(value) {}

    _convert(value, desired_type) {
        if (desired_type === 'string') return value;

        if (value === 'true') return true;
        if (value === 'false') return false;
        if (desired_type === 'boolean') throw new TypeError(`${value} expected to be boolean`);

        if (value === 'null') return null;
        if (desired_type === 'null') throw new TypeError(`${value} expected to be null`);

        if (value === 'undefined') return undefined;
        if (desired_type === 'undefined') throw new TypeError(`${value} expected to be undefined`);

        let number = Math.trunc(value);
        if (!isNaN(number)) return number;
        if (desired_type === 'number') throw new TypeError(`${value} expected to be number`);

        return value;
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

    _in_schema(key_path) {
        let next = this.schema;
        for (let key of key_path) {
            if (next[key] === undefined) {
                return false;
            }
            next = next[key];
        }

        if (next === undefined) {
            return false;
        }

        return next;
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

    merge_env(prefix, use_schema = true) {
        if (prefix !== undefined) {
            prefix = `${this.preserveCase ? prefix : prefix.toLowerCase()}_`;
        }

        for (let key in process.env) {
            const cleaned_key = this.preserveCase ? key : key.toLowerCase();
            const key_path = cleaned_key.replace(prefix, '').split('_');

            let prefered_type = undefined;
            if (use_schema && Object.keys(this.schema).length) {
                prefered_type = this._in_schema(key_path);

                if (!prefered_type) {
                    continue;
                }
            }

            if (prefix && !cleaned_key.includes(prefix)) {
                continue;
            }

            this._set(this.conf, key_path, this._convert(process.env[key], prefered_type));
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

    set_schema(schema) {
        this.schema = { ...schema };
    }

    validate(schema) {
        if (schema === undefined) {
            schema = this.schema;
        }

        this._validate_recursively(this.conf, schema);
    }

    get() {
        return { ...this.conf };
    }
}

module.exports = Config;
module.exports.default = Config;
