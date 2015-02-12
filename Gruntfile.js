'use strict';

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-karma');

  require('time-grunt')(grunt);
  var pckg = require('./package.json');

  var appConfig = {
    name: pckg.name,
    lib: 'lib',
    src: 'src',
    dist: 'dist'
  };

  grunt.initConfig({

    app: appConfig,

    watch: {
      js: {
        files: ['<%= app.src %>/{,*/}*.js'],
        tasks: ['newer:jshint:all']
      },
      jsTest: {
        files: ['test/spec/{,*/}*.js'],
        tasks: ['newer:jshint:test', 'karma']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      }
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: {
        src: [
          'Gruntfile.js',
          '<%= app.src %>/{,*/}*.js'
        ]
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/spec/{,*/}*.js']
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= app.dist %>/{,*/}*',
            '!<%= app.dist %>/.git{,*/}*'
          ]
        }]
      }
    },

    uglify: {
      dist: {
        files: {
          '<%= app.dist %>/<%= app.name %>.min.js': [
            '<%= app.dist %>/dist.js'
          ]
        }
      }
    },

    concat: {
      options: {
        separator: ';',
      },
      dist: {
        src: ['<%= app.src %>/*.js'],
        dest: '<%= app.dist %>/dist.js',
      },
    },

    // Test settings
    karma: {
      unit: {
          configFile: 'test/karma.conf.js'
      },
      //continuous integration mode: run tests once in PhantomJS browser.
      continuous: {
        configFile: 'config/karma.conf.js',
        browsers: ['PhantomJS']
      }
    }
  });

  grunt.registerTask('test', [
    'karma'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'jshint',
    'requirejs',
    'concat',
    'uglify'
  ]);

  grunt.registerTask('default', [
    'newer:jshint',
    'test',
    'build'
  ]);
};
