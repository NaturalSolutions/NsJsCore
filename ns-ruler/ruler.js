(function (root, factory) {

    // Set up Backbone appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {

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

    NsRuler = Backbone.View.extend({
        form: null,
        sourceFields:{},
        initialize: function (options) {
            this.form = options.form;
            this.option = options;
            this.sourceFields = {};

        },
        addRule: function (target, operator, source) {
            var _this = this;
            if (this.sourceFields[source] == null) {
                this.sourceFields[source] = [{ target: target, operator: operator }];
            }
            else {
                this.sourceFields[source].push({ target: target, operator: operator });
            }

            this.form.$el.find(('#' + this.getEditor(source).id)).on('change keyup paste', function (e) {
                _this.ApplyRules(e);
            });
            
            //this.form.$el.find(('#' + this.getEditor(source).id)).keypress(this.ApplyRules);
        },
        getEditor: function (name) {
            return this.form.fields[name].editor;
        },
        ApplyRules: function (evt) {
            var sourceName = evt.currentTarget.name;            
            var ruleList = this.sourceFields[sourceName];
            for (var i = 0; i < ruleList.length; i++) {
                this.form.$el.find(('#' + this.getEditor(ruleList[i].target).id)).val(this.getEditor(sourceName).getValue());
            }
        }
    });



    return (NsRuler);

}));