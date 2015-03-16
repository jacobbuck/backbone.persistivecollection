(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['backbone', 'underscore'], factory);
	} else if (typeof exports === 'object') {
		// Node/CommonJS
		module.exports = factory(require('backbone'), require('underscore'));
	} else {
		// Browser globals
		factory(root.Backbone, root._);
	}
}(this, function (Backbone, _) {

	function serialize (item) {
		return _.isObject(item) ? JSON.stringify(item) : item;
	}

	function deserialize (data) {
		return data && JSON.parse(data);
	}

	var PersistiveCollection = Backbone.Collection.extend({

		constructor: function (models, options) {
			options || (options = {});
			if (options.storeid) this.storeid = options.storeid;

			if (!this.storeid) {
				throw new Error('`storeid` must be defined');
			}

			// Initialize collection with models in localStorage (if available)
			if (!models) {
				models = this._getLocalStorageJSON();
			}

			// Call original constructor
			Backbone.Collection.prototype.constructor.call(this, models, options);

			// Listen to collection changes
			this.listenTo(this, 'add', this._onAdd);
			this.listenTo(this, 'remove', this._onRemove);
			this.listenTo(this, 'sort', this._onSort);
			this.listenTo(this, 'reset', this._onReset);

			// Listen to model changes
			this.each(function (model) {
				this.listenTo(model, 'change', this._onModelChange);
			}, this);
		},

		// Get an array of model keys from localStorage
		_getLocalStorageKeys: function () {
			var records = localStorage.getItem(_.result(this, 'storeid'));
			if (!records) return [];
			return records.split(',');
		},

		// Set an array of model keys from this collection to localStorage
		_setLocalStorageKeys: function () {
			var records = this.map(function (model) { return model.id; });
			localStorage.setItem(_.result(this, 'storeid'), records.join(','));
		},

		// Get model localStorage key from passed id
		_getLocalStorageModelKey: function (id) {
			return _.result(this, 'storeid') + '-' + id;
		},

		// Get persisted models from localStorage
		_getLocalStorageJSON: function () {
			return _.map(this._getLocalStorageKeys(), this._getLocalStorageModel, this);
		},

		// Get model from localStorage
		_getLocalStorageModel: function (id) {
			return deserialize(localStorage.getItem(this._getLocalStorageModelKey(id)));
		},

		// Set/update model to localStorage
		_setLocalStorageModel: function (model) {
			localStorage.setItem(this._getLocalStorageModelKey(model.id), serialize(model.toJSON()));
		},

		// Remove model from localStorage
		_removeLocalStorageModel: function (id) {
			localStorage.removeItem(this._getLocalStorageModelKey(model.id));
		},

		// Set models in collection to persist in localStorage
		_syncLocalStorage: function () {
			// Delete old items from localStorage
			_.each(this._getLocalStorageKeys(), function (id) {
				if (!this.get(id)) {
					this._removeLocalStorageModel(id);
				}
			}, this);

			// Create new/update existing items
			this.each(this._setLocalStorageModel, this);

			// Update records
			this._setLocalStorageKeys();
		},

		_onAdd: function (model, collection, options) {
			// Add model to localStorage
			this._setLocalStorageModel(model);

			// Listen to model changes
			this.listenTo(model, 'change', this._onModelChange);

			// Update collection keys in localStorage
			this._setLocalStorageKeys();
		},

		_onRemove: function (model, collection, options) {
			// Remove model from localStorage
			this._removeLocalStorageModel(model.id);

			// Stop listening to model
			this.stopListening(model);

			// Update collection keys in localStorage
			this._setLocalStorageKeys();
		},

		_onSort: function (collection, options) {
			// Update collection keys in localStorage
			this._setLocalStorageKeys();
		},

		_onReset: function (collection, options) {
			// Delete all items from localStorage
			_.each(this._getLocalStorageKeys(), function (id) {
				localStorage.removeItem(this._getLocalStorageModelKey(id));
			}, this);

			// Stop listening to previous models
			_.each(options.previousModels, function (model) {
				this.stopListening(model);
			}, this);

			this._setLocalStorageKeys();
		},

		_onModelChange: function (model) {
			this._setLocalStorageModel(model);
		}

	});

	Backbone.PersistiveCollection = PersistiveCollection;

	return PersistiveCollection;

}));