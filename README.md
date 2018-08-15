None of the 100 config libraries on npm did what I wanted... so i created my own. Works a little bit like the wonderful [rust config crate](https://crates.io/crates/config). Goals of this projects include

- treat the config like an object, not a key value store
- be able to set default values
- merge config from json file at a given path
- merge env var's with a namespace. Allow nesting object values with underscores. Do a best effort conversion of the data type ('false' => boolean)

```js
    const Config = require('./config.js');
    conf.merge_defaults({
        a: {
            b: 'something'
        },
        c: 12345
    });

    // assume config.json = { c: 67890 }
    conf.merge_file('./config.json');

    // env var paths are converted to lowercase
    // export PROJECT_A_B = 'something else'
    conf.merge_env('project');


    let config = conf.get();
    console.log(config.a.b); // => 'something else'
    console.log(config.c); // => 67890
```


### TODO:

- allow defining required paths and types
- tests
