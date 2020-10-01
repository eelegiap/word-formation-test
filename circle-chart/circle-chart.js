// set the dimensions and margins of the graph
var margin = { top: 10, right: 30, bottom: 40, left: 100 },
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Parse the Data
d3.csv("data.csv", function (data) {

    // sort data
    data.sort(function (b, a) {
        return a.value + b.value;
    });

    // Add X axis
    var x = d3.scaleLinear()
        .domain([0, 2500])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Y axis
    var y = d3.scaleBand()
        .range([0, height])
        .domain(data.map(function (d) { return d.word; }))
        .padding(1);
    svg.append("g")
        .call(d3.axisLeft(y))

    // Lines
    svg.selectAll("myline")
        .data(data)
        .enter()
        .append("line")
        .attr("x1", function (d) { return x(d.value); })
        .attr("x2", x(0))
        .attr("y1", function (d) { return y(d.word); })
        .attr("y2", function (d) { return y(d.word); })
        .attr("stroke", "grey")

    // Circles
    svg.selectAll("mycircle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d.value); })
        .attr("cy", function (d) { return y(d.word); })
        .attr("r", "7")
        .style("fill", function (d) {
            if (d.type == 'count') {
                return "blue";
            }
            else {
                return "red";
            }
        })
        .attr("stroke", "black")
})
