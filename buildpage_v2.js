/*global $ fetch loadchart DATA_DISPLAY jQuery*/
(function (global) {
    'use strict';

    const $body = $('#form-body');
    const $data_body = $('#data-body');
    const ID = "_id";

    //functions that have to be delared without const
    let getModal;

    //general use functions
    const random = function () {
        //makes a random string of numbers
        return Math.random().toString().replace(/0\./, "");
    };

    const wait = function (t) {
        return new Promise(function (resolve) {
            setTimeout(resolve, t);
        });
    };

    const waitForFinalEvent = function (callback, ms, uniqueId) {
        let timers = {};

        return function (e) {
            if (!uniqueId) {
                uniqueId = "Don't call this twice without a uniqueId";
                console.warn(uniqueId);
            }

            if (timers[uniqueId]) {
                clearTimeout(timers[uniqueId]);
            }
            timers[uniqueId] = setTimeout(() => callback(e), ms);
        };
    };

    const createTableBody = function (opts) {
        //set default opts
        const rand_wait = random();
        opts = opts || {};
        opts.edit = opts.edit || false;
        opts.edit_func = opts.edit_func || console.log;
        opts.short = opts.short || false;
        opts.short_title = opts.short_title || "";

        return function (entry) {

            //verify the entry has all the parts needed or set defaults
            entry.pdx_id = entry.pdx_id || "N/A";
            entry.entry_name = entry.entry_name || "N/A";
            entry.description = entry.description || "N/A";
            entry.entry_metadata = entry.entry_metadata || {};
            entry.entry_metadata.user = entry.entry_metadata.user || "N/A";
            entry.entry_data = entry.entry_data || [];

            //create actual components
            const $holder = $('<div>');
            const $listHold = $('<ul>', {
                class: "list-group"
            });

            // add header
            if (opts.short) {
                // short title
                $holder.append($('<p>', {
                    class: 'lead',
                    text: entry.pdx_id + ": " + opts.short_title
                }));
            } else {
                //title
                $holder.append($('<p>', {
                    class: 'h5',
                    text: entry.pdx_id + ': ' + entry.entry_name
                }));

                //description
                $holder.append($('<p>', {
                    class: 'font-weight-light text-muted',
                    html: entry.description + '<br />-' + entry.entry_metadata.user
                }));
            }

            //create actual list components
            $listHold.appendTo($holder);
            entry.entry_data.forEach(function (enter, index) {
                const $listItem = $('<li>', {
                    class: "list-group-item"
                });
                const rand = random();

                if (!opts.edit) {
                    // simple list item
                    $listItem
                        .append($('<strong>', {
                            html: enter.key
                        }))
                        .append($('<span>&emsp;' + enter.value + '</span>'));
                } else {
                    // complex list item
                    $listItem
                        .append($('<div>', {
                            class: "form-group row"
                        })
                            .append($('<label>', {
                                text: enter.key,
                                for: 'list-item-' + rand,
                                class: 'col-sm-3 col-form-label'
                            }))
                            .append($('<div>', {
                                class: "col-sm-9"
                            })
                                .append($('<input>', {
                                    class: 'form-control',
                                    id: 'list-item-' + rand,
                                    value: enter.value
                                }).on('keyup', waitForFinalEvent(function (evt) {
                                    opts.edit_func({
                                        id: entry[ID],
                                        key: 'entry_data.' + index,
                                        value: evt.target.value,
                                        origin: enter.value
                                    });
                                }, 500, rand_wait)))));
                }

                $listHold.append($listItem);
            });
            return $holder;
        };
    };

    const makeAcc = (function () {
        const makeAccHeading = function (entry_name, rand, count) {
            const ent_str = count > 1
                ? " entries)"
                : " entry)";

            return $('<div>', {
                class: "card-header",
                id: 'header-' + rand
            })
                .append($('<h2>', {
                    class: "mb-0"
                })
                    .append($('<button>', {
                        class: "btn btn-link collapsed",
                        type: "button",
                        "data-toggle": "collapse",
                        "data-target": "#collapse-" + rand,
                        "aria-expanded": "false",
                        "aria-controls": "collapse-" + rand,
                        html: entry_name + " (" + count + ent_str
                    })));
        };

        const makeAccBody = function (rand, $elements) {
            let $ret, $accBody;
            $ret = $('<div>', {
                id: "collapse-" + rand,
                class: "collapse",
                "aria-labelledby": "headingOne",
                "data-parent": "#accordionHolder"
            });

            $accBody = $('<div>', {
                class: 'card-body'
            }).append($elements);

            // console.log("in entry builder body", entry);

            $ret.append($accBody);
            return $ret;
        };

        return function (entry_ids, entry_name, data) {
            const rand = random();
            const $oneAcc = $('<div>', {
                class: 'card'
            });

            // add header
            $oneAcc.append(makeAccHeading(entry_name, rand, entry_ids.length));

            // create entry tables
            const $tables = entry_ids.map(function (id) {
                return data.build(id, function (entry) {
                    return createTableBody()(entry);
                });
            });

            makeAccBody(rand, $tables).appendTo($oneAcc);

            return $oneAcc;
        };
    }());

    const createSummary = function (entries, data) {
        const $holder = $('<p>', {
            class: 'row'
        });

        //get nanostring stuff
        entries.nanostring.forEach(function (id) {
            data.build(id, function (entry) {
                let byKey = {};
                entry.entry_data.forEach(function (datum) {
                    byKey[datum.key] = datum.value;
                });

                return $('<div>').append($('<dt>', {
                    class: "col-sm-3",
                    text: 'NanoString'
                })).append($('<dd>', {
                    class: 'col-sm-9',
                    text: byKey.Model + " (" + byKey["Comment 1"] + "): " + byKey.Nsname_model + " (" + byKey["Class Name"] + ")"
                })).children();
            }).appendTo($holder);
        });

        //get omics ids if avaliable
        entries.omics.forEach(function (id) {
            data.build(id, function (entry) {
                let byKey = {};
                const $temp = $('<div>');
                entry.entry_data.forEach(function (datum) {
                    byKey[datum.key] = datum.value;
                });

                //kinomics
                $temp.append($('<dt>', {
                    class: "col-sm-3",
                    text: 'Kinomics'
                })).append($('<dd>', {
                    class: 'col-sm-9',
                    html: '<a href=' + "http://toolbox.kinomecore.com/?data=" + encodeURIComponent('*[http://db.kinomecore.com/1.0.0/lvl_1.1.2?find={"sample_data":{"$elemMatch":{"value":"' + byKey['Kinomics_Sample name ()'] + '"}}}]*') + '>' + byKey['Kinomics_Sample name ()'] + '</a>'
                }));

                //Affy
                $temp.append($('<dt>', {
                    class: "col-sm-3",
                    text: 'Affymetrix'
                })).append($('<dd>', {
                    class: 'col-sm-9',
                    text: byKey['Affy_Sample ID']
                }));


                //Illumina
                $temp.append($('<dt>', {
                    class: "col-sm-3",
                    text: 'Illumina'
                })).append($('<dd>', {
                    class: 'col-sm-9',
                    html: byKey.Illumina_ID + '(' + byKey.Illumina_SentrixPosition + ')'
                }));

                return $temp.children();
            }).appendTo($holder);
        });

        return $holder;
    };

    const build_modal = function (id, data) {
        let updates = {}, change_handler = {};
        const modal = getModal();
        modal.title($('<h4>', {text: "Edit Entry"}));
        modal.body(data.build(id, createTableBody({
            edit: true,
            edit_func: function (set_obj) {
                updates[set_obj.id] = updates[set_obj.id] || {};
                updates[set_obj.id][set_obj.key] = set_obj;
            }
        }), change_handler));
        change_handler.clear();
        modal.foot($('<button>', {
            class: 'btn btn-primary',
            text: "Submit",
            click: function (evt) {
                evt.preventDefault();
                data.set(
                    Object.keys(updates)
                        .map((key1) => Object.keys(updates[key1])
                            .map((key2) => updates[key1][key2]))
                        .flat()
                        .filter((obj) => obj.value !== obj.origin)
                )
                    .then(wait(750))
                    .catch(console.error)
                    .then(modal.hide);

            }
        }));
        modal.show();
    };

    const add_blank = function (node) {
        return createTableBody({
            short: true,
            short_title: "Circle: " + node.circle
        })({
            pdx_id: node.name,
            entry_data: [{
                key: "*note",
                value: "This is a dummy node, it will only update after editing its child node and refreshing the timeline display."
            }, {
                key: "New Exp#",
                value: node.name
            }]
        });
    };

    const node_click = function (data, $info_hold, state) {
        return function (entry) {

            //save state
            state.name = entry.name;

            //clear info hold and ** build functions
            $info_hold.hide();
            $info_hold.empty();

            //create row
            let $row = $('<div>', {class: 'row'}).appendTo($info_hold);

            //create 3 columns (col-md-4; col-sm-12)
            let $col1 = $('<div>', {class: 'chart-data'})
                .appendTo($('<div>', {class: 'col col-md-4 col-sm-12'})
                    .appendTo($row))
                .append($('<p>', {class: 'text-center h4', text: "Prior"}));
            let $col2 = $('<div>', {class: 'chart-data col-md-4 col-sm-12'})
                .appendTo($row)
                .append($('<p>', {class: 'text-center h4', text: "Selected"}));
            let $col3 = $('<div>', {class: 'chart-data'})
                .appendTo($('<div>', {class: 'col col-md-4 col-sm-12'})
                    .appendTo($row))
                .append($('<p>', {class: 'text-center h4', text: "Next"}));


            //build the data for all three
            entry.prior.forEach(function (node) {
                if (node.id) {
                    $col1.append(data.build(node.id, createTableBody({
                        short: true,
                        short_title: "Circle: " + node.circle
                    })));
                } else {
                    $col1.append(add_blank(node));
                }
            });

            //build the data for all three
            entry.self.forEach(function (node) {
                if (node.id) {
                    $col2
                        .append($('<p>', {class: 'text-center'})
                            .append($('<button>', {
                                class: 'btn btn-primary',
                                text: 'Update',
                                click: function (evt) {
                                    evt.preventDefault();
                                    build_modal(node.id, data);
                                }
                            })));
                    $col2.append(data.build(node.id, createTableBody({
                        short: true,
                        short_title: "Circle: " + node.circle
                    })));
                } else {
                    $col2.append(add_blank(node));
                }
            });

            //build the data for all three
            entry.next.forEach(function (node) {
                if (node.id) {
                    $col3.append(data.build(node.id, createTableBody({
                        short: true,
                        short_title: "Circle: " + node.circle
                    })));
                } else {
                    $col3.append(add_blank(node));
                }
            });

            //show
            $info_hold.show();
        };
    };

    getModal = function () {
        const create_modal = function () {
            let rand = random(), title, body, foot, modal, edit_modal = {};

            $('#page-body').append($(
                '<div class="modal fade" id="modal' + rand + '" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">' +
                '<div class="modal-dialog modal-lg" role="document">' +
                '<div class="modal-content">' +
                '<div class="modal-header">' +
                '<h5 class="modal-title" id="title' + rand + '"></h5>' +
                '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                '<span aria-hidden="true">&times;</span>' +
                '</button>' +
                '</div>' +
                '<div class="modal-body" id="body' + rand + '">' +
                '</div>' +
                '<div class="modal-footer" id="foot' + rand + '">' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>'
            ));

            modal = $('#modal' + rand);
            title = $('#title' + rand);
            body = $('#body' + rand);
            foot = $('#foot' + rand);

            edit_modal.title = function (jq_obj) {
                title.empty();
                title.append(jq_obj);
            };
            edit_modal.body = function (jq_obj) {
                body.empty();
                body.append(jq_obj);
            };
            edit_modal.foot = function (jq_obj) {
                foot.empty();
                foot.append(jq_obj);
            };
            edit_modal.show = function () {
                modal.modal('show');
            };
            edit_modal.hide = function () {
                modal.modal('hide');
            };

            return edit_modal;
        };

        const aModal = create_modal();

        // reassign get modal
        getModal = function () {
            return aModal;
        };

        return aModal;
    };

    const build_page_components = function (data, get_list_func) {
        return function (filter) {

            //reset needed updates and data holder
            data.clearUpdates();
            $data_body.empty();

            const ids = get_list_func(filter);
            const build_data = data.expandIDs(ids);

            console.log('search results?', ids);

            //break up by pdx_id
            build_data.list('pdx_id').forEach(function (pdx_id) {
                const by_pdx_id = build_data.expandIDs(build_data.filter(function (entry) {
                    return entry.pdx_id === pdx_id;
                }));

                //add header per PDX
                $('<p>', {
                    class: "h3 row",
                    text: 'PDX ID: ' + pdx_id
                }).appendTo($data_body);

                //Now build the appropriate parts of the page

                /////////////////////////////
                //build summary information//
                /////////////////////////////

                const entries = {
                    nanostring: by_pdx_id.filter((entry) => entry.entry_name.match(/^PDX_ID\ to\ Nanostring\ naming\ and\ model\ information$/i)),
                    omics: by_pdx_id.filter((entry) => entry.entry_name.match(/^PDX_ID\ to\ old\ PDX_ID_OldKinomic\/Affy\/Illumina\ ID\'s$/i))
                };
                if (entries.nanostring.length || entries.omics.length) {
                    // add title
                    $("<p>", {class: "h4 row", text: "Avaliable Data"}).appendTo($data_body);

                    //add summary information
                    createSummary(entries, data).appendTo($data_body);
                }

                ////////////////////////
                //build passage viewer//
                ////////////////////////

                const passageIDs = by_pdx_id.filter((entry) => entry.entry_name.match(/PDX\ Passage\ Info/i));
                if (passageIDs.length) {
                    console.log(passageIDs);
                    let id = 'figure-' + random();

                    // add title
                    $("<p>", {class: "h4 row", text: "Passage Timeline"}).appendTo($data_body);

                    // add place for the passage figure and tables
                    let $info_viewer = $('<div>', {class: 'col-12'});
                    let $figure_place = $('<div>', {class: 'col-12'});
                    let $figure = $("<div>", {id: id, class: 'chart'});
                    let state = {};
                    $figure_place.append($figure);
                    $("<p>", {class: "row"})
                        .append($figure_place)
                        .append($info_viewer)
                        .appendTo($data_body);

                    //actuall build and create the passage figure
                    data.build(passageIDs, function (entries) {
                        $figure.empty();
                        let clickFunc = node_click(data, $info_viewer, state);
                        const figure_obj = global.createPassageFigure(
                            entries,
                            clickFunc,
                            state
                        );
                        //update for state, hide if the name does not exist
                        // any longer
                        if (state.name) {
                            if (state.state && state.state.name) {
                                clickFunc(state.state);
                            } else {
                                $info_viewer.hide();
                            }
                        }
                        loadchart(id, figure_obj.figure);

                        //this function must return an element
                        return $figure;
                    });
                }

                ///////////////////////////////////////////
                //build descriptive table with accordians//
                ///////////////////////////////////////////

                //add title
                $data_body.append($("<p>", {class: "h4 row", text: "All Descriptive Data"}));

                //create the acc holder
                const $accordian = $('<div>', {
                    class: 'accordion',
                    id: 'accordionHolder'
                }).appendTo($('<p>', {class: 'row'}).appendTo($data_body));

                //actually create the acc by each 'entry name'
                by_pdx_id.list('entry_name').forEach(function (entry_name) {
                    makeAcc(by_pdx_id.filter(function (entry) {
                        return entry.entry_name === entry_name;
                    }), entry_name, data).appendTo($accordian);
                });
            });
        };
    };


    global.build_page = (function () {

        const sort_by_pdx_id = function (a, b) {
            let numA, numB;

            numA = a.replace(/[^0-9]+/gi, "") * 1;
            numB = b.replace(/[^0-9]+/gi, "") * 1;

            if (numA && numB && numA > 2 && numB > 2 && numA - numB !== 0) {
                return numA - numB;
            }
            if (a > b) {
                return 1;
            }
            if (b > a) {
                return -1;
            }
            return 0;
        };

        // helper functions for building menus
        const createDropDown = function (drop_down) {
            const rand = random();

            let $element = $('<div>', {
                    class: "from-group col-" + drop_down.width
                }).append($('<label>', {
                    for: 'select-header-' + rand,
                    text: drop_down.label
                })),
                $select = $('<select>', {
                    class: "form-control",
                    id: 'select-header-' + rand
                }),
                $first = $('<option>', { // basic choice
                    disabled: 'disabled',
                    selected: 'selected',
                    text: "Select One"
                });

            //add in basic option
            $select.append($first);

            //add the actual drop down contents
            drop_down.data.sort(sort_by_pdx_id).forEach(function (drop) {
                $select.append($('<option>', {
                    value: JSON.stringify({
                        key: drop_down.key,
                        value: drop
                    }),
                    text: drop
                }));
            });

            // add the select to the returned element
            $element.append($select);

            //set function for on change
            $select.change(drop_down.selector.select(drop_down.change));

            //set function for unselecting
            drop_down.selector.unselect(function () {
                $first[0].selected = true;
            });

            return $element;
        };
        const createSearch = function (config) {
            const rand = random(), change = config.selector.select(config.change);

            let $element = $('<div>', {
                    class: "form-group col-" + config.width
                }).append($('<label>', {
                    for: 'search-bar-' + rand,
                    text: config.label
                })),
                $input = $('<input>', {
                    class: "form-control",
                    type: 'text',
                    id: 'search-bar-' + rand
                }),
                currentStr = "";

            $element.append($input);

            //change function - wait, then check if there is a change - then
            $input.on('keyup', waitForFinalEvent(function (evt) {
                if (currentStr !== evt.target.value) {
                    change(evt);
                    currentStr = evt.target.value;
                }
            }, 500, 'search-' + rand));

            //unselect function
            config.selector.unselect(function () {
                $input.val("");
            });

            return $element;
        };
        const idsFromSearch = function (data) {
            return function (search_str) {
                return data.search(search_str);
            };
        };
        const idsFromFilter = function (data) {
            return function (filter_str) {
                const filter = JSON.parse(filter_str);
                return data.filter(function (entry) {
                    return entry && entry[filter.key] && entry[filter.key] === filter.value;
                });
            };
        };
        const make_selectors = (function () {
            // memorizes functions, returns an object of functions
            let selectors = {};
            return function (ind) {
                // on first call this will set the callbacks, then will call them
                    // subsequently

                // verify ind is a string
                ind = ind.toString();

                // The first call will set the callbacks so 'ind' cannot be used twice
                if (selectors[ind]) {
                    throw 'Cannot call make_selectors with the same key multiple times';
                }
                selectors[ind] = {
                    select: function (callback) {
                        selectors[ind].select = function (evt) {
                            Object.keys(selectors).forEach(function (nind) {
                                if (nind !== ind) {
                                    selectors[nind].unselect();
                                }
                            });
                            callback(evt.target.value);
                        };
                        return selectors[ind].select;
                    },
                    unselect: function (callback) {
                        selectors[ind].unselect = callback;
                        return selectors[ind].unselect;
                    }
                };
                return selectors[ind];
            };
        }());

        return function (data_in) {
            const data = global.expandData(data_in); //build out the new data object
            const drops = [{ // info to build the drop down menus
                data: data.list('pdx_id'),
                key: 'pdx_id',
                label: 'PDX ID',
                width: 3,
                selector: make_selectors("0"),
                change: build_page_components(data, idsFromFilter(data))
            }, {
                data: data.list('origin_id'),
                key: 'origin_id',
                label: 'Origin ID',
                width: 3,
                selector: make_selectors("1"),
                change: build_page_components(data, idsFromFilter(data))
            }];

            //create the row for the selectors
            const $selectorRow = $('<div>', {
                class: 'row',
                id: 'form-body'
            }).appendTo($('<div>', {
                class: 'col-12'
            }).appendTo($('<div>', {
                class: 'row'
            })).appendTo($body));

            //Add the drop downs to the selector row
            drops.forEach(function (drop) {
                $selectorRow.append(createDropDown(drop));
            });

            //Add in the search feature
            createSearch({
                selector: make_selectors("2"),
                label: 'Exact Word Search',
                width: 6,
                change: build_page_components(data, idsFromSearch(data))
            }).appendTo($selectorRow);


            return drops;
        };
    }());

    return true;
}(DATA_DISPLAY));