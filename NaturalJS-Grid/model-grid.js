/*define([
    'jquery',
    'underscore',
    'backbone',
    'backgrid',
    'backbone-paginator',
    'backgrid-paginator',
    './model-col-generator',
],
*/

(function (root, factory) {

    // Set up Backbone appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {
        define(['jquery',
        'underscore',
        'backbone',
        'backgrid',
        'backbone-paginator',
        'backgrid-paginator',
        './model-col-generator', ],
        function ($, _, Backbone, Backgrid, PageColl, Paginator, colGene, exports) {
        // Export global even in AMD case in case this script is loaded with
        // others that may still expect a global Backbone.
        var Retour = factory(root, exports, $, _, Backbone, Backgrid, PageColl, Paginator, colGene);
        return Retour;
    });

        // Next for Node.js or CommonJS. jQuery may not be needed as a module.
    } else if (typeof exports !== 'undefined') {
        var $ = require('jquery');
        var _ = require('underscore');
        var Backbone = require('backbone');
        var Backgrid = require('backgrid');
        var PageColl = require('backbone.paginator');
        var Paginator = require('backgrid-paginator');
        var colGene = require('./model-col-generator');
        module.exports = factory(root, exports, $, _, Backbone, Backgrid, PageColl, Paginator, colGene);

        // Finally, as a browser global.
    } else {
        //TODO
        //root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
    }

}
(this, function (root, NsGrid, $, _, Backbone, Backgrid, PageColl, Paginator, colGene) {
    'use strict';
    NsGrid = Backbone.Model.extend({


        /*===================================
        =            Grid module            =
        ===================================*/

        init: false,
        pagingServerSide: true,
        coll: false,
        totalElement: null,
        filterCriteria: {},
        RowType: null,

        initialize: function (options) {
            var _this = this;
            if (options.com) {
                this.com = options.com;
                this.com.addModule(this);
            }
            this.RowClickedInfo = options.rowClicked;
            this.rowDblClickedInfo = options.rowDblClicked;
            this.onceFetched = options.onceFetched;
            if (options.rowClicked) {
                var clickFunction = options.rowClicked.clickFunction
                this.RowType = Backgrid.Row.extend({
                    events: {
                        "click": "onClick",
                        'dblclick': 'onDblClicked',
                    },
                    onClick: function () {
                        _this.interaction('rowClicked', {
                            model: this.model,
                            //parent: options.rowClicked.parent
                        });

                    },
                    onDblClicked: function () {
                        _this.interaction('rowDblClicked', {
                            model: this.model,
                            //parent: options.rowClicked.parent
                        });

                    }
                });
                Backbone.on("rowclicked", function (options) {
                    clickFunction(options);
                });
            }

            else {
                if (options.row) {
                    this.RowType = options.row;
                } else {
                    this.RowType = Backgrid.Row;
                }

            }

            this.searchPrefix = options.searchPrefix || '';

            this.sortCriteria = options.sortCriteria || {};
            this.name = options.name || 'default';
            //this.channel = options.channel;
            //this.radio = Radio.channel(this.channel);

            if (options.totalElement) {
                this.totalElement = options.totalElement;
            }
            //this.radio.comply(this.channel + ':grid:update', this.update, this);

            this.url = options.url;
            this.pageSize = options.pageSize;

            this.pagingServerSide = options.pagingServerSide;
            if (options.columns) {
                this.columns = options.columns;
            } else {
                this.colGene = new colGene({ url: this.url + 'getFields?name=' + this.name, paginable: this.pagingServerSide, checkedColl: options.checkedColl });
                this.columns = this.colGene.columns;
            }

            if (options.collection) {
                this.collection = options.collection;
                this.coll = true;
            }
            else {
                this.initCollectionFromServer();
            }
            if (this.pagingServerSide) {//&& options.columns) {
                this.setHeaderCell();
            }
            if (options.filterCriteria) {
                this.filterCriteria = options.filterCriteria;
            }

            this.initGrid();
            this.eventHandler();
        },

        setHeaderCell: function () {
            var hc = Backgrid.HeaderCell.extend({
                onClick: function (e) {
                    e.preventDefault();

                    var that = this;
                    var column = this.column;
                    var collection = this.collection;
                    var sortCriteria = (collection.sortCriteria && typeof collection.sortCriteria.id === 'undefined') ? collection.sortCriteria : {};
                    switch (column.get('direction')) {
                        case null:
                            column.set('direction', 'ascending');
                            sortCriteria[column.get('name')] = 'asc';
                            break;
                        case 'ascending':
                            column.set('direction', 'descending');
                            sortCriteria[column.get('name')] = 'desc';
                            break;
                        case 'descending':
                            column.set('direction', null);
                            delete sortCriteria[column.get('name')];
                            break;
                        default:
                            break;
                    }
                    var tmp = this.column.attributes.name;
                    if (!Object.keys(sortCriteria).length > 0)
                        collection.sortCriteria[tmp] = 'asc';
                    collection.fetch({ reset: true });
                },
            });
            for (var i = 0; i < this.columns.length; i++) {
                this.columns[i].headerCell = hc;
            };
        },

        initCollectionFromServer: function () {
            if (this.pagingServerSide) {
                this.initCollectionPaginable();
            } else if (this.pageSize) {
                this.initCollectionPaginableClient();
            }
            else {
                this.initCollectionNotPaginable();
            }
        },


        initCollectionPaginable: function () {
            var ctx = this;
            var PageCollection = PageColl.extend({
                sortCriteria: ctx.sortCriteria,
                url: this.url + ctx.searchPrefix + '?name=' + this.name,
                mode: 'server',
                state: {
                    pageSize: this.pageSize
                },
                queryParams: {
                    offset: function () { return (this.state.currentPage - 1) * this.state.pageSize; },
                    criteria: function () {

                        return JSON.stringify(this.searchCriteria);
                    },
                    order_by: function () {
                        var criteria = [];
                        for (var crit in this.sortCriteria) {
                            criteria.push(crit + ':' + this.sortCriteria[crit]);
                        }
                        return JSON.stringify(criteria);
                    },
                },
                fetch: function (options) {
                    ctx.fetchingCollection(options);
                    var params = {
                        'page': this.state.currentPage,
                        'per_page': this.state.pageSize,
                        'offset': this.queryParams.offset.call(this),
                        'order_by': this.queryParams.order_by.call(this),
                        'criteria': this.queryParams.criteria.call(this),
                    };
                    ctx.init = true;
                    options['success'] = function () {
                        if (ctx.onceFetched) {
                            ctx.onceFetched(params);
                        }
                        ctx.collectionFetched();
                    };
                    PageColl.prototype.fetch.call(this, options);
                }

            });

            this.collection = new PageCollection();

            this.listenTo(this.collection, "reset", this.affectTotalRecords);
        },

        initCollectionPaginableClient: function () {
            var _this = this;
            var PageCollection = PageColl.extend({
                url: this.url + this.sear + _this.searchPrefix + '?name=' + this.name,
                mode: 'client',
                state: {
                    pageSize: this.pageSize
                },
                queryParams: {
                    order: function () { },
                    criteria: function () {
                        return JSON.stringify(this.searchCriteria);
                    },
                },
            });

            this.collection = new PageCollection();
        },


        initCollectionNotPaginable: function () {
            _this = this;
            this.collection = new Backbone.Collection.extend({
                url: this.url + _this.searchPrefix + '?name=' + this.name,
            });
        },


        initGrid: function (options) {
            var tmp = JSON.stringify({ criteria: null });

            this.grid = new Backgrid.Grid({
                row: this.RowType,
                columns: this.columns,
                collection: this.collection
            });

            /* TESTING
            var Model = Backbone.Model.extend({});
            var Collection = Backbone.Collection.extend({ model: Model });
            var poolcolumn = { name: "IsPool", label: "IsPool", cell: "string" };

            this.grid.insertColumn(poolcolumn);

            */

            if (!this.coll) {
                this.collection.searchCriteria = this.filterCriteria;
                this.fetchCollection({ init: true });
            }
        },

        collectionFetched: function (options) {

            this.affectTotalRecords();
            if (!jQuery.isEmptyObject(this.sortCriteria)) {
                for (var key in this.sortCriteria) {
                    $('th.' + key).addClass(this.sortCriteria[key]);
                }

            }
            var $table = this.grid.$el;
            /*
            $table.floatThead({
                scrollContainer: function ($table) {
                    return $table.closest('.wrapper');
                }
            });
            */
            this.CollectionLoaded(options);
        },
        CollectionLoaded: function (options) {

        },
        update: function (args) {
            if (this.pageSize) {
                this.grid.collection.state.currentPage = 1;
                this.grid.collection.searchCriteria = args.filters;
                this.fetchCollection({ init: false });
            }
            else {
                this.filterCriteria = JSON.stringify(args.filters);
                this.fetchCollection({ init: false });
            }
        },
        fetchCollection: function (options) {
            var _this = this;
            if (this.filterCriteria != null) {
                this.grid.collection.fetch({ reset: true, data: { 'criteria': this.filterCriteria }, success: function () { _this.collectionFetched(options); } });
            }
            else {
                this.grid.collection.fetch({ reset: true, success: function () { _this.collectionFetched(options); } });
            }
        },
        displayGrid: function () {
            return this.grid.render().el;
        },


        displayPaginator: function () {
            this.paginator = new Backgrid.Extension.Paginator({
                collection: this.collection
            });
            var resultat = this.paginator.render().el;


            return resultat;
        },

        affectTotalRecords: function () {
            if (this.totalElement != null && this.paginator) {
                $('#' + this.totalElement).html(this.paginator.collection.state.totalRecords);
            }

        },

        setTotal: function () {
            this.total = this.paginator.state;
        },

        getTotal: function () {
            this.paginator.render();
            return this.paginator.collection.state.totalRecords;

        },

        eventHandler: function () {
            var self = this;
            this.grid.collection.on('backgrid:edited', function (model) {
                model.save({ patch: model.changed });
            })
        },

        fetchingCollection: function (options) {
            // to be extended

        },

        Collection: function (options) {
            // to be extended

        },

        action: function (action, params) {
            switch (action) {
                case 'focus':
                    this.hilight(params);
                    break;
                case 'selection':
                    this.selectOne(params);
                    break;
                case 'selectionMultiple':
                    this.selectMultiple(params);
                    break;
                case 'resetAll':
                    this.clearAll();
                    break;
                case 'filter':
                    this.filter(params);
                    break;
                case 'rowClicked':
                    if (this.RowClickedInfo) {
                        this.RowClickedInfo.clickFunction(params, this.RowClickedInfo.parent);
                    }
                    break;
                case 'rowDblClicked':
                    if (this.rowDblClickedInfo) {
                        this.rowDblClickedInfo.clickFunction(params, this.rowDblClickedInfo.parent);
                    }
                    break;
                default:
                    console.warn('verify the action name');
                    break;
            }
        },



        interaction: function (action, params) {
            if (this.com) {
                this.com.action(action, params);
            } else {
                this.action(action, params);
            }
        },

        hilight: function () {
        },

        clearAll: function () {
            var coll = new Backbone.Collection();
            coll.reset(this.grid.collection.models);
            for (var i = coll.models.length - 1; i >= 0; i--) {
                coll.models[i].attributes.import = false;
            };
            //to do : iterrate only on checked elements list of (imports == true)
        },

        selectOne: function (id) {
            var model_id = id;
            var coll = new Backbone.Collection();
            coll.reset(this.grid.collection.models);

            model_id = parseInt(model_id);
            var mod = coll.findWhere({ id: model_id });

            if (mod.get('import')) {
                mod.set('import', false);
                mod.trigger("backgrid:select", mod, false);
            } else {
                mod.set('import', true);
                mod.trigger("backgrid:select", mod, true);
            }
        },

        selectMultiple: function (ids) {
            var model_ids = ids, self = this, mod;

            for (var i = 0; i < model_ids.length; i++) {
                mod = this.grid.collection.findWhere({ id: model_ids[i] });
                mod.set('import', true);
                mod.trigger("backgrid:select", mod, true);
            };
        },

        checkSelect: function (e) {
            var id = $(e.target).parent().parent().find('td').html();
            this.interaction('selection', id);
        },

        checkSelectAll: function (e) {
            var ids = _.pluck(this.grid.collection.models, 'id');
            if (!$(e.target).is(':checked')) {
                this.interaction('resetAll', ids);
            } else {
                this.interaction('selectionMultiple', ids);
            }
        },

        focus: function (e) {
            if ($(e.target).is('td')) {
                var tr = $(e.target).parent();
                var id = tr.find('td').first().text();
                this.interaction('focus', id);
            }
        },


        filter: function (args) {
            if (this.coll) {
                // Client Grid Management
                this.grid.collection = args;
                this.grid.body.collection = args;
                this.grid.body.refresh();
            }
            else {
                // Server Grid Management
                this.update({ filters: args });
            }
        }
    });
    return NsGrid;

}));

