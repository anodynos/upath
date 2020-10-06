_.mixin (require 'underscore.string').exports()

chai = require 'chai'
expect = chai.expect

{ equal, deepEqual } = require './specHelpers'

upath = require 'upath'
path = require 'path'
fs = require 'fs'
util = require 'util'

splitPaths = (pathsStr)-> pathsStr.split(',').map (p)-> _.trim(p)

getMaxLengths = (inputToExpected)->
  [ _.max _.map(_.keys(inputToExpected), 'length')
    _.max _.map(inputToExpected, 'length') ]

formatObjectToOneLine = (any) -> util.inspect(any, { colors:true }).replace(/\n /g, '')

getDefaultLine = (input, expected, maxLengths)->
  ipad = _.pad '', (maxLengths[0] - input.length) + 5, ' '
  epad = _.pad '', (maxLengths[1] - expected.length) + 5 , ' '
  "`'#{ input }'`#{ ipad } ---> #{ epad }`#{ formatObjectToOneLine expected }`"

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

VERSION = JSON.parse(fs.readFileSync('package.json')).version

describe "\n# upath v#{VERSION}", ->
  it "", -> equal upath.VERSION, VERSION

  describe """\n
  [![Build Status](https://travis-ci.org/anodynos/upath.svg?branch=master)](https://travis-ci.org/anodynos/upath)
  [![Up to date Status](https://david-dm.org/anodynos/upath.png)](https://david-dm.org/anodynos/upath)

  A drop-in replacement / proxy to nodejs's `path` that:

    * Replaces the windows `\\` with the unix `/` in all string params & results. This has significant positives - see below.

    * Adds **filename extensions** functions `addExt`, `trimExt`, `removeExt`, `changeExt`, and `defaultExt`.

    * Add a `normalizeSafe` function to preserve any meaningful leading `./` & a `normalizeTrim` which additionally trims any useless ending `/`.

    * Plus a helper `toUnix` that simply converts `\\` to `/` and consolidates duplicates.

  **Useful note: these docs are actually auto generated from [specs](https://github.com/anodynos/upath/blob/master/source/spec/upath-spec.coffee), running on Linux.**

  Notes:

   * `upath.sep` is set to `'/'` for seamless replacement (as of 1.0.3).

   * upath has no runtime dependencies, except built-in `path` (as of 1.0.4)

   * travis-ci tested in node versions 8 to 14 (on linux)

   * Also tested on Windows / node@12.18.0 (without CI)

  History brief:

   * 1.x   : Initial release and various features / fixes

   * 2.0.0 : Adding UNC paths support - see https://github.com/anodynos/upath/pull/38

  """, ->

    describe """\n
    ## Why ?

    Normal `path` doesn't convert paths to a unified format (ie `/`) before calculating paths (`normalize`, `join`), which can lead to numerous problems.
    Also path joining, normalization etc on the two formats is not consistent, depending on where it runs. Running `path` on Windows yields different results than when it runs on Linux / Mac.

    In general, if you code your paths logic while developing on Unix/Mac and it runs on Windows, you may run into problems when using `path`.

    Note that using **Unix `/` on Windows** works perfectly inside nodejs (and other languages), so there's no reason to stick to the Windows legacy at all.

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

          '/windows\\unix\/mixed':          '/windows/unix/mixed'
          '\\windows//unix\/mixed':         '/windows/unix/mixed'

          '\\windows\\..\\unix\/mixed/':    '/unix/mixed/'

        runSpec inputToExpected,
          (input, expected)-> [ # alt line output
              input.replace(/\\/g, '\\\\')
              expected
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

        inputToExpected =
          'some/nodejs/deep, ../path' :        'some/nodejs/path'
          'some/nodejs\\windows, ../path' :    'some/nodejs/path'
          'some\\windows\\only, ..\\path' :    'some/windows/path'

        runSpec inputToExpected,
          (input, expected)-> [ # alt line output
              splitPaths(input.replace /\\/g, '\\\\').join("', '")
              expected
              if (pathResult = path.join.apply null, splitPaths input) isnt expected
                "  // `path.join()` gives `'#{pathResult}'`"
              else
                "  // equal to `path.join()`"
            ]
          (input, expected)-> ->
            equal upath.join.apply(null, splitPaths input), expected

      # parse is not available in node v0.10
      if not _.startsWith(process.version, 'v0.10')
        describe """\n
          Parsing with `path.parse()` should also be consistent across OSes:

            `upath.parse(path)`        --returns-->\n
          """, ->

            inputToExpected =
              'c:\\Windows\\Directory\\somefile.ext' :
                root: if path.sep is '\\' then 'c:/' else '' # parsing windows dirs not working on linux
                dir: 'c:/Windows/Directory'
                base: 'somefile.ext'
                ext: '.ext'
                name: 'somefile'

              '/root/of/unix/somefile.ext' :
                root: '/'
                dir: '/root/of/unix'
                base: 'somefile.ext'
                ext: '.ext'
                name: 'somefile'

            runSpec inputToExpected,
              (input, expected)-> [ # alt line output
                input
                expected
                if not _.isEqual (pathResult = path.parse input), expected
                  '\n' +  [1..input.length + 2].map(-> ' ').join('') + " // `path.parse()` gives `'#{ formatObjectToOneLine pathResult }'`"
                else
                  "  // equal to `path.parse()`"
              ]
              (input, expected)-> ->
                deepEqual upath.parse(input), expected

        if path.sep is '\\'
          describe """\n
            Using `path.resolve()` also is working as one expects across OSes (this test alone was executed on Windows):

              `upath.resolve(...paths)`        --returns-->\n
            """, ->

            inputToExpected =
              '"C:\\Windows\\path\\only", "../../reports"' :
                "C:/Windows/reports"

              '"C:\\Windows\\long\\path\\mixed/with/unix", "../..", "..\\../reports"' :
                "C:/Windows/long/reports"

            getInputAsArray = (pathsAsString) ->
              pathsAsString.split(', ')
                .map((aPath) -> _.slice(aPath, 1, aPath.length-1).join(''))

            runSpec inputToExpected,
              (input, expected)-> [ # alt line output
                input
                expected
                if not _.isEqual (pathResult = path.resolve.apply(null, getInputAsArray input)), expected
                  '\n' +  [1..input.length + 2].map(-> ' ').join('') + " // `path.resolve()` gives `'#{ formatObjectToOneLine pathResult }'`"
                else
                  "  // equal to `path.resolve()`"
              ]
              (input, expected)-> ->
                deepEqual upath.resolve.apply(null, getInputAsArray(input)), expected

  describe """\n
  ## Added functions
  """, ->
    describe """\n
      #### `upath.toUnix(path)`

      Just converts all `\` to `/` and consolidates duplicates, without performing any normalization.

      ##### Examples / specs

          `upath.toUnix(path)`        --returns-->\n
      """, ->
      inputToExpected =
        './/windows\\//unix/\/mixed////': './windows/unix/mixed/'
        '..///windows\\..\\\\unix\/mixed': '../windows/../unix/mixed'

      runSpec inputToExpected, (input, expected)-> ->
        equal upath.toUnix(input), expected

    describe """\n
      #### `upath.normalizeSafe(path)`

      Exactly like `path.normalize(path)`, but it keeps the first meaningful `./` or `//`.

      Note that the unix `/` is returned everywhere, so windows `\\` is always converted to unix `/`.

      ##### Examples / specs & how it differs from vanilla `path`

          `upath.normalizeSafe(path)`        --returns-->\n
      """, ->
        inputToExpected =
          # equal to path
          '': '.'
          '.': '.'
          './': './'
          './/': './'
          '.\\': './'
          '.\\//': './'
          './..': '..'
          './/..': '..'
          './../': '../'
          '.\\..\\': '../'
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
          # UNC paths
          '\\\\server\\share\\file':          '//server/share/file'
          '//server/share/file':              '//server/share/file'
          '\\\\?\\UNC\\server\\share\\file':  '//?/UNC/server/share/file'
          '\\\\LOCALHOST\\c$\\temp\\file':    '//LOCALHOST/c$/temp/file'
          '\\\\?\\c:\\temp\\file':            '//?/c:/temp/file'
          '\\\\.\\c:\\temp\\file':            '//./c:/temp/file'
          '//./c:/temp/file':                 '//./c:/temp/file'
          '////\\.\\c:/temp\\//file':         '//./c:/temp/file'

        runSpec inputToExpected,
          (input, expected)-> [ # alt line output
              input.replace(/\\/g, '\\\\')
              expected
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
          (input, expected)-> [ # alt line output
            input.replace(/\\/g, '\\\\')
            expected
            if (pathResult = upath.normalizeSafe input) isnt expected
              "  // `upath.normalizeSafe()` gives `'#{pathResult}'`"
            else
              "  // equal to `upath.normalizeSafe()`"
          ]
          (input, expected)-> ->
            equal upath.normalizeTrim(input), expected

    describe """\n
      #### `upath.joinSafe([path1][, path2][, ...])`

      Exactly like `path.join()`, but it keeps the first meaningful `./` or `//`.

      Note that the unix `/` is returned everywhere, so windows `\\` is always converted to unix `/`.

      ##### Examples / specs & how it differs from vanilla `path`

          `upath.joinSafe(path)`        --returns-->\n
      """, ->
        inputToExpected =
          'some/nodejs/deep, ../path' :        'some/nodejs/path'
          './some/local/unix/, ../path' :    './some/local/path'
          './some\\current\\mixed, ..\\path' :    './some/current/path'
          '../some/relative/destination, ..\\path' :    '../some/relative/path'
          # UNC paths
          '\\\\server\\share\\file, ..\\path' : '//server/share/path'
          '\\\\.\\c:\\temp\\file, ..\\path' :   '//./c:/temp/path'
          '//server/share/file, ../path' :      '//server/share/path'
          '//./c:/temp/file, ../path' :         '//./c:/temp/path'

        runSpec inputToExpected,
          (input, expected)-> [ # alt line output
            splitPaths(input.replace /\\/g, '\\\\').join("', '")
            expected
            if (pathResult = path.join.apply null, splitPaths input) isnt expected
              "  // `path.join()` gives `'#{pathResult}'`"
            else
              "  // equal to `path.join()`"
          ]
          (input, expected)-> ->
            equal upath.joinSafe.apply(null, splitPaths input), expected

  describe """\n
    ## Added functions for *filename extension* manipulation.

    **Happy notes:**

      In all functions you can:

      * use both `.ext` & `ext` - the dot `.` on the extension is always adjusted correctly.

      * omit the `ext` param (pass null/undefined/empty string) and the common sense thing will happen.

      * ignore specific extensions from being considered as valid ones (eg `.min`, `.dev` `.aLongExtIsNotAnExt` etc), hence no trimming or replacement takes place on them.

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
    #### `upath.trimExt(filename, [ignoreExts], [maxSize=7])`

    Trims a filename's extension.

      * Extensions are considered to be up to `maxSize` chars long, counting the dot (defaults to 7).

      * An `Array` of `ignoreExts` (eg `['.min']`) prevents these from being considered as extension, thus are not trimmed.

    ##### Examples / specs

        `upath.trimExt(filename)`          --returns-->\n
    """, ->
      inputToExpected =
        'my/trimedExt.txt': 'my/trimedExt'
        'my/trimedExt': 'my/trimedExt'
        'my/trimedExt.min': 'my/trimedExt'
        'my/trimedExt.min.js': 'my/trimedExt.min'
        '../my/trimedExt.longExt': '../my/trimedExt.longExt'

      runSpec inputToExpected, (input, expected)-> ->
        equal upath.trimExt(input), expected

      describe """\n
      It is ignoring `.min` & `.dev` as extensions, and considers exts with up to 8 chars.

          `upath.trimExt(filename, ['min', '.dev'], 8)`          --returns-->\n
      """, ->
        inputToExpected =
          'my/trimedExt.txt': 'my/trimedExt'
          'my/trimedExt.min': 'my/trimedExt.min'
          'my/trimedExt.dev': 'my/trimedExt.dev'
          '../my/trimedExt.longExt': '../my/trimedExt'
          '../my/trimedExt.longRExt': '../my/trimedExt.longRExt'

        runSpec inputToExpected, (input, expected)-> ->
          equal upath.trimExt(input, ['min', '.dev'], 8), expected

    describe """\n
    #### `upath.removeExt(filename, ext)`

    Removes the specific `ext` extension from filename, if it has it. Otherwise it leaves it as is.
    As in all upath functions, it be `.ext` or `ext`.

    ##### Examples / specs

        `upath.removeExt(filename, '.js')`          --returns-->\n
    """, ->
      inputToExpected =
        'removedExt.js': 'removedExt'
        'removedExt.txt.js': 'removedExt.txt'
        'notRemoved.txt': 'notRemoved.txt'

      runSpec inputToExpected, (input, expected)-> ->
        equal upath.removeExt(input, '.js'), expected
        equal upath.removeExt(input, 'js'), expected

    describe """\n
    It does not care about the length of exts.

        `upath.removeExt(filename, '.longExt')`          --returns-->\n
    """, ->
      inputToExpected =
        'removedExt.longExt': 'removedExt'
        'removedExt.txt.longExt': 'removedExt.txt'
        'notRemoved.txt': 'notRemoved.txt'

      runSpec inputToExpected, (input, expected)-> ->
        equal upath.removeExt(input, '.longExt'), expected
        equal upath.removeExt(input, 'longExt'), expected

    describe """\n
    #### `upath.changeExt(filename, [ext], [ignoreExts], [maxSize=7])`

    Changes a filename's extension to `ext`. If it has no (valid) extension, it adds it.

      * Valid extensions are considered to be up to `maxSize` chars long, counting the dot (defaults to 7).

      * An `Array` of `ignoreExts` (eg `['.min']`) prevents these from being considered as extension, thus are not changed - the new extension is added instead.

    ##### Examples / specs

        `upath.changeExt(filename, '.js')`  --returns-->\n
    """, ->

      inputToExpected =
        'my/module.min': 'my/module.js'
        'my/module.coffee': 'my/module.js'
        'my/module': 'my/module.js'
        'file/withDot.': 'file/withDot.js'
        'file/change.longExt': 'file/change.longExt.js'

      runSpec inputToExpected, (input, expected)-> ->
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
      It is ignoring `.min` & `.dev` as extensions, and considers exts with up to 8 chars.

          `upath.changeExt(filename, 'js', ['min', '.dev'], 8)`        --returns-->\n
      """, ->
        inputToExpected =
          'my/module.coffee':     'my/module.js'
          'file/notValidExt.min': 'file/notValidExt.min.js'
          'file/notValidExt.dev': 'file/notValidExt.dev.js'
          'file/change.longExt':  'file/change.js'
          'file/change.longRExt': 'file/change.longRExt.js'

        runSpec inputToExpected,
          (input, expected)-> ->
            equal upath.changeExt(input, 'js', ['min', 'dev'], 8), expected
            equal upath.changeExt(input, '.js', ['.min', '.dev'], 8), expected

    describe """\n
    #### `upath.defaultExt(filename, [ext], [ignoreExts], [maxSize=7])`

    Adds `.ext` to `filename`, only if it doesn't already have _any_ *old* extension.

      * (Old) extensions are considered to be up to `maxSize` chars long, counting the dot (defaults to 7).

      * An `Array` of `ignoreExts` (eg `['.min']`) will force adding default `.ext` even if one of these is present.

    ##### Examples / specs

        `upath.defaultExt(filename, 'js')`   --returns-->\n
    """, ->
      inputToExpected =
        'fileWith/defaultExt': 'fileWith/defaultExt.js'
        'fileWith/defaultExt.js': 'fileWith/defaultExt.js'
        'fileWith/defaultExt.min': 'fileWith/defaultExt.min'
        'fileWith/defaultExt.longExt': 'fileWith/defaultExt.longExt.js'

      runSpec inputToExpected, (input, expected)-> ->
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
      It is ignoring `.min` & `.dev` as extensions, and considers exts with up to 8 chars.

          `upath.defaultExt(filename, 'js', ['min', '.dev'], 8)` --returns-->\n
      """, ->
        inputToExpected =
          'fileWith/defaultExt': 'fileWith/defaultExt.js'
          'fileWith/defaultExt.min': 'fileWith/defaultExt.min.js'
          'fileWith/defaultExt.dev': 'fileWith/defaultExt.dev.js'
          'fileWith/defaultExt.longExt': 'fileWith/defaultExt.longExt'
          'fileWith/defaultExt.longRext': 'fileWith/defaultExt.longRext.js'

        runSpec inputToExpected, (input, expected)-> ->
          equal upath.defaultExt(input, 'js', ['min', '.dev'], 8), expected
          equal upath.defaultExt(input, '.js', ['.min', 'dev'], 8), expected

describe '\n' + fs.readFileSync('LICENSE', 'utf8'), -> it "", -> # print it
