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

## License

MIT
