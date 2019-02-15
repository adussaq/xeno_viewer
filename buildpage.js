/*global $ DATA_DISPLAY jQuery*/
(function (global) {
    'use strict';

    //declare variables
    var $body = $('#form-body'),
        $data = $('#data-body');

    //declare functions
    var getSearchTerms, build_page, get_key_params, display_data;

    display_data = (function () {
        var makeTableBody, mainDisplay, get_by_entry_name, getDate, build_entry_html, sort_by_date_if_found, makeAccHeading, makeAccBody;
        mainDisplay = function (title, data_arr) {
            console.log(data_arr);
            $data.empty();
            $data.append($('<p>', {
                class: 'h4',
                text: title
            }));

            $data.append(build_entry_html(data_arr));
        };

        makeAccHeading = function (entry_name, i, count) {
            var ent_str = count > 1
                ? " entries)"
                : " entry)";

            return $('<div>', {
                class: "card-header",
                id: "heading" + i
            })
                .append($('<h2>', {
                    class: "mb-0"
                })
                    .append($('<button>', {
                        class: "btn btn-link collapsed",
                        type: "button",
                        "data-toggle": "collapse",
                        "data-target": "#collapse" + i,
                        "aria-expanded": "false",
                        "aria-controls": "collapse" + i,
                        html: entry_name + " (" + count + ent_str
                    })));
        };

        makeTableBody = function (entry) {
            var j, ret = "";

            ret += '<p class="h5">' +
                    entry.pdx_id +
                    ": " +
                    entry.entry_name +
                    '</p><p class="font-weight-light text-muted">' +
                    entry.description +
                    '<br />-' +
                    entry.entry_metadata.user +
                    '</p><p>' +
                    '<ul class="list-group">';
            for (j = 0; j < entry.entry_data.length; j += 1) {
                ret += '<li class="list-group-item"><strong>' +
                        entry.entry_data[j].key +
                        ":</strong> &emsp; " +
                        entry.entry_data[j].value +
                        '</li>';
            }
            ret += '</ul></p><hr />';

            return $(ret);
        };

        makeAccBody = function (entry, id) {
            var $ret, $accBody, i;
            $ret = $('<div>', {
                id: "collapse" + id,
                class: "collapse",
                "aria-labelledby": "headingOne",
                "data-parent": "#accordionHolder"
            });

            $accBody = $('<div>', {
                class: 'card-body'
            });

            for (i = 0; i < entry.length; i += 1) {
                $accBody.append(makeTableBody(entry[i]));
            }

            console.log("in entry builder body", entry);

            $ret.append($accBody);
            return $ret;
        };

        build_entry_html = function (data_arr) {
            var entry_name_list, by_entry, i, $area, id;

            by_entry = get_by_entry_name(data_arr);
            entry_name_list = Object.keys(by_entry);
            $area = $('<div>', {
                class: 'accordion',
                style: 'margin-bottom: 10px;',
                id: 'accordionHolder'
            });

            for (i = 0; i < entry_name_list.length; i += 1) {
                id = Math.random().toString().replace(/^0\./, "");
                $area.append(
                    $('<div>', {
                        class: "card"
                    })
                        .append(makeAccHeading(entry_name_list[i], id, by_entry[entry_name_list[i]].length))
                        .append(makeAccBody(by_entry[entry_name_list[i]], id))
                );
            }

            return $area;
        };

        sort_by_date_if_found = function (a, b) {
            return getDate(b) - getDate(a);
        };

        getDate = function (entry) {
            var i, maxDate = -Infinity, parse;
            for (i = 0; i < entry.entry_data.length; i += 1) {
                if (entry.entry_data[i].value.match(/\d{1,2}\/\d{1,2}\/\d{1,2}/)) {
                    parse = Date.parse(entry.entry_data[i].value);
                    if (parse) {
                        maxDate = Math.max(parse, maxDate);
                    }
                }
            }
            return maxDate;
        };

        get_by_entry_name = function (data_arr) {
            var i = 0, byname = {}, keys = [];
            for (i = 0; i < data_arr.length; i += 1) {
                byname[data_arr[i].entry_name] = byname[data_arr[i].entry_name] || [];
                byname[data_arr[i].entry_name].push(data_arr[i]);
                keys.push(data_arr[i].entry_name);
            }
            //sort it
            for (i = 0; i < keys.length; i += 1) {
                byname[keys[i]] = byname[keys[i]].sort(sort_by_date_if_found);
            }

            return byname;

        };

        return mainDisplay;
    }());

    getSearchTerms = (function () {
        var getWordsFromKeyVal, filterWords, words, splitTerm;

        splitTerm = new RegExp('[^A-Za-z0-9]+', 'i');

        filterWords = function (el, pos) {
            if (!el || el === "") { // gets rid of undefined
                return false;
            }
            return words.indexOf(el) === pos; // gets rid of repeats
        };

        getWordsFromKeyVal = function (kv_arr) {
            var i, wordsmini = [];
            for (i = 0; i < kv_arr.length; i += 1) {
                wordsmini = wordsmini.concat(kv_arr[i].key.split(splitTerm));
                wordsmini = wordsmini.concat(kv_arr[i].value.split(splitTerm));
            }
            return wordsmini;
        };

        return function (data) {
            var i, j, dictionary = {}, word, keys;
            keys = [
                "description",
                "entry_data",
                "entry_metadata",
                "entry_name",
                "historical",
                "origin_id",
                "pdx_id"
            ];

            for (i = 0; i < data.length; i += 1) {
                words = [];
                Object.defineProperty(data[i], 'search_temp_key', {
                    value: Math.random().toString().replace(/0\./, ""),
                    writable: false,
                    enumerable: false,
                    configurable: false
                });

                //Add the 'easy ones'
                words = words.concat(data[i][keys[0]].split(splitTerm));
                words = words.concat(data[i][keys[3]].split(splitTerm));

                //Add in the id, both with and without splitting
                words = words.concat([data[i][keys[4]]]);
                words = words.concat([data[i][keys[5]]]);
                words = words.concat(data[i][keys[4]].split(splitTerm));
                words = words.concat(data[i][keys[5]].split(splitTerm));

                //Add in the key value pairs
                words = words.concat(getWordsFromKeyVal(data[i][keys[1]]));
                words = words.concat(getWordsFromKeyVal(data[i][keys[2]]));

                //filter words list
                words = words.filter(filterWords);

                //add words to dictionary
                for (j = 0; j < words.length; j += 1) {
                    word = words[j].toLocaleLowerCase();
                    dictionary[word] = dictionary[word] || [];
                    dictionary[word].push(data[i]);
                }
            }
            return dictionary;
        };
    }());

    build_page = function (data) {
        var dropdowns = get_key_params(data),
            dropdown_headers = Object.keys(dropdowns),
            searchTerms = getSearchTerms(data),
            dropdown_options,
            $select,
            page_holder,
            ready_display,
            respondToEntry,
            searchBar,
            actualSearch,
            recursive,
            called = false,
            clear_selects,
            clear_search,
            i,
            j;

        page_holder = [];

        respondToEntry = function () {
            if (!called) {
                called = true;
                setTimeout(recursive, 1000);
            }
        };

        recursive = function () {
            if (called) {
                called = false;
                setTimeout(recursive, 1000);
            } else {
                actualSearch(searchBar.val());
            }
        };


        //Test search: Sontheimer, Sontheimer 22P
        actualSearch = function (string) {
            var searchArr, ii, jj, results = [], data_keys = {}, keysOfKeys, maxNum = 0;
            clear_selects();
            searchArr = string.toLocaleLowerCase().split(/\s+/);
            for (ii = 0; ii < searchArr.length; ii += 1) {
                if (searchTerms.hasOwnProperty(searchArr[ii])) {
                    for (jj = 0; jj < searchTerms[searchArr[ii]].length; jj += 1) {
                        results.push(searchTerms[searchArr[ii]][jj]);
                        data_keys[searchTerms[searchArr[ii]][jj].search_temp_key] = data_keys[searchTerms[searchArr[ii]][jj].search_temp_key] || [
                            0,
                            searchTerms[searchArr[ii]][jj]
                        ];
                        data_keys[searchTerms[searchArr[ii]][jj].search_temp_key][0] += 1;
                        maxNum = Math.max(data_keys[searchTerms[searchArr[ii]][jj].search_temp_key][0], maxNum);
                    }
                }
            }

            //Only grab the ones that match all terms
            if (maxNum > 1) {
                results = [];
                keysOfKeys = Object.keys(data_keys);
                for (ii = 0; ii < keysOfKeys.length; ii += 1) {
                    if (data_keys[keysOfKeys[ii]][0] >= maxNum) {
                        results.push(data_keys[keysOfKeys[ii]][1]);
                    }
                }
            }


            display_data("Search: '" + string + "'", results);
            console.log(results);
            //return results;
        };

        clear_selects = function () {
            var ii;
            for (ii = 0; ii < page_holder.length; ii += 1) {
                page_holder[ii].select[0][0].selected = true;
            }
        };

        clear_search = function () {
            searchBar.val("");
        };

        ready_display = function (evt) {
            var that = this, arr, ii;

            evt.preventDefault();
            clear_search();

            arr = that.value.split(';').map(function (x) {
                return x * 1;
            });
            console.log(arr);
            console.log(page_holder);

            for (ii = 0; ii < page_holder.length; ii += 1) {
                if (ii !== arr[0]) {
                    console.log(ii, arr[0]);
                    page_holder[ii].select[0][0].selected = true;
                }
            }

            //actual data
            display_data(page_holder[arr[0]].option_keys[arr[1]], dropdowns[
                dropdown_headers[arr[0]] // select menu
            ][
                page_holder[arr[0]].option_keys[arr[1]]//key param
            ]);
        };

        // Build dropdowns
        for (i = 0; i < dropdown_headers.length; i += 1) {
            $select = $('<select>', {
                class: "form-control",
                id: "select headers" + i
            });
            $body.append($('<div>', {
                class: "form-group col-3"
            }).append($('<label>', {
                for: "select headers" + i,
                text: dropdown_headers[i]
            })).append($select));
            dropdown_options = Object.keys(dropdowns[dropdown_headers[i]]);
            $('<option>', {
                text: "Select one...",
                disabled: "disabled",
                selected: "selected"
            }).appendTo($select);
            page_holder[i] = {
                select: $select,
                option_keys: JSON.parse(JSON.stringify(dropdown_options)),
                options: []
            };
            for (j = 0; j < dropdown_options.length; j += 1) {
                page_holder[i].options[j] = $('<option>', {
                    text: dropdown_options[j],
                    val: i + ";" + j
                }).appendTo($select);
            }
            $select.on('change', ready_display);
        }

        //Build Search
        console.log(searchTerms);
        searchBar = $('<input>', {
            type: 'text',
            style: "height: 100%",
            class: "form-control",
            "aria-label": "Default",
            "aria-describedby": "searchBarInuput439201432"
        }).on('keyup', respondToEntry);

        $('<div>', {
            class: "input-group mb-3 col-6"
        }).append($('<div>', {
            class: "input-group-prepend"
        }).append($('<span>', {
            class: "input-group-text",
            id: "searchBarInuput439201432",
            html: "Exact Word Search"
        }))).append(searchBar).appendTo($body);
            // $body -> form body where the dropdowns and search go
    };

    get_key_params = function (data) {
        var parameters = {
                pdx_id: {},
                origin_id: {}
            },
            keys = Object.keys(parameters),
            i;
        data.map(function (x) {
            for (i = 0; i < keys.length; i += 1) {
                if (x.hasOwnProperty(keys[i])) {
                    parameters[keys[i]] = parameters[keys[i]] || {};
                    parameters[keys[i]][x[keys[i]]] = parameters[keys[i]][x[keys[i]]] || [];
                    parameters[keys[i]][x[keys[i]]].push(x);
                }
            }
        });
        return parameters;
    };

    global.build_page = build_page;

    return false;

}(DATA_DISPLAY));
