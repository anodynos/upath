_ = require 'lodash'
_.mixin (require 'underscore.string').exports()
path = require 'path'

upath = exports

upath.VERSION = VERSION # inject by grunt-concat

for fName, fn of path when _.isFunction fn
  upath[fName] = do (fName)->
    (args...)->
      args = _.map args, (p)-> if !_.isString(p) then p else p.replace /\\/g, '/'
      path[fName] args...

extraFunctions =

  normalizeSafe: (p)->
    if _.startsWith p, './'
      if _.startsWith(p, './..') or (p is './')
        upath.normalize(p)
      else
        './' + upath.normalize(p)
    else
      upath.normalize(p)

  normalizeTrim: (p)->
    p = upath.normalizeSafe p
    if _.endsWith(p, '/')
      p[0..p.length-2]
    else
      p

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