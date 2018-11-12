const { test } = require('ava');
const fs = require('fs');
const Config = require('./lib.js');

test('merge defaults', t => {
    const conf = new Config();
    const expected = { a: 1, b: { c: '2' } };
    conf.merge_defaults(expected);
    t.deepEqual(expected, conf.get());
});

test('merge file', t => {
    const test_file_path = 'testData.json';
    const conf = new Config();
    const expected = { a: 1, b: { c: '2' } };
    try {
        fs.writeFileSync(test_file_path, JSON.stringify(expected));
        conf.merge_file(test_file_path);
        t.deepEqual(expected, conf.get());
    } catch (err) {
        t.fail(err);
    } finally {
        fs.unlinkSync(test_file_path);
    }
});

test('merge file not required fails silently when file doesn not exist', t => {
    const conf = new Config();
    conf.merge_file('file/not/here.json');
    t.deepEqual({}, conf.get());
});

test('merge file required fails loudly when file doesn not exist', t => {
    const conf = new Config();
    t.throws(() => {
        conf.merge_file('file/not/here.json', true);
    }, Error);
});

test('get returns a copy of the underlying conf obj', t => {
    const conf = new Config();
    const expected = { a: 1, b: { c: '2' } };
    conf.merge_defaults(expected);
    let copy = conf.get();
    copy = 'should do nothing';
    t.deepEqual(expected, conf.get());
});

test('merge env with no schema', t => {
    const conf = new Config();
    const expected = { test: 'test' };
    process.env.OBJCONF_TEST = 'test';
    conf.merge_env('objconf');
    t.deepEqual(expected, conf.get());
});

test('merge env with more complicated env and preserve cases', t => {
    const conf = new Config({ preserveCase: true });
    const schema = {
        limiter: {
            capacity: 'number',
            interval: 'number',
            maxWaitingTime: 'number',
        },
    };
    const expected = {
        limiter: {
            capacity: 5,
            interval: 1,
            maxWaitingTime: 10,
        },
    };
    process.env.limiter_maxWaitingTime = '10';
    process.env.limiter_capacity = '5';
    process.env.limiter_interval = '1';
    conf.set_schema(schema);
    conf.merge_env();
    t.deepEqual(expected, conf.get());
});

test('merge env with schema', t => {
    const conf = new Config();
    const expected = { testing: 'test' };
    process.env.TESTING = 'test';
    process.env.TESTING_TWO = 'should not show up';

    conf.set_schema({ testing: 'string' });
    conf.merge_env();
    t.deepEqual(expected, conf.get());
});

test('ensure prefered type when schema set before merges', t => {
    const conf = new Config();
    process.env.TESTING = 'not a number';

    t.throws(() => {
        conf.set_schema({ testing: 'number' });
        conf.merge_env();
    }, TypeError);
});

test('preserve prefered type when multiple valid options', t => {
    const conf = new Config();
    const expected = { testing: '12345' };
    process.env.TESTING = '12345';
    conf.set_schema({ testing: 'string' });
    conf.merge_env();
    t.deepEqual(expected, conf.get());
});

test('validate passes', t => {
    const conf = new Config();
    conf.merge_defaults({
        a: 's',
        b: { c: true },
        d: 123,
        e: null,
        f: undefined,
    });
    conf.validate({
        a: 'string',
        b: { c: 'boolean' },
        d: 'number',
        e: 'null',
        f: 'undefined',
    });
    t.pass();
});

test('validate fails loudly', t => {
    const conf = new Config();
    t.throws(() => {
        conf.merge_defaults({ a: 123 });
        conf.validate({ a: 'string' });
    }, TypeError);
    t.throws(() => {
        conf.merge_defaults({ a: 1 });
        conf.validate({ a: 'boolean' });
    }, TypeError);
    t.throws(() => {
        conf.merge_defaults({ a: '123' });
        conf.validate({ a: 'number' });
    }, TypeError);
    t.throws(() => {
        conf.merge_defaults({ a: undefined });
        conf.validate({ a: 'null' });
    }, TypeError);
    t.throws(() => {
        conf.merge_defaults({ a: null });
        conf.validate({ a: 'undefined' });
    }, TypeError);
});
