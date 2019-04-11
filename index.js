/*global fetch $ DATA_DISPLAY jQuery*/
(function (global) {
    'use strict';

    //declare functions
    var fetchJSON;

    fetchJSON = function (url) {
        return fetch(url, {
            mode: "cors",
            credentials: "include",
            cache: "reload"
        }).then(function (res) {
            return res.json();
        });
    };

    //Get stuff started
    (function () {
        var $pw = $('#data-request-body'), auth1, auth2, auth3 = [];

        //check if user is already logged in
        fetchJSON('http://db.kinomecore.com/auth/passages/passages').then(function (status) {
            auth1 = status.read;
            auth3.email = status.email;
            auth3.passages = status;
            return fetchJSON('http://db.kinomecore.com/auth/xenoline_annotations/v1');
        }).then(function (status) {
            auth2 = status.read;
            auth3.other = status;
            var fetcher = [];
            if (status.email || (auth1 && auth2)) {
                //actually get data
                if (auth1) {
                    fetcher.push(fetchJSON('http://db.kinomecore.com/2.0.0/xenoline_annotations/v1?all=true'));
                }
                if (auth2) {
                    fetcher.push(fetchJSON('http://db.kinomecore.com/2.0.0/passages/passages?all=true'));
                }
                if (fetcher.length) {
                    return Promise.all(fetcher);
                } else {
                    $pw.append($('<div>', {
                        class: "jumbotron",
                        html: '<h1 class="display-4">Data Unavailable</h1>' +
                                '<p class="lead">You do not have proper permissions to access this data. If you believe this is in error please contact the administrator, Dr. Christopher Willey.</p>'
                    }));
                    throw new Error("401: User not authenticated for accessing this data.");
                }
            }
            // prompt to login
            $pw.append($('<div>', {
                class: "jumbotron",
                html: '<h1 class="display-4">Login with UAB BlazerID</h1>' +
                        '<p class="lead">You will be redirected to the UAB login when you click below.</p>' +
                        '<p class="lead">' +
                        '<a class="btn btn-primary btn-lg" href="http://db.kinomecore.com/login?redirect=' +
                        encodeURIComponent(location.href) +
                        '" role="button">Login</a>' +
                        '</p>' +
                        '<hr />' +
                        "<p><i>" +
                        "Safari users: If you have cross-site tracking disabled this login will not work natively. This is due to login credentials being stored in cross-site enabled cookies. Please disable it or utilized Chrome or Firefox." +
                        "</i></p>"
            }));

            throw new Error("User not logged in.");
        }).then(function (dataArr) {
            dataArr = dataArr.map(function (x) {
                return x.data;
            }).reduce(function (a, b) {
                return a.concat(b);
            });

            global.build_page(dataArr, auth3);
        }).catch(function (err) {
            console.warn(err);
        });

        // var get_username = function () {
        //     return new Promise(function (resolve, reject) {
        //         $pw.append($('<div>', {
        //             class: 'form-body'
        //         }).append($('<form>', { // append to div form body
        //             class: "form-signin",
        //             html: '<h1 class="h3 mb-3 font-weight-normal">Please Enter Passphrase</h1>' +
        //                     '<label for="inputEmail" class="sr-only">Email address</label>' +
        //                     '<input type="password" id="inputName" class="form-control" placeholder="passphrapse" required autofocus>'
        //         }).append($('<button>', { // append to form
        //             class: "btn btn-lg btn-primary btn-block",
        //             type: "submit",
        //             text: 'Submit',
        //             click: function (evt) {
        //                 evt.preventDefault();
        //                 var phrase = evt.target.form[0].value;
        //                 load_string('http://138.26.31.155:8000/uabfile/' + phrase + '/key.uuid').then(function (key) {
        //                     resolve(phrase + '/' + key + '/');
        //                 }).catch(function (err) {
        //                     reject(err);
        //                 });
        //             }
        //         }))));
        //     });
        // };

        // get_username().then(function (parts) {
        //     $pw.empty().hide();
        //     Promise.all(files.map(function (base) {
        //         return 'http://138.26.31.155:8000/uabfile/' + parts + base;
        //     }).map(load_string)).then(function (data) {
        //         data = data.map(function (file) {
        //             return file.split("\n").map(function (x) {
        //                 return JSON.parse(x);
        //             });
        //         }).reduce(function (a, b) {
        //             return a.concat(b);
        //         });

        //         global.build_page(data);
        //     }).catch(function (err) {
        //         console.warn(err);
        //     });
        // }).catch(function () {
        //     $pw.empty().html("Incorrect, please reload and try again if you believe this is in error.");
        // });
        return;
    }());

    return false;
}(DATA_DISPLAY));