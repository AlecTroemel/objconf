None of the 100 config libraries on npm did what I wanted... so i created my own. Works a little bit like the wonderful [rust config crate](https://crates.io/crates/config). Goals of this projects include

- treat the config like an object, not a key value store
- be able to set default values
- merge config from json file at a given path
- merge env var's with a namespace. Allow nesting object values with underscores. Do a best effort conversion of the data type ('false' => boolean)

```js
    const Config = require('objconf');
    conf.merge_defaults({
        a: {
            b: 'something'
        },
        c: 12345
    });

    // assume config.json = { c: 67890 }
    conf.merge_file('./config.json');

    // export PROJECT_A_B = 'something else'
    conf.merge_env('project');

    conf.validate({
        a: {
            b: 'string',
        },
        c: 'number',
    });

    let config = conf.get();
    console.log(config.a.b); // => 'something else'
    console.log(config.c); // => 67890
```

### API

##### merge_defaults(obj)
merge configuration with a given object

```
conf.merge_defaults({
    a: {
        b: 'something'
    },
    c: 12345
});
```

##### merge_file(filepath)
merge configuration from a json file given its path

```js
conf.merge_file('./config.json');
```

##### merge_env(prefix)
given environment variables with the given prefix. The env var names are converted to lowercase for comparrison and merging into the configuration. So for example the env var `PREFIX_PARENT_CHILD=test` will be merged into the config at `{ parent: { child: 'test' } }`.

```js
conf.merge_env('project');
```

##### validate(schema)
takes a schema which is an object with string values. These values can be 'string', 'boolean', 'null ', 'undefined', or 'number'. if the types of the current configuration do not match the schema, an error is thrown.

```js
conf.merge_defaults({
    a: {
        b: 'something',
    },
    c: true,
    d: 12345,
    e: null,
    f: undefined,
});

conf.validate({
    a: {
        b: 'string',
    },
    c: 'boolean',
    d: 'number',
    e: 'null',
    f: 'undefined',
});

```


##### get()
return the configuration object

```js
conf.merge_defaults({ a: 'test' });
console.log(cong.get().a, ' = test')
```

### TODO:
- tests
