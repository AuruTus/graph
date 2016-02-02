/* цвета, которые нельзя передать SVG export'ом */
var color01 = "#000080"

// Главный компонент для визуализации в виде графа
var Graph = React.createClass({
    loadDataFromServer: function(filter) {
        // Преобразовываем массив json-данных gfilter для передачи через url 
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
                //eval('this.refs.theSVGScene').setView([data.averagex,data.averagey], data.averageScale)
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
    handleNodeTip(data, attributes, name, x, y) {
        var text = data + '; '
        text = text + 'тип - ' + name + '; '
        attributes.forEach(function(attr) {
            if (attr.value) {
                text = text + attr.name + ' - '
                text = text + attr.value + '; '
            }
        })
        text = text + 'x: ' + x + ' y: ' + y + '; '
        eval('this.refs.theInfo').updateState(text)
    },
    render: function() {
        var graphFilter = $('.graph .filter')
        var info = $('.graph .info')
        //var bordersOnBothSides = graphFilter.outerWidth() - graphFilter.innerWidth()
        //console.log('bb',bordersOnBothSides)
        var svgdx = graphFilter.width() + 80 + info.width()
        var svgdy = $('.navbar-header').height() + 8
        var sceneWidth = $(window).width() - svgdx - scrollbarWidth()
        //sceneWidth = 400
        var sceneHeight = $(window).height() - svgdy
        //sceneHeight = 400
        return (
            <div className="graph">
                <Filter
                    ref='theFilter'
                    _handleSubmit={this.handleSubmit}
                    //updateTaxonomy={this.updateTaxonomy}
                    sceneHeight={sceneHeight}
                />
                <ProxyScene 
                    ref='theProxyScene'
                    data={this.state.data}
                    filter={this.state.gfilter}
                    sceneWidth={sceneWidth}
                    sceneHeight={sceneHeight}
                    svgWidth={sceneWidth}
                    svgHeight={sceneHeight}
                    svgdx={svgdx}
                    svgdy={svgdy}
                    _handleNodeClick={this.handleNodeClick}
                    _handleNodeTip={this.handleNodeTip}
                    _handleSceneClick={this.handleNodeClick}
                />
            </div>
        );
                /*
                <Info ref={'theInfo'} 
                    sceneHeight={sceneHeight}
                />
                */
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
            //filter.layout = this.constructor.filter.layout // Добавляем к состоянию фильтра значение способа компоновки
            filter.options = {zero: 'no'} // Добавляем к состоянию фильтра значение словаря options
            filter.nodes = this.state.nodes // Добавляем к состоянию фильтра значение массива nodes
            filter.taxonomy = eval('this.refs.theTaxonomy').getState() // Добавляем к состоянию фильтра чекбоксов всех компонентов таксономии
            filter.data = eval('this.refs.theFilterData').state.value // Добавляем к состоянию фильтра значение поля NodeData input 
            filter.depth = eval('this.refs.theDepth').state.value // Добавляем к состоянию фильтра значение поля NodeData input 
            //filter.attributes = eval('this.refs.theFilterAttributes').constructor.filter // Добавляем к состоянию фильтра значение фильтра аттрибутов
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
                    <NodeData ref={'theFilterData'} />
                    <div className={'RecursiveCheckboxTree'}>
                        <RecursiveCheckboxTree
                            ref={'theTaxonomy'}
                            children={this.state.taxonomyData}
                            display={'Отображать выбранные типы сущностей, включая их соседей:'}
                        />
                    </div>
                    <Depth ref='theDepth' />
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
        return {value: '2'}
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




