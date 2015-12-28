/* 
Иерархия компонента:

ForceGraphFilter
- OptionsFilter
-- CMRadioGroup
--- CMRadioGroupButton
- AttributesFilter
-- CMCheckboxGroup
--- CMCheckboxButton

*/


var ForceGraphFilter = React.createClass({
    getInitialState: function() {
        return {
            attributesState: {"doc_name": true, "doc_timestamp": true, "full_name": true},
            optionsState: {},
            filterNodes: nodesList,
            force: new ForceLayout('.scene', gid)
        }
    },
    graphUpdate: function() {
        //console.log(this.constructor.displayName,' --------------------------------------------------------- > ','update graph')
        // Формируем массив json-данных graphFilter
        var gfilter = { 
            attributes: this.state.attributesState ,
            nodes: nodesList,
            options: this.state.optionsState,
        } 
        //console.log('filterAttributes > ',graphFilter.filterAttributes)
        //console.log('filterOptions > ',graphFilter.filterOptions)
        //console.log('graphFilter--> ',graphFilter)

        // Перерисовываем граф
        this.state.force.update(gid, gfilter)
    },

    handleAttributesFilterChange: function(state) {
        //console.log('filterAttributes > ',state)
        //var filterAttributes = joinAsTrue(state)
        //console.log('joned filterAttributes > ',filterAttributes)
        //console.log('state[] > ',state)
        this.setState({ attributesState: state, })
        //this.setState({ attributesState: filterAttributes })
        //console.log('filterAttributes > ',this.state.attributesState)
    },
    handleAttributesFilterReClick: function() {
        // Перерисовываем граф
        //this.graphUpdate()        
    },

    handleOptionsFilterChange: function(state) {
        this.setState({ optionsState: state })
        //console.log('>>> ',state)
    },
    handleOptionsFilterReClick: function(state) {
        // Перерисовываем граф
        //this.graphUpdate()        
    },

    handleReClick: function(state) {
        //console.log('filterAttributes --> ',this.state.filterAttributes)
        //console.log('filterOptions --> ',this.state.filterOptions)
        // Перерисовываем граф
        //this.graphUpdate()        
        //console.log('---------------------------------------------> ','reclick')       
    },
    handleSubmit: function(e) {
        e.preventDefault()

        this.setState({ filterNodes: nodesList }) 
        
        // Перерисовываем граф
        //this.graphUpdate()        
    },
    handleResetClick: function(e) {
        // Сбрасываем выделенные узлы
        this.setState({ filterNodes: [] })
        //nodesListReset = true
        nodesList = []

        // Перерисовываем граф
        //this.graphUpdate()        
    },
    handleTextChange: function(e) {
        // Сбрасываем выделенные узлы
        //this.setState({ filterNodes: [] })
    },
    render: function() {
        this.graphUpdate() // Обновляем граф при инициализации компонента
                
        //<br /> <input type="text" className="" value={this.state.filterNodes} onChange={this.handleTextChange} />

        return (
            <form onSubmit={this.handleSubmit} ref="forceGraphFilterForm">
                <input type="submit" className="btn btn-warning" value="Отфильтровать" />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <AttributesFilter
                    onChange={this.handleAttributesFilterChange}
                    //onClick={this.handleReClick}
                    //onClick={this.handleAttributesFilterReClick}
                />
                <br /><br />
                <OptionsFilter 
                    onChange={this.handleOptionsFilterChange}
                    //onClick={this.handleReClick}
                    //onClick={this.handleOptionsFilterReClick}
                /><br />

                <div>
                    <input type='button' className='col-sm-2 btn' value='Сбросить выделенные узлы' onClick={this.handleResetClick} />
                    <div className="col-sm-10">
                        <input value={this.state.filterNodes} className="form-control" type="text" placeholder="Nodes list"  id="disabledInput" disabled/>
                    </div>
                </div><br />

            </form>
        )
    },
});


var OptionsFilter = React.createClass({
    getInitialState: function() {
        return {
            zeroDegreeProperties: [
                {value: 'true', display: 'Убирать узлы без связей', checked: true},
                {value: 'false', display: 'отображать', checked: false},
            ],
            nodeRadiusProperties: [
                {value: 'byDegree', display: 'Радиус узла по весу', checked: true},
                {value: 'byAttributes', display: 'по кол-ву атрибутов', checked: false},
            ],
            // Ассоциативный массив всех определяющих компонент атрибутов
            componentState: {},
        }
    },
    handleChange: function(key, value) {
        // Обновляем состояние массива optionsState
        var state = this.state.componentState
        state[key] = value
        this.setState({ componentState: state })

        // Передаём обработку родительскому компоненту
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(state)
        }
    },
    handleReClick: function() {
        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.onClick === 'function') {
            this.props.onClick()
        }
    },
    render: function() {
        return (
            <div>
            <CMRadioGroup
                name='zero'
                properties={this.state.zeroDegreeProperties}
                onChange={this.handleChange}
                onClick={this.handleReClick}
            />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <CMRadioGroup
                name='radius'
                properties={this.state.nodeRadiusProperties}
                onChange={this.handleChange}
                onClick={this.handleReClick}
            />
            </div>
        )
    },
})


var AttributesFilter = React.createClass({
    // Получаем массив атрибутов с сервера в формате json
    loadDataFromServer: function() {
        $.ajax({
            // url по которому на стороне сервера формируется массив атрибутов узлов в формате json
            url: '/json-attributes/',

            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({attributesFilterProperties: data})
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString())
            }.bind(this)
        })
    },
    getInitialState: function() {
        return {
            // Ассоциативный массив состояний группы чекбоксов
            checkboxGroupState: {},

            // Входной массив атрубутов
            attributesFilterProperties: [],
        }
    },
    componentDidMount: function() {
        // Получаем массив атрибутов с сервера в формате json
        this.loadDataFromServer()
    },
    handleChange: function(state) {
        //console.log(this.constructor.displayName,' state > ',state)
        this.setState({ checkboxGroupState: state })

        // Передаём родителю состояние массива checkboxGroupState
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(state)
        }
    },
    handleReClick: function() {
        //console.log(this.constructor.displayName,' > ',this.state.checkboxGroupState)
        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.onClick === 'function') {
            this.props.onClick()
        }
    },
    render: function() {
        return (
            <CMCheckboxGroup
                name='attributes'
                properties={this.state.attributesFilterProperties}
                onChange={this.handleChange}
                onClick={this.handleReClick}
            />
        )
    }
});


React.render(
    <ForceGraphFilter />,
    document.getElementById('force-filter')
);


