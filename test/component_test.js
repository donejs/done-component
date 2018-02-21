var QUnit = require("steal-qunit");
var loader = require("@loader");
var steal = require("@steal");
var stache = require("can-stache");

QUnit.module("done-component");

test("Basics works", function(){
	expect(1);

	loader.import("test/tests/hello-world.component").then(function(r){
		ok("Loaded successfully");
		start();
	});
	stop();
});


test("from works", function(){
	expect(1);

	loader.import("test/tests/frankenstein.component").then(function(r){
		equal(typeof r.ViewModel, "function", "external viewModel was loaded");
		start();
	});
	stop();
});

test("view-model from with can-import in template works", function(){
	expect(1);

	loader.import("test/tests/from_and_import.component").then(function(){
		ok(true, "Yay it works");
		start();
	});

	stop();
});

test("ViewModel is part of the export", function(){
	expect(1);

	loader.import("test/tests/hello-world.component").then(function(hw){
		var ViewModel = hw.ViewModel;
		var helloWorld = new ViewModel();

		equal(helloWorld.message, "Hello There!", "ViewModel can be tested");
		start();
	});

	stop();
});

test("Using `template` instead of `view` works", function(){
	expect(1);

	loader.import("test/tests/with-template.component").then(function(c){
		var Component = c.Component;
		var view = Component.prototype.view;
		var frag = view();
		equal(frag.firstChild.nodeValue.trim(), "Hello world", "view was included");

		start();
	});

	stop();
});

test("Defines the correct loader", function(){
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

		ok(template, "template defined to the correct loader");
		ok(events, "events defined to the correct loader");

		start();
	});

	stop();
});


// Issues #16 and #17:
test("Import relative modules", function(){
	expect(1);

	loader.import("test/tests/tpl-import.component").then(function(r){
		ok("Loaded successfully");
		start();
	}).catch(function(err){
		start();
	});
	stop();
});

test("leak-scope attribute works", function(){
	expect(1);

	loader.import("test/tests/leak.component").then(function(){
		var template = stache("<leak-scope>{{foo}}</leak-scope>");
		var frag = template({});

		var tn = frag.firstChild.firstChild.nextSibling;

		equal(tn.nodeValue, "bar", "leakScope worked");

		start();
	});

	stop();
});
