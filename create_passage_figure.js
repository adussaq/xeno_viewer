/*global $ fetch loadchart DATA_DISPLAY jQuery*/
(function (global) {
    'use strict';
    // var edit_entry, edit_modal, create_modal, open_modal, createPassageFigure, cleanDate, byDate, onNodeClick;

    const ID = "_id";
    const IGNORE_REGEX = /^\s*(none|-)\s*$/i;

    const clean_string = function (str) {
        //get rid of excess spaces and leading/trailing spaces
        return str.replace(/\s+/, " ").trim();
    };

    const cleanDate = function (dateObj) {
        let dateStr = clean_string(dateObj.value);
        let date = new Date(dateStr.replace(/[^\d\/]+/g, "").replace(/\/+/g, "/").replace(/^10\/210\/09$/, "10/21/09").replace(/8\/24\/812/, "8/24/12"));
        if (isNaN(date.getDate())) {
            console.warn("bad dateStr", dateStr);
        }
        return date;
    };

    let recurse_color;
    recurse_color = function (by_exp_id, nid, color) {
        by_exp_id[nid].color = color;
        if (by_exp_id[nid].next.length === 1) {
            recurse_color(by_exp_id, by_exp_id[nid].next[0], color);
        }
    };

    const date_color_order = function (by_exp_id) {
        //find minimum date to set
        const minimumDate = Object.keys(by_exp_id)
            .map((nid) => by_exp_id[nid].date && by_exp_id[nid].date.valueOf())
            .filter((x) => x)
            .reduce((a, b) => Math.min(a, b)) - 1000 * 60 * 60 * 24 * 2;

        // set minimum date, define all 'nexts', set types
        Object.keys(by_exp_id).forEach(function (nid) {
            if (!by_exp_id[nid].date || !by_exp_id[nid].date.valueOf()) {
                by_exp_id[nid].date = new Date(minimumDate);
                by_exp_id[nid].type = 'free';
            } else {
                by_exp_id[nid].type = 'fixed';
            }
            by_exp_id[nid].prior.forEach(function (oid) {
                by_exp_id[oid].next.push(nid);
            });
        });

        //find new color nodes defined as new branch or following a split
        const newColorsIds = Object.keys(by_exp_id)
            .filter((nid) => by_exp_id[nid].prior.length !== 1 || by_exp_id[by_exp_id[nid].prior[0]].next.length !== 1);

        // define color start points and propagate them
        const colors = global.generateColor(newColorsIds.length);
        newColorsIds.forEach(function (nid, i) {
            // assign colors
            recurse_color(by_exp_id, nid, colors[i]);
        });

        //finally order the nodes by date
        Object.keys(by_exp_id)
            .sort((a, b) => by_exp_id[a].date - by_exp_id[b].date)
            .forEach(function (nid, i) {
                by_exp_id[nid].order = i;
            });
    };

    const get_by_exp_id = function (entries) {
        let entry_by_ids = {
            exp_id: {},
            act_id: {}
        };
        entries.forEach(function (entry) {
            let exp_id_arr, old_id_arr, exp_id, date, c = 1;

            // get 'New Exp#'
            exp_id_arr = entry.entry_data.filter((obj) => obj.key.match(/^\s*New\s*Exp\s*#\s*$/i));

            // get 'Old Exp#'
            old_id_arr = entry.entry_data
                .filter((obj) => obj.key.match(/^\s*Old\s*Exp\s*#\s*$/i) && !obj.value.match(IGNORE_REGEX));

            // get date
            date = entry.entry_data.filter((obj) => obj.key.match(/^\s*Passage\s*Date\s*$/i)).map(cleanDate);
            if (date.length > 1) {
                date = new Date(date.reduce(function (a, b) {
                    return Math.max(new Date(a), new Date(b));
                }));
            } else if (date.length === 1) {
                date = new Date(date);
            } else {
                date = 0;
            }

            // ensure the correct number of matches in new exp #
            if (exp_id_arr.length === 1) {
                exp_id = clean_string(exp_id_arr[0].value);
            } else if (exp_id_arr.length > 1) {
                exp_id = exp_id_arr.map((kv) => clean_string(kv.value)).join('&');
            } else {
                exp_id = "undefined" + c;
                //make sure undefined does not repeat
                while (entry_by_ids.exp_id.hasOwnProperty(exp_id)) {
                    c += 1;
                    exp_id = "undefined" + c;
                }
            }

            exp_id = clean_string(exp_id);

            // initialize new id
            entry_by_ids.exp_id[exp_id] = entry_by_ids.exp_id[exp_id] || {
                self: [],
                next: [],
                prior: []
            };

            // initialize old ids
            old_id_arr.forEach(function (kv) {
                let old_id = clean_string(kv.value);
                entry_by_ids.exp_id[old_id] = entry_by_ids.exp_id[old_id] || {
                    self: [],
                    next: [],
                    prior: []
                };
            });

            //Finally store things
            entry_by_ids.act_id[entry[ID]] = entry;

            // self push id
            entry_by_ids.exp_id[exp_id].self.push(entry[ID]);

            // add in date sticking with newest
            entry_by_ids.exp_id[exp_id].date = entry_by_ids.exp_id[exp_id].date || date;
            entry_by_ids.exp_id[exp_id].date = new Date(Math.max(date, entry_by_ids.exp_id[exp_id].date));

            //prior concat add linked items to be later flattened
            entry_by_ids.exp_id[exp_id].prior = entry_by_ids.exp_id[exp_id].prior.concat(old_id_arr.map(function (kv) {
                return clean_string(kv.value);
            }));

        });
        return entry_by_ids;
    };

    const make_nodes_links = function (by_exp_id, flat, on_node_click) {
        let figureObj = {
            nodes: [],
            links: []
        };

        //create nodes (limit date to the 15th day of the month)
        Object.keys(by_exp_id).forEach(function (nid) {
            // add in each node
            figureObj.nodes.push({
                id: by_exp_id[nid].order,
                name: nid,
                date: new Date(by_exp_id[nid].date.getFullYear(), by_exp_id[nid].date.getMonth()).toGMTString(),
                from: by_exp_id[nid].color,
                type: by_exp_id[nid].type,
                click: function () {
                    on_node_click(flat[nid], nid);
                }
            });

            //add in each 'next' link
            by_exp_id[nid].next.forEach(function (nnid) {
                figureObj.links.push({
                    source: by_exp_id[nid].order,
                    target: by_exp_id[nnid].order,
                    type: "answeredby",
                    color: by_exp_id[nnid].color // link color
                });
            });

        });

        //sort these so the figure maker function will accept them
        figureObj.nodes = figureObj.nodes.sort((a, b) => a.id - b.id);
        figureObj.links = figureObj.links.sort((a, b) => a.source - b.source);

        return figureObj;
    };

    const flatten = function (by_ids) {
        let flat_obj = {};

        // first clean up basic object
        Object.keys(by_ids.exp_id).forEach(function (nid) {
            let figure_obj = {name: nid};
            const entry = by_ids.exp_id[nid];

            //set self ids
            figure_obj.self = entry.self.map((id) => ({id: id, circle: entry.order, name: nid}));

            //if no information on the node, set a name for display
            if (!figure_obj.self.length) {
                figure_obj.self.push({
                    id: undefined,
                    name: nid,
                    circle: entry.order
                });
            }

            flat_obj[nid] = figure_obj;
        });

        // now actually set next and prior
        Object.keys(by_ids.exp_id).forEach(function (nid) {
            const entry = by_ids.exp_id[nid];
            let figure_obj = flat_obj[nid];

            figure_obj.next = entry.next.map((cid) => flat_obj[cid].self).flat();
            figure_obj.prior = entry.prior.map((cid) => flat_obj[cid].self).flat();
        });

        return flat_obj;
    };

    global.createPassageFigure = function (entries, on_node_click, last) {

        // set quick reference for by experiment id with backwards links
        let entry_by_ids = get_by_exp_id(entries);

        // add in dates, colors and order
        date_color_order(entry_by_ids.exp_id);

        // flatten object for click function
        const flat = flatten(entry_by_ids);

        // set up state store
        if (last && typeof last === "object") {
            last.state = flat[last.name];
        }

        // create nodes and links
        return {
            figure: make_nodes_links(entry_by_ids.exp_id, flat, on_node_click)
        };
        // figObj = createPassageFigure(id_entry_data[ids[i]]["PDX Passage Info"], $info_elem);
        // // console.log("*****", figObj);
        // //throw "testing"
        // loadchart('timelinefig' + randNum, figObj);
    };
}(DATA_DISPLAY));