var QUnit = require("steal-qunit");
var loader = require("@loader");

QUnit.module("can/component/component/system");

test("Basics works", function(){
	expect(1);

	loader.import("test/tests/hello-world.component!").then(function(r){
		ok("Loaded successfully");
		start();
	});
	stop();
});


test("from works", function(){
	expect(1);

	loader.import("test/tests/frankenstein.component!").then(function(r){
		equal(typeof r.viewModel, "function", "external viewModel was loaded");
		start();
	});
	stop();
});

test("view-model from with can-import in template works", function(){
	expect(1);

	loader.import("test/tests/from_and_import.component!").then(function(){
		ok(true, "Yay it works");
		start();
	});

	stop();
});

