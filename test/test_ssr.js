var ssr = require("done-ssr");
var assert = require("assert");
var path = require("path");
var through = require("through2");
var steal = require("steal");
require("can-vdom");

var helpers = {
	dom: function(html){
		html = html.replace("<!DOCTYPE html>", "").trim();
		var doc = new document.constructor();
		doc.__addSerializerAndParser(document.__serializer, document.__parser);
		window.LoaderPolyfill = steal.loader.constructor;
		var div = doc.createElement("html");
		div.innerHTML = html.trim();
		// use last child instead of first, because the presence of <!DOCTYPE html>
		//  will cause the first child to be a text node.
		return div.lastChild;
	},
	traverse: function(node, callback){
		var cur = node.firstChild;

		while(cur) {
			callback(cur);
			helpers.traverse(cur, callback);
			cur = cur.nextSibling;
		}
	}
};

describe("done-component server side rendering", function(){
	before(function(){
		this.render = ssr({
			config: path.join(__dirname, "tests", "ssr", "package.json!npm"),
			main: "index.stache!done-autorender"
		});
	});

	it("css gets rendered", function(done){
		this.render("/").pipe(through(function(buffer){
			var html = buffer.toString();

			var node = helpers.dom(html);

			var foundStyle = false;
			helpers.traverse(node, function(el){
				if(el.nodeName === "STYLE") {
					foundStyle = true;
				}
			});

			assert.equal(foundStyle, true, "Found the style element");
			done();
		}))
	});

});
