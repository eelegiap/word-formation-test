var width = 1250,
height = 600,
padding = 6, // separation between nodes
maxRadius = 12;

var n = 20, // total number of nodes
m = 3; // number of distinct clusters

// var x = d3.scale.ordinal()
// .domain(d3.range(m))
// .rangePoints([0, width], 1);

d3.json("multi-foci-data.json", function (error, graph) {

    console.log('graph',graph);
    var nodes = [];
    for (const d of graph) {
        // if (d.color_id == 0) {
        //     var bubble_color = "white"
        // }
      nodes.push({
        radius: d.radius * 70,
        id: d.color_id,
        color: color(d.color_id),
        cx: x(d.color_id),
        cy: height / 2,
        text: d.text
      });
    };
    ;
    console.log('nodes1',nodes);
data = [2,4,5,7,12,123,352,1000];
table = d3.select("#content")
        .append("table")
        .property("border","1px");
d3.select("#myCheckbox").on("change",update);
update();


function update(){
    if(d3.select("#myCheckbox").property("checked")){
        newData = data.filter(function(d,i){return d % 2 == 0;});
    } else {
        newData = data;			
    }	
    
    newRows = table.selectAll("tr")
            .data(newData,function(d){return d;});
    newRows.enter()
        .append("tr")
        .append("td")
        .text(function(d){return d;});		
    newRows.exit()
        .remove();			
}
});