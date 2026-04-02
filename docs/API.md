# upath API

> Auto-generated from test results by `doc-reporter.ts`. Do not edit manually.

## `upath.normalize(path)`

| Input                             | Output                     |
| --------------------------------- | -------------------------- |
| `"c:/windows/nodejs/path"`        | `"c:/windows/nodejs/path"` |
| `"c:/windows/../nodejs/path"`     | `"c:/nodejs/path"`         |
| `"c:\\windows\\nodejs\\path"`     | `"c:/windows/nodejs/path"` |
| `"c:\\windows\\..\\nodejs\\path"` | `"c:/nodejs/path"`         |
| `"/windows\\unix/mixed"`          | `"/windows/unix/mixed"`    |
| `"\\windows//unix/mixed"`         | `"/windows/unix/mixed"`    |
| `"\\windows\\..\\unix/mixed/"`    | `"/unix/mixed/"`           |

## `upath.join(paths...)`

| Input                                | Output                |
| ------------------------------------ | --------------------- |
| `["some/nodejs/deep","../path"]`     | `"some/nodejs/path"`  |
| `["some/nodejs\\windows","../path"]` | `"some/nodejs/path"`  |
| `["some\\windows\\only","..\\path"]` | `"some/windows/path"` |

## `upath.toUnix(path)`

| Input                               | Output                       |
| ----------------------------------- | ---------------------------- |
| `".//windows\\//unix/\\/mixed////"` | `"./windows/unix/mixed/"`    |
| `"..///windows\\..\\\\unix/mixed"`  | `"../windows/../unix/mixed"` |

## `upath.normalizeSafe(path)`

### equal to path.normalize

| Input              | Output          |
| ------------------ | --------------- |
| `""`               | `"."`           |
| `"."`              | `"."`           |
| `"./"`             | `"./"`          |
| `".//"`            | `"./"`          |
| `".\\"`            | `"./"`          |
| `".\\//"`          | `"./"`          |
| `"./.."`           | `".."`          |
| `".//.."`          | `".."`          |
| `"./../"`          | `"../"`         |
| `".\\..\\"`        | `"../"`         |
| `"./../dep"`       | `"../dep"`      |
| `"../dep"`         | `"../dep"`      |
| `"../path/dep"`    | `"../path/dep"` |
| `"../path/../dep"` | `"../dep"`      |
| `"dep"`            | `"dep"`         |
| `"path//dep"`      | `"path/dep"`    |

### different to path.normalize (preserves leading ./ and //)

| Input                           | Output                    |
| ------------------------------- | ------------------------- |
| `"./dep"`                       | `"./dep"`                 |
| `"./path/dep"`                  | `"./path/dep"`            |
| `"./path/../dep"`               | `"./dep"`                 |
| `".//windows\\unix/mixed/"`     | `"./windows/unix/mixed/"` |
| `"..//windows\\unix/mixed"`     | `"../windows/unix/mixed"` |
| `"windows\\unix/mixed/"`        | `"windows/unix/mixed/"`   |
| `"..//windows\\..\\unix/mixed"` | `"../unix/mixed"`         |

### UNC paths

| Input                               | Output                        |
| ----------------------------------- | ----------------------------- |
| `"\\\\server\\share\\file"`         | `"//server/share/file"`       |
| `"//server/share/file"`             | `"//server/share/file"`       |
| `"\\\\?\\UNC\\server\\share\\file"` | `"//?/UNC/server/share/file"` |
| `"\\\\LOCALHOST\\c$\\temp\\file"`   | `"//LOCALHOST/c$/temp/file"`  |
| `"\\\\?\\c:\\temp\\file"`           | `"//?/c:/temp/file"`          |
| `"\\\\.\\c:\\temp\\file"`           | `"//./c:/temp/file"`          |
| `"//./c:/temp/file"`                | `"//./c:/temp/file"`          |
| `"////\\.\\c:/temp\\//file"`        | `"//./c:/temp/file"`          |

## `upath.normalizeTrim(path)`

| Input                       | Output                   |
| --------------------------- | ------------------------ |
| `"./"`                      | `"."`                    |
| `"./../"`                   | `".."`                   |
| `"./../dep/"`               | `"../dep"`               |
| `"path//dep\\"`             | `"path/dep"`             |
| `".//windows\\unix/mixed/"` | `"./windows/unix/mixed"` |

## `upath.joinSafe(path1, path2, ...)`

| Input                                         | Output                    |
| --------------------------------------------- | ------------------------- |
| `["some/nodejs/deep","../path"]`              | `"some/nodejs/path"`      |
| `["./some/local/unix/","../path"]`            | `"./some/local/path"`     |
| `["./some\\current\\mixed","..\\path"]`       | `"./some/current/path"`   |
| `["../some/relative/destination","..\\path"]` | `"../some/relative/path"` |
| `["\\\\server\\share\\file","..\\path"]`      | `"//server/share/path"`   |
| `["\\\\.\\c:\\temp\\file","..\\path"]`        | `"//./c:/temp/path"`      |
| `["//server/share/file","../path"]`           | `"//server/share/path"`   |
| `["//./c:/temp/file","../path"]`              | `"//./c:/temp/path"`      |

## `upath.addExt(filename, ext)`

### addExt(filename, 'js')

| Input                        | Output                    |
| ---------------------------- | ------------------------- |
| `"myfile/addExt", 'js'`      | `"myfile/addExt.js"`      |
| `"myfile/addExt.txt", 'js'`  | `"myfile/addExt.txt.js"`  |
| `"myfile/addExt.js", 'js'`   | `"myfile/addExt.js"`      |
| `"myfile/addExt.min.", 'js'` | `"myfile/addExt.min..js"` |

### addExt(filename) — no ext param

| Input                  | Output      |
| ---------------------- | ----------- |
| `"myfile/addExt"`      | `unchanged` |
| `"myfile/addExt.txt"`  | `unchanged` |
| `"myfile/addExt.js"`   | `unchanged` |
| `"myfile/addExt.min."` | `unchanged` |

## `upath.trimExt(filename, ignoreExts?, maxSize?)`

### trimExt(filename) — defaults

| Input                       | Output                      |
| --------------------------- | --------------------------- |
| `"my/trimedExt.txt"`        | `"my/trimedExt"`            |
| `"my/trimedExt"`            | `"my/trimedExt"`            |
| `"my/trimedExt.min"`        | `"my/trimedExt"`            |
| `"my/trimedExt.min.js"`     | `"my/trimedExt.min"`        |
| `"../my/trimedExt.longExt"` | `"../my/trimedExt.longExt"` |

### trimExt(filename, ['min', '.dev'], 8)

| Input                                            | Output                       |
| ------------------------------------------------ | ---------------------------- |
| `"my/trimedExt.txt", ['min', '.dev'], 8`         | `"my/trimedExt"`             |
| `"my/trimedExt.min", ['min', '.dev'], 8`         | `"my/trimedExt.min"`         |
| `"my/trimedExt.dev", ['min', '.dev'], 8`         | `"my/trimedExt.dev"`         |
| `"../my/trimedExt.longExt", ['min', '.dev'], 8`  | `"../my/trimedExt"`          |
| `"../my/trimedExt.longRExt", ['min', '.dev'], 8` | `"../my/trimedExt.longRExt"` |

## `upath.removeExt(filename, ext)`

### removeExt(filename, '.js')

| Input                        | Output             |
| ---------------------------- | ------------------ |
| `"removedExt.js", '.js'`     | `"removedExt"`     |
| `"removedExt.txt.js", '.js'` | `"removedExt.txt"` |
| `"notRemoved.txt", '.js'`    | `"notRemoved.txt"` |

### removeExt(filename, '.longExt')

| Input                                  | Output             |
| -------------------------------------- | ------------------ |
| `"removedExt.longExt", '.longExt'`     | `"removedExt"`     |
| `"removedExt.txt.longExt", '.longExt'` | `"removedExt.txt"` |
| `"notRemoved.txt", '.longExt'`         | `"notRemoved.txt"` |

## `upath.changeExt(filename, ext?, ignoreExts?, maxSize?)`

### changeExt(filename, '.js')

| Input                          | Output                     |
| ------------------------------ | -------------------------- |
| `"my/module.min", '.js'`       | `"my/module.js"`           |
| `"my/module.coffee", '.js'`    | `"my/module.js"`           |
| `"my/module", '.js'`           | `"my/module.js"`           |
| `"file/withDot.", '.js'`       | `"file/withDot.js"`        |
| `"file/change.longExt", '.js'` | `"file/change.longExt.js"` |

### changeExt(filename) — trims extension

| Input                   | Output                  |
| ----------------------- | ----------------------- |
| `"my/module.min"`       | `"my/module"`           |
| `"my/module.coffee"`    | `"my/module"`           |
| `"my/module"`           | `"my/module"`           |
| `"file/withDot."`       | `"file/withDot"`        |
| `"file/change.longExt"` | `"file/change.longExt"` |

### changeExt(filename, 'js', ['min', '.dev'], 8)

| Input                                             | Output                      |
| ------------------------------------------------- | --------------------------- |
| `"my/module.coffee", 'js', ['min', 'dev'], 8`     | `"my/module.js"`            |
| `"file/notValidExt.min", 'js', ['min', 'dev'], 8` | `"file/notValidExt.min.js"` |
| `"file/notValidExt.dev", 'js', ['min', 'dev'], 8` | `"file/notValidExt.dev.js"` |
| `"file/change.longExt", 'js', ['min', 'dev'], 8`  | `"file/change.js"`          |
| `"file/change.longRExt", 'js', ['min', 'dev'], 8` | `"file/change.longRExt.js"` |

## `upath.defaultExt(filename, ext?, ignoreExts?, maxSize?)`

### defaultExt(filename, 'js')

| Input                                 | Output                             |
| ------------------------------------- | ---------------------------------- |
| `"fileWith/defaultExt", 'js'`         | `"fileWith/defaultExt.js"`         |
| `"fileWith/defaultExt.js", 'js'`      | `"fileWith/defaultExt.js"`         |
| `"fileWith/defaultExt.min", 'js'`     | `"fileWith/defaultExt.min"`        |
| `"fileWith/defaultExt.longExt", 'js'` | `"fileWith/defaultExt.longExt.js"` |

### defaultExt(filename) — no ext param

| Input                           | Output      |
| ------------------------------- | ----------- |
| `"fileWith/defaultExt"`         | `unchanged` |
| `"fileWith/defaultExt.js"`      | `unchanged` |
| `"fileWith/defaultExt.min"`     | `unchanged` |
| `"fileWith/defaultExt.longExt"` | `unchanged` |

### defaultExt(filename, 'js', ['min', '.dev'], 8)

| Input                                                      | Output                              |
| ---------------------------------------------------------- | ----------------------------------- |
| `"fileWith/defaultExt", 'js', ['min', '.dev'], 8`          | `"fileWith/defaultExt.js"`          |
| `"fileWith/defaultExt.min", 'js', ['min', '.dev'], 8`      | `"fileWith/defaultExt.min.js"`      |
| `"fileWith/defaultExt.dev", 'js', ['min', '.dev'], 8`      | `"fileWith/defaultExt.dev.js"`      |
| `"fileWith/defaultExt.longExt", 'js', ['min', '.dev'], 8`  | `"fileWith/defaultExt.longExt"`     |
| `"fileWith/defaultExt.longRext", 'js', ['min', '.dev'], 8` | `"fileWith/defaultExt.longRext.js"` |
