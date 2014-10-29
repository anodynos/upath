_ = require 'lodash'
S = if process.platform is 'win32' then '\\' else '/'
startsWith = (string, substring) -> string.lastIndexOf(substring, 0) is 0
nodeBin = "node_modules#{S}.bin#{S}"

sourceDir     = "source/code"
buildDir      = "build/code"
sourceSpecDir = "source/spec"
buildSpecDir  = "build/spec"

module.exports = gruntFunction = (grunt) ->
  pkg = grunt.file.readJSON 'package.json'

  gruntConfig =
    pkg: pkg

    meta:
      banner: """
      /*!
      * <%= pkg.name %> - version <%= pkg.version %>
      * Compiled on <%= grunt.template.today(\"yyyy-mm-dd\") %>
      * <%= pkg.repository.url %>
      * Copyright(c) <%= grunt.template.today(\"yyyy\") %> <%= pkg.author.name %> (<%= pkg.author.email %> )
      * Licensed <%= pkg.licenses[0].type %> <%= pkg.licenses[0].url %>
      */\n
      """
      varVERSION: "var VERSION = '<%= pkg.version %>'; //injected by grunt:concat\n"
      mdVersion: "# <%= pkg.name %> v<%= pkg.version %>\n"
      usrBinEnvNode: "#!/usr/bin/env node\n"

    options: {sourceDir, buildDir, sourceSpecDir, buildSpecDir}

    clean:
      build: 'build'
      temp: 'temp'

    concat:
      VERSION:
        options: banner: "<%= meta.banner %><%= meta.varVERSION %>"
        src: [ '<%= options.buildDir %>/upath.js']
        dest:  '<%= options.buildDir %>/upath.js'

    watch:
      dev: # requires `coffeeWatch` to compile changed only files! need a changed-only-files coffee task!
        files: ["source/**/*"]
        tasks: ['build', 'test']

    shell:
      coffee: command: "#{nodeBin}coffee -cb -o ./build ./source"
      coffeeWatch: command: "#{nodeBin}coffee -cbw -o ./build ./source"
      mochaCmd: command: "#{nodeBin}mocha #{buildSpecDir}/**/*-spec.js -R spec --recursive --bail"
      options: verbose: true, failOnError: true, stdout: true, stderr: true

  ### shortcuts generation ###
  splitTasks = (tasks)-> if not _.isString tasks then tasks else (_.filter tasks.split(/\s/), (v)-> v)
  grunt.registerTask cmd, splitTasks "shell:#{cmd}" for cmd of gruntConfig.shell # shortcut to all "shell:cmd"
  grunt.registerTask shortCut, splitTasks tasks for shortCut, tasks of {
    default: "clean build test"
    build: "coffee concat"
    test: "mochaCmd"

    "alt-b": "build"
    "alt-t": "test"
  }

  grunt.loadNpmTasks task for task of pkg.devDependencies when startsWith(task, 'grunt-')
  grunt.initConfig gruntConfig