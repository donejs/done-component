[![Build Status](https://travis-ci.org/stealjs/system-component.svg?branch=master)](https://travis-ci.org/stealjs/system-component)
[![npm version](https://badge.fury.io/js/system-component.svg)](http://badge.fury.io/js/system-component)

# system-component

A [StealJS](http://stealjs.com/) and [SystemJS](https://github.com/systemjs/systemjs) plugin for [CanJS](http://canjs.com/) components.  system-component allows you to easily define your component completely from a single `.component` file:

## Install

```
npm install system-component --save
```

## Usage

Define a can.Component in a separate file:

### hello.component

```mustache
<can-component tag="hello-world">
	<style type="less">
		i {
			color: red;
		}
	</style>
	<template>
		{{#if visible}}<b>{{message}}</b>{{else}}<i>Click me</i>{{/if}}
	</template>
	<script type="view-model">
		export default {
			visible: true,
			message: "Hello There!"
		};
	</view-model>
	<script type="events">
		export default {
			click: function(){
				this.viewModel.attr("visible", !this.viewModel.attr("visible"))
			}
		};
	</events>
</can-component>
```

### main.stache

In your template simply import your component and you can start using it:

```mustache
<can-import from="hello-world.component!"/>

<hello-world></hello-world>
```

## API

### tag

The tag name is specified on the `can-component` element. This corresponds to `tag` when defining a Component in JavaScript.

### style

The `<style>` tag lets you include CSS specific to your component. By default it will use the CSS plugin but you can use preprocessors by specifying:

#### type

The style type lets you use an alternative to CSS such as Less:

```html
<style type="less">
  span {
    color: red
  }
</style>
```

Not that when using Less your style is automatically wrapped with the Component's tag name, so that it is scoped to only your component.

### template

The `<template>` tag is where you put your Stache template.

### view-model

The `<view-model>` or `<script type="view-model">` is where you put your viewModel. You can use either method, but the `<script>` method is more compatible with your editor.

### events

The `<events>` or `<script type="events">` is where you put your events object.

### helpers

The `<helpers>` or `<script type="helpers">` is where you put Stache helpers.

### from

Each of the subtags (style, template, view-model, events, and helpers) can optionally take a `from=` attribute that allows you to define that in a separate module. It's useful if one part is longer and you want to separate that out into it's own file:

```html
<can-component tag="foo">
  <view-model from="foo/view_model"/>
</can-component>
```

## Exported Object

Your `.component` will export an object that contains properties for `Component` which is the can.Component constructor, `ViewModel` which is a can.Map of your exported ViewModel.  This is useful for when testing:

```js
var QUnit = require("steal-qunit");
var HelloVM = require("hello-world.component!").ViewModel;

QUnit.test("view model works", function(){
  var map = new HelloVM();
  ...
});

```

## License

MIT
