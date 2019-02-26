/*global DATA_DISPLAY*/
(function (global) {
    'use strict';

    var generateColor;

    // example usage:

    generateColor = function (colorCount) {

        // var colors = ["#e6194B", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#42d4f4", "#f032e6", "#bfef45", "#fabebe", "#469990", "#e6beff", "#9A6324", "#fffac8", "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#a9a9a9"];
        var colors = ["#ff5103", "#0042e7", "#d2a517", "#9a89b4", "#a21636", "#8c2f63", "#006a71", "#325e00", "#7cbaff", "#0072e6", "#00a2c8", "#00aea0", "#009e38", "#82400f", "#006840", "#515442", "#fc2d44", "#da239b", "#c7a675", "#83ac00", "#83976d", "#614682", "#694a53", "#b137f0", "#d9764c", "#c0710c", "#a51400", "#862593", "#7e4134", "#674e21", "#eb6382", "#aa7dd7", "#bb8091", "#006da2", "#938073", "#7a6b00", "#535062"];
        var out = [], i;

        for (i = 0; i < colorCount; i += 1) {
            out.push(colors[i % colors.length]);
        }
        return out;
    };

    global.generateColor = generateColor;

}(DATA_DISPLAY));

