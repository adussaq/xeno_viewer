/*global $ DATA_DISPLAY jQuery*/
(function (global) {
    'use strict';

    //declare variables
    var files = [
        "1.0PDX_ID-NanoStringLabels_JCA.json",
        "1.0PDX_ID-SN-Affy-IllumID_JCAv2.json",
        "2.0PDXID_MTDrugRespD7_JCA.json",
        "2.0PDXID_MTDrugRespD14_JCA.json",
        "2.0PDXID_SphDrugRespD7_JCA.json",
        "PDX Summary Table CDW.json",
        "radiation response data.json",
        "TMZ response data.json",
        "Xenograft summary 011119 GYG_other.json",
        "Xenograft summary 011119 GYG.json",
        "IC Survival Data.json",
        "STR for PDX database 2.13.19.json"
    ];

    //declare functions
    var load_string;

    load_string = function (url) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                dataType: "text",
                url: url,
                success: resolve,
                error: function (err) {
                    console.warn(err);
                    reject("Failed to get: " + url);
                }
            });
        });
    };

    //Get stuff started
    (function () {
        var $pw = $('#data-request-body');

        var get_username = function () {
            return new Promise(function (resolve, reject) {
                $pw.append($('<div>', {
                    class: 'form-body'
                }).append($('<form>', { // append to div form body
                    class: "form-signin",
                    html: '<h1 class="h3 mb-3 font-weight-normal">Please Enter Passphrase</h1>' +
                            '<label for="inputEmail" class="sr-only">Email address</label>' +
                            '<input type="password" id="inputName" class="form-control" placeholder="passphrapse" required autofocus>'
                }).append($('<button>', { // append to form
                    class: "btn btn-lg btn-primary btn-block",
                    type: "submit",
                    text: 'Submit',
                    click: function (evt) {
                        evt.preventDefault();
                        var phrase = evt.target.form[0].value;
                        load_string('http://138.26.31.155:8000/uabfile/' + phrase + '/key.uuid').then(function (key) {
                            resolve(phrase + '/' + key + '/');
                        }).catch(function (err) {
                            reject(err);
                        });
                    }
                }))));
            });
        };

        get_username().then(function (parts) {
            $pw.empty().hide();
            Promise.all(files.map(function (base) {
                return 'http://138.26.31.155:8000/uabfile/' + parts + base;
            }).map(load_string)).then(function (data) {
                data = data.map(function (file) {
                    return file.split("\n").map(function (x) {
                        return JSON.parse(x);
                    });
                }).reduce(function (a, b) {
                    return a.concat(b);
                });

                global.build_page(data);
            }).catch(function (err) {
                console.warn(err);
            });
        }).catch(function () {
            $pw.empty().html("Incorrect, please reload and try again if you believe this is in error.");
        });
        return;
    }());

    return false;
}(DATA_DISPLAY));