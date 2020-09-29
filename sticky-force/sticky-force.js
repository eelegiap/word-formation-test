var width = 1200,
    height = 800;

var force = d3.layout.force()
    .size([width, height])
    .charge(-400)
    .linkDistance(200)
    .on("tick", tick);

var drag = force.drag()
    .on("dragstart", dragstart);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

d3.json("graph.json", function (error, graph) {
    if (error) throw error;

    force
        .nodes(graph.nodes)
        .links(graph.links)
        .start();

    force.gravity(0.05);

    link = link.data(graph.links)
        .enter().append("line")
        .attr("class", "link")
        .style("opacity", ".33")

    node = node.data(graph.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("stroke-width", "1.5")
        .attr("stroke", "#000")
        .attr("r", function (d, i) {
            var rad_factor = Math.log(d.count);
            var count = d.count;
            console.log(count);
            return count / 3;
        })
        .attr("fill", function (d) {
            if (d.level == "1E") {
                color = "#32CD32"
            }
            if (d.level == "2I") {
                color = "blue"
            }
            if (d.level == "3A") {
                color = "purple"
            }
            return color;
        })
        .style("opacity", ".50")
        .on("dblclick", dblclick)
        .call(drag);

    labels = svg.selectAll("text")
        .data(graph.nodes)
        .enter().append('text')
        .attr("class", "label")
        .text(function (d, i) {
            console.log('word:', graph.nodes[i].txt);
            return graph.nodes[i].txt
        });

});

function tick() {
    link.attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    node.attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });

    labels.attr('x', function (d) { return d.x - 35; })
        .attr('y', function (d) { return d.y + 5; });
}

function dblclick(d) {
    d3.select(this).classed("fixed", d.fixed = false).style("opacity",".5");
}

function dragstart(d) {
    d3.select(this).classed("fixed", d.fixed = true).style("opacity",".75");
}
