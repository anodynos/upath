# upath v0.1.0

[![Build Status](https://travis-ci.org/anodynos/upath.svg?branch=master)](https://travis-ci.org/anodynos/upath)
[![Up to date Status](https://david-dm.org/anodynos/upath.png)](https://david-dm.org/anodynos/upath.png)

A proxy to nodejs's `path` that:

  * Replaces the windows `\` with the unix `/` in all string results.

  * Adds methods to add, trim, change, and default filename extensions.

  * Add a `normalizeSafe` method to preserve any leading `./`

**Useful note: these docs are actually auto generated from [specs](https://github.com/anodynos/upath/blob/master/source/spec/upath-spec.coffee).**

## Added methods


### `upath.normalizeSafe(path)`

Exactly like `path.normalize(path)`, but it keeps the first meaningful `'./'`.

Note that the unix `'/'` is returned everywhere, so windows '\' is always converted to unix '/'.

#### Examples / specs & how it differs from vanilla `path`

    `upath.normalizeSafe(path)`        --returns-->

        ✓ `''`                              --->                        `'.`'  // equal to `path.normalize()`
        ✓ `'.'`                             --->                        `'.`'  // equal to `path.normalize()`
        ✓ `'./'`                            --->                       `'./`'  // equal to `path.normalize()`
        ✓ `'./..'`                          --->                       `'..`'  // equal to `path.normalize()`
        ✓ `'./../dep'`                      --->                   `'../dep`'  // equal to `path.normalize()`
        ✓ `'../path/dep'`                   --->              `'../path/dep`'  // equal to `path.normalize()`
        ✓ `'../path/../dep'`                --->                   `'../dep`'  // equal to `path.normalize()`
        ✓ `'dep'`                           --->                      `'dep`'  // equal to `path.normalize()`
        ✓ `'path//dep'`                     --->                 `'path/dep`'  // equal to `path.normalize()`
        ✓ `'./dep'`                         --->                    `'./dep`'  // `path.normalize()` gives `'dep'`
        ✓ `'./path/dep'`                    --->               `'./path/dep`'  // `path.normalize()` gives `'path/dep'`
        ✓ `'./path/../dep'`                 --->                    `'./dep`'  // `path.normalize()` gives `'dep'`
        ✓ `'.//windows\\unix/mixed/'`       --->    `'./windows/unix/mixed/`'  // `path.normalize()` gives `'windows\unix/mixed/'`
        ✓ `'..//windows\\unix/mixed'`       --->    `'../windows/unix/mixed`'  // `path.normalize()` gives `'../windows\unix/mixed'`
        ✓ `'windows\\unix/mixed/'`          --->      `'windows/unix/mixed/`'  // `path.normalize()` gives `'windows\unix/mixed/'`
        ✓ `'..//windows\\..\unix/mixed'`    --->            `'../unix/mixed`'  // `path.normalize()` gives `'../windows\..\unix/mixed'`


## Added methods for *filename extension* manipulation.

**Happy notes:**

  * All methods support '.ext' & 'ext' - the dot '.' on the extension is always adjusted correctly.

  * You can omit the `'ext'` param in all methods (or pass null/undefined) and the common sense thing will happen.


### `upath.addExt(filename, [ext])`

Adds `.ext` to `filename`, but only if it doesn't already have the exact extension.

#### Examples / specs

    `upath.addExt(filename, 'js')`     --returns-->

        ✓ `'myfile/addExt'`                 --->         `'myfile/addExt.js`'
        ✓ `'myfile/addExt.txt'`             --->     `'myfile/addExt.txt.js`'
        ✓ `'myfile/addExt.js'`              --->         `'myfile/addExt.js`'
        ✓ `'myfile/addExt.min.'`            --->    `'myfile/addExt.min..js`'


It adds nothing if no `ext` param is passed.

    `upath.addExt(filename)`           --returns-->

          ✓ `'myfile/addExt'`                 --->            `'myfile/addExt`'
          ✓ `'myfile/addExt.txt'`             --->        `'myfile/addExt.txt`'
          ✓ `'myfile/addExt.js'`              --->         `'myfile/addExt.js`'
          ✓ `'myfile/addExt.min.'`            --->       `'myfile/addExt.min.`'


### `upath.trimExt(filename)`

Trims a filename's extension.

#### Examples / specs

    `upath.trimExt(filename)`          --returns-->

        ✓ `'my/trimedExt.txt'`              --->             `'my/trimedExt`'
        ✓ `'my/trimedExt'`                  --->             `'my/trimedExt`'
        ✓ `'my/trimedExt.min.js'`           --->         `'my/trimedExt.min`'
        ✓ `'../my/trimedExt.longExt'`       --->          `'../my/trimedExt`'


### `upath.changeExt(filename, [ext])`

Changes a filename's extension to `ext`. If it has no extension, it adds it.

#### Examples / specs

    `upath.changeExt(filename, 'js')`  --returns-->

        ✓ `'my/module.coffee'`              --->             `'my/module.js`'
        ✓ `'my/module'`                     --->             `'my/module.js`'
        ✓ `'file/withDot.'`                 --->          `'file/withDot.js`'


If no `ext` param is is given, it trims the current extension (if any).

    `upath.changeExt(filename)`        --returns-->

          ✓ `'my/module.coffee'`              --->                `'my/module`'
          ✓ `'my/module'`                     --->                `'my/module`'
          ✓ `'file/withDot.'`                 --->             `'file/withDot`'


### `upath.defaultExt(file, [ext], [ignoreExts], [maxSize=6])`

Adds `.ext` to a filename, only if it doesn't already have _any_ old extension.

  * Old extensions can be an `Array` of `ignoreExts` (eg [`.min`]), adding the default `.ext` even if one of these is present.

  * Old extensions are considered to be up to `maxSize` chars long, counting the dot (defaults to 6).

#### Examples / specs

    `upath.defaultExt(filename, 'js')`   --returns-->

        ✓ `'fileWith/defaultExt'`           --->   `'fileWith/defaultExt.js`'
        ✓ `'fileWith/defaultExt.js'`        --->   `'fileWith/defaultExt.js`'
        ✓ `'fileWith/defaultExt.min'`       --->  `'fileWith/defaultExt.min`'
        ✓ `'fileWith/defaultExt.longExt'`   --->`'fileWith/defaultExt.longExt.js`'


If no `ext` param is passed, it leaves filename intact.

    `upath.defaultExt(filename)`       --returns-->

          ✓ `'fileWith/defaultExt'`           --->      `'fileWith/defaultExt`'
          ✓ `'fileWith/defaultExt.js'`        --->   `'fileWith/defaultExt.js`'
          ✓ `'fileWith/defaultExt.min'`       --->  `'fileWith/defaultExt.min`'
          ✓ `'fileWith/defaultExt.longExt'`   --->`'fileWith/defaultExt.longExt`'


It is ignoring '.min' & '.dev' as extensions, and considers exts with up to 8 chars (incl dot) as extensions.

    `upath.defaultExt(filename, 'js', ['min', 'dev'], 8)` --returns-->

          ✓ `'fileWith/defaultExt'`           --->   `'fileWith/defaultExt.js`'
          ✓ `'fileWith/defaultExt.min'`       --->`'fileWith/defaultExt.min.js`'
          ✓ `'fileWith/defaultExt.dev'`       --->`'fileWith/defaultExt.dev.js`'
          ✓ `'fileWith/defaultExt.longExt'`   --->`'fileWith/defaultExt.longExt`'
          ✓ `'fileWith/defaultExt.longRext'`  --->`'fileWith/defaultExt.longRext.js`'


# License

The MIT License

Copyright (c) 2013-2014 Agelos Pikoulas (agelos.pikoulas@gmail.com)

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
