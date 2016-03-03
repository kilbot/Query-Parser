module.exports = function(grunt) {

  var webpack = require('webpack');

  grunt.initConfig({

    watch: {
      js  : {
        files: ['src/*.js'],
        tasks: ['jshint', 'simplemocha', 'webpack']
      },
      test: {
        files: ['tests/*.js'],
        tasks: ['simplemocha']
      }
    },

    simplemocha: {
      options: {
        globals    : ['should'],
        timeout    : 3000,
        ignoreLeaks: false,
        ui         : 'bdd',
        reporter   : 'spec'
      },
      all    : {
        src: [
          'tests/setup.js',
          'tests/spec.js'
        ]
      }
    },

    jshint: {
      options: {
        jshintrc: true,
        reporter: require('jshint-stylish'),
        verbose : true
      },
      files  : ['src/*.js']
    },

    webpack: {
      build: {
        entry: './src/parser.js',
        output: {
          path: 'dist/',
          filename: 'parser.min.js',
          library: 'Parser'
        },
        externals: {
          lodash: '_'
        },
        plugins: [
          new webpack.optimize.UglifyJsPlugin()
        ]
      }
    }

  });

  require('load-grunt-tasks')(grunt);
  grunt.registerTask('default', ['jshint', 'simplemocha', 'webpack']);
  grunt.registerTask('dev', ['default', 'watch']);
}