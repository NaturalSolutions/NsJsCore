(function (root, factory) {

    // Set up Backbone appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {
        define([
    'jquery',
    'underscore',
    'backbone'
        ], function ($, _, Backbone, exports) {
            // Export global even in AMD case in case this script is loaded with
            // others that may still expect a global Backbone.
            var Retour = factory(root, exports, $, _, Backbone);
            return Retour;
        });

        // Next for Node.js or CommonJS. jQuery may not be needed as a module.
    } else if (typeof exports !== 'undefined') {
        var $ = require('jquery');
        var _ = require('underscore');
        var Backbone = require('backbone');


        module.exports = factory(root, exports, $, _, Backbone);
        //return Retour ;
        // Finally, as a browser global.
    } else {
        //TODO
        //root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
    }

}(this, function (root, NsCom, $, _, Backbone) {
    /*

define([
    'jquery',
    'underscore',
    'backbone'
    


], function($, _, Backbone ) {*/

    'use strict';
    // I am the internal, static counter for the number of Coms
    // that have been created in the system. This is used to
    // power the unique identifier of each instance.
    var instanceCount = 0;


    // I get the next instance ID.
    var getNewInstanceID = function () {

        // Precrement the instance count in order to generate the
        // next value instance ID.
        return (++instanceCount);

    };


    // -------------------------------------------------- //
    // -------------------------------------------------- //


    // I return an initialized object.
    function Com() {
        // Store the private instance id.
        this._instanceID = getNewInstanceID();
        this.components = [];
        this.motherColl = new Backbone.Collection();
        // Return this object reference.
        return (this);

    }


    // I return the current instance count. I am a static method
    // on the Com class.
    Com.getInstanceCount = function () {

        return (instanceCount);

    };


    // Define the class methods.
    Com.prototype = {
        // I return the instance ID for this instance.
        getInstanceID: function () {
            return (this._instanceID);
        },

        setMotherColl: function (coll) {
            this.motherColl = coll;
        },

        getMotherColl: function () {
            return this.motherColl;
        },

        updateMotherColl: function (ids) {
            for (var i = ids.length - 1; i >= 0; i--) {
                this.motherColl.where({ id: ids[i] }, function (m) {
                    m.attributes.import = true;
                });

            };
        },

        addModule: function (m) {
            this.components.push(m);
        },



        action: function (action, ids) {
            if (action === 'selection' || action === 'selection') {
                this.updateMotherColl(ids);
            }
            for (var i = 0; i < this.components.length; i++) {
                this.components[i].action(action, ids);
            };
        },
    };


    // -------------------------------------------------- //
    // -------------------------------------------------- //
    // TODO Destroy components 




    return (Com);

}));