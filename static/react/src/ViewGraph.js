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
            gfilter: {},
        }
    },
    handleSubmit: function(filter) {
        // Преобразовываем массив json-данных gfilter для передачи через url 
        filterJSONed = encodeURIComponent(JSON.stringify(filter))
        // Формируем адрес, по которому будет производится REST-запрос
        var url = '/json-main-graph/' + gid + '/' + filterJSONed
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
            this.setState({data: xhr.response, gfilter: filter})
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
    handleNodeClick(nid, checked) {
        nid = parseInt(nid)
        if (typeof nid === 'number') {
            // Добавление/удаление выделенного по клику узла в массив Filter.state.nodes
            filter = eval('this.refs.theFilter')
            nodes = filter.state.nodes
            if (checked) {
                nodes.push(nid)
            } else {
                nodes.pop(nid)
            }
            filter.setState({nodes: nodes})
        }
    },
    handleNodeTip(data, attributes, name) {
        var text = data + '; '
        text = text + 'тип - ' + name + '; '
        attributes.forEach(function(attr) {
            if (attr.value) {
                text = text + attr.name + ' - '
                text = text + attr.value + '; '
            }
        })
        eval('this.refs.theInfo').updateState(text)
    },
    render: function() {
        var graphFilter = $('.graph .filter')
        //var bordersOnBothSides = graphFilter.outerWidth() - graphFilter.innerWidth()
        //console.log('bb',bordersOnBothSides)
        var sceneWidth = $(window).width() - scrollbarWidth() - graphFilter.width() - 4
        sceneWidth = 400
        //console.log('css',parseInt(graphFilter.css("borderLeftWidth"), 10))
        //console.log($('.graph .filter').width())
        //console.log('window',$(window).width())
        //console.log('scroll',scrollbarWidth())
        //console.log('sceneWidth',sceneWidth)
        return (
            <div className="graph">
                <div className="filter">
                    <Filter
                        ref='theFilter'
                        _handleSubmit={this.handleSubmit}
                        //updateTaxonomy={this.updateTaxonomy}
                    />
                </div>
                <Info ref={'theInfo'} width={sceneWidth}/>
                <SVGScene 
                    ref='theSVGScene'
                    data={this.state.data}
                    filter={this.state.gfilter}
                    sceneWidth={sceneWidth}
                    sceneHeight={sceneWidth}
                    _handleNodeClick={this.handleNodeClick}
                    _handleNodeTip={this.handleNodeTip}
                    _handleSceneClick={this.handleNodeClick}
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

            //view: [this.props.sceneWidth/2,this.props.sceneHeight/2],
            view: [40,40],
            scale: 5,
            multiplier: 100,
        }
    },
    project(_point) {
        var point = {}
        point.x = _point[0] * (this.state.scale * this.state.multiplier) + this.state.view[0]
        point.y = _point[1] * (this.state.scale * this.state.multiplier) + this.state.view[1]
        //var x = node.x*scale+xOffset 
        //var y = node.y*scale+yOffset 
        return point
    },
    handleClick() {
        console.log('svg click')
        eval('this.refs.theInfo').updateState('')
    },
    render: function() {
        console.log('scene: ',this.props.sceneWidth,'-',this.props.sceneHeight)
        var sceneHeight = this.props.sceneWidth/2
        var scale = this.props.sceneWidth/1
        var xOffset = this.props.sceneWidth/2
        var yOffset = this.props.sceneWidth/2
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
                // В данном случае, специально, id узла совпадает с порядковым ключом ассоциативного массива объектов
                nid = key
                //console.log(key)
                var node = nodes[nid]
                var x = node.x*scale+xOffset 
                var y = node.y*scale+yOffset 
                var point = this.project([node.x,node.y])
                /*
                var checked
                if ('innodes',typeof this.props.filter.nodes === 'object') {
                    console.log(nid,'-',this.props.filter.nodes)
                }
                */
                nodeRows.push(<GraphNode
                    key={nid}
                    ref={"theGraphNode"+nid}
                    nid={nid}
                    data={node.data}
                    x={point.x}
                    y={point.y}
                    taxonomy={node.taxonomy}
                    attributes={node.attributes}
                    degree={node.degree}
                    r={r}
                    width={width}
                    height={height}
                    _handleNodeClick={this.props._handleNodeClick}
                    _handleNodeTip={this.props._handleNodeTip}
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
                height={this.props.sceneHeight}
                //onClick={this.props._handleSceneClick}
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
            checked: false,
            //dragging: false,
        }
    },
    componentDidUpdate: function (props, state) {
        state.checked = false
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
    onMouseOver: function () {
        // Передача обработки родительскому компоненту
        if (typeof this.props._handleNodeTip === 'function') {
            this.props._handleNodeTip(this.props.data, this.props.attributes, this.props.taxonomy.name)
        }
    },
    onClick: function () {
        var checked = this.state.checked
        checked = checked ? false : true
        this.setState({ checked: checked, })
        // Передача обработки родительскому компоненту
        if (typeof this.props._handleNodeClick === 'function') {
            this.props._handleNodeClick(this.props.nid, checked, this.props.data, this.props.attributes)
        }
    },
    render: function() {
        switch(this.props.taxonomy.tid) {
            case 10:
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
                    r={this.props.r}
                    checked={this.state.checked}
                    //onMouseDown={this.onMouseDown}
                    _onMouseOver={this.onMouseOver}
                    _onClick={this.onClick}
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
        if (this.props.degree > 2) {
            var scale = "scale(.8,.8)"
            var transform = "translate("+(this.props.cx-19)+","+(this.props.cy-18)+")"
        } else {
            var scale = "scale(.5,.5)"
            var transform = "translate("+(this.props.cx-12)+","+(this.props.cy-15)+")"
        }
        var text = []
        if (this.props.degree > 2) {
            text.push(<text x={-30} y={35} >
                        {this.props.data}
                </text>)
        }
        return (
            <g 
                fill='green'
                className={'Person ' + this.props.checked}
                transform={transform}
                onMouseOver={this.props._onMouseOver}
                onClick={this.props._onClick}
                >
                <path
                    transform={scale}
                    d="M 24.827,0 C 11.138,0 0.001,11.138 0.001,24.827 c 0,13.689 11.137,24.827 24.826,24.827 13.688,0 24.826,-11.138 24.826,-24.827 C 49.653,11.138 38.517,0 24.827,0 Z m 14.315,38.51 c 0,-0.574 0,-0.979 0,-0.979 0,-3.386 -3.912,-4.621 -6.006,-5.517 -0.758,-0.323 -2.187,-1.011 -3.653,-1.728 -0.495,-0.242 -0.941,-0.887 -0.997,-1.438 l -0.162,-1.604 c 1.122,-1.045 2.133,-2.5 2.304,-4.122 l 0.253,0 c 0.398,0 0.773,-0.298 0.832,-0.663 l 0.397,-2.453 c 0.053,-0.524 -0.442,-0.842 -0.843,-0.842 0.011,-0.052 0.02,-0.105 0.025,-0.149 0.051,-0.295 0.082,-0.58 0.102,-0.857 0.025,-0.223 0.045,-0.454 0.056,-0.693 0.042,-1.158 -0.154,-2.171 -0.479,-2.738 -0.33,-0.793 -0.83,-1.563 -1.526,-2.223 -1.939,-1.836 -4.188,-2.551 -6.106,-1.075 -1.306,-0.226 -2.858,0.371 -3.979,1.684 -0.612,0.717 -0.993,1.537 -1.156,2.344 -0.146,0.503 -0.243,1.112 -0.267,1.771 -0.026,0.733 0.046,1.404 0.181,1.947 -0.382,0.024 -0.764,0.338 -0.764,0.833 l 0.396,2.453 c 0.059,0.365 0.434,0.663 0.832,0.663 l 0.227,0 c 0.36,1.754 1.292,3.194 2.323,4.198 l -0.156,1.551 c -0.056,0.55 -0.502,1.193 -0.998,1.438 -1.418,0.692 -2.815,1.358 -3.651,1.703 -1.97,0.812 -6.006,2.131 -6.006,5.517 l 0,0.766 C 7.033,34.756 5.005,30.031 5.005,24.83 c 0,-10.932 8.894,-19.826 19.826,-19.826 10.933,0 19.826,8.894 19.826,19.826 -0.004,5.303 -2.109,10.116 -5.515,13.68 z"/>
                {text}
            </g>
        )
    }
})

var GraphNodeCircle = React.createClass({
    /*
    onMouseDown: function(e) {
        if (typeof this.props.onMouseDown === 'function') {
            this.props.onMouseDown(e, this.props.nid)
        }
    },
        */
    render: function() {
        return (
            <g
                className={'Circle ' + this.props.checked}
                onMouseOver={this.props._onMouseOver}
                onClick={this.props._onClick}
                //onMouseDown={this.onMouseDown}
            >
            <circle 
                cx={this.props.cx}
                cy={this.props.cy}
                r={this.props.r}
                //transform={scale}
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
    statics: { filter: {}, },
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
            data: '',
            nodes: [],
            filter: {},
        }
    },
    updateFilter(key, value) {
        this.constructor.filter[key] = value 
        //console.log('f',this.constructor.filter)
    },
    handleSubmit: function(e) {
        e.preventDefault()
        // Передаём обработку родительской функции
        if (typeof this.props._handleSubmit === 'function') {
            var filter = {}
            // Добавляем к состоянию фильтра значение способа компоновки
            //console.log('filter',this.constructor.filter.layout)
            filter.layout = this.constructor.filter.layout
            // Добавляем к состоянию фильтра значение словаря options
            filter.options = {zero: 'no'}
            // Добавляем к состоянию фильтра значение массива nodes
            filter.nodes = this.state.nodes
            // Добавляем к состоянию фильтра чекбоксов всех компонентов таксономии
            filter.taxonomy = eval('this.refs.theTaxonomy').getState()
            // Добавляем к состоянию фильтра значение поля NodeData input 
            filter.data = eval('this.refs.theFilterData').state.value
            // Добавляем к состоянию фильтра значение фильтра аттрибутов
            filter.attributes = eval('this.refs.theFilterAttributes').constructor.filter
            // Передаём обработку родительскому компоненту
            if (typeof (func = this.props._handleSubmit) === 'function') { func(filter) }
            // Обнуляем массив выделенных узлов
            this.state.nodes = []
        }
    },
    render: function() {
        console.log('Rendering filter...')
        return (
            <form onSubmit={this.handleSubmit} ref="forceGraphFilterForm" className='taxonomy'>
                <Layout _updateFilter={this.updateFilter} _submit={this.handleSubmit} />
                <input type="submit" className="btn btn-warning" value="Отфильтровать" />
                <NodeData 
                    ref={'theFilterData'}
                />
                <div className={'RecursiveCheckboxTree'}>
                    <RecursiveCheckboxTree
                        ref={'theTaxonomy'}
                        children={this.state.taxonomyData}
                        display={'Классификатор сущностей:'}
                    />
                </div>
                <Attributes ref='theFilterAttributes' _updateFilterState={this.updateFilter} />
                <Position />
                <input type="submit" className="btn btn-warning" value="Отфильтровать" />
            </form>
        );
    },
})


var Attributes = React.createClass({
    statics: { filter: {}, },
    getDataFromServer: function() {
        // url по которому на стороне сервера формируется ассоциативный массив 
        // в формате json существующих типов информационных объектов 
        var url = '/json-attributes/'
        var xhr = new XMLHttpRequest()
        xhr.open('GET', url)
        xhr.responseType = 'json'
        xhr.send()
        // Производим обработку данных, после получения ответа от сервера
        xhr.onreadystatechange = function() {
          if(xhr.readyState == 4) { // Операция завершена
            this.setState({data: xhr.response})
          }
        }.bind(this)
    },
    getInitialState: function() {
        // Получаем  данные с сервера в формате json
        this.getDataFromServer()
        return {
            // ассоциативный массив данных, полученный с сервера в формате json
            data: '',
        }
    },
    updateFilter(key, value) {
        this.constructor.filter[key] = value
        if (typeof (func = this.props._updateFilterState) === 'function') { func('attributes', this.constructor.filter) }
    },
    render: function() {
        //console.log(this.state.data)
        var rows = []
        attributes = this.state.data
        Object.keys(attributes).forEach(function(key) {
            attr = attributes[key]
            rows.push(<AttributesLabel
                    key={attr.value}
                    value={attr.value}
                    checked={attr.checked}
                    display={attr.display}
                    _updateFilterState={this.updateFilter}
                />)
        }.bind(this))
        return (
            <div className='attributes-filter'>
                <h3>Фильтр по атрибутам</h3>
                {rows}
            </div>
        )
    }
})


var AttributesLabel = React.createClass({
    getInitialState: function() {
        return {
            checked: this.props.checked,
        }
    },
    componentDidMount: function() {
        if (typeof (func = this.props._updateFilterState) === 'function') { func(this.props.value, this.state.checked) }
    },
    handleChange: function(e) {
        var checked = this.state.checked
        checked = checked ? false : true
        this.setState({ checked: checked })
        if (typeof (func = this.props._updateFilterState) === 'function') { func(this.props.value, checked) }
    },
    render: function() {
        //console.log('render attr')
        return (
            <label>
                <input 
                    type="checkbox" 
                    value={this.props.value}
                    checked={this.state.checked}
                    onChange={this.handleChange}
                />
                {this.props.display} 
            </label>
        )
    }
})


var NodeData = React.createClass({
    getInitialState: function() {
        return {value: ''}
    },
    handleChange: function(event) {
		this.setState({value: event.target.value});
	},
    render: function() {
        return (
            <label className='data'>
                Фильтрация по атрибуту data
                <input 
					type="text"
					value={this.state.value}
					onChange={this.handleChange}
				/>
            </label>
        )
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
                {'tid': 3, 'value': 'Министр', 'display': 'Министр', 'checked': true},
                {'tid': 4, 'value': 'Губернатор', 'display': 'Губернатор', 'checked': true},
                {'tid': 5, 'value': 'Чиновник', 'display': 'Чиновник', 'checked': true},
                {'tid': 6, 'value': 'Депутат', 'display': 'Депутат', 'checked': true},
                {'tid': 7, 'value': 'Журналист', 'display': 'Журналист', 'checked': true},
                {'tid': 8, 'value': 'Активист', 'display': 'Активист', 'checked': true},
                {'tid': 9, 'value': 'Конструктор', 'display': 'Конструктор', 'checked': true},
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
            text: " ",
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


var Layout = React.createClass({
    getInitialState: function() {
        return {
            layouts: ['shell', 'random', 'spring'],
            value: 'shell',
        }
    },
    handleChange(e) {
        var value = e.target.value.substr(0, 140)
        this.setState({value: value})
        if (typeof (func = this.props._updateFilter) === 'function') { func('layout', value) }
        if (typeof (func = this.props._submit) === 'function') { func(e) }
    },
    render: function() {
        rows = []
        this.state.layouts.forEach(function(layout) {
            rows.push(
                <option value={layout}>{layout}</option>
            )
        })
        return (
            <div className="form-group">
                <label>Выбор способа компоновки:</label>
                <select value={this.state.value} onChange={this.handleChange} className="form-control">
                    {rows}
                </select>
            </div>
        )
    },
})


React.render( <Graph/>, mountGraph)




