
module.exports = function(grunt){
	grunt.initConfig({
		testee: {
		  tests: {
			options: {
			  browsers: ["firefox"]
			},
			src: ["test/test.html"]
		  }
		}
	});

	grunt.loadNpmTasks("testee");

	grunt.registerTask("test", ["testee"]);
};
