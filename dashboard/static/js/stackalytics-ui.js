/*
 Copyright (c) 2013 Mirantis Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
 implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

function createTimeline(data) {
    var plot = $.jqplot('timeline', data, {
        gridPadding: {
            right: 35
        },
        cursor: {
            show: false
        },
        highlighter: {
            show: true,
            sizeAdjust: 6
        },
        axes: {
            xaxis: {
                tickRenderer: $.jqplot.CanvasAxisTickRenderer,
                tickOptions: {
                    fontSize: '8pt',
                    angle: -90,
                    formatString: '%b \'%y'
                },
                renderer: $.jqplot.DateAxisRenderer,
                tickInterval: '1 month'
            },
            yaxis: {
                min: 0,
                label: ''
            },
            y2axis: {
                min: 0,
                label: ''
            }
        },
        series: [
            {
                shadow: false,
                fill: true,
                fillColor: '#4bb2c5',
                fillAlpha: 0.3
            },
            {
                shadow: false,
                fill: true,
                color: '#4bb2c5',
                fillColor: '#4bb2c5'
            },
            {
                shadow: false,
                lineWidth: 1.5,
                showMarker: true,
                markerOptions: { size: 5 },
                yaxis: 'y2axis'
            }
        ]
    });
}

function renderTimeline(options) {
    $(document).ready(function () {
        $.ajax({
            url: make_uri("/api/1.0/stats/timeline", options),
            dataType: "json",
            success: function (data) {
                createTimeline(data["timeline"]);
            }
        });
    });
}

function renderTableAndChart(url, container_id, table_id, chart_id, link_param, table_column_names) {

    $(document).ready(function () {

        $.ajax({
            url: make_uri(url),
            dataType: "json",
            success: function (data) {

                var tableData = [];
                var chartData = [];

                var limit = 10;
                var aggregate = 0;
                var index = 1;
                var i;

                data = data["stats"];

                if (data.length == 0) {
                    $("#" + container_id).hide();
                    return;
                }

                for (i = 0; i < data.length; i++) {
                    if (i < limit - 1) {
                        chartData.push([data[i].name, data[i].metric]);
                    } else {
                        aggregate += data[i].metric;
                    }

                    var index_label = index;
                    if (data[i].name == "*independent") {
                        index_label = "";
                    } else {
                        index++;
                    }
                    if (!data[i].link) {
                        if (data[i].id) {
                            data[i]["link"] = make_link(data[i].id, data[i].name, link_param);
                        } else {
                            data[i]["link"] = data[i].name
                        }
                    }
                    data[i]["index"] = index_label;
                    tableData.push(data[i]);
                }

                if (i == limit) {
                    chartData.push([data[i - 1].name, data[i - 1].metric]);
                } else if (i > limit) {
                    chartData.push(["others", aggregate]);
                }

                if (!table_column_names) {
                    table_column_names = ["index", "link", "metric"];
                }
                var tableColumns = [];
                var sort_by_column = 0;
                for (i = 0; i < table_column_names.length; i++) {
                    tableColumns.push({"mData": table_column_names[i]})
                    if (table_column_names[i] == "metric") {
                        sort_by_column = i;
                    }
                }

                if (table_id) {
                    $("#" + table_id).dataTable({
                        "aLengthMenu": [
                            [10, 25, 50, -1],
                            [10, 25, 50, "All"]
                        ],
                        "aaSorting": [
                            [ sort_by_column, "desc" ]
                        ],
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aaData": tableData,
                        "aoColumns": tableColumns
                    });
                }

                if (chart_id) {
                    var plot = $.jqplot(chart_id, [chartData], {
                        seriesDefaults: {
                            renderer: jQuery.jqplot.PieRenderer,
                            rendererOptions: {
                                showDataLabels: true
                            }
                        },
                        legend: { show: true, location: 'e' }
                    });
                }
            }
        });
    });
}

function render_bar_chart(chart_id, chart_data) {
    $.jqplot(chart_id, chart_data, {
        seriesDefaults: {
            renderer: $.jqplot.BarRenderer,
            rendererOptions: {
                barMargin: 1
            },
            pointLabels: {show: true}
        },
        axes: {
            xaxis: {
                renderer: $.jqplot.CategoryAxisRenderer,
                label: "Age"
            },
            yaxis: {
                label: "Count"
            }
        }
    });
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

function make_link(id, title, param_name) {
    var options = {};
    options[param_name] = encodeURIComponent(id).toLowerCase();
    var link = make_uri("/", options);
    return "<a href=\"" + link + "\">" + title + "</a>"
}

function make_uri(uri, options) {
    var ops = {};
    $.extend(ops, getUrlVars());
    if (options != null) {
        $.extend(ops, options);
    }
    var str = $.map(ops,function (val, index) {
        return index + "=" + val;
    }).join("&");

    return (str == "") ? uri : uri + "?" + str;
}
