var QUnit = require("steal-qunit");
var loader = require("@loader");

QUnit.module("done-component");

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

test("ViewModel is part of the export", function(){
	expect(1);

	loader.import("test/tests/hello-world.component!").then(function(hw){
		var ViewModel = hw.ViewModel;
		var helloWorld = new ViewModel();

		equal(helloWorld.attr("message"), "Hello There!", "ViewModel can be tested");
		start();
	});

	stop();
});
