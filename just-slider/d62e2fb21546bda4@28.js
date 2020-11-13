export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# d3-simple-slider`
)});
  main.variable(observer()).define(["slider"], function(slider){return(
slider()
  .render()
)});
  main.variable(observer("slider")).define("slider", ["d3","width"], function(d3,width){return(
function slider() {
  return Object.assign(d3.sliderHorizontal()
    .min(0)
    .max(10)
    .step(1)
    .width(width)
    .displayValue(false)
    .on('onchange', console.log), {
    render() {
      return d3.create("svg")
          .attr("viewBox", [-20, -10, width + 40, 53])
          .call(this)
        .node();
    }
  });
}
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require('d3-selection', 'd3-simple-slider')
)});
  return main;
}
