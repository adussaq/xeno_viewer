/*global $ DATA_DISPLAY jQuery*/
(function (global) {
    'use strict';

    //declare variables
    var $body = $('#form-body'),
        $data = $('#data-body');

    //declare functions
    var makeTableBody, summary_information, getSearchTerms, passage_figure, build_sample_select, get_key_params, display_data, splitTerm;

    splitTerm = new RegExp('[^A-Za-z0-9]+', 'i');

    passage_figure = (function () {
        var createPassageFigure, cleanDate, byDate, onNodeClick;

        cleanDate = function (dateStr) {
            var date = new Date(dateStr.replace(/[^\d\/]+/g, "").replace(/\/+/g, "/").replace(/^10\/210\/09$/, "10/21/09").replace(/8\/24\/812/, "8/24/12"));
            if (isNaN(date.getDate())) {
                console.warn("bad dateStr", dateStr);
            }
            return date;
        };

        byDate = function (obj) {
            return function (a, b) {
                return obj[a].date - obj[b].date;
            };
        };

        onNodeClick = function (id, byId, elem) {
            //return function (node) {
            return function () {
                var strOrder = "", i, prior, next, current;
                // console.log(node, id, byId, byId[id]);

                prior = $('<div>', {
                    class: "col-md-4 col-sm-12",
                    style: "border: 2px solid grey;border-radius: 5px;max-height: 200px;overflow-y:scroll;overflow: -moz-scrollbars-vertical;"
                }).append($('<h4>', {
                    text: "Prior",
                    class: "text-center"
                }));
                current = $('<div>', {
                    class: "col-md-4 col-sm-12",
                    style: "border: 2px solid grey;border-radius: 5px;max-height: 200px;overflow-y:scroll;overflow: -moz-scrollbars-vertical;"
                }).append($('<h4>', {
                    text: "Current",
                    class: "text-center"
                }));
                next = $('<div>', {
                    class: "col-md-4 col-sm-12",
                    style: "border: 2px solid grey;border-radius: 5px;max-height: 200px;overflow-y:scroll;overflow: -moz-scrollbars-vertical;"
                }).append($('<h4>', {
                    text: "Next",
                    class: "text-center"
                }));

                // Prior
                for (i = 0; i < byId[id].old.length; i += 1) {
                    if (byId[id].old[i].self) {
                        prior.append(makeTableBody(byId[id].old[i].self, true, 'Circle ' + byId[id].old[i].order));
                    } else {
                        prior.append(makeTableBody({
                            entry_data: [{
                                key: "New Exp#",
                                value: byId[id].old[i].id
                            }]
                        }, true, 'Circle ' + byId[id].old[i].order));
                    }
                }

                // Current
                if (byId[id].self) {
                    current.append(makeTableBody(byId[id].self, true, 'Circle ' + byId[id].order));
                } else {
                    current.append(makeTableBody({
                        entry_data: [{
                            key: "New Exp#",
                            value: id
                        }]
                    }, true, 'Circle ' + byId[id].order));
                }

                // Next
                for (i = 0; i < byId[id].next.length; i += 1) {
                    if (byId[id].next[i].self) {
                        next.append(makeTableBody(byId[id].next[i].self, true, 'Circle ' + byId[id].next[i].order));
                    } else {
                        next.append(makeTableBody({
                            entry_data: [{
                                key: "New Exp#",
                                value: byId[id].next[i].id
                            }]
                        }, true, 'Circle ' + byId[id].next[i].order));
                    }
                }
                strOrder = strOrder.replace(/,$/, "");
                elem.empty().append(prior).append(current).append(next);
                //console.log(strOrder);
            };
        };

        createPassageFigure = function (arr, info_elem) {
            var i, j, k, temp, colors, parents = new Set(), figureObj, byKey = {}, thisDate, keys, thisExp, oldExp;

            // create linked list, forward and backwards
            for (i = 0; i < arr.length; i += 1) {
                thisExp = 0;
                oldExp = 0;
                thisDate = 0;
                for (j = 0; j < arr[i].entry_data.length; j += 1) {
                    if (arr[i].entry_data[j].key.match(/new\sexp/i)) {
                        thisExp = arr[i].entry_data[j].value;
                    } else if (arr[i].entry_data[j].key.match(/old\sexp/i)) {
                        oldExp = arr[i].entry_data[j].value;
                    } else if (arr[i].entry_data[j].key.match(/Passage\sDate/i)) {
                        thisDate = cleanDate(arr[i].entry_data[j].value);
                    }
                }


                if (!thisExp) {
                    thisExp = ":undefined: " + Math.random().toString().replace(/0\./, "");
                }
                if (!oldExp) {
                    oldExp = ":undefined: " + Math.random().toString().replace(/0\./, "");
                }
                if (!oldExp.match(/-|none/)) {
                    oldExp = oldExp.replace(/^X(\d{2})(\d+)$/, "X$1-$2");
                }
                if (!thisExp.match(/-/)) {
                    thisExp = thisExp.replace(/^X(\d{2})(\d+)$/, "X$1-$2");
                }

                thisExp = thisExp.replace(/[^\w\d\-\*\:]+/gi, "");
                oldExp = oldExp.replace(/[^\w\d\-\*\:]+/gi, "");
                thisExp = "X" + thisExp;
                thisExp = thisExp.replace(/X+/ig, "X");

                if (oldExp === thisExp) {
                    thisExp = oldExp + "&&dup1";
                }


                byKey[thisExp] = byKey[thisExp] || {
                    self: [],
                    date: [],
                    id: thisExp,
                    old: [],
                    next: []
                };

                byKey[thisExp].self.push(arr[i]);
                byKey[thisExp].date.push(thisDate);

                if (!oldExp.match(/none/i)) {
                    oldExp = "X" + oldExp;
                    oldExp = oldExp.replace(/X+/ig, "X");
                    // create old exp as needed
                    byKey[oldExp] = byKey[oldExp] || {
                        self: [],
                        date: [],
                        id: oldExp,
                        old: [],
                        next: []
                    };
                    byKey[oldExp].next.push(byKey[thisExp]);

                    //update this exp
                    byKey[thisExp].old.push(byKey[oldExp]);
                }
            }

            //clean up duplicates...
            keys = Object.keys(byKey);
            var temperObj, temperThese;
            for (i = 0; i < keys.length; i += 1) {
                if (byKey[keys[i]].self.length > 1) {
                    temperObj = byKey[keys[i]];
                    temperThese = [];
                    delete byKey[keys[i]];
                    for (j = 0; j < temperObj.self.length; j += 1) {
                        temperThese.push(keys[i] + "&&dup" + j);
                        byKey[keys[i] + "&&dup" + j] = {
                            self: [temperObj.self[j]],
                            date: [temperObj.date[j]],
                            id: thisExp,
                            old: temperObj.old,
                            next: temperObj.next
                        };
                    }
                    for (j = 0; j < temperObj.old.length; j += 1) {
                        for (k = 0; k < temperObj.old[j].next.length; k += 1) {
                            if (temperObj.old[j].next[k].self.length > 1) {
                                temperObj.old[j].next.splice(k, 1);
                            }
                        }
                        for (k = 0; k < temperThese.length; k += 1) {
                            temperObj.old[j].next.push(byKey[temperThese[k]]);
                        }
                    }
                }
            }

            keys = Object.keys(byKey);
            var minDate = new Date();
            // add in missing dates and clean up object
            for (i = 0; i < keys.length; i += 1) {
                //Fixed all dups
                byKey[keys[i]].self = byKey[keys[i]].self[0];
                byKey[keys[i]].date = byKey[keys[i]].date[0];

                if (byKey[keys[i]].date) {
                    minDate = Math.min(minDate, byKey[keys[i]].date);
                }
            }
            for (i = 0; i < keys.length; i += 1) {
                if (!byKey[keys[i]].date) {
                    byKey[keys[i]].type = "free";
                    byKey[keys[i]].date = new Date(minDate);
                } else {
                    byKey[keys[i]].type = "fixed";
                }
            }

            //Find "parents" including things with > 1 parents
            for (i = 0; i < keys.length; i += 1) {
                if (byKey[keys[i]].old.length !== 1) {
                    parents.add(keys[i]);
                }
                if (byKey[keys[i]].next.length > 1) {
                    for (j = 0; j < byKey[keys[i]].next.length; j += 1) {
                        parents.add(byKey[keys[i]].next[j].id);
                    }
                }
            }

            colors = DATA_DISPLAY.generateColor(parents.size + 1);
            // Set parent node colors
            i = 0;
            parents.forEach(function (key) {
                byKey[key].nodeColor = colors[i];
                // Set all node colors
                temp = byKey[key].next;
                while (temp.length === 1) {
                    temp[0].nodeColor = colors[i];
                    temp = temp[0].next;
                }
                //increment the color
                i += 1;
            });

            // Add in index num
            keys = keys.sort(byDate(byKey));
            for (i = 0; i < keys.length; i += 1) {
                byKey[keys[i]].order = i;
            }

            figureObj = {
                nodes: [],
                links: []
            };

            //keys = keys.reverse();

            for (i = 0; i < keys.length; i += 1) {
                figureObj.nodes.push({
                    name: byKey[keys[i]].id,
                    date: byKey[keys[i]].date.toGMTString().replace(/^[\s\S]+(\w{3}\s\d{4})[\s\S]+$/i, "$1"),
                    id: byKey[keys[i]].order,
                    from: byKey[keys[i]].nodeColor, //circle color
                    type: byKey[keys[i]].type, //free, fixed, hasAnswer, both, isAnswer
                    click: onNodeClick(keys[i], byKey, info_elem)
                });

                for (j = 0; j < byKey[keys[i]].next.length; j += 1) {
                    figureObj.links.push({
                        source: byKey[keys[i]].order,
                        target: byKey[keys[i]].next[j].order,
                        type: "answeredby",
                        color: byKey[keys[i]].next[j].nodeColor //link color
                    });
                }
            }

            //correct figure for having only one value to plot
            // var tDate;
            // if (figureObj.nodes.length === 1) {
            //     temp = JSON.parse(JSON.stringify(figureObj.nodes[0]));
            //     temp.id = NaN;
            //     tDate = new Date(temp.date);
            //     tDate = new Date(tDate.setMonth(tDate.getMonth() + 1.9));
            //     temp.date = tDate.toGMTString().replace(/^[\s\S]+(\w{3}\s\d{4})[\s\S]+$/i, "$1");
            //     figureObj.nodes.push(temp);
            //     figureObj.links = [];
            // }

            // Create chain of names
            //var nameList = [], currentNode, space = " ";

            // var nextNode = function (arr) {
            //     var ii;
            //     for (ii = 0; ii < arr.length; ii += 1) {
            //         if (arr[ii]) {
            //             return true;
            //         }
            //     }
            //     return false;
            // };

            // for (i = 0; i < parents.length; i += 1) {
            //     nameList[i] = [""];
            //     currentNode = [parents[i]];
            //     while (nextNode(currentNode)) {
            //         for (j = 0; j < currentNode.length; j += 1) {
            //             if (currentNode[j]) {
            //                 nameList[i][j] += currentNode[j].id;
            //                 if (currentNode[j].next.length) {
            //                     nameList[i][j] += '->';
            //                     //set all but first children
            //                     for (k = 1; k < currentNode[j].next.length; k += 1) {
            //                         currentNode.splice(j + k, 0, currentNode[j].next[k]);
            //                         nameList[i].splice(j + k, 0, space.repeat(nameList[i][j].length - 2 - currentNode[j].id.length) + currentNode[j].id + '->');
            //                     }
            //                     //set first child
            //                     currentNode[j] = currentNode[j].next[0];
            //                 } else {
            //                     //end of nodes
            //                     currentNode[j] = 0;
            //                 }
            //             }
            //         }
            //     }
            // }
            // console.log(nameList);

            //GBM-X1524
            //GBM-X1066

            // create object for graph


            // console.log('nums', parents, byKey);

            return figureObj;
        };

        return function (data_arr, elem) {
            var i, id_entry_data = {}, ids, figObj, $info_elem;
            //per entry
            for (i = 0; i < data_arr.length; i += 1) {
                id_entry_data[data_arr[i].pdx_id] = id_entry_data[data_arr[i].pdx_id] || {};
                id_entry_data[data_arr[i].pdx_id][data_arr[i].entry_name] = id_entry_data[data_arr[i].pdx_id][data_arr[i].entry_name] || [];
                id_entry_data[data_arr[i].pdx_id][data_arr[i].entry_name].push(data_arr[i]);
            }

            //per id
            ids = Object.keys(id_entry_data);
            var titleElem, randNum;
            // console.log(id_entry_data);
            for (i = 0; i < ids.length; i += 1) {
                if (id_entry_data[ids[i]].hasOwnProperty("PDX Passage Info")) {
                    randNum = Math.random().toString().replace(/^0\./, "");
                    titleElem = $("<div>", {
                        class: "row"
                    }).appendTo(elem);
                    titleElem.append($('<h4>Passage Information Timeline</h4>'));
                    titleElem.append($('<div>', {
                        id: 'timelinefig' + randNum,
                        class: 'text-center chart'
                    }));
                    $info_elem = $('<div>', {
                        class: 'row'
                    });
                    $info_elem.appendTo(elem);

                    figObj = createPassageFigure(id_entry_data[ids[i]]["PDX Passage Info"], $info_elem);
                    // console.log("*****", figObj);
                    //throw "testing"
                    loadchart('timelinefig' + randNum, figObj);
                }
            }
        };
    }());

    summary_information = (function () {
        var getParts;
        getParts = function (dataArr) {
            var i = 0, ret = {
                summary: [],
                data_availiable: []
            };
            for (i = 0; i < dataArr.length; i += 1) {
                if (dataArr[i].entry_name === "Summary Table") {
                    ret.summary.push(dataArr[i]);
                } else if (dataArr[i].entry_name === "PDX_ID to old PDX_ID_OldKinomic/Affy/Illumina ID's" || dataArr[i].entry_name === "PDX_ID to Nanostring naming and model information") {
                    ret.data_availiable.push(dataArr[i]);
                }
            }
            return ret;
        };
        return function (data, $elem) {
            var parts, $avail, i, j, NSmodel, NScomment, NSclass, NSid, kurl, KinomeID, AffyID, IlluminaID, IlluminaPos;
            parts = getParts(data);

            //list summary data

            //list avaliable data
            $avail = $('<div>', {class: 'row'}).appendTo($elem);
            if (parts.data_availiable.length) {
                $('<div>', {class: "col-12 h4", text: "Avaliable Data"}).appendTo($avail);
                $avail = $('<dl>', {class: "row"}).appendTo($('<div>', {class: 'col-12'}).appendTo($avail));
                for (i = 0; i < parts.data_availiable.length; i += 1) {
                    if (parts.data_availiable[i].entry_name.match(/NanoString/i)) {
                        for (j = 0; j < parts.data_availiable[i].entry_data.length; j += 1) {
                            if (parts.data_availiable[i].entry_data[j].key.match(/Nsname_model/)) {
                                NSid = parts.data_availiable[i].entry_data[j].value;
                            } else if (parts.data_availiable[i].entry_data[j].key.match(/Model/)) {
                                NSmodel = parts.data_availiable[i].entry_data[j].value;
                            } else if (parts.data_availiable[i].entry_data[j].key.match(/Comment/)) {
                                NScomment = parts.data_availiable[i].entry_data[j].value;
                            } else if (parts.data_availiable[i].entry_data[j].key.match(/Class\ Name/)) {
                                NSclass = parts.data_availiable[i].entry_data[j].value;
                            }
                        }
                        NSmodel = NSmodel.charAt(0).toUpperCase() + NSmodel.slice(1);

                        $('<dt class="col-sm-3">NanoString</dt> <dd class="col-sm-9">' + NSmodel + " (" + NScomment + "): " + NSid + " (" + NSclass + ")</dd>").appendTo($avail);
                    }

                    if (parts.data_availiable[i].entry_name.match(/PDX_ID_OldKinomic/i)) {
                        KinomeID = "";
                        AffyID = "";
                        IlluminaID = "";
                        IlluminaPos = "";
                        for (j = 0; j < parts.data_availiable[i].entry_data.length; j += 1) {
                            if (parts.data_availiable[i].entry_data[j].key.match(/Kinomics_Sample/)) {
                                KinomeID = parts.data_availiable[i].entry_data[j].value;
                            } else if (parts.data_availiable[i].entry_data[j].key.match(/Affy_Sample\ ID/)) {
                                AffyID = parts.data_availiable[i].entry_data[j].value;
                            } else if (parts.data_availiable[i].entry_data[j].key.match(/Illumina_ID/)) {
                                IlluminaID = parts.data_availiable[i].entry_data[j].value;
                            } else if (parts.data_availiable[i].entry_data[j].key.match(/Illumina_SentrixPosition/)) {
                                IlluminaPos = parts.data_availiable[i].entry_data[j].value;
                            }
                        }

                        if (KinomeID.length) {
                            // http://testing.kinomecore.com/?data=*[http://db.kinomecore.com/1.0.0/lvl_1.1.2?find={"sample_data":{"$elemMatch":{"value":"<sample entered here>"}}}]*
                            kurl = "http://toolbox.kinomecore.com/?data=" + encodeURIComponent('*[http://db.kinomecore.com/1.0.0/lvl_1.1.2?find={"sample_data":{"$elemMatch":{"value":"' + KinomeID + '"}}}]*');
                            $('<dt class="col-sm-3">Kinomics</dt><dd class="col-sm-9"><a href="' + kurl + '">' + KinomeID + "</a></dd>").appendTo($avail);
                        }
                        if (AffyID.length) {
                            $('<dt class="col-sm-3">Affymetrix:</dt> <dd class="col-sm-9">' + AffyID + "</dd>").appendTo($avail);
                        }
                        if (IlluminaID.length) {
                            $('<dt class="col-sm-3">Illumina:</dt> <dd class="col-sm-9">' + IlluminaID + " (pos: " + IlluminaPos + ")</dd>").appendTo($avail);
                        }
                    }
                }
            }


            console.log('summary information', parts);

            return $elem;
        };
    }());

    display_data = (function () {
        var mainDisplay, get_by_entry_name, getDate, build_entry_html, sort_by_date_if_found, makeAccHeading, makeAccBody, getListOfPDXIDs;

        getListOfPDXIDs = function (data_arr) {
            var i, list = {};
            for (i = 0; i < data_arr.length; i += 1) {
                list[data_arr[i].pdx_id] = list[data_arr[i].pdx_id] || [];
                list[data_arr[i].pdx_id].push(data_arr[i]);
            }
            return {
                ids: Object.keys(list),
                data: list
            };
        };

        mainDisplay = function (title, full_data_arr) {
            var $temp, by_ids, i, data_arr;

            //Log the data
            console.log('Data Selected', full_data_arr);

            //Delete what exists
            $data.empty();

            // Add the header as selected (PDX ID, etc)
            $data.append($('<p>', {
                class: 'h2 row',
                text: title
            }));

            //Get all pdx ids and create viewer for each
            by_ids = getListOfPDXIDs(full_data_arr);

            for (i = 0; i < by_ids.ids.length; i += 1) {
                data_arr = by_ids.data[by_ids.ids[i]];

                //Add header for pdx id
                $data.append($('<p>', {
                    class: 'h3 row',
                    text: 'PDX ID: ' + by_ids.ids[i]
                }));

                //create summary table / data avaliable?
                    // Add in row/col for passage figure
                $temp = $('<div>', {
                    class: "row"
                });
                $data.append($temp);
                $temp = $('<div>', {
                    class: "col-12"
                }).appendTo($temp);
                summary_information(data_arr, $temp);


                //create passage figure
                    // Add in row/col for passage figure
                $temp = $('<div>', {
                    class: "row"
                });
                $data.append($temp);
                $temp = $('<div>', {
                    class: "col-12"
                }).appendTo($temp);
                passage_figure(data_arr, $temp);

                //create accordian viewer
                $data.append($("<p>", {
                    class: "h4 row",
                    text: "All Descriptive Data"
                }));
                $data.append(build_entry_html(data_arr));
            }
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

        makeTableBody = function (entry, short, adder) {
            var j, ret = "";

            entry.pdx_id = entry.pdx_id || "N/A";
            entry.entry_name = entry.entry_name || "N/A";
            entry.description = entry.description || "N/A";
            entry.entry_metadata = entry.entry_metadata || {};
            entry.entry_metadata.user = entry.entry_metadata.user || "N/A";
            entry.entry_data = entry.entry_data || [];

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

            if (short) {
                ret = '<p class="lead">' + entry.pdx_id + ': ' + adder + '</p>';
            }
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

            // console.log("in entry builder body", entry);

            $ret.append($accBody);
            return $ret;
        };

        build_entry_html = function (data_arr) {
            var entry_name_list, by_entry, i, $area, id, $row;

            by_entry = get_by_entry_name(data_arr);
            entry_name_list = Object.keys(by_entry);
            $row = $('<div>', {
                class: 'row'
            });
            $area = $('<div>', {
                class: 'accordion',
                style: 'margin-bottom: 10px;',
                id: 'accordionHolder'
            }).appendTo($row);

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

            return $row;
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
        var getWordsFromKeyVal, filterWords, words;

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

    build_sample_select = function (data) {
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
            sortPDXid,
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

        sortPDXid = function (a, b) {
            var numA, numB;

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


        //Test search: Sontheimer, Sontheimer 22P
        actualSearch = function (string) {
            var searchArr, ii, jj, results = [], data_keys = {}, keysOfKeys, maxNum = 0;
            clear_selects();
            searchArr = string.toLocaleLowerCase().split(splitTerm);
            for (ii = 0; ii < searchArr.length; ii += 1) { //For each term searched
                if (searchTerms.hasOwnProperty(searchArr[ii])) { // Is it in the dictionary
                    for (jj = 0; jj < searchTerms[searchArr[ii]].length; jj += 1) { // For each entry that matches
                        results.push(searchTerms[searchArr[ii]][jj]);  // save the one
                        data_keys[searchTerms[searchArr[ii]][jj].search_temp_key] = data_keys[searchTerms[searchArr[ii]][jj].search_temp_key] || [
                            {}, // start the list of matches
                            searchTerms[searchArr[ii]][jj] // store the object
                        ];

                        data_keys[searchTerms[searchArr[ii]][jj].search_temp_key][0][searchArr[ii]] = 1;
                        maxNum = Math.max(Object.keys(data_keys[searchTerms[searchArr[ii]][jj].search_temp_key][0]).length, maxNum);
                    }
                }
            }



            //Only grab the ones that match all terms
            if (maxNum > 1) {
                results = [];
                keysOfKeys = Object.keys(data_keys);
                for (ii = 0; ii < keysOfKeys.length; ii += 1) {
                    if (Object.keys(data_keys[keysOfKeys[ii]][0]).length >= maxNum) {
                        results.push(data_keys[keysOfKeys[ii]][1]);
                    }
                }
            }

            // console.log("search results", data_keys, maxNum, results);
            display_data("Search: '" + string + "'", results);
            //return results;
        };
        //Xeno x1016 X1066

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
            //console.log(arr);
            // console.log(page_holder);

            for (ii = 0; ii < page_holder.length; ii += 1) {
                if (ii !== arr[0]) {
                    // console.log(ii, arr[0]);
                    page_holder[ii].select[0][0].selected = true;
                }
            }

            //actual data
            display_data(dropdown_headers[arr[0]] + ': ' + page_holder[arr[0]].option_keys[arr[1]], dropdowns[
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
            dropdown_options = Object.keys(dropdowns[dropdown_headers[i]]).sort(sortPDXid);
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
        // console.log(searchTerms);
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

    global.build_page = build_sample_select;

    return false;

}(DATA_DISPLAY));