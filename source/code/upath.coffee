_ = require 'lodash'
_.mixin (require 'underscore.string').exports()
path = require 'path'

upath = exports

upath.VERSION = if VERSION? then VERSION else 'NO-VERSION' # inject by grunt-concat

toUnix = (p)->
  p = p.replace /\\/g, '/'
  double = /\/\//
  while p.match double
    p = p.replace double, '/' # node on windows doesn't replace doubles
  p

for fName, fn of path when _.isFunction fn
  upath[fName] = do (fName)->
    (args...)->
      args = _.map args, (p)-> if _.isString(p) then toUnix(p) else p
      toUnix(path[fName] args...)

extraFunctions =

  toUnix: toUnix

  normalizeSafe: (p)->
    p = toUnix(p)
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

  trimExt: (filename, ignoreExts, maxSize=7)->
    oldExt = upath.extname filename
    if isValidExt oldExt, ignoreExts, maxSize
      filename[0..(filename.length - oldExt.length)-1]
    else
      filename

  changeExt: (filename, ext, ignoreExts, maxSize=7)->
    upath.trimExt(filename, ignoreExts, maxSize) +
      if not ext
        ''
      else
        if ext[0] is '.'
          ext
        else
          '.' + ext

  defaultExt: (filename, ext, ignoreExts, maxSize=7)->
    oldExt = upath.extname filename
    if isValidExt(oldExt, ignoreExts, maxSize)
      filename
    else
      upath.addExt filename, ext

isValidExt = (ext, ignoreExts, maxSize)->
  ((ext) and (ext.length <= maxSize)) and
  (ext not in _.map(ignoreExts, (e)->
    (if e and (e[0] isnt '.') then '.' else '') + e)
  )

for name, extraFn of extraFunctions
  if not _.isUndefined upath[name]
    throw new Error "path.#{name} already exists."
  else
    upath[name] = extraFn
