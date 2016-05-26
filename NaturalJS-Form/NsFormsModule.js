

(function (root, factory) {

    // Set up Backbone appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {
        console.log('amd');
        define(['jquery',
      'underscore',
      'backbone',
      'marionette',
      'backbone_forms'
      ], function ( $, _, Backbone, Marionette, BackboneForm, exports) {
          // Export global even in AMD case in case this script is loaded with
          // others that may still expect a global Backbone.
          var Retour = factory(root, exports, $, _, Backbone, Marionette, BackboneForm);
          console.log(Retour) ;
          return Retour;
      });

        // Next for Node.js or CommonJS. jQuery may not be needed as a module.
    } else if (typeof exports !== 'undefined') {
		console.log('common JS');
        var $ = require('jquery');
        var _ = require('underscore');
        var Backbone = require('backbone');
		Backbone.$ = $;
        var Marionette = require('backbone.marionette');
        require('backbone-forms');
        var BackboneForm=  Backbone.Form ;
        /*var brfs = require('brfs')
        var tpl = brfs('./Templates/NsFormsModule.html');*/
       
        
		module.exports = factory(root, exports, $, _, Backbone, Marionette, BackboneForm);
		//return Retour ;
        // Finally, as a browser global.
    } else {
        //TODO
        //root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
    }

}(this, function (root, NsForm,$, _, Backbone, Marionette, BackboneForm) {
 var tpl = '<div id="NsFormButton">' 
     +'<button class="NsFormModuleCancel<%=formname%>">'
     + 'Cancel '
    +'</button>'
    +'<button class="NsFormModuleSave<%=formname%>">'
        +'Save' 
    +'</button>'
        +'<button class="NsFormModuleEdit<%=formname%>">'
        +'Edit'
    +'</button>'
        +'<button class="NsFormModuleClear<%=formname%>">'
        +'Clear' 
    +'</button>'
+'</div>' ;

    NsForm =  Backbone.View.extend({
        BBForm: null,
        modelurl: null,
        Name: null,
        objectType: null,
        displayMode: null,
        buttonRegion: null,
        formRegion: null,
        id: null,
        reloadAfterSave: true,
        template: tpl,

        redirectAfterPost: "",

        extendsBBForm: function () {
            //if ()
            Backbone.Form.validators.errMessages.required = '';
            Backbone.Form.Editor.prototype.initialize = function (options) {
                var options = options || {};

                //Set initial value
                if (options.model) {
                    if (!options.key) throw new Error("Missing option: 'key'");

                    this.model = options.model;

                    this.value = this.model.get(options.key);
                }
                else if (options.value !== undefined) {
                    this.value = options.value;
                }

                if (this.value === undefined) this.value = this.defaultValue;

                //Store important data
                _.extend(this, _.pick(options, 'key', 'form'));

                var schema = this.schema = options.schema || {};

                this.validators = options.validators || schema.validators;

                //Main attributes
                this.$el.attr('id', this.id);
                this.$el.attr('name', this.getName());
                if (schema.editorClass) this.$el.addClass(schema.editorClass);
                if (schema.editorAttrs) this.$el.attr(schema.editorAttrs);

                if (options.schema.validators && options.schema.validators[0] == "required") {

                    this.$el.addClass('required');
                }

            };
        },

        initialize: function (options) {
            this.extendsBBForm();
            this.schema = options.schema ;
            this.fieldsets = options.fieldsets ;
            this.modelurl = options.modelurl;
            this.name = options.name;
            this.buttonRegion = options.buttonRegion  || [];
            this.formRegion = options.formRegion;
            if (options.reloadAfterSave != null) { this.reloadAfterSave = options.reloadAfterSave };
            // The template need formname as vrairable, to make it work if several NSForms in the same page
            // With adding formname, there will be no name conflit on Button class
            var variables = { formname: this.name };
            if (options.template) {
                // if a specific template is given, we use it
                //if ()
                
                if (typeof (options.template) === 'string') {
                    this.template = _.template($(options.template).html(), variables);
                }
                else {
                }
            
            }
            else {
                // else use default template
                this.template = _.template($(tpl).html(), variables);
            }


            if (options.id && !isNaN(options.id)) {
                this.id = options.id;
            }
            else {
                this.id = 0;
            }
            if (options.displayMode) {
                this.displayMode = options.displayMode;
            }
            else {
                this.displayMode = 'edit';
            }

            if (options.objecttype) {
                this.objectType = options.objecttype;
            }
            else {
                this.objectType = null;
            }
            //this.objectType = options.objecttype;
            //this.displaybuttons();
            if (options.model) {
                // If a model is given, no ajax call to initialize the form
                this.model = options.model;
                this.BBForm = new BackboneForm({
                    model: this.model,
                    data: this.model.data,
                    fieldsets: this.model.fieldsets,
                    schema: this.model.schema
                });
                this.showForm();
            }
            else {
                // otherwise, use ajax call to get form information
                this.initModel();
            }
            if (options.redirectAfterPost) {
                // allow to redirect after creation (post) using the id of created object
                this.redirectAfterPost = options.redirectAfterPost;
            }


        },

        initModel: function () {
            var _this = this ;
            if (!this.modelurl){return ;}
            if (this.schema) {
                var Model = Backbone.Model.extend(
                    {
                        urlRoot:this.modelurl,
                        schema:this.schema
                        }
                    );
                this.model = new Model({id:this.id}) ;
                
                this.model.fetch({success:function() {
                     _this.BeforeCreateForm();
                    _this.BBForm = new BackboneForm({ model: _this.model, data: _this.model.data, fieldsets: _this.model.fieldsets, schema: _this.model.schema });
                    _this.showForm();
                    }
                }) ;
            }
            else {
                this.initModelServeur() ;
            }

        },
        initModelServeur:function() {
            if (!this.model) {
                this.model = new Backbone.Model();
            }
            
            if (this.model.attributes.id) {
                id = this.model.attributes.id;
            } else {
                id = this.id;
            }
            var url = this.modelurl
            var _this = this;
            url += this.id;

            $.ajax({
                url: url,
                context: this,
                type: 'GET',
                data: { FormName: this.name, ObjectType: this.objectType, DisplayMode: this.displayMode },
                dataType: 'json',
                success: function (resp) {

                    if (!_this.schema) {
                        _this.model.schema = resp.schema;
                    }
                    else {
                        _this.model.schema = _this.schema ;
                    }
                    
                    _this.model.attributes = resp.data;
                    if (resp.fieldsets) {
                        // if fieldset present in response, we get it
                        _this.model.fieldsets = resp.fieldsets;
                    }
                    _this.BeforeCreateForm();
                    // give the url to model to manage save
                    _this.model.urlRoot = this.modelurl;
                    _this.BBForm = new BackboneForm({ model: _this.model, data: _this.model.data, fieldsets: _this.model.fieldsets, schema: _this.model.schema });
                    _this.showForm();
                },
                error: function (data) {
                    _this.gettingError(data);
                }
            });
        },

        BeforeCreateForm: function () {
        },
        showForm: function () {
            var _this = this;
            this.BBForm.render();
            this.render();

            // Call extendable function before the show call
            this.BeforeShow();
            var _this = this;
            $('#' + this.formRegion).html(this.BBForm.el);



            this.buttonRegion.forEach(function (entry) {
                $('#' + entry).html(_this.template);
            });


            $('#' + this.formRegion).find('input').on("keypress", function (e) {
                if (e.which == 13) {
                    e.preventDefault();
                    _this.butClickSave(e);
                }
            });


            this.displaybuttons();
        },
        AfterShow: function () {
            // to be extended
        },


        displaybuttons: function () {
            var ctx = this;

            $('.NsFormModuleCancel' + ctx.name).unbind();
            $('.NsFormModuleSave' + ctx.name).unbind();
            $('.NsFormModuleClear' + ctx.name).unbind();
            $('.NsFormModuleEdit' + ctx.name).unbind();
           

            if (ctx.displayMode == 'edit') {
                $('.NsFormModuleCancel' + ctx.name).attr('style', 'display:');
                $('.NsFormModuleSave' + ctx.name).attr('style', 'display:');
                $('.NsFormModuleClear' + ctx.name).attr('style', 'display:');
                $('.NsFormModuleEdit' + ctx.name).attr('style', 'display:none');
                $('#' + this.formRegion).find('input:enabled:first').focus()

            }
            else {
                $('.NsFormModuleCancel' + ctx.name).attr('style', 'display:none');
                $('.NsFormModuleSave' + ctx.name).attr('style', 'display:none');
                $('.NsFormModuleClear' + ctx.name).attr('style', 'display:none');
                $('.NsFormModuleEdit' + ctx.name).attr('style', 'display:');
            }


            $('.NsFormModuleSave' + ctx.name).click($.proxy(ctx.butClickSave, ctx));
            $('.NsFormModuleEdit' + ctx.name).click($.proxy(ctx.butClickEdit, ctx));
            $('.NsFormModuleClear' + ctx.name).click($.proxy(ctx.butClickClear, ctx));
            $('.NsFormModuleCancel' + ctx.name).click($.proxy(ctx.butClickCancel, ctx));
            this.buttonDiplayed();
        },

        butClickSave: function (e) {

            var validation = this.BBForm.commit();
            //console.log('**************************************Validation****************', validation);
            if (validation != null) return;

            if (this.model.attributes["id"] == 0) {
                // To force post when model.save()
                this.model.attributes["id"] = null;
            }

            var _this = this;
            var _this = this;
            this.onSavingModel();
            if (this.model.id == 0) {
                // New Record
                this.model.save(null, {

                    success: function (model, response) {
                        // Getting ID of created record, from the model (has beeen affected during model.save in the response)
                        _this.savingSuccess(model, response);
                        _this.id = _this.model.id;

                        if (_this.redirectAfterPost != "") {
                            // If redirect after creation
                            var TargetUrl = _this.redirectAfterPost.replace('@id', _this.id);

                            if (window.location.href == window.location.origin + TargetUrl) {
                                // if same page, relaod
                                window.location.reload();
                            }
                            else {
                                // otherwise redirect
                                window.location.href = TargetUrl;
                            }
                        }
                        else {
                            // If no redirect after creation
                            if (_this.reloadAfterSave) {
                                _this.reloadingAfterSave();
                            }
                        }
                    },
                    error: function (model,response) {
                        _this.savingError(model, response);
                    }

                });
            }
            else {
                // After update of existing record
                this.model.save(null, {
                    success: function (model, response) {
                        _this.savingSuccess(model, response);
                        if (_this.reloadAfterSave) {
                            _this.reloadingAfterSave();
                        }
                    },
                    error: function (response) {
                        _this.savingError(response);
                    }
                });
            }
            this.afterSavingModel();
        },
        butClickEdit: function (e) {
            e.preventDefault();
            this.displayMode = 'edit';
            this.initModel();
            this.displaybuttons();



        },
        butClickCancel: function (e) {
            e.preventDefault();
            this.displayMode = 'display';
            this.initModel();
            this.displaybuttons();
        },
        butClickClear: function (e) {
            var formContent = this.BBForm.el;
            $(formContent).find('input').val('');
            $(formContent).find('select').val('');
            $(formContent).find('textarea').val('');
            $(formContent).find('input[type="checkbox"]').attr('checked', false);
        },
        reloadingAfterSave: function () {
            this.displayMode = 'display';
            // reaload created record from AJAX Call
            this.initModel();
            this.showForm();
            this.displaybuttons();
        },
        onSavingModel: function () {
            // To be extended, calld after commit before save on model
        },

        afterSavingModel: function () {
            // To be extended called after model.save()
        },
        BeforeShow: function () {
            // to be extended called after render, before the show function
        },

        savingSuccess: function (model, response) {
            // To be extended, called after save on model if success
        },
        savingError: function (model, response) {
            // To be extended, called after save on model if error
        },

        gettingError: function (response) {
            // To be extended, called when initializing model failed

        },
        buttonDiplayed: function (e) {
        }


    });
    return NsForm;

}));