define([
	"module",
	"can-stache/src/mustache_core",
	"can-view-parser"
], function(module, mustacheCore, parser){

	function parse(source){
		var template = mustacheCore.cleanLineEndings(source),
			tags = {
				"can-component": true,
				"style": true,
				"template": true,
				"view": true,
				"view-model": true,
				"events": true,
				"helpers": true,
				"simple-helpers": true,
				"script": true,
				"can-import": true
			},
			areIn = {},
			texts = {
				style: "",
				"view-model": "",
				events: "",
				helpers: "",
				"simple-helpers": ""
			},
			froms = {},
			types = {},
			attrs = {},
			values = {},
			imports = [],
			ases = {},
			currentTag = "",
			currentAttr = "",
			tagName = "",
			leakScope = false,
			keepToken = function(){
				// We only want to keep the template's tokens.
				return !!areIn.template || !!areIn.view;
			},
			isViewTag = function(name){
				return name === "view" || name === "template";
			};

		var intermediate = parser(template, {
			start: function(tagName){
				// Mark when we are inside one of the tags.
				if(tags[tagName]) {
					currentTag = tagName;
					areIn[tagName] = true;
				}
				return keepToken();
			},
			attrStart: function(attrName){
				currentAttr = attrName;

				if(currentAttr === "leak-scope") {
					leakScope = true;
				}

				return keepToken();
			},
			attrEnd: function(attrName){
				currentAttr = "";
				return keepToken();
			},
			attrValue: function(value){
				if(areIn["can-component"]) {
					if(currentAttr === "tag") {
						tagName = value;
					} else if(currentAttr === "leak-scope") {
						leakScope = value !== "false";
					}
				}
				if(areIn["can-import"] && currentAttr === "from") {
					imports.push(value);
				}
				if(currentAttr === "type" && tags[currentTag]) {
					types[currentTag] = (value+"").replace("text/", "");

					// <script type="events">
					if(currentTag === "script" && tags[value]) {
						currentTag = value;
					}
				} else if(currentAttr === "from" && tags[currentTag]) {
					froms[currentTag] = value;
				}
				attrs[currentAttr] = value;
				return keepToken();
			},
			end: function(tagName){
				if(tagName === "can-import") {
					if(attrs.as) {
						ases[attrs.as] = attrs.from;
					}

					attrs.as = false;
					attrs.from = false;
					areIn["can-import"] = false;
				}
				return keepToken();
			},
			close: function(tagName){
				if(tagName === "can-import") {
					imports.pop();
				}
				if(tags[tagName]) {
					areIn[tagName] = false;
				}
				return keepToken();
			},
			special: keepToken,
			chars: function(char){
				if(texts[currentTag] != null) {
					texts[currentTag] += char;
				}
				return keepToken();
			},
			done: function(){}
		}, true);

		// Remove the leading template noise.
		var idx = 0, cur = intermediate[0];
		while(cur.tokenType !== "end" || (cur.args ? !isViewTag(cur.args[0]) : true)) {
			intermediate.shift();
			cur = intermediate[0];
		}
		// Remove the template end
		intermediate.shift();

		return {
			froms: froms,
			intermediate: intermediate,
			imports: imports,
			tagName: tagName,
			texts: texts,
			types: types,
			leakScope: leakScope
		};
	}

	// Make functions that will define virtual modules
	function makeDefineVirtualModule(loader, load, addDep, args){

		function namer(loadName){
			var baseName = loadName.substr(0, loadName.indexOf("!"));

			return function(part, plugin){
				return baseName + "-" + part + (plugin ? ("." + plugin) : "");
			};
		}

		function addresser(loadAddress){
			return function(part, plugin){
				var base = loadAddress + "." + part;
				return base + (plugin ? ("." + plugin) : "");
			};
		}

		var name = namer(load.name);
		var address = addresser(load.address);

		// A function for disposing of modules during live-reload
		var disposeModule = function(moduleName){
			if(loader.has(moduleName))
				loader["delete"](moduleName);
		};
		if(loader.liveReloadInstalled || loader.has("live-reload")) {
			loader.import("live-reload", { name: module.id }).then(function(reload){
				disposeModule = reload.disposeModule || disposeModule;
			});
		}

		return function(defn){
			if(defn.condition) {
				if(defn.arg) {
					// viewModel
					args.push(defn.arg);
				}

				var moduleName = typeof defn.name === "function" ?
					defn.name(name) : name(defn.name);
				var moduleAddress = typeof defn.address === "function" ?
					defn.address(address) : address(defn.address);

				// from="something.js"
				if(defn.from) {
					addDep(defn.from, false);
				}

				else if(defn.getLoad) {
					var moduleSource = defn.source();
					return defn.getLoad(moduleName).then(function(newLoad){
						moduleName = newLoad.name || moduleName;

						// For live-reload
						disposeModule(moduleName);

						loader.define(moduleName, moduleSource, {
							metadata: newLoad.metadata,
							address: moduleAddress
						});
						addDep(moduleName);
					});
				}

				else if(defn.source) {
					addDep(moduleName);

					if(loader.has(moduleName))
						loader["delete"](moduleName);

					if(typeof defn.source !== "string") {
						return Promise.resolve(defn.source)
							.then(function(source){
								loader.define(moduleName, source, {
									address: address(defn.name)
								});
							});
					}

					loader.define(moduleName, defn.source, {
						address: address(defn.name)
					});
				}
			}
		}
	}

	function templateDefine(intermediateAndImports, normalize){
		var intermediate = intermediateAndImports.intermediate;
		var imports = intermediateAndImports.imports;
		imports.unshift(normalize("can-component"));
		imports.unshift(normalize("can-stache"));

		return Promise.all(imports).then(function(imports){
			return "def" + "ine(" + JSON.stringify(imports) + ", " +
				"function(stache){\n" +
				"\treturn stache(" + JSON.stringify(intermediate) + ");\n" +
				"});";
		});
	}

	function translate(load){
		var localLoader = this.localLoader || this,
			result = parse(load.source),
			tagName = result.tagName,
			texts = result.texts,
			types = result.types,
			froms = result.froms,
			normalize = function(str){
				return localLoader.normalize(str, module.id);
			},
			deps = [normalize("can-component")],
			ases = ["Component"],
			addDep = function(depName, isVirtual){
				deps.push(depName);
				if(isVirtual !== false) load.metadata.virtualDeps.push(depName);
			},
			stylePromise, templatePromise;


		load.metadata.virtualDeps = [];
		var defineVirtualModule = makeDefineVirtualModule(localLoader, load,
														  addDep, ases);

		// Define the template
		templatePromise = defineVirtualModule({
			condition: froms.template || froms.view || result.intermediate.length,
			arg: "view",
			name: "view",
			from: froms.template || froms.view,
			source: templateDefine(result, normalize)
		});

		// Define the viewModel
		defineVirtualModule({
			condition: froms["view-model"] || texts["view-model"],
			arg: "viewModel",
			name: "view-model",
			from: froms["view-model"],
			source: texts["view-model"]
		});

		// Define events
		defineVirtualModule({
			condition: froms.events || texts.events,
			arg: "events",
			name: "events",
			from: froms.events,
			source: texts.events
		});

		// Define helpers
		defineVirtualModule({
			condition: froms.helpers || texts.helpers,
			arg: "helpers",
			name: "helpers",
			from: froms.helpers,
			source: texts.helpers
		});

		// Define simple-helpers
		defineVirtualModule({
			condition: froms["simple-helpers"] || texts["simple-helpers"],
			arg: "simpleHelpers",
			name: "simple-helpers",
			from: froms["simple-helpers"],
			source: texts["simple-helpers"]
		});

		// Define the styles
		stylePromise = defineVirtualModule({
			condition: froms.style || texts.style,
			name: function(name){
				return name("style", types.style || "css") + "!"
			},
			address: function(address){
				return address("style", types.style);
			},
			source: function(){
				var styleText = texts.style;
				if(types.style === "less") {
					var styleText = tagName + " {\n" + texts.style + "}\n";
				}
				return styleText;
			},
			getLoad: function(styleName){
				var styleLoad = {};
				var normalizePromise = localLoader.normalize(styleName, load.name);
				var locatePromise = normalizePromise.then(function(name){
					styleName = name;
					styleLoad = { name: name, metadata: {} };
					return localLoader.locate(styleLoad);
				});

				return locatePromise.then(function(){
					return {
						name: styleName,
						metadata: styleLoad.metadata
					};
				});
			}
		}) || Promise.resolve();


		return Promise.all([
			stylePromise,
			templatePromise
		]).then(function(){
			return Promise.all(deps);
		}).then(function(deps){
			return "def" + "ine(" + JSON.stringify(deps) + ", function(" +
				ases.join(", ") + "){\n" +
				"\tvar __interop = function(m){if(m && m['default']) {return m['default'];}else if(m) return m;};\n\n" +
				"\tvar ViewModel = __interop(typeof viewModel !== 'undefined' ? viewModel : undefined);\n" +
				"\tvar ComponentConstructor = Component.extend({\n" +
				"\t\ttag: '" + tagName + "',\n" +
				"\t\tview: __interop(typeof view !== 'undefined' ? view : undefined),\n" +
				"\t\tViewModel: ViewModel,\n" +
				"\t\tevents: __interop(typeof events !== 'undefined' ? events : undefined),\n" +
				"\t\thelpers: __interop(typeof helpers !== 'undefined' ? helpers : undefined),\n" +
				"\t\tsimpleHelpers: __interop(typeof simpleHelpers !== 'undefined' ? simpleHelpers : undefined),\n" +
				"\t\tleakScope: " + result.leakScope + "\n" +
				"\t});\n\n" +
				"\treturn {\n" +
				"\t\tComponent: ComponentConstructor,\n" +
				"\t\tViewModel: ViewModel,\n" +
				"\t};\n" +
				"});";
		});

	}

	return {
		translate: translate
	};

});
