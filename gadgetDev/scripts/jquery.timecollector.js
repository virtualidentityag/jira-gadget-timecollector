/**
 * @name          timecollector
 * @version       1.0
 * @lastmodified  2015-01-18
 * @package       html-css-js
 * @subpackage    jQuery plugin
 * @author        Jan Rembold, VI
 *
 * based on: http://jqueryboilerplate.com/
 */

(function ($, window, document, undefined) {
    'use strict';

    var pluginName = 'timecollector',
        defaults = {};

    // The actual plugin constructor
    function Plugin(element, options){
        this.$element = $(element);
        this.options = $.extend({}, defaults, options) ;
    }

    // methods
    var methods = {
        init: function(jiraIssues){

            this.options.jiraIssues = jiraIssues;

            // set default data
            this.setDefaultData();

            // sum all tickets
            this.sumUpIssues();

            // prepare data for chart
            this.prepareData();

            // sort data
            this.sortData();
            this.log('formatted data', this.data);

            // render template
            this.$element.html(this.options.templates.timeCollector(this.data));

            // init gadet tabs
            this.initTabs();

            // konami this
            this.konami();

        },

        setDefaultData: function(){

            // set fields to calculate statistics
            var defaults = ['total'];
            var retainerField = this.options.gadget.getPref('retainerField') || '';
            if(retainerField && retainerField !== ''){
                defaults = ['total', 'retainer'];
            }
            var calculateFieldsPref = this.options.gadget.getPref('calculateField') || '';
            if(calculateFieldsPref && calculateFieldsPref !== '' && calculateFieldsPref !== 'false') {
                this.options.grabFields = $.merge(defaults, calculateFieldsPref.split('|'));
            } else {
                this.options.grabFields = defaults;
            }

            // prepare data object
            this.data = {
                title: this.options.gadget.getPref('titleField'),
                filterUrl: gadgetHelper.baseUrl + '/issues/?filter=' + this.options.gadget.getPref('filterId').split('-')[1],
                ticketCount: this.options.jiraIssues.total,
                activateComponentTab: (this.options.gadget.getPref('showField') === 'component'),
                activateVersionTab: (this.options.gadget.getPref('showField') === 'version'),
                activateTicketTab: (this.options.gadget.getPref('showField') === 'ticket')
            };
        },

        sumUpIssues: function(){
            var self = this;
            this.log('all issues', this.options.jiraIssues.issues);

            $.each(self.options.jiraIssues.issues, function(i, issue){
                $.each(self.options.grabFields, function(j, fieldName){

                    if(fieldName === 'tickets') {
                        self.addIssueTimesToFieldItem(fieldName, issue.key+' '+issue.fields.summary, issue);
                    } else {
                        var elements;
                        if(issue.fields[fieldName] && issue.fields[fieldName].length > 0) {
                            elements = issue.fields[fieldName];
                        } else {
                            elements = [{name: 'Keine Zuordnung'}];
                        }

                        $.each(elements, function(k, element){
                            self.addIssueTimesToFieldItem(fieldName, element.name, issue);
                        });
                    }

                });
            });
        },

        prepareData: function(){
            var self = this;
            var cssWidthTo100Percent = 75;
            var maxTotalPercent = {};

            // calculate sums and set maximum total percentages
            $.each(self.options.grabFields, function(i, fieldName){
                $.each(self.data[fieldName], function(j, bar){

                    // set default values
                    if(fieldName === 'retainer') {
                        bar.retainer                = self.parseInt(self.options.gadget.getPref('retainerField'))*8*60*60;
                        bar.summedOriginalEstimate  = self.getWorkingDays(bar.retainer);
                        bar.summedTimeSpent         = self.getWorkingDays(bar.originalEstimate);
                        bar.summedRemainingEstimate = self.getWorkingDays((bar.timeSpent + bar.remainingEstimate) - bar.originalEstimate);
                    } else {
                        bar.summedOriginalEstimate  = self.getWorkingDays(bar.originalEstimate);
                        bar.summedTimeSpent         = self.getWorkingDays(bar.timeSpent);
                        bar.summedRemainingEstimate = self.getWorkingDays(bar.remainingEstimate);
                    }
                    bar.total                       = self.getWorkingDays(bar.timeSpent + bar.remainingEstimate);
                    bar.totalPercent                = bar.summedOriginalEstimate > 0 ? Math.round(bar.total / bar.summedOriginalEstimate * 100) : 100;

                    if(typeof(maxTotalPercent[fieldName]) === 'undefined' || maxTotalPercent[fieldName] < bar.totalPercent) {
                        maxTotalPercent[fieldName] = bar.totalPercent;
                    }

                });
            });

            $.each(self.options.grabFields, function(i, fieldName){
                $.each(self.data[fieldName], function(j, bar){

                    // calculate length of total bar (grey)
                    if(bar.totalPercent <= 100) {

                        // set bar width for all items up to 100% relative to 100% marker (e.g. 75% of CSS width)
                        bar.totalBarWidth = (bar.totalPercent / 100) * cssWidthTo100Percent;

                        // calculate length of progress bar relative to total bar width
                        bar.totalProgressWidth = bar.total > 0 ? (bar.summedTimeSpent / bar.total * 100) : 100;

                        // color calculation
                        if(bar.summedOriginalEstimate === 0) {
                            bar.state = 'purple';
                        }

                    } else {

                        // set bar width for all items over 100% relative to maximum percentage
                        // inside the rest (right side) of 100% marker (e.g. 25% of CSS width)
                        // plus width of 100% marker (e.g. 75% of CSS width)
                        bar.totalBarWidth = ((bar.totalPercent / maxTotalPercent[fieldName]) * (100 - cssWidthTo100Percent)) + cssWidthTo100Percent;

                        // calculate relative percentage from total bar to 100% marker
                        // set progress bar width relative to 100% marker
                        // 0                   75    82   100%
                        // |-------------------|-----*    |
                        //                    91,5%
                        var relativeMarkerPercentage = cssWidthTo100Percent / bar.totalBarWidth * 100;

                        // calculate length of progress bar
                        if(bar.summedTimeSpent <= bar.summedOriginalEstimate) {

                            bar.totalProgressWidth = bar.summedTimeSpent / bar.summedOriginalEstimate * relativeMarkerPercentage;

                            // color calculation
                            bar.state = 'orange';

                        } else {

                            var timeOverBudget = bar.summedTimeSpent - bar.summedOriginalEstimate;
                            var restBudget = bar.total - bar.summedOriginalEstimate;

                            if(restBudget > 0) {

                                // total progress width relative to over budget bar
                                bar.totalProgressWidth = ((100 - relativeMarkerPercentage) * timeOverBudget / restBudget) + relativeMarkerPercentage;

                            } else {

                                // no time left
                                bar.totalProgressWidth = 100;

                            }

                            // color calculation
                            bar.state = 'red';

                        }
                    }

                  if(fieldName === 'retainer'){
                    bar.shortDesc = '<span class="sum">&sum;</span> '+bar.total+' TW';
                    bar.shortDesc += bar.summedOriginalEstimate > 0 ? ' (Projektvolumen: '+bar.summedOriginalEstimate+' TW)' : ' (Ohne Projektvolumen)';

                    bar.longDesc = bar.summedTimeSpent+' TW geschätzte Aufwände';
                    bar.longDesc += bar.summedRemainingEstimate > 0 ? ' + '+bar.summedRemainingEstimate+' TW zusätzliche Aufwände' : '';
                    bar.longDesc += bar.summedOriginalEstimate > 0 ? ' (Projektvolumen: '+bar.summedOriginalEstimate+' TW)' : ' (Ohne Projektvolumen)';
                  } else {
                    // set short and long descriptions
                    bar.shortDesc = '<span class="sum">&sum;</span> '+bar.total+' TW';
                    bar.shortDesc += bar.summedOriginalEstimate > 0 ? ' (Schätzung: '+bar.summedOriginalEstimate+' TW)' : ' (Ohne Schätzung)';

                    bar.longDesc = bar.summedTimeSpent+' TW geleistet';
                    bar.longDesc += bar.summedRemainingEstimate > 0 ? ' + '+bar.summedRemainingEstimate+' TW verbleibend' : '';
                    bar.longDesc += bar.summedOriginalEstimate > 0 ? ' (Schätzung: '+bar.summedOriginalEstimate+' TW)' : ' (Ohne Schätzung)';

                    // no estimation entries
                    if(bar.summedOriginalEstimate == 0) {
                        if(bar.summedTimeSpent > 0) {

                            // worklogs are available
                            bar.totalPercent = null;

                        } else {

                            // no worklogs at all
                            bar.totalPercent = 0;
                            bar.totalBarWidth = cssWidthTo100Percent;
                            bar.totalProgressWidth = 0;
                            bar.nologs = true;
                            bar.shortDesc = '';
                            bar.longDesc = '';
                            bar.state = 'transparent';

                        }
                    }

                    // estimation exists but total is 0 - extremly rare use case
                    if(bar.summedOriginalEstimate > 0 && bar.total === 0) {
                        bar.totalBarWidth = cssWidthTo100Percent;
                        bar.totalProgressWidth = 0;
                        bar.state = 'transparent';
                    }
                });
            });

            // set total fieldname
            this.data.total[0].fieldItemName = 'Total';

            // set retainer fieldname
            if(this.data.retainer){
              this.data.retainer[0].fieldItemName = 'Retainer/ Projekt';
            }
        },

        sortData: function(){
            var self = this;

            $.each(this.options.grabFields, function(i, field){
                self.data[field].sort(function(a,b) {
                    switch(self.options.gadget.getPref('sortField')) {
                        case 'largest-component':
                            return b.total - a.total; // largest component first

                        case 'biggest-disaster':
                            return b.totalPercent - a.totalPercent; // biggest disaster first

                        case 'best-result':
                            return a.totalPercent - b.totalPercent; // biggest success first

                        case 'name-ascending':
                            if (a.fieldItemName > b.fieldItemName) return 1;
                            if (a.fieldItemName < b.fieldItemName) return -1;
                            return 0;

                        case 'name-descending':
                            if (a.fieldItemName < b.fieldItemName) return 1;
                            if (a.fieldItemName > b.fieldItemName) return -1;
                            return 0;
                    }
                });
            });

        },

        addIssueTimesToFieldItem: function(fieldName, name, issue){
            if(typeof(this.data[fieldName]) === 'undefined') {
                this.data[fieldName] = [];
            }

            var key = -1;
            $.each(this.data[fieldName], function(i, element){
                if(element.fieldItemName == name) {
                    key = i;
                    return false;
                }
            });

            if(key > -1) {
                this.data[fieldName][key]['originalEstimate']  += this.getNumber(issue.fields.timeoriginalestimate);
                this.data[fieldName][key]['remainingEstimate'] += this.getNumber(issue.fields.timeestimate);
                this.data[fieldName][key]['timeSpent']         += this.getNumber(issue.fields.timespent);
            } else {
                var data = {
                    fieldItemName:     name,
                    originalEstimate:  this.getNumber(issue.fields.timeoriginalestimate),
                    remainingEstimate: this.getNumber(issue.fields.timeestimate),
                    timeSpent:         this.getNumber(issue.fields.timespent)
                };

                if(fieldName === 'tickets') {
                    data.fieldItemLink = gadgetHelper.baseUrl + '/browse/' + issue.key;
                }

                this.data[fieldName].push(data);
            }


        },

        getNumber: function(time){
            if(typeof(time) !== 'number') {
                return 0;
            }
            return time;
        },

        getWorkingDays: function(seconds){
            var days = seconds / (60 * 60 * 8);
            return parseFloat((parseInt(days) == days) ? days : days.toFixed(2));
        },

        initTabs: function(){
            var self = this;
            this.$element.find('.tabs > a').on('click', function(e){
                e.preventDefault();
                if(!$(this).hasClass('active')) {
                    self.$element.find('.tabs > a.active').removeClass('active');
                    $(this).addClass('active');

                    self.$element.find('.tab-content.active').removeClass('active');
                    self.$element.find($(this).attr('href')).addClass('active');

                    gadgets.window.adjustHeight();
                }
            });
        },

        konami: function(){
            var kkeys = [], konami = "38,38,40,40,37,39,37,39,66,65";
            $(document).on('keydown.konami', function(e) {
                kkeys.push( e.keyCode );
                if ( kkeys.toString().indexOf( konami ) >= 0 ) {
                    $(document).off('keydown.konami');
                    $('.bar .total').each(function(){
                        var random = Math.floor(Math.random() * (75 - 60)) + 60;
                        $(this).animate({'width': random+'%'}, 1200, function(){
                            $(this).parent().next('.percentage').text(random+'%');
                        });
                    });
                    $('.bar .progress').each(function(){
                        var random = Math.floor(Math.random() * (99 - 50)) + 50;
                        $(this).animate({'width': random+'%'}, 1500, function(){
                            $('.bar').attr('class', 'bar');
                        });
                    });
                    $('.bar .shortdesc').text('(ツ)');
                    $('.bar .longdesc').text('┗(＾0＾)┓');
                }
            });
        },

        log: function(message, obj){
            if (typeof console === 'undefined' || typeof console.log === 'undefined') {
                console = {};
                console.log = console.dir = function(){};
            }

            if(this.options.gadget.getPref('debugField') === 'log') {
                console.log(message);
                if(obj !== undefined) {
                    console.dir(obj);
                }
            }
        }
    };

    $.extend(Plugin.prototype, methods);
    $.fn[pluginName] = function(options){
        return this.each(function(){
            if(!$.data(this, 'plugin_' + pluginName)){
                $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);

