_ = require 'lodash'
_.mixin (require 'underscore.string').exports()

chai = require 'chai'
expect = chai.expect
{ equal, notEqual, ok, notOk, tru, fals, deepEqual, notDeepEqual, exact, notExact, iqual, notIqual
  ixact, notIxact, like, notLike, likeBA, notLikeBA, equalSet, notEqualSet } = require './specHelpers'

upath = require '../code/upath'
path = require 'path'

getMaxLengths = (inputToExpected)->
  [ _.max _.pluck(_.keys(inputToExpected), 'length')
    _.max _.map(inputToExpected, 'length') ]

getLine = (input, expected, maxLengths)->
  ipad = _.pad '', (maxLengths[0] - input.length) + (30 - maxLengths[0]), ' '
  epad = _.pad '', (maxLengths[1] - expected.length) + (25 - maxLengths[1]), ' '
  "`'#{input}'`#{ipad}--->#{epad}`'#{expected}`'"

VERSION = JSON.parse(require('fs').readFileSync('package.json')).version

describe "\n# upath v#{VERSION}", ->
  it "", -> equal upath.VERSION, VERSION

  describe """\n
  [![Build Status](https://travis-ci.org/anodynos/upath.svg?branch=master)](https://travis-ci.org/anodynos/upath)
  [![Up to date Status](https://david-dm.org/anodynos/upath.png)](https://david-dm.org/anodynos/upath.png)

  A drop-in replacement / proxy to nodejs's `path` that:

    * Replaces the windows `\\` with the unix `/` in all string results.

    * Adds methods to add, trim, change, and default filename extensions.

    * Add a `normalizeSafe` method to preserve any leading `./`

  **Useful note: these docs are actually auto generated from [specs](https://github.com/anodynos/upath/blob/master/source/spec/upath-spec.coffee).**

  ## Added methods
  """, ->
    describe """\n
      #### `upath.normalizeSafe(path)`

      Exactly like `path.normalize(path)`, but it keeps the first meaningful `./`.

      Note that the unix `/` is returned everywhere, so windows `\\` is always converted to unix `/`.

      ##### Examples / specs & how it differs from vanilla `path`

          `upath.normalizeSafe(path)`        --returns-->\n
      """, ->

      maxLengths = getMaxLengths inputToExpected =
        # equal to path
        '': '.'
        '.': '.'
        './': './'
        './..': '..'
        './../dep': '../dep'
        '../path/dep': '../path/dep'
        '../path/../dep': '../dep'
        'dep': 'dep'
        'path//dep': 'path/dep'
        # different to path
        './dep': './dep'
        './path/dep': './path/dep'
        './path/../dep': './dep'
        './/windows\\unix\/mixed/': './windows/unix/mixed/'
        '..//windows\\unix\/mixed': '../windows/unix/mixed'
        'windows\\unix\/mixed/': 'windows/unix/mixed/'
        '..//windows\\..\\unix\/mixed': '../unix/mixed'

      for input, expected of inputToExpected
        do (input, expected)->
          line = getLine(input.replace('\\', '\\\\'), expected, maxLengths) +
            if (pathResult = path.normalize input) isnt expected
              "  // `path.normalize()` gives `'#{pathResult}'`"
            else
              "  // equal to `path.normalize()`"
          it line, ->
            equal upath.normalizeSafe(input), expected

  describe """\n
    ## Added methods for *filename extension* manipulation.

    **Happy notes:**

      * All methods support `.ext` & `ext` - the dot `.` on the extension is always adjusted correctly.

      * You can omit the `ext` param in all methods (or pass null/undefined) and the common sense thing will happen.
    """, ->

    describe """ \n
    #### `upath.addExt(filename, [ext])`

    Adds `.ext` to `filename`, but only if it doesn't already have the exact extension.

    ##### Examples / specs

        `upath.addExt(filename, 'js')`     --returns-->\n
    """, ->

      maxLengths = getMaxLengths inputToExpected =
        'myfile/addExt': 'myfile/addExt.js'
        'myfile/addExt.txt': 'myfile/addExt.txt.js'
        'myfile/addExt.js': 'myfile/addExt.js'
        'myfile/addExt.min.': 'myfile/addExt.min..js' #trailing '.' considered part of filename

      for input, expected of inputToExpected
        do (input, expected)->
          line = getLine(input, expected, maxLengths)

          it line, ->
            equal upath.addExt(input, 'js'), expected
            equal upath.addExt(input, '.js'), expected

      describe """\n
      It adds nothing if no `ext` param is passed.

          `upath.addExt(filename)`           --returns-->\n
      """, ->
        for input, expected of inputToExpected
          do (input, expected)->
            line = getLine(input, input, maxLengths)

            it line, ->
              equal upath.addExt(input), input

    describe """\n
    #### `upath.trimExt(filename)`

    Trims a filename's extension.

    ##### Examples / specs

        `upath.trimExt(filename)`          --returns-->\n
    """, ->
        maxLengths = getMaxLengths inputToExpected =
          'my/trimedExt.txt': 'my/trimedExt'
          'my/trimedExt': 'my/trimedExt'
          'my/trimedExt.min.js': 'my/trimedExt.min'
          '../my/trimedExt.longExt': '../my/trimedExt'

        for input, expected of inputToExpected
          do (input, expected)->
            it getLine(input, expected, maxLengths), ->
              equal upath.trimExt(input), expected

    describe """\n
    #### `upath.changeExt(filename, [ext])`

    Changes a filename's extension to `ext`. If it has no extension, it adds it.

    ##### Examples / specs

        `upath.changeExt(filename, 'js')`  --returns-->\n
    """, ->

      maxLengths = getMaxLengths inputToExpected =
        'my/module.coffee': 'my/module.js'
        'my/module': 'my/module.js'
        'file/withDot.': 'file/withDot.js'

      for input, expected of inputToExpected
        do (input, expected)->
          it getLine(input, expected, maxLengths), ->
            equal upath.changeExt(input, 'js'), expected
            equal upath.changeExt(input, '.js'), expected


      describe """\n
      If no `ext` param is given, it trims the current extension (if any).

          `upath.changeExt(filename)`        --returns-->\n
      """, ->
        for input, expected of inputToExpected
          do (input, expected)->
            it getLine(input, upath.trimExt(expected), maxLengths), ->
              equal upath.changeExt(input), upath.trimExt expected

    describe """\n
    #### `upath.defaultExt(filename, [ext], [ignoreExts], [maxSize=6])`

    Adds `.ext` to `filename`, only if it doesn't already have _any_ *old* extension.

      * (Old) extensions are considered to be up to `maxSize` chars long, counting the dot (defaults to 6).

      * An `Array` of `ignoreExts` (eg [`.min`]) will force adding default `.ext` even if one of these is present.

    ##### Examples / specs

        `upath.defaultExt(filename, 'js')`   --returns-->\n
    """, ->

      maxLengths = getMaxLengths inputToExpected =
        'fileWith/defaultExt': 'fileWith/defaultExt.js'
        'fileWith/defaultExt.js': 'fileWith/defaultExt.js'
        'fileWith/defaultExt.min': 'fileWith/defaultExt.min'
        'fileWith/defaultExt.longExt': 'fileWith/defaultExt.longExt.js'

      for input, expected of inputToExpected
        do (input, expected)->
          it getLine(input, expected, maxLengths), ->
            equal upath.defaultExt(input, 'js'), expected
            equal upath.defaultExt(input, '.js'), expected

      describe """\n
      If no `ext` param is passed, it leaves filename intact.

          `upath.defaultExt(filename)`       --returns-->\n
      """, ->
        for input, expected of inputToExpected
          do (input, expected)->
            it getLine(input, input, maxLengths), ->
              equal upath.defaultExt(input), input

      describe """\n
      It is ignoring `.min` & `.dev` as extensions, and considers exts with up to 8 chars (incl dot) as extensions.

          `upath.defaultExt(filename, 'js', ['min', 'dev'], 8)` --returns-->\n
      """, ->

        maxLengths = getMaxLengths inputToExpected =
          'fileWith/defaultExt': 'fileWith/defaultExt.js'
          'fileWith/defaultExt.min': 'fileWith/defaultExt.min.js'
          'fileWith/defaultExt.dev': 'fileWith/defaultExt.dev.js'
          'fileWith/defaultExt.longExt': 'fileWith/defaultExt.longExt'
          'fileWith/defaultExt.longRext': 'fileWith/defaultExt.longRext.js'

        for input, expected of inputToExpected
          do (input, expected)->
            it getLine(input, expected, maxLengths), ->
              equal upath.defaultExt(input, 'js', ['min', 'dev'], 8), expected
              equal upath.defaultExt(input, '.js', ['min', 'dev'], 8), expected