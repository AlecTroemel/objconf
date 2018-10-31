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
        conf.merge_file('file/not/here.json', false);
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

test('merge env', t => {
    const conf = new Config();
    const expected = { test: 'test' };
    process.env.OBJCONF_TEST = 'test';
    conf.merge_env('objconf');
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