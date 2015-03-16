Backbone.PersistiveCollection
=============================

Extended Backbone Collection which persists it’s state in localStorage.

Documentation
-------------

Works the same as [Backbone.Collection](http://backbonejs.org/#Collection), except requires a `storeid` option set:

```js
var mycollection = new PersistiveCollection([...], {
	storeid: 'coolbeans'
});

// or

var MyCollection = new PersistiveCollection.extend({
	storeid: 'coolbeans'
});
```