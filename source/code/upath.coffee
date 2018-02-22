_ =
  isFunction: require 'lodash.isfunction'
  isString: require 'lodash.isstring'

path = require 'path'

upath = exports

upath.VERSION = if VERSION? then VERSION else 'NO-VERSION' # injected by urequire-inject-version

toUnix = (p) ->
  p = p.replace /\\/g, '/'
  double = /\/\//
  while p.match double
    p = p.replace double, '/' # node on windows doesn't replace doubles
  p

for propName, propValue of path
  if _.isFunction propValue
    upath[propName] = do (propName) ->
      (args...) ->
        args = args.map (p) ->
          if _.isString(p)
            toUnix p
          else
            p

        result = path[propName] args...

        if _.isString result
          toUnix result
        else
          result
  else
    upath[propName] = propValue

extraFunctions =

  toUnix: toUnix

  normalizeSafe: (p) ->
    p = toUnix(p)
    if p.startsWith './'
      if p.startsWith('./..') or (p is './')
        upath.normalize(p)
      else
        './' + upath.normalize(p)
    else
      upath.normalize(p)

  normalizeTrim: (p) ->
    p = upath.normalizeSafe p
    if p.endsWith('/')
      p[0..p.length-2]
    else
      p


  joinSafe: (p...) ->
    result = upath.join.apply null, p
    if p[0].startsWith('./') && !result.startsWith('./')
      result = './' + result
    result

  addExt: (file, ext) ->
    if not ext
      file
    else
      ext = '.' + ext if ext[0] isnt '.'
      file + if file.endsWith(ext) then '' else ext

  trimExt: (filename, ignoreExts, maxSize=7) ->
    oldExt = upath.extname filename
    if isValidExt oldExt, ignoreExts, maxSize
      filename[0..(filename.length - oldExt.length)-1]
    else
      filename

  removeExt: (filename, ext) ->
    if not ext
      return filename
    else
      ext = if ext[0] is '.' then ext else '.' + ext
      if upath.extname(filename) is ext
        upath.trimExt filename
      else
        filename

  changeExt: (filename, ext, ignoreExts, maxSize=7) ->
    upath.trimExt(filename, ignoreExts, maxSize) +
      if not ext
        ''
      else
        if ext[0] is '.'
          ext
        else
          '.' + ext

  defaultExt: (filename, ext, ignoreExts, maxSize=7) ->
    oldExt = upath.extname filename
    if isValidExt(oldExt, ignoreExts, maxSize)
      filename
    else
      upath.addExt filename, ext

isValidExt = (ext, ignoreExts = [], maxSize) ->
  ((ext) and (ext.length <= maxSize)) and
  (ext not in ignoreExts.map (e) ->
    (if e and (e[0] isnt '.') then '.' else '') + e
  )

for name, extraFn of extraFunctions
  if upath[name] isnt undefined
    throw new Error "path.#{name} already exists."
  else
    upath[name] = extraFn
