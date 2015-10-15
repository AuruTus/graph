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
            //x: this.props.x,
            //y: this.props.y,
            dragging: false,
            nodeToMove: 0,
        }
    },
    componentDidUpdate: function (props, state) {
        if (this.state.dragging && !state.dragging) {
            document.addEventListener('mousemove', this.onMouseMove)
            document.addEventListener('mouseup', this.onMouseUp)
        } else if (!this.state.dragging && state.dragging) {
            document.removeEventListener('mousemove', this.onMouseMove)
            document.removeEventListener('mouseup', this.onMouseUp)
        }
    },
    onMouseDown: function (e, nid) {
//console.log(nid)
        if (e.button !== 0) return
        // Устанавливаем флаг перетаскивания объекта в значение истина
        this.setState({dragging: true, nodeToMove: nid,})
        // Прекращает дальнейшую передачу текущего события
        e.stopPropagation()
        // Отменяет действия браузера по умолчанию
        e.preventDefault()
    },
    onMouseUp: function (e) {
        // Устанавливаем флаг перетаскивания объекта в значение ложь
        this.setState({dragging: false})
        e.stopPropagation()
        e.preventDefault()
    },
    onMouseMove: function (e) {
        // Если флаг перетаскивания не истина, отменяем дальнейшую обработку
        if (!this.state.dragging) return
        var x = e.pageX + 1
        var y = e.pageY - 122
        this.setState({
            x: x,
            y: y,
        })
        e.stopPropagation()
        e.preventDefault()
        this.updateGraphNodePos(this.state.nodeToMove, x, y)
        this.updateGraphEdgePos(this.state.edgesToMove, x, y)
    },
    updateGraphNodePos: function (nid, x, y) {
//console.log(nid,'>',x,'-',y)
        node = eval('this.refs.theGraphNode' + nid)
//console.log(node)
        node.setState({x: x, y: y,})
    },
    updateGraphEdgePos: function (eids, x, y) {
        eids.forEach(function(eid) {
            edge = eval('this.refs.theGraphEdge' + eid)
            edge.setState({x: x, y: y,})
        })
    },
    render: function() {
        var sceneHeight = 600
        var scale = 550
        var xOffset = 20
        var yOffset = 20
        var r = 7
        var width = 16
        var height = 12
        var nodes = this.state.data.nodes
        var nodeRows = []
        var edgeRows = []

        // В случае, если массив данных nodes уже проинициализирован, то:
        if (typeof nodes !== "undefined") {
            // Создаём массив объектов типа GraphNode
            Object.keys(nodes).forEach(function(key) {
//console.log('nodes:',key)
                var node = nodes[key]
                var x = node.x*scale+xOffset 
                var y = node.y*scale+yOffset 
                nodeRows.push(<GraphNode
                    key={key}
                    ref={"theGraphNode"+key}
                    nid={key}
                    x={x}
                    y={y}
                    //neighbors={node.neighbors}
                    type={node.type}
                    r={r}
                    width={width}
                    height={height}
                    onMouseDown={this.onMouseDown}
                />)
            }.bind(this))

            // Создаём массив объектов типа GraphEdge
            Object.keys(nodes).forEach(function(key) {
                var node = nodes[key]
                var x1 = node.x*scale+xOffset
                var y1 = node.y*scale+yOffset

                node.neighbors.forEach(function(nid) {
//console.log('edges:',key,'>',nid)
                    var x2 = nodes[nid].x*scale+xOffset
                    var y2 = nodes[nid].y*scale+yOffset
                    var eid = key+nid
                    edgeRows.push(<GraphEdge
                        key={eid}
                        ref={"theGraphEdge"+eid}
                        eid={eid}
                        startx={x1}
                        starty={y1}
                        x2={x2}
                        y2={y2}
                    />)
                })
            })
        }

        return (
            <svg 
                width={this.props.sceneWidth}
                height={sceneHeight}
                className="graph"
            >
                <g>
                    {edgeRows}
                    {nodeRows}
                </g>
            </svg>
        );
    },
})


var GraphNode = React.createClass({
    getInitialState: function() {
        return {
            x: this.props.x,
            y: this.props.y,
            dragging: false,
        }
    },
    componentDidUpdate: function (props, state) {
        if (this.state.dragging && !state.dragging) {
//console.log(state)
            document.addEventListener('mousemove', this.onMouseMove)
            document.addEventListener('mouseup', this.onMouseUp)
        } else if (!this.state.dragging && state.dragging) {
            document.removeEventListener('mousemove', this.onMouseMove)
            document.removeEventListener('mouseup', this.onMouseUp)
        }
    },
    onMouseDown: function(e, nid) {
        if (typeof this.props.onMouseDown === 'function') {
//console.log(nid)
            this.props.onMouseDown(e, nid)
        }
    },
    /*
    rnMouseDown: function (e) {
        if (e.button !== 0) return
        //var pos = $(this.getDOMNode()).offset()
//console.log(e.pageX,e.pageY)
        this.setState({
          // Устанавливаем флаг перетаскивания объекта в значение истина
          dragging: true,
          //rel: { x: e.pageX - pos.left, y: e.pageY - pos.top + 110, },
        })
        // Прекращает дальнейшую передачу текущего события
        e.stopPropagation()
        // Отменяет действия браузера по умолчанию
        e.preventDefault()

console.log(this.props.onMouseDown)
        if (typeof this.props.onMouseDown === 'function') {
console.log(e)
            this.props.onMouseDown(e)
        }
    },
    onMouseUp: function (e) {
        // Устанавливаем флаг перетаскивания объекта в значение ложь
        this.setState({dragging: false})
        // Прекращает дальнейшую передачу текущего события
        e.stopPropagation()
        // Отменяет действия браузера по умолчанию
        e.preventDefault()
    },
    onMouseMove: function (e) {
        // Если флаг перетаскивания не истина, отменяем дальнейшую обработку
        if (!this.state.dragging) return
//console.log(e.pageX-this.state.rel.x)
        this.setState({
            x: e.pageX + 1,
            y: e.pageY - 122,
        })
        // Прекращает дальнейшую передачу текущего события
        e.stopPropagation()
        // Отменяет действия браузера по умолчанию
        e.preventDefault()
    },
    */
    render: function() {
        switch(this.props.type) {
            case 1:
                NodeType = GraphNodePerson
                break
            case 2:
                NodeType = GraphNodeCircle
                //NodeType = GraphNodeRect
                break
        }

        return (
            <g>
                <NodeType
                    {...this.props}
                    cx={this.state.x}
                    cy={this.state.y}
                    onMouseDown={this.onMouseDown}
                />
            </g>
        )
    }
})


var GraphNodePerson = React.createClass({
    handleClick: function(e) {
        if (typeof this.props.handleClick === 'function') {
            this.props.handleClick()
        }
    },
    render: function() {
        return (
                <use 
                    xlink={"Person"}
                    x={this.props.cx}
                    y={this.props.cy}
                    onClick={this.handleClick}
                />
        )
    }
})

var GraphNodeCircle = React.createClass({
    onMouseDown: function(e) {
        if (typeof this.props.onMouseDown === 'function') {
            this.props.onMouseDown(e, this.props.nid)
        }
    },
    render: function() {
        return (
                <g>
                <circle 
                    cx={this.props.cx}
                    cy={this.props.cy}
                    r={this.props.r}
                    //onMouseDown={this.onMouseDown}
                />
                </g>
        )
    }
})


var GraphNodeRect = React.createClass({
    onMouseDown: function(e) {
        if (typeof this.props.onMouseDown === 'function') {
            this.props.onMouseDown(e, this.props.nid)
        }
    },
    render: function() {
        return (
            <rect 
                x={this.props.cx-this.props.width/2}
                y={this.props.cy-this.props.height/2}
                width={this.props.width}
                height={this.props.height}
                //onMouseDown={this.onMouseDown}
            />
        )
    }
})


var GraphEdge = React.createClass({
    render: function() {
        return (
            <line 
                x1={this.props.startx}
                y1={this.props.starty}
                x2={this.props.x2}
                y2={this.props.y2}
            />
        )
    }
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

