



var width = 1200,
height = 1000,
padding = 1.5, // separation between same-color nodes
clusterPadding = 6, // separation between different-color nodes
maxRadius = 12;

var color = d3.scale.ordinal()
.range(["#7A99AC", "#E4002B"]);



d3.text("yasnadata.csv", function (error, text) {
if (error) throw error;
var colNames = "text,size,pos,level,translation\n" + text;
var data = d3.csv.parse(colNames);

data.forEach(function (d) {
    d.size = +d.size;
});


//unique cluster/group id's
var cs = [];
data.forEach(function (d) {
    if (!cs.contains(d.group)) {
        cs.push(d.group);
    }
});

var n = data.length, // total number of nodes
    m = cs.length; // number of distinct clusters

//create clusters and nodes
var clusters = new Array(m);
var nodes = [];
for (var i = 0; i < n; i++) {
    nodes.push(create_nodes(data, i));
}

var force = d3.layout.force()
    .nodes(nodes)
    .size([width, height])
    .gravity(.02)
    .charge(0)
    .on("tick", tick)
    .start();

var svg = d3.select("#vis").append("svg")
    .attr("width", width)
    .attr("height", height);

// try making color gradient
var color = d3.scale.linear()
    .domain([0, 9])
    .range(["yellow", "tomato"]);
// try making color gradient

// Define the div for the tooltip
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var node = svg.selectAll("circle")
    .data(nodes)
    .enter().append("g")
    // .on("mouseover", mouseover)
    // .on("mouseout", mouseout)
    .call(force.drag);


node.append("circle")
    .attr("opacity", .9)
    // .attr('fill', function (d, i) { return color(i); })
    .attr('fill',function(d) {
        if (d.level == "1E") {
            color = "#32CD32"
        }
        if (d.level == "2I") {
            color = "blue"
        }
        if (d.level == "3A") {
            color = "purple"
        }
        if (d.level == "4SU") {
            color = "orange"
        }
        return color;
    })
    .attr("r", function (d) { return d.radius });
node.append("text")
    .attr("dy", ".3em")
    .style("text-anchor", "middle")
    .style("font-size", function (d) {return Math.log(d.radius) * 5 + "px"; })
    .text(function (d) { return d.text });
    
node.on("mouseover", function (d, i) {
        var string = d3.select(this).attr("transform");
        var translate = string.substring(string.indexOf("(") + 1, string.indexOf(")")).split(",");
        div.transition()
            .duration(100)
            .style("opacity", .9);
        var f = d3.format(".1f");
        div.html("Word: <b>" + d.text + "</b><br/>" + 
                "Part of speech: " + d.pos + "<br/>" +
                "Translation: " + d.translation + "<br/>" +
                "Count: " + f(d.radius) + "<br/>" +
                "Level: " + d.level)
            .style("font-size", "16px")
            .style("left", (parseFloat(translate[0]) - .25 * d.radius) + "px")
            .style("top", (parseFloat(translate[1])) + "px");
        // change classes
        d3.selectAll("g")
            .classed("selected", function (e, j) { return j == i; })
            .classed("notselected", function (e, j) { return j != i; });
    })
    .on("mouseout", function (d) {
        div.transition()
            .duration(100)
            .style("opacity", 0);
        d3.selectAll("g").attr("class", "selected");
    });;

// function mouseover() {
//     d3.select(this).select("circle").transition()
//         .duration(200)
//         .attr("opacity", 1);
//   }

//   function mouseout() {
//     d3.select(this).select("circle").transition()
//         .duration(750)
//   }


function create_nodes(data, node_counter) {
    console.log(node_counter);
    var i = cs.indexOf(data[node_counter].group),
        r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius,
        d = {
            cluster: i,
            radius: Math.log(data[node_counter].size)*20,
            text: data[node_counter].text,
            pos: data[node_counter].pos,
            level: data[node_counter].level,
            translation: data[node_counter].translation,
            x: Math.cos(i / m * 2 * Math.PI) * 200 + width / 2 + Math.random(),
            y: Math.sin(i / m * 2 * Math.PI) * 200 + height / 2 + Math.random()
        };
    if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
    return d;
};



function tick(e) {
    node.each(cluster(10 * e.alpha * e.alpha))
        .each(collide(.5))
        .attr("transform", function (d) {
            var k = "translate(" + d.x + "," + d.y + ")";
            return k;
        })

}

// Move d to be adjacent to the cluster node.
function cluster(alpha) {
    return function (d) {
        var cluster = clusters[d.cluster];
        if (cluster === d) return;
        var x = d.x - cluster.x,
            y = d.y - cluster.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + cluster.radius;
        if (l != r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            cluster.x += x;
            cluster.y += y;
        }
    };
}

// Resolves collisions between d and all other circles.
function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    return function (d) {
        var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function (quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== d)) {
                var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
                if (l < r) {
                    l = (l - r) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
    };
}
});

Array.prototype.contains = function (v) {
for (var i = 0; i < this.length; i++) {
    if (this[i] === v) return true;
}
return false;
};
