module.exports = function (grunt) {
	
	"use strict";
	
	var pkg = grunt.file.readJSON("package.json"),
		key;
	
	grunt.initConfig({
		pkg: pkg,
		clean: ["dist", "build/<%= pkg.version %>"],
		jshint: {
			files: [
				"Gruntfile.js",
				"jquery.<%= pkg.name %>.js"
			]
		},
		uglify: {
			options: {
				banner: "/*! <%= pkg.name %> v<%= pkg.version %> | (c) 2014 <%= pkg.author %> */\n"
			},
			build: {
				src: "jquery.<%= pkg.name %>.js",
				dest: "jquery.<%= pkg.name %>.min.js"
			}
		},
		copy: {
			main: {
				src: "jquery.*.js",
				dest: "build/<%= pkg.version %>/"
			}
		},
		watch: {
			files: [
				"*.js"
			],
			tasks: "default"
		}
	});

	// Loading dependencies
	for (key in pkg.devDependencies) {
		if (key !== "grunt" && key.indexOf("grunt") === 0) {
			grunt.loadNpmTasks(key);
		}
	}

	grunt.registerTask("default", ["clean", "jshint", "uglify", "copy"]);
};