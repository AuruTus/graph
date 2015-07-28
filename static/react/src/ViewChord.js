var ChordFilter = React.createClass({
    getInitialState: function() {
        return {
        }
    },
    handleSubmit: function(e) {
        //e.preventDefault()

        //this.setState({ filterNodes: nodesList }) 
        
        // Перерисовываем граф
        //this.graphUpdate()        
    },
    render: function() {
        return (
            <form onSubmit={this.handleSubmit} ref="ChordFilterForm">
                <input type="submit" className="btn btn-warning" value="Отфильтровать" />
            </form>
        )
    },
})




React.render(
    <ChordFilter />,
    document.getElementById('chord-filter')
);


/* 
* 
* Блок для вывода круговой диаграмы ************************************************************/

function ChordLayout(containerID, id){

    var matrix = [
      [11975,  5871, 8916, 2868],
      [ 1951, 10048, 2060, 6171],
      [ 8010, 16145, 8090, 8045],
      [ 1013,   990,  940, 6907]
    ];

    var gfilter = {"options":{"rmzero":"true","radius":"byDegree"}}
    gfilter = encodeURIComponent(JSON.stringify(gfilter))

    var url = '/json-chord/' + id + '/' + gfilter + '/'

    var width = 1100,
        height = 1100,
        innerRadius = Math.min(width, height) * .1,
        outerRadius = innerRadius * 1.1;

    // Определяем массив цветов для закрашивания
    var fill = d3.scale.ordinal()
        .domain(d3.range(8))
        .range(["#000000", "#FFDD89", "#957244", "#F26223", "#F26223", "#026223", "#F06223", "#F26220", ]);

    // Определяем svg-сцену
    var svg = d3.select(containerID).append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 4 + ")");
        //.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    d3.json(url, function(error, graph) {
        this.graph = graph

        var chord = d3.layout.chord()
            .padding(.05)
            .sortSubgroups(d3.descending)
            .matrix(graph.matrix);

        svg.append("g").selectAll("path")
            .data(chord.groups)
          .enter().append("path")
            .style("fill", function(d) { return fill(d.index); })
            .style("stroke", function(d) { return fill(d.index); })
            .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
            .on("mouseover", fade(.1))
            .on("mouseout", fade(1));

        var ticks = svg.append("g").selectAll("g")
            .data(chord.groups)
          .enter().append("g").selectAll("g")
            .data(groupTicks.bind(this))
          .enter().append("g")
            .attr("transform", function(d) {
              return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                  + "translate(" + outerRadius + ",0)";
            })

        ticks.append("line")
            .attr("x1", 1)
            .attr("y1", 0)
            .attr("x2", 5)
            .attr("y2", 0)
            .style("stroke", "#000");

        ticks.append("text")
            .attr("x", 8)
            .attr("dy", ".35em")
            .attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180)translate(-16)" : null; })
            .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
            .text(function(d) { return d.label; });

        svg.append("g")
            .attr("class", "chord")
          .selectAll("path")
            .data(chord.chords)
          .enter().append("path")
            .attr("d", d3.svg.chord().radius(innerRadius))
            .style("fill", function(d) { return fill(d.target.index); })
            .style("opacity", 1)
    })

    // Returns an array of tick angles and labels, given a group.
    function groupTicks(d) {
        //console.log('> ',this.graph)
        var k = (d.endAngle - d.startAngle) / d.value;
        // Получаем значение подписи узла из json-представления графа,
        // переданного сервером
        var nodeLabel = ''
        /*
        if (this.graph.nodes[d.index]['id']) {
            nodeLabel += 'id ' + this.graph.nodes[d.index]['id'] + '; '
        }
        */
        if (this.graph.nodes[d.index]['data']) {
            nodeLabel += this.graph.nodes[d.index]['data']
        }
        if (this.graph.nodes[d.index]['title']) {
            nodeLabel += this.graph.nodes[d.index]['title']
        }
        return d3.range(0, d.value, 1000).map(function(v, i) {
            return {
                angle: v * k + d.startAngle,
                label: nodeLabel,
            };
        });
    }

    // Returns an event handler for fading a given chord group.
    function fade(opacity) {
      return function(g, i) {
        svg.selectAll(".chord path")
            .filter(function(d) { return d.source.index != i && d.target.index != i; })
          .transition()
            .style("opacity", opacity)
      };
    }
}

/* /Блок для вывода круговой диаграмы **********************************************************
*
*/
