

(function (root, factory) {

    // Set up Backbone appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {
        define(['jquery',
                'underscore',
                'backbone',
                'marionette',
                'backbone_forms',
                'sweetalert',
                'i18n',
                'autosize'
        ], function ($, _, Backbone, Marionette, BackboneForm, sweetAlert, i18n, autosize, exports) {
          // Export global even in AMD case in case this script is loaded with
          // others that may still expect a global Backbone.
            var Retour = factory(root, exports, $, _, Backbone, Marionette, BackboneForm, sweetAlert, i18n, autosize);
          return Retour;
      });

        // Next for Node.js or CommonJS. jQuery may not be needed as a module.
    } else if (typeof exports !== 'undefined') {
        var $ = require('jquery');
        var _ = require('underscore');
        var Backbone = require('backbone');
		Backbone.$ = $;
        var Marionette = require('backbone.marionette');
        require('backbone-forms');
        var BackboneForm=  Backbone.Form ;
        /*var brfs = require('brfs')
        var tpl = brfs('./Templates/NsFormsModule.html');*/
        autosize = require('autosize');
        i18n = require('i18n');
        
        module.exports = factory(root, exports, $, _, Backbone, Marionette, BackboneForm, autosize, i18n);
		//return Retour ;
        // Finally, as a browser global.
    } else {
        //TODO
        //root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
    }

}(this, function (root, NsForm, $, _, Backbone, Marionette, BackboneForm, sweetAlert, i18n, autosize) {

    var tpl = '<div id="NsFormButton">'
     +'<button class="NsFormModuleCancel<%=formname%>">'
     + 'Cancel '
    +'</button>'
    +'<button class="NsFormModuleSave<%=formname%>">'
        +'Save' 
    + '</button>'
        + (window.currentUser && window.currentUser.isAdmin ? '<button class="NsFormModuleEdit<%=formname%> NsFormEditButton">'
        + 'Edit'
    + '</button>' : "")
        + (window.currentUser && window.currentUser.isAdmin ? '<button class="NsFormModuleDelete<%=formname%> NsFormDeleteButton">'
        + 'Delete'
    + '</button>' : "")
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
        autosizeTextArea:true,
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
            this.options = options;
            this.extendsBBForm();
            this.schema = options.schema ;
            this.fieldsets = options.fieldsets ;
            this.modelurl = options.modelurl;
            this.name = options.name;
            this.buttonRegion = options.buttonRegion  || [];
            this.formRegion = options.formRegion;
            //HAS PROVEN USELESS -> this.hasFieldsChanged = false;
            this.that = this;

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

            if (options.autosizeTextArea != null && !options.autosizeTextArea) {
                this.autosizeTextArea = false;
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

            if (options.alloptions)
            {
                if (options.alloptions.listofids) {
                    this.listofids = options.alloptions.listofids;
                }
            }

            if (options.MainObjectId)
                this.MainObjectId = options.MainObjectId;

            if (options.AfterShow)
                this.AfterShow = options.AfterShow;

            if (options.Secondary)
                this.Secondary = options.Secondary;

            //----------------------------------------------------
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
                });
            }
            else {
                this.initModelServeur() ;
            }

        },
        initModelServeur: function () {
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
                data: { FormName: this.name, ObjectType: this.objectType, DisplayMode: this.displayMode, MainObjectId: this.MainObjectId, SubjectList: this.listofids, Secondary: this.Secondary },
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
                    _this.displayDefaultTexts();

                    if (_this.model.attributes.subjects && _this.model.attributes.subjects.length > 1)
                    {
                        if (_this.options.origin && _this.options.origin.displayPoolList)
                        {
                            _this.options.origin.displayPoolList(_this.model.attributes.subjects);
                        }
                    }
                    _this.AfterCreateForm();
                },
                error: function (data) {
                    _this.gettingError(data);
                }
            });
        },

        BeforeCreateForm: function () {

        },

        AfterCreateForm: function() {

        },

        showForm: function () {

            var _this = this;
            this.BBForm.render();
            this.render();
            if (this.name && this.name.toLowerCase() == "ecoleventform")
            {
                $("#headerEventForm").css("display", "block");
                $("#eventTypeName").html(this.BBForm.model.attributes.typeobjname);
            }

            // Call extendable function before the show call
            this.BeforeShow();
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
            if (this.autosizeTextArea) {
                setTimeout(function () {
                    autosize($('textarea'));
                }, 0);
            }

            // TODO, should not be here
            $('.form-control').on('change', function (evt) { _this.formControlChange(evt, _this); });
            $('.dateTimePicker').on('dp.change', function (evt) { _this.formControlChange(evt, _this); });
            $('.autocompTree').on('click', function (evt) { _this.formControlChange(evt, _this); });

            $('.dateTimePicker').trigger('dp.change');

            $.each($(".formContainer fieldset>div"), function (index, value) {
                if ($(value).find(".HiddenInput").length > 0)
                    $(value).addClass("HiddenInputParent");
                if ($(value).find(".ReadOnlyInput").length > 0)
                    $(value).addClass("ReadOnlyInputParent");
            });

            this.AfterShow();
        },

        AfterShow: function () {

        },

        displaybuttons: function () {
            var that = this;

            $('.NsFormModuleCancel' + that.name).unbind();
            $('.NsFormModuleSave' + that.name).unbind();
            $('.NsFormModuleClear' + that.name).unbind();
            $('.NsFormModuleEdit' + that.name).unbind();
            $('.NsFormModuleDelete' + that.name).unbind();
           
            if (that.displayMode == 'edit') {
                $('.NsFormModuleCancel' + that.name).attr('style', 'display:');
                $('.NsFormModuleSave' + that.name).attr('style', 'display:');
                $('.NsFormModuleClear' + that.name).attr('style', 'display:');
                $('.NsFormModuleEdit' + that.name).attr('style', 'display:none');
                $('.NsFormModuleDelete' + that.name).attr('style', 'display:none');
                $('#' + this.formRegion).find('input:enabled:first').focus()

            }
            else {
                $('.NsFormModuleCancel' + that.name).attr('style', 'display:none');
                $('.NsFormModuleSave' + that.name).attr('style', 'display:none');
                $('.NsFormModuleClear' + that.name).attr('style', 'display:none');
                $('.NsFormModuleEdit' + that.name).attr('style', 'display:');
                $('.NsFormModuleDelete' + that.name).attr('style', 'display:');
            }

            $('.NsFormModuleSave' + that.name).click($.proxy(that.butClickSave, that));
            $('.NsFormModuleEdit' + that.name).click($.proxy(that.butClickEdit, that));
            $('.NsFormModuleDelete' + that.name).click($.proxy(that.butClickDelete, that));
            $('.NsFormModuleClear' + that.name).click($.proxy(that.butClickClear, that));
            $('.NsFormModuleCancel' + that.name).click($.proxy(that.butClickCancel, that));

            that.buttonDiplayed();
        },

        butClickSave: function (e) {
            var that = this;
            var validation = this.BBForm.commit();
            if (validation != null) {
                sweetAlert({
                    title: (i18n ? i18n.t("alerts.errInForm") : "Error in form"),
                    text: (i18n ? i18n.t("alerts.formNotSaved") : "The form could not be saved! Some compulsory fields are empty!"),
                    type: "error",
                    confirmButtonText: (i18n? i18n.t("gen.understood") : "Understood")
                });
                return;
            }

            if (this.model.attributes["id"] == 0) {
                this.model.attributes["id"] = null;
            }

            var _this = this;

            var subjs = this.model.attributes.subjects;
            if (subjs && subjs.length == 1
                && subjs[0].toString().indexOf("::") !== -1)
            {
                this.model.attributes.subjects = subjs[0].split("::")[0].trim();
            }

            this.onSavingModel();

            $('.NsFormModuleSave' + that.name).css("display", "none");
            $('.NsFormModuleCancel' + that.name).css("display", "none");

            if (this.model.id == 0) {
                // New Record
                this.model.save(null, {

                    success: function (model, response) {
                        // Getting ID of created record, from the model (has been affected during model.save in the response)
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
                        $('.NsFormModuleSave' + that.name).css("display", "block");
                        $('.NsFormModuleCancel' + that.name).css("display", "block");
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
                    error: function (model, response) {
                        _this.savingError(model, response);
                        $('.NsFormModuleSave' + that.name).css("display", "block");
                        $('.NsFormModuleCancel' + that.name).css("display", "block");
                    }
                });
            }
            this.afterSavingModel();
        },

        butClickEdit: function (e) {

        },

        butClickDelete: function (e, env, skipConfirm) {
            if (env)
                this.model = env.model;

            var idToDelete = 0;
            var itemType = "[ItemType]";
            var apiPath = "[apiPath]";

            if ((this.model.attributes.typeobjname &&
                this.model.attributes.typeobjname.toLowerCase() == "created")
                || this.model.attributes.Subjects)
            {
                itemType = "Sample";
                apiPath = itemType;

                if (this.model.attributes.Subjects)
                {
                    idToDelete = this.model.attributes.id;
                }

                if (this.model.attributes.sample)
                {
                    idToDelete = this.model.attributes.sample;
                }
            }

            if (this.model.attributes.sample)
            {
                itemType = "Event";
                apiPath = "EcolEvent";

                idToDelete = this.model.attributes.id;
            }

            var confirmDeletion = function(isConfirm){
                if (isConfirm) {
                    $.ajax({
                        url: 'api/' + apiPath.toLowerCase() + '/?itemId=' + idToDelete,
                        type: 'DELETE',
                        dataType: 'json',
                        success: function (resp) {
                            if (resp.result) {
                                setTimeout(function () {
                                    sweetAlert({
                                        title: (i18n? i18n.t("alerts.delSuccess") : ""),
                                        text: (i18n? i18n.t("gen.your") : "") + " " + itemType + " " + (i18n? i18n.t("alerts.successDeleted") : ""),
                                        type: "success",
                                        confirmButtonText: (i18n? i18n.t("gen.understood") : "")
                                    }, function () {
                                        var newLoc = (window.location.href.split('?')[0]);
                                        if (window.location.href == newLoc)
                                            window.location.reload();
                                        else
                                            window.location.href = newLoc;
                                    });
                                }, 100);
                            }
                            else if (resp.reason) {
                                setTimeout(function () {
                                    sweetAlert({
                                        title: (i18n? i18n.t("alerts.delError") : ""),
                                        text: (i18n? i18n.t("gen.reason") + "\n" + resp.reason : ""),
                                        type: "error",
                                        confirmButtonText: (i18n? i18n.t("gen.understood") : "")
                                    });
                                }, 100);
                            }
                        },
                        error: function (resp) {
                            setTimeout(function () {
                                sweetAlert({
                                    title: (i18n? i18n.t("alerts.delError") : ""),
                                    text: 'Reason:\n' + resp.responseText,
                                    type: "error",
                                    confirmButtonText: (i18n? i18n.t("gen.understood") : "")
                                });
                            }, 100);
                        }
                    });
                }
            };

            if (skipConfirm)
                confirmDeletion(true);
            else if (idToDelete > 0) {
                sweetAlert({
                    title: (i18n? i18n.t("alerts.areYouSure") : ""),
                    text: (i18n ? i18n.t("gen.your") : "") + " " + itemType + " " + (i18n ? i18n.t("alerts.beLost") : ""),
                    type: "warning",
                    confirmButtonText: (i18n? i18n.t("gen.delete") : ""),
                    cancelButtonText: (i18n? i18n.t("alerts.keep") : ""),
                    showCancelButton: true
                }, confirmDeletion);
            }
        },

        butClickCancel: function (e) {
            window.onbeforeunload = null;
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

        },

        defaultTextsFormSchema: function (schema)
        {
            var that = this;

            $.each(schema, function (index, value) {
                var element = $(".formModeEdit [name='" + value.name + "']:last");

                switch (value.type.toLowerCase()) {
                    case "text":
                        var mydefaultValue = "";
                        if (element.val() == "") {
                            mydefaultValue = value.defaultValue;
                            if ((mydefaultValue == null || mydefaultValue == "")
                                && value.options && value.options.defaultValue)
                                mydefaultValue = value.options.defaultValue
                            element.val(mydefaultValue);
                        }

                        break;

                    case "select":
                        var mydefaultValue = "";
                        if ((element.val() == "" || element.val() == null) && value.options && value.options.length > 0) {

                            var foundselected = false;
                            $.each(value.options, function (eachindex, eachvalue) {
                                if (!foundselected && eachvalue.selected
                                    && eachvalue.selected == "selected") {
                                    foundselected = true;
                                    mydefaultValue = eachvalue.val;
                                }
                            });

                            if (foundselected)
                                element.val(mydefaultValue);
                        }

                        break;

                    case "checkbox":

                        if (value.options && value.options.defaultValue) {
                            var defval = value.options.defaultValue
                            if (defval == 1 || defval == '1' || defval == 'true')
                                element.prop('checked', true);
                        }

                        break;

                        //TODO FIND A WAY TO APPLY ONLY ON CREATE, NOT ON EDIT AND IF DEFAULT VALUE IS NOT FORCED AT 0
                    case "number":
                        if (value.options && value.options.defaultValue) {
                            if (element.val() == 0)
                                element.val(value.options.defaultValue);
                        }
                        else if (element.val() == 0) {
                            element.val("");
                        }
                        break;

                    case "listofsubforms":
                        that.defaultTextsFormSchema(value.subschema);
                        break;
                }

            });
        },

        displayDefaultTexts: function () {

            this.defaultTextsFormSchema(this.BBForm.schema);

        },

        //TODO : THIS SHOULD BE IN GENFORM, NOT IN NSFORMSMODULE !!!
        formControlChange: function (evt, context) {
            var that = context;

            /* NOT WORKING ...
            $(this).addClass("haschanged");
            var target = evt.target;
            if (target.id == "dateTimePicker" && $(target).find("input[name='eventdate']").length > 0) {
                var idyear = $("#EColEventForm input[name='identificationyear']");
                if (idyear.length > 0) {
                    var fromdate = $(this).find("input").val().split("/");
                    var dateyear = new Date(fromdate[2], '0', '1');
                    $(idyear).val(dateyear);

            */

            $(this).addClass("haschanged");

            if ($(this).closest(".subformArea") != null)
            {
                $(this).closest(".subformArea").addClass("haschanged");
            }

            var target = evt.target;

            if (target.id == "dateTimePicker")
            {
                $(target).find("input").attr("value", $(target).find("input").val());

                if ($(target).find("input[name='eventdate']").length > 0) {
                    var idyear = $("#EColEventForm input[name='identificationyear']");

                    if (idyear.length > 0) {
                        var fromdate = $(target).find("input").val().replace(" 00:00:00", "").split("/");
                        var dateyear = new Date(fromdate[2], fromdate[1] - 1, fromdate[0]).getFullYear();
                        idyear.val(dateyear);
                        $(idyear).attr("value", "01/01/" + dateyear);
                        that.model.attributes.identificationyear = new Date(fromdate[2], 0, 1, 1);
                    }
                }
            }

        }
    });
    return NsForm;

}));