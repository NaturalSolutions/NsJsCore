(function (root, factory) {

    // Set up Backbone appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {
        console.log('amd');
        define(['jquery',
    'underscore',
    'backbone',
    'backbone_forms',
    'moment',
        ], function ($, _, Backbone, BbForms, moment, exports) {
            // Export global even in AMD case in case this script is loaded with
            // others that may still expect a global Backbone.
            var Retour = factory(root, exports, $, _, Backbone, BbForms, moment);

            return Retour;
        });

        // Next for Node.js or CommonJS. jQuery may not be needed as a module.
    } else if (typeof exports !== 'undefined') {

        var $ = require('jquery');
        var _ = require('underscore');
        var Backbone = require('backbone');
        require('backbone-forms');
        var moment = require('moment');
        var BbForms = Backbone.Form;
        Backbone.$ = $;



        /*var brfs = require('brfs')
        var tpl = brfs('./Templates/NsFormsModule.html');*/


        module.exports = factory(root, exports, $, _, Backbone, BbForms, moment);
        //return Retour ;
        // Finally, as a browser global.
    } else {
        //TODO
        //root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
    }

}(this, function (root, NsRuler, $, _, Backbone, BbForms, moment) {

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
    function Ruler() {
        // Store the private instance id.
        this._instanceID = getNewInstanceID();
        this.components = [];
        // Return this object reference.
        return (this);

    }

    // I return the current instance count. I am a static method
    // on the Com class.
    Ruler.getInstanceCount = function () {
        return (instanceCount);
    };


    // Define the class methods.
    Ruler.prototype = {
        // I return the instance ID for this instance.
        getInstanceID: function () {
            return (this._instanceID);
        },
    };




    return (Com);

}));