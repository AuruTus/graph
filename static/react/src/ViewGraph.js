var Scene = React.createClass({
    getInitialState: function() {
        return {
            filterAttributes: {},
            taxonomy: {},
            filterOptions: {zero: 'no'},
        }
    },
    handleSubmit: function(e) {
        e.preventDefault();
        
        // Формируем массив json-данных graphFilter
        var graphFilter = { 
            filterAttributes: this.state.filterAttributes ,
            filterOptions: this.state.filterOptions,
            filterTaxonomy: this.state.taxonomy,
        } 
        console.log(this.constructor.displayName,' graphFilter > ',graphFilter)

        // Преобразовываем массив json-данных graphFilter для передачи через url 
        graphFilter = encodeURIComponent(JSON.stringify(graphFilter))

        // Формируем и отправляен get-запрос на сервер
        /*
        var client = new XMLHttpRequest()
        var url = '/create-project/' + graphFilter
        client.open('GET', url)
        client.send()

        client.onreadystatechange = function() {
          if(this.readyState == this.HEADERS_RECEIVED) {
            //console.log(this.getAllResponseHeaders());
            location.reload()
          }
        }
        */

    },
    handleReClick: function(e) {
        //this.handleSubmit(e)
    },
    updateAttributesFilter(filterAttributesState) {
        this.setState({ filterAttributes: filterAttributesState })
    },
    updateTaxonomy(taxonomyState) {
        this.setState({ taxonomy: taxonomyState })
    },
    render: function() {
        return (
            <div>
                <form className="comment" onSubmit={this.handleSubmit} ref="forceGraphFilterForm">
                    <AttributesFilter
                        updateAttributesFilter={this.updateAttributesFilter}
                    />
                    <TaxonomyFilter
                        updateTaxonomy={this.updateTaxonomy}
                    />
                    <input type="submit" className="btn btn-warning" value="Отфильтровать" />
                </form>
                <Graph />
            </div>
        );
    },
});


var Graph = React.createClass({
    getDefaultProps: function() {
        var ww = $(window).width() - scrollbarWidth()

        return {
            sceneWidth: ww,
        }
    },
    loadDataFromServer: function() {
        $.ajax({
            // url по которому на стороне сервера формируется ассоциативный массив данных графа в формате json
            url: '/json-spring/' + gid + '/',

            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({data: data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString())
            }.bind(this)
        })
    },
    getInitialState: function() {
        // Получаем  данные с сервера в формате json
        this.loadDataFromServer()

        return {
            // ассоциативный массив данных, полученный с сервера в формате json
            data: [],
        }
    },
    getGraphNodeState: function(nid) {
        node = eval('this.refs.theGraphNode' + nid)
        console.log(node.getState())
    },
    handleChange: function() {
        console.log("val")
    },
    render: function() {
        var sceneHeight = 600
        var rows = []

        var nodes = this.state.data.nodes
        var scale = 550
        var xoffset = 20
        var yoffset = 20
        var r = 7
        var width = 16
        var height = 12
        if (typeof nodes !== "undefined") {
            Object.keys(nodes).forEach(function(key) {
                node = nodes[key]
                rows.push(<GraphNode
                    key={key}
                    ref={"theGraphNode"+key}
                    nid={key}
                    cx={node.x*scale+xoffset}
                    cy={node.y*scale+yoffset}
                    neighbors={node.neighbors}
                    type={node.type}
                    r={r}
                    width={width}
                    height={height}
                    getGraphNodeState={this.getGraphNodeState}
                    onChange={this.handleChange}
                />)
            })
/*
            nodes.forEach(function(prop, key) {
                rows.push(<GraphNode
                    key={key}
                    ref={"theGraphNode"+prop.nid}
                    nid={prop.id}
                    cx={prop.x*scale+xoffset}
                    cy={prop.y*scale+yoffset}
                    neighbors={prop.neighbors}
                    type={prop.type}
                    r={r}
                    width={width}
                    height={height}
                    getGraphNodeState={this.getGraphNodeState}
                    onChange={this.handleChange}
                />)
            })
*/
        }

        return (
            <svg 
                width={this.props.sceneWidth}
                height={sceneHeight}
                className="graph"
            >
                {rows}
            </svg>
        );
    },
})


//points={"50,75 58,137.5 58,262.5 50,325 42,262.6 42,137.5"}
var GraphNodePoly = React.createClass({
    render: function() {
var op = this.props.r
var tf = Math.tan(Math.PI/4)
var mp = tf*op 
var r = Math.sqrt(op*op + mp*mp)

//console.log(r)

        return (
            <polygon
            />
        );
    }
})


var GraphNode = React.createClass({
    getInitialState: function() {
        return {
            cx: this.props.cx,
            cy: this.props.cy,
        }
    },
    getState: function () {
        var state = []
        state["cx"] = this.state.cx
        state["cy"] = this.state.cy

        return state
    },
    handle: function() {
        console.log(this.props.nid)
        if (typeof this.props.onChange === 'function') {
            this.props.onChange()
        }
    },
    render: function() {
        var edges = []
        this.props.neighbors.forEach(function(prop, key) {
            console.log(this.props.nid)
            if (typeof this.props.getGraphNodeState === 'function') {
                this.props.getGraphNodeState(this.props.nid)
            }

            edges.push(<GraphEdge
                key={key}
                x1={this.props.cx}
                y1={this.props.cy}
                x2={0}
                y2={0}
            />)
        }.bind(this))

        switch(this.props.type) {
            case 1:
                NodeType = GraphNodeCircle
                break
            case 2:
                NodeType = GraphNodeRect
                break
        }

        return (
            <g>
                {edges}
                <NodeType
                    {...this.props}
                    handle={this.handle}
                />
            </g>
        )
    }
})


var GraphNodeCircle = React.createClass({
    handleClick: function() {
        if (typeof this.props.reClick === 'function') {
            this.props.reClick()
        }
    },
    render: function() {
        return (
            <circle 
                cx={this.props.cx}
                cy={this.props.cy}
                r={this.props.r}
                onClick={this.handleClick}
            />
        )
    }
})


var GraphNodeRect = React.createClass({
    handleClick: function() {
        if (typeof this.props.reClick === 'function') {
            this.props.reClick()
        }
    },
    render: function() {
        return (
            <rect 
                x={this.props.cx-this.props.width/2}
                y={this.props.cy-this.props.height/2}
                width={this.props.width}
                height={this.props.height}
                onClick={this.handleClick}
            />
        )
    }
})


var GraphEdge = React.createClass({
    render: function() {
        return (
            <line 
                x1={this.props.x1}
                y1={this.props.y1}
                x2={this.props.x2}
                y2={this.props.y2}
            />
        )
    }
})


var AttributesFilter = React.createClass({
    loadDataFromServer: function() {
        $.ajax({
            // url по которому на стороне сервера формируется ассоциативный массив атрибутов узлов в формате json
            url: '/json-attributes/',

            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({properties: data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString())
            }.bind(this)
        })
    },
    getInitialState: function() {
        // Получаем  данные с сервера в формате json
        this.loadDataFromServer()

        return {
            // ассоциативный массив данных, полученный с сервера в формате json
            properties: [],

            filterAttributesState: {},
        }
    },
    handleChange: function(checkboxGroupState) {
        this.setState({ filterAttributesState: checkboxGroupState })

        // Передаём обновлённый словарь состояний родительскому компоненту
        if (typeof this.props.updateAttributesFilter === 'function') {
            this.props.updateAttributesFilter(checkboxGroupState)
        }
        
    },
    render: function() {
        return (
            <CMCheckboxGroup
                name='attributes'
                properties={this.state.properties}
                onChange={this.handleChange}
            />
        );
    },
})


var TaxonomyFilter = React.createClass({
    loadDataFromServer: function() {
        $.ajax({
            // url по которому на стороне сервера формируется ассоциативный массив существующих типов в формате json
            url: '/json-taxonomy/',

            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({properties: data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString())
            }.bind(this)
        })
    },
    getInitialState: function() {
        // Получаем  данные с сервера в формате json
        this.loadDataFromServer()

        return {
            // ассоциативный массив данных, полученный с сервера в формате json
            properties: [],

            taxonomyState: {},
        }
    },
    handleChange: function(checkboxGroupState) {
        this.setState({ taxonomyState: checkboxGroupState })

        // Передаём обновлённый словарь состояний родительскому компоненту
        if (typeof this.props.updateTaxonomy === 'function') {
            this.props.updateTaxonomy(checkboxGroupState)
        }
        
    },
    render: function() {
        return (
            <CMCheckboxGroup
                name='taxonomy'
                properties={this.state.properties}
                onChange={this.handleChange}
            />
        );
    },
})


React.render( <Scene/>, mountNode)


