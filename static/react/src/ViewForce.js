/* Блок для вывода графа ************************************************************/

//var nodesList = []

function ForceLayout(containerID, id, graphFilter){
    scale = 550
    width = 600
    height = 600

    this.color = d3.scale.category20()

    this.force = d3.layout.force()
        .charge(-20)
        .linkDistance(30)
        .size([width, height])

    this.svg = d3.select(containerID)
        .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
                //.attr('transform', 'translate(15,15)')

    if (graphFilter) {
        //console.log('graphfileter > ',graphFilter)
        //this.update(id, graphFilter)
    }
}

ForceLayout.prototype.update = function(gid, graphFilter) {
    nodeRadius = graphFilter.options.radius
    //console.log(this.constructor.displayName,' > ',nodeRadius)

    // Преобразовываем массив json-данных graphFilter для передачи через url 
    //console.log('graphFilter attributesState', graphFilter.attributesState)
    graphFilter = encodeURIComponent(JSON.stringify(graphFilter))

    var url = '/json-force-react/' + gid + '/' + graphFilter + '/'

    d3.json(url, function(error, graph) {
        this.force
            .nodes(graph.nodes)
            .links(graph.links)
            .start()


        var link = this.svg.selectAll("line").data(graph.links)
        link.enter().append("line")
            .attr("class", "link")
            //.style("stroke", function(d) { return color(d.attribute); })
            //.style("stroke-width", function(d) { return Math.sqrt(d.attribute); })
            //.text(function(d) { return d.title; });
        link.exit().remove()

        var node = this.svg.selectAll("circle").data(graph.nodes)
        node.enter().append("circle")
            //.attr("id", function(d) { return d.id })
            .attr("class", "node")
            //.attr("r", 5)
            .attr("r", function(d) { 
                var attr = 0
                //console.log('nrnrnr > ',nodeRadius)
                if (nodeRadius == 'byDegree') {
                    attr = d.degree
                } else {
                    //console.log('aaaa > ',d.numberOfAttributes)
                    attr = d.numberOfAttributes
                }
                return attr/3 + 5 
            })
            //.style("fill", function(d) { return this.color(d.attribute); })
            .call(this.force.drag)
            /*
            .style("fill", function() {
                //console.log('nodeslistrest > ',nodesListReset)
                var color = false
                if (nodesListReset === true) {
                    color = "steelblue"
                    //nodesList = []
                }
                console.log(' > ',color)
                return color
            })
            */
            .on('click', function(d) {
                if (inArray(d.id, nodesList)) {
                    nodesList.pop(d.id)
                    d3.select(this).style("fill", "steelblue")
                } else {
                    nodesList.push(d.id)
                    d3.select(this).style("fill", "orange")
                }
            })

        node.append("title")
            .text(function(d) { 
                var attributes = d.attributes
                //console.log(attributes)
                return d.data + '_' + d.id + ': ' + d.degree + '. Свойства: ' + attributes 
            }) 
            //.attr("transform", function(d){ return "translate("+d.x+","+d.y+")"; })

        this.force.on("tick", function() {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })        
        })

        node.exit().remove()
    }.bind(this))
    //console.log(' --------------------------------------------------------- ^ ','graph has been updated')
}
/* /Блок для вывода графа ************************************************************/

var toggleColor = (function(){
   var currentColor = "lightblue";

    return function(){
        currentColor = currentColor == "lightblue" ? "magenta" : "lightblue";
        d3.select(this).style("fill", currentColor);
    }
})();

