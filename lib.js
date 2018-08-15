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
        return number === NaN ? value : number;
    }

    _merge(target, source) {
        if (this._is_object(target) && this._is_object(source)) {
            for (const key in source) {
                if (this._is_object(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this._merge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
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

    merge_defaults(source) {
        this._merge(this.conf, source);
    }

    merge_file(path) {
        const source = Object.assign(JSON.parse(fs.readFileSync(path, 'utf8')));
        this._merge(this.conf, source);
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

    get() {
        return this.conf;
    }
}

module.exports = Config;
module.exports.default = Config;
