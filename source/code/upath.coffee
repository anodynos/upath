_ = require 'lodash'
_.mixin (require 'underscore.string').exports()
path = require 'path'

upath = exports

upath.VERSION = VERSION

for fName, fn of path when _.isFunction fn
  upath[fName] = do (fName)->
    (p...)->
      res = path[fName] p...
      if _.isString res
        res.replace /\\/g, '/'
      else
        res

extraFunctions =

  normalizeSafe: (path)->
    path = path.replace /\\/g, '/'
    if _.startsWith path, './'
      if _.startsWith(path, './..') or (path is './')
        upath.normalize(path)
      else
        './' + upath.normalize(path)
    else
      upath.normalize(path)

  addExt: (file, ext)->
    if not ext
      file
    else
      ext = '.' + ext if ext[0] isnt '.'
      file + if _.endsWith(file, ext) then '' else ext

  trimExt: (file)->
    file[0..(file.length - upath.extname(file).length)-1]

  changeExt: (file, ext)->
    upath.trimExt(file) + if not ext then '' else if ext[0] is '.' then ext else '.' + ext


  defaultExt: (file, ext, ignoreExts, maxSize=6)->
    oldExt = upath.extname file
    if ((oldExt) and (oldExt.length <= maxSize)) and
        (oldExt not in _.map(ignoreExts, (e)-> (if e and (e[0] isnt '.') then '.' else '') + e))
      file
    else
      upath.addExt file, ext

for name, extraFn of extraFunctions
  if not _.isUndefined upath[name]
    throw new Error "path.#{name} already exists."
  else
    upath[name] = extraFn
