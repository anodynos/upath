path = require 'path'

isFunction = (val) -> typeof val == 'function'

isString = (val) ->
  typeof val == 'string' or
    (!!val and typeof val == 'object' and Object::toString.call(val) == '[object String]')

upath = exports

upath.VERSION = if VERSION? then VERSION else 'NO-VERSION' # injected by urequire-inject-version

toUnix = (p) ->
  p = p.replace /\\/g, '/'
  p = p.replace /(?<!^)\/+/g, '/' # replace doubles except beginning for UNC path
  p

for propName, propValue of path
  if isFunction propValue
    upath[propName] = do (propName) ->
      (args...) ->
        args = args.map (p) ->
          if isString(p)
            toUnix p
          else
            p

        result = path[propName] args...

        if isString result
          toUnix result
        else
          result
  else
    upath[propName] = propValue

upath.sep = '/'

extraFunctions =

  toUnix: toUnix

  normalizeSafe: (p) ->
    p = toUnix(p)
    result = upath.normalize(p)
    if p.startsWith('./') && !result.startsWith('./') && !result.startsWith('..')
      result = './' + result
    else if p.startsWith('//') && !result.startsWith('//')
      if p.startsWith('//./')
        result = '//.' + result
      else
        result = '/' + result
    result

  normalizeTrim: (p) ->
    p = upath.normalizeSafe p
    if p.endsWith('/')
      p[0..p.length-2]
    else
      p


  joinSafe: (p...) ->
    result = upath.join.apply null, p
    if p.length > 0
      p0 = toUnix(p[0])
      if p0.startsWith('./') && !result.startsWith('./') && !result.startsWith('..')
        result = './' + result
      else if p0.startsWith('//') && !result.startsWith('//')
        if p0.startsWith('//./')
          result = '//.' + result
        else
          result = '/' + result
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
        upath.trimExt filename, [], ext.length
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

for own name, extraFn of extraFunctions
  if upath[name] isnt undefined
    throw new Error "path.#{name} already exists."
  else
    upath[name] = extraFn
