
module.exports = function(grunt){
	grunt.initConfig({
		copy: {
			toTest: {
				files: [{
					expand: true,
					src:["node_modules/**"],
					dest: "test/tests/ssr",
					filter: "isFile"
				}]
			}

		},
		testee: {
		  tests: {
			options: {
			  browsers: ["firefox"]
			},
			src: ["test/test.html"]
		  }
		}
	});

	grunt.loadNpmTasks("grunt-testee");
	grunt.loadNpmTasks("grunt-contrib-copy");

	grunt.registerTask("test", ["testee"]);
};
