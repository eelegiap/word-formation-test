var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

// var newData = d3.range(1).map(function(n) {
//   return Math.random() * 1 + .01;
// }); 

// //l_converter.domain([0, 10]);
// //l_converter.range([0, 1000]);
// // Given any number between 0 and 10, convert it to a number between 0 and 1000 using a linear scale.

// console.log(newData);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink()
        .distance(function (d) {
            return (Math.random() + .3) * 600;
            // if (Number.isInteger(d.value)) {
            //     return d.value; Math.random;
            // }
            // else {
            //     return 100;
            // }
        })
        .strength(0.33))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.json("miserables.json", function (error, graph) {
    if (error) throw error;

    console.log(graph.links);

    var nodes = graph.nodes,
        nodeById = d3.map(nodes, function (d) { return d.id; }),
        links = graph.links,
        bilinks = [];

    links.forEach(function (link) {
        var s = link.source = nodeById.get(link.source),
            t = link.target = nodeById.get(link.target),
            i = {}; // intermediate node
        nodes.push(i);
        links.push({ source: s, target: i, score: 100 }, { source: i, target: t });
        bilinks.push([s, i, t]);
    });

    var link = svg.selectAll(".link")
        .data(bilinks)
        .enter().append("path")
        .attr("class", "link");

    var g = svg.selectAll("g")
        .data(nodes.filter(function (d) { return d.id; }))
        .enter()
        .append("g");

    var circle = g.append("circle")
        .attr("class", "node")
        .attr("r", function (d) {
            console.log("d", d);
            var rand_r = Math.random() * 50;
            // return Math.log(d.count * 10) * 10;
            return d.count * 5;
        })
        .attr("fill", function (d) { return color(d.group); })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    var label = g.append("text")
        .attr("font-size", "35px")
        .text(function (d) { return d.text; });

    simulation
        .nodes(nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(links);

    function ticked() {
        link.attr("d", positionLink);
        g.attr("transform", positionNode);
    }
});

function positionLink(d) {
    return "M" + d[0].x + "," + d[0].y
        + "S" + d[1].x + "," + d[1].y
        + " " + d[2].x + "," + d[2].y;
}

function positionNode(d) {
    return "translate(" + d.x + "," + d.y + ")";
}

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x, d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x, d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null, d.fy = null;
}