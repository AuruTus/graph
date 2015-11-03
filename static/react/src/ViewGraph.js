var Graph = React.createClass({
    loadDataFromServer: function() {
        $.ajax({
            // url по которому на стороне сервера формируется ассоциативный массив данных графа в формате json
            url: '/json-main-graph/' + gid + '/',
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
            filterAttributes: {},
            taxonomy: {},
            filterOptions: {zero: 'no'},
        }
    },
    handleSubmit: function(taxonomyState) {
        // Формируем массив json-данных gfilter
        var gfilter = { 
            filterAttributes: this.state.filterAttributes ,
            filterOptions: this.state.filterOptions,
            filterTaxonomy: taxonomyState,
        } 
        // Преобразовываем массив json-данных gfilter для передачи через url 
        gfilter = encodeURIComponent(JSON.stringify(gfilter))
        // Указываем адрес, по которому будет производится запрос
        var url = '/json-main-graph/' + gid + '/' + gfilter
        // Инициализируем объект XMLHttpReques, позволяющий отправлять асинхронные запросы веб-серверу
        // и получать ответ без перезагрузки страницы
        var xhr = new XMLHttpRequest()
        xhr.open('GET', url)
        xhr.responseType = 'json'
        xhr.send()
        // Производим обработку данных, после получения ответа от сервера
        xhr.onreadystatechange = function() {
          if(xhr.readyState == 4) { // `DONE`
          //if(this.readyState == this.HEADERS_RECEIVED) {
            //console.log(this.getAllResponseHeaders());
            this.setState({data: xhr.response})
          }
        }.bind(this)
    },
    /*
    getTaxonomyState() {
        console.log('tax',taxonomyState)
    },
    updateTaxonomy(taxonomyState) {
        console.log('tax',taxonomyState)
        this.setState({ taxonomy: taxonomyState })
    },
    */
    handleNodeClick(data, attributes) {
        var text = data + '; '
        //console.log(attributes)
        attributes.forEach(function(attr) {
            if (attr.display) {
                text = text + attr.name + ' - '
                text = text + attr.display + '; '
            }
        })
        eval('this.refs.theInfo').updateState(text)
    },
    render: function() {
        var sceneWidth = $(window).width() - scrollbarWidth()
        return (
            <div className="graph">
                <div className="filter">
                    <Filter
                        _handleSubmit={this.handleSubmit}
                        //updateTaxonomy={this.updateTaxonomy}
                    />
                </div>
                <Info ref={'theInfo'} width={sceneWidth}/>
                <SVGScene 
                    data={this.state.data}
                    sceneWidth={sceneWidth}
                    _handleNodeClick={this.handleNodeClick}
                />
            </div>
        );
    },
})


var SVGScene = React.createClass({
    getInitialState: function() {
        return {
            //x: this.props.x,
            //y: this.props.y,
            dragging: false,
            nodeToMove: 0,
        }
    },
    render: function() {
        var sceneHeight = 600
        var scale = 500
        var xOffset = 30
        var yOffset = 30
        var r = 5
        var width = 16
        var height = 12
        var nodes = this.props.data.nodes
        var nodeRows = []
        var edgeRows = []

        // В случае, если массив данных nodes уже проинициализирован, то:
        if (typeof nodes !== "undefined") {
            console.log('Updating graph...')
            // Создаём массив объектов типа GraphNode
            Object.keys(nodes).forEach(function(key) {
                var node = nodes[key]
                var x = node.x*scale+xOffset 
                var y = node.y*scale+yOffset 
                //console.log('x',x,'y',y)
                nodeRows.push(<GraphNode
                    key={key}
                    ref={"theGraphNode"+key}
                    nid={key}
                    data={node.data}
                    x={x}
                    y={y}
                    taxonomy={node.taxonomy}
                    attributes={node.attributes}
                    degree={node.degree}
                    r={r}
                    width={width}
                    height={height}
                    _handleNodeClick={this.props._handleNodeClick}
                    //onMouseDown={this.onMouseDown}
                />)
            }.bind(this))

            // Создаём массив объектов типа GraphEdge
            Object.keys(nodes).forEach(function(key) {
                //console.log('update edges')
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
            }.bind(this))
        }

        return (
            <svg 
                width={this.props.sceneWidth}
                height={sceneHeight}
            >
                {edgeRows}
                {nodeRows}
            </svg>
        );
    },
})


var GraphNode = React.createClass({
    getInitialState: function() {
        //console.log('x',this.props.x,'y',this.props.y)
        return {
            x: this.props.x,
            y: this.props.y,
            //dragging: false,
        }
    },
    componentDidUpdate: function (props, state) {
        //console.log('x',this.state.x,'y',this.state.y)
        //console.log('x',state.x,'y',state.y)
        //state.x = this.props.x
        //state.y = this.props.y
        /*
        if (this.state.dragging && !state.dragging) {
            //console.log(state)
            document.addEventListener('mousemove', this.onMouseMove)
            document.addEventListener('mouseup', this.onMouseUp)
        } else if (!this.state.dragging && state.dragging) {
            document.removeEventListener('mousemove', this.onMouseMove)
            document.removeEventListener('mouseup', this.onMouseUp)
        }
        */
    },
    /*
        onMouseDown: function (e) {
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
    onClick: function () {
        if (typeof this.props._handleNodeClick === 'function') {
            this.props._handleNodeClick(this.props.data, this.props.attributes)
        }
    },
    render: function() {
        switch(this.props.taxonomy.tid) {
            case 1:
                NodeType = GraphNodePerson
                break
            default:
                NodeType = GraphNodeCircle
                //NodeType = GraphNodeRect
                break
        }

        return (
            <g>
                <NodeType
                    {...this.props}
                    cx={this.props.x}
                    cy={this.props.y}
                    onMouseDown={this.onMouseDown}
                    onClick={this.onClick}
                />
            </g>
        )
    }
})


var GraphNodePerson = React.createClass({
    /*
    handleClick: function(e) {
        if (typeof this.props.handleClick === 'function') {
            this.props.handleClick()
        }
    },
    */
    render: function() {
        //var transform = "scale(.7,.7) translate("+this.props.cx+","+this.props.cy+")"
        //var transform = "translate("+(this.props.cx-15)+","+(this.props.cy-15)+")"
        var transform = "translate("+(this.props.cx-12)+","+(this.props.cy-15)+")"
        var scale = "scale(.5,.5)"
                /*<circle  transform={scale} cx={this.props.cx} cy={this.props.cy} r={15} />*/ 
        return (
            <g 
                className="person" 
                transform={transform}
                onClick={this.props.onClick}
                >
                <path
                    transform={scale}
                    d="M 24.827,0 C 11.138,0 0.001,11.138 0.001,24.827 c 0,13.689 11.137,24.827 24.826,24.827 13.688,0 24.826,-11.138 24.826,-24.827 C 49.653,11.138 38.517,0 24.827,0 Z m 14.315,38.51 c 0,-0.574 0,-0.979 0,-0.979 0,-3.386 -3.912,-4.621 -6.006,-5.517 -0.758,-0.323 -2.187,-1.011 -3.653,-1.728 -0.495,-0.242 -0.941,-0.887 -0.997,-1.438 l -0.162,-1.604 c 1.122,-1.045 2.133,-2.5 2.304,-4.122 l 0.253,0 c 0.398,0 0.773,-0.298 0.832,-0.663 l 0.397,-2.453 c 0.053,-0.524 -0.442,-0.842 -0.843,-0.842 0.011,-0.052 0.02,-0.105 0.025,-0.149 0.051,-0.295 0.082,-0.58 0.102,-0.857 0.025,-0.223 0.045,-0.454 0.056,-0.693 0.042,-1.158 -0.154,-2.171 -0.479,-2.738 -0.33,-0.793 -0.83,-1.563 -1.526,-2.223 -1.939,-1.836 -4.188,-2.551 -6.106,-1.075 -1.306,-0.226 -2.858,0.371 -3.979,1.684 -0.612,0.717 -0.993,1.537 -1.156,2.344 -0.146,0.503 -0.243,1.112 -0.267,1.771 -0.026,0.733 0.046,1.404 0.181,1.947 -0.382,0.024 -0.764,0.338 -0.764,0.833 l 0.396,2.453 c 0.059,0.365 0.434,0.663 0.832,0.663 l 0.227,0 c 0.36,1.754 1.292,3.194 2.323,4.198 l -0.156,1.551 c -0.056,0.55 -0.502,1.193 -0.998,1.438 -1.418,0.692 -2.815,1.358 -3.651,1.703 -1.97,0.812 -6.006,2.131 -6.006,5.517 l 0,0.766 C 7.033,34.756 5.005,30.031 5.005,24.83 c 0,-10.932 8.894,-19.826 19.826,-19.826 10.933,0 19.826,8.894 19.826,19.826 -0.004,5.303 -2.109,10.116 -5.515,13.68 z"/>
            </g>
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
                //transform={scale}
                //onMouseDown={this.onMouseDown}
                onClick={this.props.onClick}
            />
            </g>
        )
    }
})


/*
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
*/


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


/*
var GraphNodePoly = React.createClass({
    render: function() {
        //points={"50,75 58,137.5 58,262.5 50,325 42,262.6 42,137.5"}
        var op = this.props.r
        var tf = Math.tan(Math.PI/4)
        var mp = tf*op 
        var r = Math.sqrt(op*op + mp*mp)

        //console.log(r)

        return (
            <polygon
            />
        )
    }
})
*/


var Filter = React.createClass({
    loadTaxonomyDataFromServer: function() {
        $.ajax({
            // url по которому на стороне сервера формируется ассоциативный массив существующих типов в формате json
            url: '/json-taxonomy/',
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({taxonomyData: data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString())
            }.bind(this)
        })
    },
    getInitialState: function() {
        // Получаем  данные с сервера в формате json
        this.loadTaxonomyDataFromServer()
        return {
            // ассоциативный массив данных, полученный с сервера в формате json
            taxonomyData: [],
        }
    },
    handleSubmit: function(e) {
        e.preventDefault()
        // Получаем состояние чекбоксов всех компонентов таксономии
        var taxonomyState = eval('this.refs.theTaxonomy').getState()
        // Передаём обработку родительской функции
        if (typeof this.props._handleSubmit === 'function') {
            this.props._handleSubmit(taxonomyState)
        }
    },
    render: function() {
        return (
            <form onSubmit={this.handleSubmit} ref="forceGraphFilterForm" className='taxonomy'>
                <div className={'RecursiveCheckboxTree'}>
                    <RecursiveCheckboxTree
                        ref={'theTaxonomy'}
                        children={this.state.taxonomyData}
                        display={'Фильтр по типам ИО:'}
                    />
                </div>
                <Position />
                <input type="submit" className="btn btn-warning" value="Отфильтровать" />
            </form>
        );
    },
})


var Position = React.createClass({
    getInitialState: function() {
        // Получаем данные с сервера в формате json
        return {
            // Ассоциативный массив данных, полученный с сервера в формате json
            data: [
                {'tid': 1, 'value': 'Президент', 'display': 'Президент', 'checked': true},
                {'tid': 2, 'value': 'Премьер', 'display': 'Премьер', 'checked': true},
                {'tid': 3, 'value': 'Губернатор', 'display': 'Губернатор', 'checked': true},
                {'tid': 4, 'value': 'Чиновник', 'display': 'Чиновник', 'checked': true},
                {'tid': 5, 'value': 'Депутат', 'display': 'Депутат', 'checked': true},
                {'tid': 6, 'value': 'Журналист', 'display': 'Журналист', 'checked': true},
                {'tid': 7, 'value': 'Активист', 'display': 'Активист', 'checked': true},
            ],
        }
    },
    render: function() {
        return (
            <div className={'RecursiveCheckboxTree'}>
                <RecursiveCheckboxTree
                    ref={'thePositionTaxonomy'}
                    children={this.state.data}
                    display={'Фильтр по типам должностей:'}
                />
            </div>
        )
    },
})


var Info = React.createClass({
    getInitialState: function() {
        return {
            text: "node info test",
        }
    },
    getState: function() {
        return this.state.text
    },
    updateState: function(text) {
        this.setState({text: text});
    },
    render: function() {
        return (
            <div className="info">
                {this.state.text}
            </div>
        )
    },
})


React.render( <Graph/>, mountGraph)


