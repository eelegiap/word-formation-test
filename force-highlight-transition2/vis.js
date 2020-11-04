// List of groups (here I have one group per column)
var color_groups = ["Color by level", "Color by part of speech"]

// add the options to the color button
d3.select("#colorButton")
    .selectAll('myOptions')
    .data(color_groups)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button

// add the options to the color button
d3.select("#labelButton")
    .selectAll('myOptions')
    .data(['Show labels', 'Hide labels'])
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button

// set radius of circle
const R = 14;

var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
svg = d3.select('svg');

// load data
d3.json("zhiv_data.json", function (error, graph) {
    // get total word count
    total_word_count = graph.nodes.length;
    d3.select("#count").text(total_word_count);

    // size svg accordingly
    svg.attr('width', 1200)
    svg.attr('height', function() { return (1000) })
    width = +svg.attr('width'),
    height = +svg.attr('height');

    // get normalized values for link placement
    normalized_values = getNormalized(graph);

    // enter the simulation!!!
    simulation = d3.forceSimulation()
        .nodes(graph.nodes)
        .force('link', d3.forceLink().id(d => d.id)
            .distance(function (d, i) {
                return (3 / (normalized_values[i] + .01))*(150/75)
            }))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2))
        .on('tick', ticked);

    simulation.force('link')
        .links(graph.links);

    link = svg.selectAll('line')
        .data(graph.links)
        .enter().append('line');

    link
        .attr('class', 'link');

    node = svg.selectAll('.node')
        .data(graph.nodes)
        .enter().append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));;

    node.append('circle')
        .attr('r', R)
        .attr("fill", function (d, i) {
            return get_level_color(d.level, i)
        })
        .on('mouseover.tooltip', function (d) {
            tooltip.transition()
                .duration(300)
                .style("opacity", .8);
            tooltip.html("<b>Word: </b>" + d.id + "<br>" +
                "<b>Translation: </b>" + d.translation + "<br>" +
                "<b>POS: </b>" + d.pos + "<br>" +
                "<b>Count: </b>" + d.count + "<br>" +
                "<b>Level: </b>" + d.level)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 10) + "px")
                .style("padding", "5px");
        })
        .on('mouseover.fade', fade(0.1))
        .on("mouseout.tooltip", function () {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        })
        .on('mouseout.fade', fade(1))
        .on("mousemove", function () {
            tooltip.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 10) + "px");
        })
        .on('dblclick', releasenode)


    node.append('text')
        .attr('x', 0)
        .attr('dy', '.35em')
        .attr("display", "block")
        .text(d => d.id);

    function ticked() {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    }
    function releasenode(d) {
        d.fx = null;
        d.fy = null;
    }

    const linkedByIndex = {};
    graph.links.forEach(d => {
        linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
    });

    function isConnected(a, b) {
        return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
    }

    function fade(opacity) {
        return d => {
            node.style('stroke-opacity', function (o) {
                const thisOpacity = isConnected(d, o) ? 1 : opacity;
                this.setAttribute('fill-opacity', thisOpacity);
                return thisOpacity;
            });
            link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));
        };
    }
    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
    }

    function getNormalized(graph) {
        var val_total = 0
        // find average
        for (d of graph.nodes) {
            val_total += parseFloat(d.count);
        }
        var mean = val_total / graph.nodes.length;
    
        // find standard dev
        var variance_sum = 0;
        for (d of graph.nodes) {
            var count = parseFloat(d.count);
            variance_sum += (count - mean) ** 2;
        }
        var variance = variance_sum / graph.nodes.length;
        var std_dev = Math.sqrt(variance);
    
        // calc z-scores of all counts
        var z_scores = []
        for (d of graph.nodes) {
            var z_score = (parseFloat(d.count) - mean) / std_dev;
            z_scores.push(z_score);
        }
        // make 0 to 1
        normalized_values = []
        var min = Math.min.apply(Math, z_scores);
        var max = Math.max.apply(Math, z_scores);
    
        for (i = 0; i < graph.nodes.length; i++) {
            var normalized_val = (z_scores[i] - min) / (max - min);
            normalized_values.push(normalized_val);
        }
        return normalized_values.sort().reverse();
        }

    // A function that update the chart
    // https://www.d3-graph-gallery.com/graph/line_select.html
    function colorUpdate(selectedGroup) {
        circles = d3.selectAll("circle");
        if (selectedGroup == 'Color by part of speech') {
            d3.select("#levellegend").style("display", "none");
            d3.select("#poslegend").style("display", "block");
            circles
                .transition()
                .duration(750)
                .attr("fill", function (d, i) {
                    return get_pos_color(d.pos, i)
                })
        }
        if (selectedGroup == 'Color by level') {
            d3.select("#levellegend").style("display", "block")
            d3.select("#poslegend").style("display", "none")
            circles
                .transition()
                .duration(750)
                .attr("fill", function (d, i) {
                    return get_level_color(d.level, i)
                })
            }
        }
    // when the dropdown is changed, change color
    d3.select("#colorButton").on("change", function (d) {
        // recover the option that has been chosen
        var selectedOption = d3.select(this).property("value")
        // run the updateChart function with this selected option
        colorUpdate(selectedOption)
    })

    function labelUpdate(selectedGroup) {
        var current_state = node.select("text").attr("display");
        node.select("text")
            .transition()
            .attr("display",
                function () {
                    if (current_state == 'block') {
                        return "none"
                    }
                    else {
                        return "block"
                    }
                })
    }
    // when the dropdown is changed, change label
    d3.select("#labelButton").on("change", function (d) {
        // recover the option that has been chosen
        var selectedOption = d3.select(this).property("value")
        // run the updateChart function with this selected option
        labelUpdate(selectedOption)
    })
    data = graph.nodes;
})
// change from radial view to linear view
function RadToLin() {
    console.log("updating...");
    // get original positions of data
    originalCoords = []
    d3.selectAll('.node').each(function (d) {
        var string = d3.select(this).attr("transform");
        originalCoords.push(string);
    });

    // make linear ticks
    linearXs = []
    for (i = 0; i < data.length; i++) {
        if (i == 0) {
            scaled_x = Math.log10(1 / (normalized_values[i]))
        }
        else {
            scaled_x = Math.log10(1 / (normalized_values[i] + .0001))
        };
        linearXs.push((scaled_x / 5) * width + 50)
    };
    // density data
    densityXs = []
    for (i = 0; i < data.length; i++) {
        var val1 = linearXs[i];
        var counter = 0;
        for (j = 0; j < data.length; j++) {
            var val2 = linearXs[j];
            if ((val2 > (val1 - R * 2)) && val2 < (val1 + R * 2)) {
                counter++;
            }
        }
        densityXs.push(counter);
    }
console.log('densityx',densityXs);
    svg.append("line")
        .attr("class", "line")
        .attr("opacity", 0)
        .attr("x1", 0)
        .attr("y1", height / 2)
        .attr("x2", width)
        .attr("y2", height / 2)
        .style("stroke", "lightgrey")
        .transition()
        .duration(2000)
        .attr("opacity", 1);

    d3.selectAll('.node')
        .transition()
        .duration(1000)
        .attr("transform", function (d, i) {
            // xs
            var xrandomness = 0
            if (densityXs[i] > 20) {
                var xrandomness = Math.random() * 400;
            }
            var new_x = linearXs[i] + xrandomness;
            // ys
            var yrandomness = 0;
            if (i > 1) {
                var yrandomness = (Math.random() - .5) * densityXs[i] * 75;
            }

            var new_y = height / 2 + yrandomness;

            if ((new_y > height) || new_y < 0) {
                new_y = Math.random() * (height/2 - 25) + 200;
            }
            return "translate(" + new_x + "," + new_y + ")";
        });


    // simulation.alpha(1).restart();

    simulation
        .force('charge', d3.forceManyBody().strength(-30000));
    simulation.nodes(data)
        .on("tick", tick)
    simulation.alpha(1).restart();

    function tick() {
        node.on(function (d) { d.x = d.originalX; }) //constrains/fixes x-position
        node
            // .attr("cx", function (d) { return d.x = Math.max(R, Math.min(width - R, d.x)); });
            .attr("cy", function (d) { return d.y = Math.max(R, Math.min(height - R, d.y)); });
    }
};

function LinToRad() {
    d3.selectAll('.node')
        .transition()
        .duration(1000)
        .attr("transform", function (d, i) {
            return originalCoords[i];
        });

    d3.selectAll(".line")
        .transition()
        .duration(1000)
        .attr("opacity", 0)
}

function get_pos_color(pos, i) {
    if (i == 0) {
        return "white";
    }
    if (pos == "noun") {
        color = "#3da5d9"
    }
    if (pos == "adj") {
        color = "#ffd166"
    }
    if (pos == "verb") {
        color = "#ef476f"
    }
    return color;
}
function get_level_color(level, i) {
    if (i == 0) {
        return "white";
    }
    if (level == "1E") {
        color = "#00ad43"
    }
    if (level == "2I") {
        color = "#3da5d9"
    }
    if ((level == "3A") || (level == "3AU")) {
        color = "#69359c"
    }
    if ((level == "4SU") || (level == "4S")) {
        color = "#ffa41c"
    }
    return color;
}