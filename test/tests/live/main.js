require("./foo.component");
var stache = require("can-stache");

var app = document.getElementById("app");
app.innerHTML = '';
app.appendChild(stache("<foo-bar></foo-bar>")());

