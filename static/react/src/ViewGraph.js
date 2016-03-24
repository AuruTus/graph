/* цвета, которые нельзя передать SVG export'ом */
var color01 = "#000080"
var events = [50,60,70,75,80,90,100,110,115,120,130,140]

// Главный компонент для визуализации в виде графа
var Graph = React.createClass({
    loadDataFromServer: function(filter) {
        // Преобразовываем массив json-данных gfilter для передачи через url 
        //console.log("FILTER",filter)
        var filterJSONed = encodeURIComponent(JSON.stringify(filter))
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
                this.setState({data: xhr.response, gfilter: filter})
                var data = xhr.response
                eval('this.refs.theSVGScene').setView([data.averagex,data.averagey], data.averageScale)
            }
        }.bind(this)
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
        this.loadDataFromServer(filter)
    },
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
    handleNodeTip(data, attributes, name, x, y, nid) {
        var text = data + '; '
        text = text + 'тип - ' + name + '; '
        attributes.forEach(function(attr) {
            if (attr.value) {
                text = text + attr.name + ' - '
                text = text + attr.value + '; '
            }
        })
        //text = text + 'x: ' + x + ' y: ' + y + '; '
        text += ' nid: ' + nid
        eval('this.refs.theInfo').updateState(text)
    },
    setNode(nid, x, y) {
        console.log(x,'|',this.state.data.nodes[nid].x)
        console.log(y,'|',this.state.data.nodes[nid].y)
        var data = this.state.data
        data.nodes[nid].x = x
        data.nodes[nid].y = y
        this.setState({ data: x, data })
    },
    render: function() {
        var graphFilter = $('.graph .filter')
        var info = $('.graph .info')
        //var bordersOnBothSides = graphFilter.outerWidth() - graphFilter.innerWidth()
        //console.log('bb',bordersOnBothSides)

        var svgdx = graphFilter.width() + 33
        var svgdy = $('.navbar-header').height() + 3

        var dx = graphFilter.width() + 80 + info.width()
        var dy = $('.navbar-header').height() + 8
        var sceneWidth = $(window).width() - dx - scrollbarWidth()
        //sceneWidth = 400
        var sceneHeight = $(window).height() - dy
        //sceneHeight = 400
        return (
            <div className="graph">
                <Filter
                    ref='theFilter'
                    _handleSubmit={this.handleSubmit}
                    //updateTaxonomy={this.updateTaxonomy}
                    sceneHeight={sceneHeight}
                />
                <SVGScene 
                    //ref='theProxyScene'
                    ref='theSVGScene'
                    data={this.state.data}
                    filter={this.state.gfilter}
                    sceneWidth={sceneWidth}
                    sceneHeight={sceneHeight}
                    svgWidth={sceneWidth}
                    svgHeight={sceneHeight}
                    offsetX={sceneWidth/2}
                    offsetY={sceneHeight/2}
                    svgdx={svgdx}
                    svgdy={svgdy}
                    _handleNodeClick={this.handleNodeClick}
                    _handleNodeTip={this.handleNodeTip}
                    _handleSceneClick={this.handleNodeClick}
                    updateNode={this.handleUpdateNode}
                    setNode={this.setNode}
                />
                <Info ref={'theInfo'} 
                    sceneHeight={sceneHeight}
                />
            </div>
        )
    },
})


var ProxyScene = React.createClass({
    render: function() {
        if (typeof this.props.data.nodes !== 'undefined') {
            var _nodes = this.props.data.nodes
            var nodes = {}
            Object.keys(_nodes).forEach(function(key) { 
                var node = _nodes[key]
                nodes[key] = {
                    nid: key,
                    x: node.x*1000,
                    y: node.y*1000,
                    r: randint(5,15),
                }
            })
        }
        return (
            <Scene 
                nodes={nodes}
                sceneWidth={this.props.sceneWidth}
                sceneHeight={this.props.sceneHeight}
            />
        )
    }
})


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
            //var filter = {}
            var filter = this.constructor.filter
            filter.layout = this.constructor.filter.layout // Добавляем к состоянию фильтра значение способа компоновки
            filter.options = {zero: 'no'} // Добавляем к состоянию фильтра значение словаря options
            filter.nodes = this.state.nodes // Добавляем к состоянию фильтра значение массива nodes
            filter.taxonomy = eval('this.refs.theTaxonomy').getState() // Добавляем к состоянию фильтра чекбоксов всех компонентов таксономии
            filter.data = eval('this.refs.theFilterData').state.value // Добавляем к состоянию фильтра значение поля NodeData input 
            filter.depth = eval('this.refs.theDepth').state.value // Добавляем к состоянию фильтра значение поля NodeData input 
            //filter.attributes = eval('this.refs.theFilterAttributes').constructor.filter // Добавляем к состоянию фильтра значение фильтра аттрибутов
            //console.log('FILTER',filter)
            if (typeof (func = this.props._handleSubmit) === 'function') { func(filter) } // Передаём обработку родительскому компоненту
            this.state.nodes = [] // Обнуляем массив выделенных узлов
        }
    },
    render: function() {
        console.log('Rendering filter...')
        return (
            <div 
                className="filter noselect"
                style={{"height" : this.props.sceneHeight,}}
                >
                <form onSubmit={this.handleSubmit} ref="forceGraphFilterForm" className='taxonomy'>
                    <Layout _updateFilter={this.updateFilter} _submit={this.handleSubmit} />
                    <input type="submit" className="btn btn-warning" value="Отфильтровать" />
                    <JoinPersons ref='theJoinPersons' _updateFilter={this.updateFilter} />
                    <Depth ref='theDepth' />
                    <NodeData ref={'theFilterData'} />
                    <div className={'RecursiveCheckboxTree'}>
                        <RecursiveCheckboxTree
                            ref={'theTaxonomy'}
                            children={this.state.taxonomyData}
                            display={'Отображать выбранные типы сущностей, включая их соседей:'}
                        />
                    </div>
                    {/*
                    <Attributes ref='theFilterAttributes' _updateFilterState={this.updateFilter} />
                    <Position />
                    */}
                    <input type="submit" className="btn btn-warning" value="Отфильтровать" />
                </form>
            </div>
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


var Depth = React.createClass({
    getInitialState: function() {
        return {value: '1'}
    },
    handleChange: function(event) {
        this.setState({value: event.target.value});
    },
    render: function() {
        return (
            <label className='data'>
                Глубина поиска соседних узлов
                <input type="text" value={this.state.value} onChange={this.handleChange} />
            </label>
        )
    },
})


var JoinPersons = React.createClass({
    getInitialState: function() {
        var isChecked = false
        if (typeof (func = this.props._updateFilter) === 'function') { func('joinPersons', isChecked) }
        return {isChecked: isChecked}
    },
    handleChange: function(event) {
        var isChecked = !this.state.isChecked
        this.setState({isChecked: isChecked});
        if (typeof (func = this.props._updateFilter) === 'function') { func('joinPersons', isChecked) }
    },
    render: function() {
        return (
            <label className='data'>
                <input type="checkbox" checked={this.state.isChecked} onChange={this.handleChange} />
                Объединять персоны по фамилии
            </label>
        )
    },
})


//class CheckboxWithLabel extends React.Component {
var roinPersons = React.createClass({
    getInitialState: function() {
        this.state = {isChecked: false};
        this.onChange = this.onChange.bind(this)
    },
    onChange() { 
        this.setState({isChecked: !this.state.isChecked})
    },
    render: function() {
        return ( 
            <label>
                <input type="checkbox" checked={this.state.isChecked} onChange={this.onChange} /> 
            {this.state.isChecked ? this.props.labelOn : this.props.labelOff} 
            </label>
        ) 
    },
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
                Фильтрация узлов по полю data
                <input type="text" value={this.state.value} onChange={this.handleChange} />
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
            <div 
                className="info"
                style={{"height" : this.props.sceneHeight,}}
                >
                {this.state.text}
            </div>
        )
    },
})


var Layout = React.createClass({
    getInitialState: function() {
        return {
            layouts: ['spring', 'shell', 'random'],
            value: 'spring',
        }
    },
    handleChange(e) {
        var value = e.target.value.substr(0, 140)
        this.setState({value: value})
        console.log("LAYOUT VALUE",value)
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





var SVGScene = React.createClass({
    statics: {
        clicked: false,
    },
    getInitialState: function() {
        var scale = 1
        return {
            clicked: false,
            dragging: false,
            scale: scale,
            vx: 0.5,
            vy: 0.5,
            dx: 0,
            dy: 0,
        }
    },
    setView(point, scale) {
        var vx = point[0]
        var vy = point[1]

        var vxs = vx * this.props.svgWidth*scale
        var vys = vy * this.props.svgHeight*scale
        //console.log('setView: vxs ',vxs,' vys',vys)

        var dx = vxs - this.props.svgWidth/2
        var dy = vys - this.props.svgHeight/2
        //console.log('setView: dx ',dx,' dy',dy)

        this.setState({dx: dx, dy: dy, vx: vx, vy: vy, scale: scale})
    },
    setCam(point) {
        var x = point[0] + this.props.svgdx + this.props.svgWidth/2
        var y = point[1] + this.props.svgdy + this.props.svgHeight/2

        var vx = (x + this.state.dx - this.props.svgdx) / (this.props.svgWidth*this.state.scale)
        var vy = (y + this.state.dy - this.props.svgdy) / (this.props.svgHeight*this.state.scale)

        var vxs = vx * this.props.svgWidth*this.state.scale
        var vys = vy * this.props.svgHeight*this.state.scale
        //console.log('setView: vxs ',vxs,' vys',vys)

        var dx = vxs - this.props.svgWidth/2
        var dy = vys - this.props.svgHeight/2
        //console.log('setView: dx ',dx,' dy',dy)

        this.setState({dx: dx, dy: dy, vx: vx, vy: vy})
    },
    project(_point) {
        var point = {}
        var x = _point[0]
        var y = _point[1]
        var sx = x * this.props.svgWidth*this.state.scale
        var sy = y * this.props.svgHeight*this.state.scale
        point.x = sx - this.state.dx
        point.y = sy - this.state.dy
        return point
    },
    reProject(_point) {
        var point = {}
        var x = _point[0]
        var y = _point[1]
        //console.log(x)
        //console.log(x+this.state.dx)
        point.x = (x+this.state.dx) / (this.props.svgWidth*this.state.scale)
        point.y = (y+this.state.dy) / (this.props.svgHeight*this.state.scale)
        return point
    },
    setNode(nid, x, y) {
        console.log("X",x,"Y",y)
        var point = this.reProject([x,y])
        if (typeof (func = this.props.setNode) === 'function') { func(nid, point.x, point.y) }
    },
    handleSceneClick(e) {
        var cx = (e.pageX - this.props.svgdx) -this.props.svgWidth/2
        var cy = (e.pageY - this.props.svgdy) -this.props.svgHeight/2
        if (this.constructor.clicked) {
            this.constructor.clicked = false
        } else {
            this.setCam([cx,cy])
        }
    },
    handleMouseDown(e) {
        console.log("Scene dragging...")
        if (e.button !== 0) return // only left mouse button
        var pos = $(this.getDOMNode()).offset()
        this.setState({
            dragging: true,
            mouseDown: 'mouse-down',
            rel: {
                x: (e.pageX - this.props.svgdx) -this.props.svgWidth/2,
                y: (e.pageY - this.props.svgdy) -this.props.svgHeight/2,
                //x: e.pageX - pos.left,
                //y: e.pageY - pos.top
            }
        })
        e.stopPropagation()
        e.preventDefault()
    },
    handleMouseUp(e) {
        console.log("Stop scene dragging")
        this.setState({
            dragging: false,
            mouseDown: '',
        })
        e.stopPropagation()
        e.preventDefault()
    },
    handleMouseMove(e) {
        if (this.state.dragging) {
            var cx = (e.pageX - this.props.svgdx) -this.props.svgWidth/2
            var cy = (e.pageY - this.props.svgdy) -this.props.svgHeight/2
            var dx = this.state.rel.x - cx
            var dy = this.state.rel.y - cy
            this.setCam([dx,dy])
            this.setState({ rel: { x: cx, y: cy, } })
        }
    },
    handleWheel(e) {
        e.preventDefault() 
        if(e.deltaY < 0) {
            //this.handleSceneClick(e)
            this.handleWheelClick(e, '+')
        } else {
            this.handleWheelClick(e, '-')
        }
    },
    handleWheelClick(e, sign) {
        e.preventDefault()
        var scaleStep = 0.2
        var scale = this.state.scale
        this.constructor.clicked = false
        scale = eval(scale + sign + scaleStep)

        var cx = (e.pageX - this.props.svgdx) -this.props.svgWidth/2
        var cy = (e.pageY - this.props.svgdy) -this.props.svgHeight/2
        var dx = cx - cx * scale
        var dy = cy - cy * scale
        console.log("SCALE",scale,"CX",cx,"CY",cy)
        if (scale > 0) {
            this.setCam([cx,cy])
            this.setState({scale: scale})
        }
    },
    handleScaleClick(e, sign) {
        console.log('sign',sign)
        e.preventDefault()
        var scaleStep = 0.2
        var scale = this.state.scale

        /*
        if (this.constructor.clicked) {
            this.constructor.clicked = false
        } else {
            if ((sign != '+') || (sign != '-')) {
                sign = '+'
            }
        }
        */

        this.constructor.clicked = false
        scale = eval(scale + sign + scaleStep)
        if (scale > 0) {
            this.setState({scale: scale})
        }
        //console.log('scale',scale)
    },
    clicked(_value) {
        var value
        value = (typeof _value === 'undefined') ? false: _value
        this.constructor.clicked = value
    },
    mouseClick(e) {
        console.log("CLICKED")
    
            var x = (e.pageX - this.props.svgdx)
            var y = (e.pageY - this.props.svgdy)
            console.log(x,y)
            if (typeof (func = this.props.setNode) === 'function') { 
                func(this.props.nid, x, y) 
            }
    },
    render: function() {
        var sceneHeight = this.props.sceneWidth/2
        var scale = this.props.sceneWidth/10
        var r = 5
        var nodeRows = []
        var edgeRows = []

        // В случае, если массив данных this.props.data.nodes уже проинициализирован, то:
        if (typeof this.props.data.nodes !== 'undefined') {
            var nodes = this.props.data.nodes
            // Создаём массив объектов типа GraphNode
            Object.keys(nodes).forEach(function(key) {
                // В данном случае, специально, id узла совпадает 
                // с порядковым ключом ассоциативного массива объектов.
                nid = key
                var node = nodes[nid]
                var point = this.project([node.x,node.y])
                nodeRows.push(<GraphNode
                    key={nid}
                    ref={"theGraphNode"+nid}
                    nid={nid}
                    type={node.type}
                    data={node.data}
                    offsetX={this.props.offsetX}
                    offsetY={this.props.offsetY}
                    svgdx={this.props.svgdx}
                    svgdy={this.props.svgdy}
                    x={point.x}
                    y={point.y}
                    taxonomy={node.taxonomy}
                    attributes={node.attributes}
                    degree={node.degree}
                    r={r}
                    //_sceneDoubleClick={this.handleSceneClick}
                    //_sceneClicked={this.clicked}
                    //_handleNodeClick={this.props._handleNodeClick}
                    //_handleNodeTip={this.props._handleNodeTip}
                    onMouseClick={this.mouseClick}
                    setNode={this.setNode}
                />)
            }.bind(this))

            // Создаём массив объектов типа GraphEdge
            Object.keys(nodes).forEach(function(key) {
                var node = nodes[key]
                var x1 = node.x*scale+this.props.offsetX
                var y1 = node.y*scale+this.props.offsetY
                node.neighbors.forEach(function(nid) {
                    var eid = key+nid
                    var startPoint = this.project([node.x,node.y])
                    var endPoint = this.project([nodes[nid].x,nodes[nid].y])
                    edgeRows.push(<GraphEdge
                        key={eid}
                        ref={"theGraphEdge"+eid}
                        eid={eid}
                        startx={startPoint.x}
                        starty={startPoint.y}
                        x2={endPoint.x}
                        y2={endPoint.y}
                    />)
                }.bind(this))
            }.bind(this))
        }

        console.log('Updating graph...')
        return (
            <svg 
                width={this.props.sceneWidth}
                height={this.props.sceneHeight}
                //onClick={this.handleSceneClick}
                onDoubleClick={this.handleSceneClick}
                onWheel={this.handleWheel}
                onMouseUp={this.handleMouseUp}
                onMouseDown={this.handleMouseDown}
                onMouseMove={this.handleMouseMove}
                className={'' + this.state.mouseDown}
            >
                <symbol id="organization-icon" viewBox="0 0 22 22">
                    <path d="M32 6.076c-1.177 0.522-2.443 0.875-3.771 1.034 1.355-0.813 2.396-2.099 2.887-3.632-1.269 0.752-2.674 1.299-4.169 1.593-1.198-1.276-2.904-2.073-4.792-2.073-3.626 0-6.565 2.939-6.565 6.565 0 0.515 0.058 1.016 0.17 1.496-5.456-0.274-10.294-2.888-13.532-6.86-0.565 0.97-0.889 2.097-0.889 3.301 0 2.278 1.159 4.287 2.921 5.465-1.076-0.034-2.088-0.329-2.974-0.821-0.001 0.027-0.001 0.055-0.001 0.083 0 3.181 2.263 5.834 5.266 6.437-0.551 0.15-1.131 0.23-1.73 0.23-0.423 0-0.834-0.041-1.235-0.118 0.835 2.608 3.26 4.506 6.133 4.559-2.247 1.761-5.078 2.81-8.154 2.81-0.53 0-1.052-0.031-1.566-0.092 2.905 1.863 6.356 2.95 10.064 2.95 12.076 0 18.679-10.004 18.679-18.68 0-0.285-0.006-0.568-0.019-0.849 1.283-0.926 2.396-2.082 3.276-3.398z" fill="#000000"></path>
                </symbol>
                <g className='edges'>{edgeRows}</g>
                {nodeRows}
                <ScaleNav 
                    _handleClick={this.handleScaleClick}
                    _sceneClicked={this.clicked}
                />
                <line 
                    x1={-5 + this.props.offsetX} 
                    y1={0 + this.props.offsetY} 
                    x2={5 + this.props.offsetX} 
                    y2={0 + this.props.offsetY} 
                    stroke='purple'
                />
                <line 
                    x1={0 + this.props.offsetX} 
                    y1={-5 + this.props.offsetY} 
                    x2={0 + this.props.offsetX} 
                    y2={5 + this.props.offsetY} 
                    stroke='purple'
                />
            </svg>
        );
    },
})


var ScaleNav = React.createClass({
    handleClick(e, sign) {
        if (typeof (func = this.props._sceneClicked) === 'function') { func() }
        if (typeof (func = this.props._handleClick) === 'function') { func(e, sign) }
    },
    render: function() {
        return(
            <g className='scale-nav noselect'>
                <ScaleNavPlus _handleClick={this.handleClick} />
                <ScaleNavMinus _handleClick={this.handleClick} />
            </g>
        )
    }
})
var ScaleNavPlus = React.createClass({
    handleClick(e) {
        if (typeof (func = this.props._handleClick) === 'function') { func(e, '+') }
    },
    render: function() {
        return(
            <g className='scale-nav-plus' onClick={this.handleClick}>
                <g>
                    <rect x='2' y='2' rx='2' ry='2' width="25" height="25" />
                    <text x='6' y='24'>+</text>
                </g>
            </g>
        )
    }
})
var ScaleNavMinus = React.createClass({
    handleClick(e) {
        if (typeof (func = this.props._handleClick) === 'function') { func(e, '-') }
    },
    render: function() {
        return(
            <g className='scale-nav-minus' onClick={this.handleClick}>
                <g>
                    <rect x='2' y='28' rx='2' ry='2' width="25" height="25" />
                    <text x='9' y='48'>-</text>
                </g>
            </g>
        )
    }
})


var GraphNode = React.createClass({
    getInitialState: function() {
        return {
            checked: false,
            dragging: false,
        }
    },
    componentWillMount() {
    },
    componentDidUpdate: function (props, state) {
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
            this.props._handleNodeTip(this.props.data, this.props.attributes, this.props.taxonomy.name, this.props.x, this.props.y, this.props.nid)
        }
    },
    /*
    onDoubleClick: function() {
        alert(location)
        //location = "http://www.mozilla.org"
        if (typeof (func = this.props._sceneClicked) === 'function') { func(false) }
        if (typeof (func = this.props._sceneDoubleClick) === 'function') { func() }
    },
    */
    onClick: function () {
        //alert(location)
        var checked = this.state.checked
        checked = checked ? false : true
        this.setState({ checked: checked, })
        // Передача обработки родительскому компоненту
        if (typeof (func = this.props._sceneClicked) === 'function') { func() }
        if (typeof (func = this.props._handleNodeClick) === 'function') { 
            func(this.props.nid, 
            checked, 
            this.props.data, 
            this.props.attributes) 
        }
    },
    handleMouseDown(e) {
        console.log("X",this.props.x - this.props.offsetX)
        if (e.button !== 0) return // only left mouse button
        //var pos = $(this.getDOMNode()).offset()
        this.setState({
            dragging: true,
            mouseDown: 'mouse-down',
            /*
            rel: {
                x: (e.pageX - this.props.svgdx),
                y: (e.pageY - this.props.svgdy),
            }
            */
        })
        e.stopPropagation()
        e.preventDefault()
    },
    handleMouseUp(e) {
        this.setState({
            dragging: false,
            mouseDown: '',
        })
        e.stopPropagation()
        e.preventDefault()
    },
    handleMouseMove(e) {
        if (this.state.dragging) {
            var x = (e.pageX - this.props.svgdx)
            var y = (e.pageY - this.props.svgdy)
            if (typeof (func = this.props.setNode) === 'function') { 
                //func(this.props.nid, this.state.rel.x, this.state.rel.y) 
                func(this.props.nid, x, y) 
            }
            /*
            this.setState({
                rel: {
                    x: (e.pageX - this.props.svgdx),
                    y: (e.pageY - this.props.svgdy),
                }
            })
            */
        }
    },
    dragStart(e) {
            var x = (e.pageX - this.props.svgdx)
            var y = (e.pageY - this.props.svgdy)
            console.log(x,y)
            if (typeof (func = this.props.setNode) === 'function') { 
                func(this.props.nid, x, y) 
            }
    },
    click(e) {
        console.log("CLICKED")
    },
    render: function() {
        var tid = this.props.taxonomy.tid
        if (tid == 10) {
            NodeType = GraphNodePerson
        } else if (tid == 300) {
            NodeType = GraphNodeOrganization
        } else if (inArray(tid, events)) {
            NodeType = GraphNodeEvent
        } else {
            NodeType = GraphNodeCircle
        }

        var text = []
        var scaleX = 1.1
        var scaleY = 1.1
        if (this.props.degree > 2) {
            scaleX = 1.9
            scaleY = 1.9
            text.push(
                <text 
                    x={this.state.x}
                    y={this.state.y+15}
                >
                    {this.props.data}
                </text>)
        }
        var scale = 'scale(' + scaleX + ',' + scaleY +') '
        var translateX = this.props.x/scaleX
        var translateY = this.props.y/scaleY
        var translate = 'translate(' + translateX + ', ' + translateY + ') '
        var transform =  scale + translate

        return (
            <g
                transform={transform} 
                draggable='true'
                //onDragStart={this.dragStart}
                //onMouseClick={this.props.mouseClick}
            >
                <NodeType
                    {...this.props}
                    r={this.props.r}
                    checked={this.state.checked}
                    text={text}
                    onMouseDown={this.handleMouseDown}
                    onMouseUp={this.handleMouseUp}
                    onMouseMove={this.handleMouseMove}
                    onClick={this.click}
                />
            </g>
        )
    }
})


var GraphNodePerson = React.createClass({
    handleDoubleClick() {
        console.log('nid',this.props.nid)
        //location = "/map/" + this.props.nid
        //if (typeof (func = this.props._onClick) === 'function') { func() }
        window.open('/map/' + gid +'/'  + this.props.nid, '_blank')
        //window.open('/json-transfers/' + gid +'/'  + this.props.nid, '_blank')
    },
    render: function() {
        return (
            <g 
                className={'person ' + this.props.checked + ' ' + this.props.type}
                >
                <path
                    transform="scale(.3) translate(-25,-25)"
                    d="M 24.827,0 C 11.138,0 0.001,11.138 0.001,24.827 c 0,13.689 11.137,24.827 24.826,24.827 13.688,0 24.826,-11.138 24.826,-24.827 C 49.653,11.138 38.517,0 24.827,0 Z m 14.315,38.51 c 0,-0.574 0,-0.979 0,-0.979 0,-3.386 -3.912,-4.621 -6.006,-5.517 -0.758,-0.323 -2.187,-1.011 -3.653,-1.728 -0.495,-0.242 -0.941,-0.887 -0.997,-1.438 l -0.162,-1.604 c 1.122,-1.045 2.133,-2.5 2.304,-4.122 l 0.253,0 c 0.398,0 0.773,-0.298 0.832,-0.663 l 0.397,-2.453 c 0.053,-0.524 -0.442,-0.842 -0.843,-0.842 0.011,-0.052 0.02,-0.105 0.025,-0.149 0.051,-0.295 0.082,-0.58 0.102,-0.857 0.025,-0.223 0.045,-0.454 0.056,-0.693 0.042,-1.158 -0.154,-2.171 -0.479,-2.738 -0.33,-0.793 -0.83,-1.563 -1.526,-2.223 -1.939,-1.836 -4.188,-2.551 -6.106,-1.075 -1.306,-0.226 -2.858,0.371 -3.979,1.684 -0.612,0.717 -0.993,1.537 -1.156,2.344 -0.146,0.503 -0.243,1.112 -0.267,1.771 -0.026,0.733 0.046,1.404 0.181,1.947 -0.382,0.024 -0.764,0.338 -0.764,0.833 l 0.396,2.453 c 0.059,0.365 0.434,0.663 0.832,0.663 l 0.227,0 c 0.36,1.754 1.292,3.194 2.323,4.198 l -0.156,1.551 c -0.056,0.55 -0.502,1.193 -0.998,1.438 -1.418,0.692 -2.815,1.358 -3.651,1.703 -1.97,0.812 -6.006,2.131 -6.006,5.517 l 0,0.766 C 7.033,34.756 5.005,30.031 5.005,24.83 c 0,-10.932 8.894,-19.826 19.826,-19.826 10.933,0 19.826,8.894 19.826,19.826 -0.004,5.303 -2.109,10.116 -5.515,13.68 z"/>
                {/*this.props.text*/}
            </g>
        )
                //<circle cx='0' cy='0' r='1' fill={'purple'} />
    }
})


var GraphNodeCircle = React.createClass({
    dragStart(e) {
        console.log("node drag")
            var x = (e.pageX - this.props.svgdx)
            var y = (e.pageY - this.props.svgdy)
            console.log(x,y)
            if (typeof (func = this.props.setNode) === 'function') { 
                func(this.props.nid, x, y) 
            }
    },
    render: function() {
        return (
            <g
                //draggable='true'
                className={'circle ' + this.props.checked}
                onMouseDown={this.props.onMouseDown}
                onMouseUp={this.props.onMouseUp}
                onMouseMove={this.props.onMouseMove}
                //onDragStart={this.dragStart}
                onClick={this.props.click}
            >
                <circle 
                    cx='0'
                    cy='0'
                    r={this.props.r}
                />
            {/*this.props.text*/}
            </g>
        )
    }
})


var GraphNodeOrganization = React.createClass({
    render: function() {
        var useTag = '<use xlink:href="#organization-icon" />';
        //var useTag = '<use xlink:href="/static/org.svg#zz-icon" />';
        return (<g>
            <g
                className={'organization ' + this.props.checked}
            >
                {/*this.props.text*/}
                <circle 
                    cx='0'
                    cy='0'
                    r='3'
                    fill='orange'
                />
            </g>
        </g>)
    }
})


var GraphNodeEvent = React.createClass({
    render: function() {
        return (
            <g
                className={'event ' + this.props.checked}
            >
                <rect 
                    transform='scale(1, 1.3) rotate(45) translate(-4, -4)'
                    x='0'
                    y='0'
                    height="8"
                    width="8"
                />
                {/*this.props.text*/}
            </g>
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


React.render( <Graph/>, mountGraph)
