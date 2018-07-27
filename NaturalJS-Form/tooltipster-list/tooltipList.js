(function ( $ ) {

    $.fn.tooltipList = function(options) {

        //  -----------------------------------------------
        //  Settings
        //
        this.settings = $.extend({
            //  Default position : top
            position : 'top',
            //  Default animation : fade
            animation: 'fade',
            //  By default when we click out of tooltip, it close itself automaticly
            autoClose: true,
            //  Allow to add a class to the tooltipster element
            tooltipClass : 'tooltipList',
            //  We create a default option with negative value
            availableOptions : [{
                label   : 'default option',
                val     : -1
            }],

            //  Callbacks

            //  We set an useless default li click event callback
            liClickEvent: function (liValue, origin, tooltip) {

            },
            searchEnter: function (searchedValue) {

            },
            searchPlaceholder : ""
        }, options);

        //  -----------------------------------------------
        //  Bind li click event and run specified callback
        //
        this.bindLiClick = function() {
            this.tooltip.find('li').bind('click', $.proxy(function(e) {
                //  Run specified callback
                this.settings.liClickEvent($(e.target).data('value'), this.origin, this.tooltip);
            }, this));
        };

        this.bindSearchEnter = function () {
            this.tooltip.find('input').bind('keyup', $.proxy(function (e) {
                if (e.which == 13) {
                    this.settings.searchEnter($(e.target).val());
                }
            }, this));
        };

        //  -----------------------------------------------
        //  Update List function when input value changed
        //
        this.updateLiList = function(inputValue, origin, tooltip) {
            //  When input text value change (we used keyup because we change the list in real time)
            //  We change list options

            //  First we clear the last list
            tooltip.find('ul').html('');

            $.map(this.settings.availableOptions, $.proxy(function (val, index) {
                var icone = '';
                if (val.icon) {
                    icone += '<span class="reneco ' + val.icon + ' style="font-size:100px;line-height:120px "></span>&nbsp&nbsp';
                }
                if (val.label.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0) {
                    //  Append element on the list
                    tooltip.find('ul').append('<li data-value="' + val.val + '" >' + icone + val.label +  '</li>');
                }
            }, this));

            this.bindLiClick();
        };

        //  -----------------------------------------------
        //  Tooltip HYML element
        //
        this.tooltipHTMLContent = $.proxy(function() {
            var html = '';

            $.map(this.settings.availableOptions, $.proxy(function(val, index) {
                html += '<li data-value="' + val.val + '" >' + val.label + '</li>';
            }, this));

            return $('\
                <div class="">\
                    <input type="text" />\
                    <i class="reneco reneco-search"></i>\
                    <br /> \
                    <ul>' +  html + '</ul>\
                </div>\
            ')
        }, this);

        //  -----------------------------------------------
        //  Create tooltip with tooltipster library
        //
        $(this).tooltipster({
            //  Plugin HTML content
            content: this.tooltipHTMLContent ,
            //  animation
            animation : this.settings.animation,
            //  position
            position : this.settings.position,
            //  autoclose options
            autoClose : this.settings.autoClose,
            //  Allow HTML content
            contentAsHTML: true,
            //  Allow interative tooltip (for search functionnality)
            interactive: true,
            //  Add class
            theme: 'tooltipster-default ' + this.settings.tooltipClass,

            //  Callbacks

            functionReady : $.proxy(function(origin, tooltip) {

                this.origin     = origin;
                this.tooltip    = tooltip;

                $(tooltip).find('input').bind('keyup', $.proxy(function(e) {
                    this.updateLiList( $(e.target).val(), origin, tooltip );
                }, this));

                $(tooltip).find('input').attr("placeholder", this.settings.searchPlaceholder);

                this.updateLiList("", origin, tooltip);
                this.bindSearchEnter();

                $(tooltip).find('input').focus();
            }, this),

            functionAfter: function (origin, tooltip) {
                // When the mouse move out of the tooltip we destroy otherwise the tooltip is trigger when we hover the button
                console.log($(origin), $(origin).tooltipster);
                //if ($(origin).length > 0 && $(origin).tooltipster)
                //    $(origin).tooltipster('destroy');
            }

        });

        //  Show tooltipster
        $(this).tooltipster('show');
    };

}( jQuery ));
