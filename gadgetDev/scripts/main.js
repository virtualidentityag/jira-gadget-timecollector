'use strict';
/**
 * User: david.losert
 * Date: 07.01.2015
 * Time: 14:55
 */
(function () {
    window.TimeCollector = TimeCollector || {};
    var $ = AJS.$; // Jquery Shortcut in our own namespace
    var gadget = initGadget();

    function initGadget() {
        return AJS.Gadget({
            baseUrl: atlassian.util.getRendererBaseUrl(),
            useOAuth: '/rest/gadget/1.0/currentUser',
            config: {
                descriptor: function (args) {
                    var filterSearchField = AJS.gadget.fields.filterPicker(gadget, 'filterId');
                    //var filterSearchField = AJS.gadget.fields.projectOrFilterPicker(gadget, "filterId");
                    var filterId = gadget.getPref("filterId");
                    if(filterId) {
                        for( var i = 0; i < args.filter.options.length; i++) {
                            for( var j = 0; j < args.filter.options[i].group.options.length; j++) {
                                if(args.filter.options[i].group.options[j].value == filterId) {
                                    gadget.projectOrFilterName = args.filter.options[i].group.options[j].label;
                                    break;
                                }
                            }
                            if(gadget.projectOrFilterName != "" ) {
                                break;
                            }
                        }
                    }

                    var titleField = {
                        id: "titleField",
                        userpref: "titleField",
                        class: "titleField",
                        label: "Titel",
                        description: "Dieser Titel wird überhalb des Gadgets angezeigt",
                        type: "text",
                        value: gadget.getPref("titleField")
                    };

                    var retainerField = {
                        id: "retainerField",
                        userpref: "retainerField",
                        class: "retainerField",
                        label: "Retainer Budget",
                        description: "Hier kann optional ein Retainer Budget hinterlegt werden. (Angabe in TW)",
                        type: "text",
                        value: gadget.getPref("retainerField")
                    };

                    var sortField = {
                        id: "sortField",
                        userpref: "sortField",
                        label: "Sortieren nach",
                        description: "",
                        type: "select",
                        selected: gadget.getPref("sortField"),
                        options:[
                            {
                                label: "Umfangreichste Elemente in TW",
                                value: "largest-component"
                            },
                            {
                                label: "Größte Verfehlungen in %",
                                value: "biggest-disaster"
                            },
                            {
                                label: "Beste Zielerreichung in %",
                                value: "best-result"
                            },
                            {
                                label: "Name - Aufsteigend",
                                value: "name-ascending"
                            },
                            {
                                label: "Name - Absteigend",
                                value: "name-descending"
                            }
                        ]
                    };

                    var calculateFieldsPref = gadget.getPref('calculateField') || '';
                    var calculateFields = calculateFieldsPref.split('|');
                    var calculateField = {
                        id: "calculateField",
                        userpref: "calculateField",
                        label: "Statistiken anzeigen",
                        description: "",
                        type: "checkbox",
                        options:[
                            {
                                label: "Komponenten",
                                value: "components",
                                selected: (calculateFields.indexOf('components') > -1)
                            },
                            {
                                label: "Versionen",
                                value: "fixVersions",
                                selected: (calculateFields.indexOf('fixVersions') > -1)
                            },
                            {
                                label: "Tickets",
                                value: "tickets",
                                selected: (calculateFields.indexOf('tickets') > -1)
                            }
                        ]
                    };
                    var showField = {
                        id: "showField",
                        userpref: "showField",
                        label: "Tab anzeigen",
                        description: "",
                        type: "select",
                        selected: gadget.getPref("showField") ? gadget.getPref("showField") : 'component',
                        options:[
                            {
                                label: "Komponenten",
                                value: "component"
                            },
                            {
                                label: "Versionen",
                                value: "version"
                            },
                            {
                                label: "Tickets",
                                value: "ticket"
                            },
                            {
                                label: "Kein Tab",
                                value: "nothing"
                            }
                        ]
                    };
                    var debugField = {
                        id: "debugField",
                        userpref: "debugField",
                        label: "Debug",
                        description: "",
                        type: "select",
                        selected: gadget.getPref("debugField"),
                        options:[
                            {
                                label: "Keine Ausgaben",
                                value: "none"
                            },
                            {
                                label: "Log",
                                value: "log"
                            }
                        ]
                    };

                    return {
                        fields: [
                            titleField,
                            retainerField,
                            filterSearchField,
                            calculateField,
                            showField,
                            sortField,
                            debugField,
                            AJS.gadget.fields.nowConfigured()
                        ]
                    };
                },
                args: [
                    {
                        key: 'filter',
                        ajaxOptions: '/rest/gadget/1.0/filtersAndProjects'
                    }
                ]
            },
            view: {
                enableReload: true,
                onResizeAdjustHeight: true,
                template: function (args) {

                    $('#view').timecollector({
                        gadget: this,
                        templates: TimeCollector.templates
                    }).data('plugin_timecollector').init(args.jiraIssues);

                },
                args: [
                    {
                        key: "jiraIssues",
                        ajaxOptions: function () {
                            var filterId = this.getPref('filterId').split('-')[1];

                            // limit query fields
                            var requiredFields = ['fixVersions', 'components', 'timeestimate', 'timeoriginalestimate', 'timespent', 'summary'];
                            var url = '/rest/api/2/search?jql=filter=' + filterId + '&fields=' + requiredFields.join(',')+'&maxResults=2000';

                            // or grab all
                            //var url = '/rest/api/2/search?jql=filter=' + filterId + '&fields=*all&maxResults=2000';

                            return {
                                url: url,
                                contentType: 'application/json',
                                type: "GET"
                            }
                        }
                    }
                ]
            }
        });
    }
})();