var ssr = require("done-ssr");
var assert = require("assert");
var path = require("path");
var through = require("through2");
var makeWindow = require("can-vdom/make-window/make-window");
var document = makeWindow({}).document;

var helpers = {
	dom: function(html){
		html = html.replace("<!doctype html>", "").trim();
		var doc = new document.constructor();
		doc.__addSerializerAndParser(document.__serializer, document.__parser);
		var div = doc.createElement("div");
		div.innerHTML = html;

		return div.firstChild;
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
	this.timeout(20000);

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
