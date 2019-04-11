/*global $ fetch loadchart DATA_DISPLAY jQuery*/
(function (global) {
    'use strict';

    const ID = "_id";
    const ALLOWPOST = true;
    const SPEACH_SPLIT = new RegExp('[^A-Za-z0-9]+', 'i');
    const URL_BASE = 'http://db.kinomecore.com/2.0.0/';
    const JOIN_STR = '|&|&|&|&|';

    let deepCopy;
    deepCopy = function (obj) {
        // if not array or object or is null return self
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        // set up the output object
        let newO;
        if (obj instanceof Array) {
            newO = obj.map(deepCopy);
        } else {
            newO = {};
            Object.keys(obj).forEach(function (key) {
                newO[key] = deepCopy(obj[key]);
            });
        }
        return newO;
    };

    const getByIds = function (getter) {
        return function (ids) {
            return global.expandData(ids.map(function (id) {
                return getter(id);
            }), true, getter);
        };
    };

    const getById = function (data) {
        let data_obj = {};
        data.forEach(function (data_elem) {
            data_obj[data_elem[ID]] = data_elem;
        });
        let getFunc = function (id) {
            return deepCopy(data_obj[id]);
        };

        getFunc.set = function (id, data) {
            data_obj[id] = data;
        };

        return getFunc;
    };

    const db_connect = function (url, data, method) {
        if (!method) {
            method = "GET";
        }
        // Default options are marked with *
        return fetch(url, {
            method: method, // *GET, POST, PUT, DELETE, etc.
            mode: "cors", // no-cors, cors, *same-origin
            cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
            credentials: "include", // include, *same-origin, omit
            headers: {
                "Content-Type": "application/json"
            },
            redirect: "follow", // manual, *follow, error
            referrer: "no-referrer", // no-referrer, *client
            body: JSON.stringify(data) // body data type must match "Content-Type" header
        }).then(function (response) {
            return response.json(); // parses JSON response into native Javascript objects
        });
    };

    const build = function (getter, saver) {
        //
        // The portions of this require an id or array of ids to
        // be passed in, followed by a function that returns an element to be
        // added to the page. This allows elements to be stored and updated
        // when data changes take place. The 3rd parameter is 'state_in' which
        // takes an object with one property. It will be mutated in place
        // adding a .clear function that removes the update need from the queue
        // and then a .change property that will be called when the display
        // update is called.
        //
        let innerBuild, array_build, ret_false;

        ret_false = function () {
            return false;
        };

        array_build = function (ids, builder, state_in) {
            state_in = state_in || {};
            let $thisElem = builder(ids.map(function (id) {
                return getter(id);
            }));
            let thisInd = saver.group.length;
            saver.group.push({
                id: ids.join(JOIN_STR),
                func: function () {
                    let $newElem = array_build(ids, builder);
                    $thisElem.replaceWith($newElem);
                    saver.group[thisInd].id = "";
                    saver.group[thisInd].func = ret_false;
                }
            });
            state_in.clear = function () {
                saver.group[thisInd].id = "";
                saver.group[thisInd].func = ret_false;
            };
            return $thisElem;
        };

        innerBuild = function (id, builder, state_in) {
            state_in = state_in || {};
            if (Array.isArray(id)) {
                return array_build(id, builder, state_in);
            }
            saver.ind[id] = saver.ind[id] || [];
            let thisInd = saver.ind[id].length;
            let $thisElem = builder(getter(id));
            saver.ind[id].push(function () {
                let $newElem = innerBuild(id, builder);
                $thisElem.replaceWith($newElem);
                saver.ind[id][thisInd] = ret_false;
                if (state_in.change && typeof state_in.change === 'function') {
                    state_in.change();
                }
            });

            state_in.clear = function () {
                saver.ind[id][thisInd] = ret_false;
            };

            return $thisElem;
        };

        return innerBuild;
    };

    const getUnique = function (data) {
        return function (key) {
            let names = {};
            data.forEach(function (entry) {
                names[entry[key]] = 1;
            });
            return Object.keys(names).filter((x) => x);
        };
    };

    const getIdList = function (data) {
        return function (filter_func) {
            return data.filter(filter_func).map((entry) => entry[ID]);
        };
    };

    const search = function (dictionary) {
        return function (string) {
            let results = {},
                searchArr = string.toLocaleLowerCase().split(SPEACH_SPLIT);

            // find hits
            searchArr.forEach(function (word, i) {
                if (dictionary.hasOwnProperty(word)) {
                    dictionary[word].forEach(function (id) {
                        results[id] = results[id] || 0;
                        results[id] += 2 - (i + 1) / searchArr.length;
                    });
                }
            });

            // return highest score first
            return Object.keys(results).sort((a, b) => results[b] - results[a]);
        };
    };

    const set = (function () {
        return function (changer, getter) {
            const postData = function (id, db, col, data_obj) {

                if (ALLOWPOST) {
                    return db_connect(URL_BASE + db + "/" + col + "/" + id, data_obj, "PATCH")
                        .then(function (resp) {
                            return resp.data[0];
                        });
                }

                // way of mimicing the post below without posting
                console.log(URL_BASE + db + "/" + col + "/" + id, data_obj);
                let data_in = getter(id);
                let parameters = Object.keys(data_obj);

                parameters.forEach(function (parameter) {
                    let miniParams = parameter.split(/\./);
                    let setPoint = data_in;
                    let finalKey = miniParams.pop(); // empties 'value'
                    miniParams.forEach(function (key) {
                        setPoint = setPoint[key];
                    });
                    setPoint[finalKey] = data_obj[parameter];
                });

                return Promise.resolve(data_in);
            };

            const combine_and_post = function (updates, db, col) {
                let by_id = {};
                updates.forEach(function (update) {
                    by_id[update.id] = by_id[update.id] || {};

                    // if this is a new key/value pair
                    if (typeof update.value === 'object') {
                        by_id[update.id][update.key] = update.value;
                    } else {
                        by_id[update.id][update.key + '.value'] = update.value;
                    }
                });

                return Object.keys(by_id).map((id) => postData(id, db, col, by_id[id]));
            };

            return function (update_arr, db, col) {
                //console.log(update_arr);
                return Promise.all(combine_and_post(update_arr, db, col)).then(function (objs) {
                    return objs.map(function (obj) {
                        //update global object with return
                        getter.set(obj[ID], obj);

                        //update parts of the page
                        changer.ind[obj[ID]].forEach(function (func) {
                            func();
                        });

                        //update group parts of the page
                        changer.group
                            .forEach(function (g_obj) {
                                if (g_obj.id.match(obj[ID])) {
                                    g_obj.func();
                                }
                            });

                        //return id
                        return obj[ID];
                    });
                });
            };
        };
    }());

    const add = (function () {
        return function (getter, resetFunc) {
            return function (obj, db, collection) {
                let objO = deepCopy(obj);
                let prom;
                if (ALLOWPOST) {
                    prom = db_connect(URL_BASE + db + "/" + collection, obj, "POST").then(function (ret) {
                        if (!ret.success) {
                            throw "Failed to Post";
                        }
                        objO[ID] = ret.data[0].id;
                        return objO;
                    });
                } else {
                    console.log(URL_BASE + db + "/" + collection, objO);
                    objO[ID] = "fake" + Math.random();
                    prom = Promise.resolve(objO);
                }

                return prom.then(function (obj_final) {
                    //update data status
                    getter.set(obj_final[ID], obj_final);
                    resetFunc(obj_final);

                    return obj_final;
                });
            };
        };
    }());

    const build_dictionary = (function () {
        let getWordsFromKeyVal, filterWords, words;

        filterWords = function (el, pos) {
            if (!el || el === "") { // gets rid of undefined
                return false;
            }
            return words.indexOf(el) === pos; // gets rid of repeats
        };

        getWordsFromKeyVal = function (kv_arr) {
            let i, wordsmini = [];
            for (i = 0; i < kv_arr.length; i += 1) {
                wordsmini = wordsmini.concat(kv_arr[i].key.split(SPEACH_SPLIT));
                wordsmini = wordsmini.concat(kv_arr[i].value.split(SPEACH_SPLIT));
            }
            return wordsmini;
        };

        return function (data) {
            let keys, dictionary = {};
            keys = [
                "description",
                "entry_data",
                "entry_metadata",
                "entry_name",
                "historical",
                "origin_id",
                "pdx_id"
            ];

            data.forEach(function (entry) {
                words = [];

                //Add the 'easy ones'
                words = words.concat(entry[keys[0]].split(SPEACH_SPLIT));
                words = words.concat(entry[keys[3]].split(SPEACH_SPLIT));

                //Add in the id, both with and without splitting
                words = words.concat([entry[keys[4]]]);
                words = words.concat([entry[keys[5]]]);
                words = words.concat(entry[keys[4]].split(SPEACH_SPLIT));
                words = words.concat(entry[keys[5]].split(SPEACH_SPLIT));

                //Add in the key value pairs
                // console.log(data[i], data[i][keys[1]]);
                words = words.concat(getWordsFromKeyVal(entry[keys[1]]));
                words = words.concat(getWordsFromKeyVal(entry[keys[2]]));

                //filter words list
                words = words.filter(filterWords);

                words.forEach(function (word) {
                    word = word.toLocaleLowerCase();
                    dictionary[word] = dictionary[word] || [];
                    dictionary[word].push(entry[ID]);
                });
            });

            return dictionary;
        };
    }());

    global.expandData = function (data, no_build, getter) {
        //data array comes in
        let data_methods_obj = {}, changer = {ind: {}, group: []}, dictionary;

        //set methods
        if (!no_build) {
            getter = getById(data);
            data_methods_obj.build = build(getter, changer);
        }
        let buildIt;

        buildIt = function () {
            data_methods_obj.list = getUnique(data);
            data_methods_obj.filter = getIdList(data);
            dictionary = build_dictionary(data);
            data_methods_obj.search = search(dictionary);
        };

        buildIt();

        data_methods_obj.clearUpdates = function () {
            changer = {ind: {}, group: []};
        };
        data_methods_obj.set = set(changer, getter);
        data_methods_obj.expandIDs = getByIds(getter);
        data_methods_obj.add = add(getter, function (item) {
            data.push(item);
            buildIt();
        });

        //return object with methods
        return data_methods_obj;
    };

    return global;
}(DATA_DISPLAY));