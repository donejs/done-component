var DefineMap = require("can-define/map/map");

module.exports = DefineMap.extend({
	choice: "string",
	isCorrect:  {
		get: function(){
			return this.choice === "bride-of-frankenstein";
		}
	}
});
