require("./foo.component");
var stache = require("can-stache");

var app = document.getElementById("app");
app.appendChild(stache("<foo-bar></foo-bar>")());
