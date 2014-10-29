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

getDefaultLine = (input, expected, maxLengths)->
  ipad = _.pad '', (maxLengths[0] - input.length) + 5, ' '
  epad = _.pad '', (maxLengths[1] - expected.length) + 5 , ' '
  "`'#{input}'`#{ipad}--->#{epad}`'#{expected}`'"


runSpec = (inputToExpected, getLine, itTest)->
  if not itTest     # can also be called as runSpec(inputToExpected, itTest) for getdefaultLine
    itTest = getLine
    getLine = getDefaultLine

  maxLengths = getMaxLengths inputToExpected
  for input, expected of inputToExpected
    do (input, expected, maxLengths)->
      finalLine = line = getLine(input, expected, maxLengths)
      if _.isArray line
        finalLine = getDefaultLine line[0], line[1], maxLengths
        finalLine += line[2] if line[2] # extra line info
      # call the actual `it`
      it finalLine, itTest(input, expected)
  
VERSION = JSON.parse(require('fs').readFileSync('package.json')).version

describe "\n# upath v#{VERSION}", ->
  it "", -> equal upath.VERSION, VERSION

  describe """\n
  [![Build Status](https://travis-ci.org/anodynos/upath.svg?branch=master)](https://travis-ci.org/anodynos/upath)
  [![Up to date Status](https://david-dm.org/anodynos/upath.png)](https://david-dm.org/anodynos/upath.png)

  A drop-in replacement / proxy to nodejs's `path` that:

    * Replaces the windows `\\` with the unix `/` in all string params & results. This has significant positives - see below.

    * Adds methods to add, trim, change, and default filename extensions.

    * Add a `normalizeSafe` method to preserve any meaningful leading `./` & a `normalizeTrim` which additionally trims any useless ending `/`.

  **Useful note: these docs are actually auto generated from [specs](https://github.com/anodynos/upath/blob/master/source/spec/upath-spec.coffee), running on Linux.**
  """, ->

    describe """\n
    ## Why ?

    Normal `path` doesn't convert paths to a unified format (ie `/`) before calculating paths (`normalize`, `join`), which can lead to numerous problems.
    Also path joining, normalization etc on the two formats is not consistent, depending on where it runs - last checked with nodejs 0.10.32 running on Linux.
    Running on Windows `path` yields different results.

    In general, if you code your paths logic while developing on Unix/Mac and it runs on Windows, you may run into problems when using `path`.

    Note that using **Unix `/` on Windows** works perfectly inside nodejs (and other languages), so there's no reason to stick to the legacy.

    ##### Examples / specs
    """, ->

      describe """\n
      Check out the different (improved) behavior to vanilla `path`:

          `upath.normalize(path)`        --returns-->\n
      """, ->
        inputToExpected =
          'c:/windows/nodejs/path' :        'c:/windows/nodejs/path'
          'c:/windows/../nodejs/path':      'c:/nodejs/path'

          'c:\\windows\\nodejs\\path':      'c:/windows/nodejs/path'
          'c:\\windows\\..\\nodejs\\path':  'c:/nodejs/path'

          '//windows\\unix\/mixed':         '/windows/unix/mixed'
          '\\windows//unix\/mixed':         '/windows/unix/mixed'

          '//windows\\..\\unix\/mixed/':    '/unix/mixed/'

        runSpec inputToExpected,
          (input, expected)-> [ input.replace(/\\/g, '\\\\'), expected,
              if (pathResult = path.normalize input) isnt expected
                "  // `path.normalize()` gives `'#{pathResult}'`"
              else
                "  // equal to `path.normalize()`"
            ]
          (input, expected)-> ->
            equal upath.normalize(input), expected


      describe """\n
      Joining paths can also be a problem:

          `upath.join(paths...)`        --returns-->\n
      """, ->

        splitPaths = (pathsStr)->
          pathsStr.split(',').map (p)-> _.trim(p)

        inputToExpected =
          'some/nodejs/deep, ../path' :        'some/nodejs/path'
          'some/nodejs\\windows, ../path' :    'some/nodejs/path'
          'some\\windows\\only, ..\\path' :    'some/windows/path'

        runSpec inputToExpected,
          (input, expected)-> [
              splitPaths(input.replace /\\/g, '\\\\').join("', '")
              expected
              if (pathResult = path.join.apply null, splitPaths input) isnt expected
                "  // `path.join()` gives `'#{pathResult}'`"
              else
                "  // equal to `path.join()`"
            ]
          (input, expected)-> ->
            equal upath.join.apply(null, splitPaths input), expected

  describe """\n
  ## Added methods
  """, ->
    describe """\n
      #### `upath.normalizeSafe(path)`

      Exactly like `path.normalize(path)`, but it keeps the first meaningful `./`.

      Note that the unix `/` is returned everywhere, so windows `\\` is always converted to unix `/`.

      ##### Examples / specs & how it differs from vanilla `path`

          `upath.normalizeSafe(path)`        --returns-->\n
      """, ->
        inputToExpected =
          # equal to path
          '': '.'
          '.': '.'
          './': './'
          './..': '..'
          './../': '../'
          './../dep': '../dep'
          '../dep': '../dep'
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

        runSpec inputToExpected,
          (input, expected)-> [input.replace(/\\/g, '\\\\'), expected,
              if (pathResult = path.normalize input) isnt expected
                "  // `path.normalize()` gives `'#{pathResult}'`"
              else
                "  // equal to `path.normalize()`"
            ]
          (input, expected)-> ->
            equal upath.normalizeSafe(input), expected

    describe """\n
      #### `upath.normalizeTrim(path)`

      Exactly like `path.normalizeSafe(path)`, but it trims any useless ending `/`.

      ##### Examples / specs

          `upath.normalizeTrim(path)`        --returns-->\n
      """, ->
        inputToExpected =
          './': '.'
          './../': '..'
          './../dep/': '../dep'
          'path//dep\\': 'path/dep'
          './/windows\\unix\/mixed/': './windows/unix/mixed'

        runSpec inputToExpected,
          (input, expected)-> [input.replace('\\', '\\\\'), expected,
            if (pathResult = upath.normalizeSafe input) isnt expected
              "  // `upath.normalizeSafe()` gives `'#{pathResult}'`"
            else
              "  // equal to `upath.normalizeSafe()`"
          ]
          (input, expected)-> ->
            equal upath.normalizeTrim(input), expected

  describe """\n
    ## Added methods for *filename extension* manipulation.

    **Happy notes:**

      * All methods support `.ext` & `ext` - the dot `.` on the extension is always adjusted correctly.

      * You can omit the `ext` param in all methods (or pass null/undefined) and the common sense thing will happen.
    """, ->

    ######

    describe """ \n
    #### `upath.addExt(filename, [ext])`

    Adds `.ext` to `filename`, but only if it doesn't already have the exact extension.

    ##### Examples / specs

        `upath.addExt(filename, 'js')`     --returns-->\n
    """, ->
      inputToExpected =
        'myfile/addExt': 'myfile/addExt.js'
        'myfile/addExt.txt': 'myfile/addExt.txt.js'
        'myfile/addExt.js': 'myfile/addExt.js'
        'myfile/addExt.min.': 'myfile/addExt.min..js' #trailing '.' considered part of filename

      runSpec inputToExpected, (input, expected)-> ->
         equal upath.addExt(input, 'js'), expected
         equal upath.addExt(input, '.js'), expected

      describe """\n
      It adds nothing if no `ext` param is passed.

          `upath.addExt(filename)`           --returns-->\n
      """, ->
        runSpec inputToExpected,
          (input)-> [input, input]
          (input, expected)-> ->
            equal upath.addExt(input), input
            equal upath.addExt(input, ''), input

    describe """\n
    #### `upath.trimExt(filename)`

    Trims a filename's extension.

    ##### Examples / specs

        `upath.trimExt(filename)`          --returns-->\n
    """, ->
        inputToExpected =
          'my/trimedExt.txt': 'my/trimedExt'
          'my/trimedExt': 'my/trimedExt'
          'my/trimedExt.min.js': 'my/trimedExt.min'
          '../my/trimedExt.longExt': '../my/trimedExt'

        runSpec inputToExpected, (input, expected)-> ->
          equal upath.trimExt(input), expected

    describe """\n
    #### `upath.changeExt(filename, [ext])`

    Changes a filename's extension to `ext`. If it has no extension, it adds it.

    ##### Examples / specs

        `upath.changeExt(filename, 'js')`  --returns-->\n
    """, ->

      inputToExpected =
        'my/module.coffee': 'my/module.js'
        'my/module': 'my/module.js'
        'file/withDot.': 'file/withDot.js'

      runSpec inputToExpected,
        (input, expected)-> ->
          equal upath.changeExt(input, 'js'), expected
          equal upath.changeExt(input, '.js'), expected

      describe """\n
      If no `ext` param is given, it trims the current extension (if any).

          `upath.changeExt(filename)`        --returns-->\n
      """, ->
        runSpec inputToExpected,
          (input, expected)-> [input, upath.trimExt expected]
          (input, expected)-> ->
            equal upath.changeExt(input), upath.trimExt expected
            equal upath.changeExt(input, ''), upath.trimExt expected

    describe """\n
    #### `upath.defaultExt(filename, [ext], [ignoreExts], [maxSize=6])`

    Adds `.ext` to `filename`, only if it doesn't already have _any_ *old* extension.

      * (Old) extensions are considered to be up to `maxSize` chars long, counting the dot (defaults to 6).

      * An `Array` of `ignoreExts` (eg [`.min`]) will force adding default `.ext` even if one of these is present.

    ##### Examples / specs

        `upath.defaultExt(filename, 'js')`   --returns-->\n
    """, ->

      inputToExpected =
        'fileWith/defaultExt': 'fileWith/defaultExt.js'
        'fileWith/defaultExt.js': 'fileWith/defaultExt.js'
        'fileWith/defaultExt.min': 'fileWith/defaultExt.min'
        'fileWith/defaultExt.longExt': 'fileWith/defaultExt.longExt.js'

      runSpec inputToExpected,
        (input, expected)-> ->
          equal upath.defaultExt(input, 'js'), expected
          equal upath.defaultExt(input, '.js'), expected

      describe """\n
      If no `ext` param is passed, it leaves filename intact.

          `upath.defaultExt(filename)`       --returns-->\n
      """, ->

        runSpec inputToExpected,
          (input)-> [input, input]
          (input, expected)-> ->
            equal upath.defaultExt(input), input

      describe """\n
      It is ignoring `.min` & `.dev` as extensions, and considers exts with up to 8 chars (incl dot) as extensions.

          `upath.defaultExt(filename, 'js', ['min', 'dev'], 8)` --returns-->\n
      """, ->

        inputToExpected =
          'fileWith/defaultExt': 'fileWith/defaultExt.js'
          'fileWith/defaultExt.min': 'fileWith/defaultExt.min.js'
          'fileWith/defaultExt.dev': 'fileWith/defaultExt.dev.js'
          'fileWith/defaultExt.longExt': 'fileWith/defaultExt.longExt'
          'fileWith/defaultExt.longRext': 'fileWith/defaultExt.longRext.js'

        runSpec inputToExpected, (input, expected)-> ->
          equal upath.defaultExt(input, 'js', ['min', 'dev'], 8), expected
          equal upath.defaultExt(input, '.js', ['min', 'dev'], 8), expected