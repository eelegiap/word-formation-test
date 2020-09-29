var width = 1150,
    height = 600,
    padding = 6, // separation between nodes
    maxRadius = 12;

var n = 20, // total number of nodes
    m = 3; // number of distinct clusters

var color = d3.scale.category10()
    .domain(d3.range(m));

var x = d3.scale.ordinal()
    .domain(d3.range(m))
    .rangePoints([0, width], 1);

d3.json("multi-foci-data.json", function (error, graph) { 
    // new version
    var nodes = [];
    for (const d of graph) {
        console.log('d', d);
        nodes.push({
            radius: d.radius * 60,
            color: color(d.color_id),
            cx: x(d.color_id),
            cy: height / 2,
            text: d.text
        });
      };
    console.log('newndes',nodes);
;

var force = d3.layout.force()
    .nodes(nodes)
    .size([width, height])
    .gravity(0)
    .charge(0)
    .on("tick", tick)
    .start();

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var g = svg.selectAll("g")
    .data(nodes).enter()
    .append("g");
    
var circle = g
    .append("circle")
    .attr("r", function(d) { return d.radius; })
    .style("fill", function(d) { return d.color; })
    .call(force.drag);
    
var label = g
    .append("text")
    .style("font-size", function(d) {
        // return d.radius/2 + "px";
        return "20px";
    })
    .attr("class", "label")
    .text(function(d) {
        return d.text;
    });


function tick(e) {
  circle
      .each(gravity(.2 * e.alpha))
      .each(collide(.5))
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
 label
      .each(gravity(.2 * e.alpha))
      .each(collide(.5))
      .attr("x", function(d) { return d.x - d.radius*.8; })
      .attr("y", function(d) { return d.y; });
}

// Move nodes toward cluster focus.
function gravity(alpha) {
  return function(d) {
    d.y += (d.cy - d.y) * alpha;
    d.x += (d.cx - d.x) * alpha;
  };
}

// Resolve collisions between nodes.
function collide(alpha) {
  var quadtree = d3.geom.quadtree(nodes);
  return function(d) {
    var r = d.radius + maxRadius + padding,
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + (d.color !== quad.point.color) * padding;
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
};

});

