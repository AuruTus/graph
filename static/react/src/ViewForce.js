
/* Блок для вывода графа ************************************************************/

var nodesList = []
var nodesListReset = false

function ForceLayout(containerID, id, attributesFilter){
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
}

ForceLayout.prototype.update = function(gid, graphFilter) {
    // Преобразовываем массив json-данных graphFilter для передачи через url 
    //console.log('graphFilter attributesState', graphFilter.attributesState)
    graphFilter = encodeURIComponent(JSON.stringify(graphFilter))
    //console.log('graphFilter', graphFilter)

    var url = '/json-force/' + gid + '/' + graphFilter + '/'
    
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
            .attr("r", 5)
            //.style("fill", function(d) { return this.color(d.attribute); })
            .call(this.force.drag)
            .style("fill", function() {
                var color = false
                if (nodesListReset === true) {
                    color = "steelblue"
                    nodesList = []
                    nodesListReset === false
                }
                console.log(' > ',color)
                return color
            })
            .on('click', function(d) {
                if (inArray(d.id, nodesList)) {
                    nodesList.pop(d.id)
                    d3.select(this).style("fill", "steelblue")
                } else {
                    nodesList.push(d.id)
                    d3.select(this).style("fill", "orange")
                }
            })

        node.exit().remove()

        node.append("title")
            .text(function(d) { 
                var attributes = d.attributes
                //console.log(attributes)
                return d.data + '_' + d.id + '. Свойства: ' + attributes 
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
    }.bind(this))
    console.log(' --------------------------------------------------------- ^ ','graph has been updated')
}
/* /Блок для вывода графа ************************************************************/

var toggleColor = (function(){
   var currentColor = "lightblue";

    return function(){
        currentColor = currentColor == "lightblue" ? "magenta" : "lightblue";
        d3.select(this).style("fill", currentColor);
    }
})();


/* Блок обработки фильтра ************************************************************/
var filterAttributesID = '.filter .attributes'


//filterSubmit('.filter .attributes')
/* /Блок обработки фильтра ************************************************************/
