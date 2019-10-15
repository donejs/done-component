var QUnit = require("steal-qunit");
var loader = require("@loader");
var steal = require("@steal");
var stache = require("can-stache");

QUnit.module("done-component");

QUnit.onUnhandledRejection = function() {};

QUnit.test("Basics works", function(assert){
	assert.expect(3);
	var done = assert.async();

	loader.import("test/tests/hello-world.component").then(function(r){
		assert.ok("Loaded successfully");
		assert.equal(typeof r.Component, "function", "The function is a named export");
		assert.equal(r.Component, r.default, "The default export is the Component");
		done();
	});
});

QUnit.test("from works", function(assert){
	assert.expect(1);
	var done = assert.async();

	loader.import("test/tests/frankenstein.component").then(function(r){
		assert.equal(typeof r.ViewModel, "function", "external viewModel was loaded");
		done();
	});
});

QUnit.test("view-model from with can-import in template works", function(assert){
	assert.expect(1);
	var done = assert.async();

	loader.import("test/tests/from_and_import.component").then(function(){
		assert.ok(true, "Yay it works");
		done();
	});
});

QUnit.test("ViewModel is part of the export", function(assert){
	assert.expect(1);
	var done = assert.async();

	loader.import("test/tests/hello-world.component").then(function(hw){
		var ViewModel = hw.ViewModel;
		var helloWorld = new ViewModel();

		assert.equal(helloWorld.message, "Hello There!", "ViewModel can be tested");
		done();
	});
});

QUnit.test("Using `template` instead of `view` works", function(assert){
	assert.expect(1);
	var done = assert.async();

	loader.import("test/tests/with-template.component").then(function(c){
		var Component = c.Component;
		var view = Component.prototype.view;
		var frag = view();
		assert.equal(frag.firstChild.nodeValue.trim(), "Hello world", "view was included");

		done();
	});
});

QUnit.test("Defines the correct loader", function(assert){
	var done = assert.async();
	var mySteal = steal.clone();
	var myLoader = mySteal.System;
	myLoader.configMain = steal.System.configMain;
	myLoader.paths = steal.System.paths;
	var defines = {};

	var oldDefine = myLoader.define;
	myLoader.define = function(name, source){
		defines[name] = source;
		return oldDefine.apply(this, arguments);
	};

	myLoader.import(myLoader.configMain).then(function(){
		return myLoader.import("test/tests/frankenstein.component");
	}).then(function(){
		var template = defines["test/tests/frankenstein.component-view"];
		var events = defines["test/tests/frankenstein.component-events"];

		assert.ok(template, "template defined to the correct loader");
		assert.ok(events, "events defined to the correct loader");

		done();
	});
});


// Issues #16 and #17:
QUnit.test("Import relative modules", function(assert){
	assert.expect(1);
	var done = assert.async();

	loader.import("test/tests/tpl-import.component").then(function(r){
		assert.ok("Loaded successfully");
		done();
	}).catch(function(err){
		done(err);
	});
});

QUnit.test("leak-scope attribute works", function(assert){
	assert.expect(1);
	var done = assert.async();

	loader.import("test/tests/leak.component").then(function(){
		var template = stache("<leak-scope>{{foo}}</leak-scope>");
		var frag = template({});

		var tn = frag.firstChild.firstChild.nextSibling;

		assert.equal(tn.nodeValue, "bar", "leakScope worked");
		done();
	});
});

QUnit.test("error messages includes the source", function(assert){
	var done = assert.async();
	loader.import("~/test/tests/oops.component")
	.then(null, function(err){
		assert.ok(/<can-import/.test(err.message), "can-import code is in the message");
		assert.ok(/oops.component/.test(err.stack), "the importing file is in the stack");
	}).then(function() { done(); });
});

QUnit.test("#99 - .component files include a filename", function(assert){
	assert.expect(1);
	var done = assert.async();

	loader.import("test/tests/with-filename.component").then(function(c){
		var Component = c.Component;
		var view = Component.prototype.view;
		var frag = view();
		assert.equal(frag.firstElementChild.innerHTML,
			"test/tests/with-filename.component",
			"component includes filename");
		done();
	});
});
