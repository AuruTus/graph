/* 
Иерархия компонента:

ForceGraphFilter
- OptionsFilter
-- ZRadioGroup
--- ZRadioGroupButton
- AttributesFilter
-- ZCheckboxGroup
--- ZCheckboxButton

*/


var ForceGraphFilter = React.createClass({
    getInitialState: function() {
        return {
            attributesState: [],
            optionsState: [],
        }
    },
    graphUpdate: function() {
        // Формируем массив json-данных graphFilter
        var graphFilter = { 
            filterAttributes: this.state.attributesState ,
            filterNodes: nodesList,
            filterOptions: this.state.optionsState,
        } 
        //console.log('filterAttributes --> ',graphFilter.filterAttributes)
        //console.log('filterOptions --> ',graphFilter.filterOptions)
        //console.log('graphFilter--> ',graphFilter)

        // Перерисовываем граф
        force.update(gid, graphFilter)
    },

    handleAttributesFilterChange: function(state) {
        //console.log('state > ',state)
        state = joinAsTrue(state)
        //console.log('state[] > ',state)
        this.setState({ attributesState: state })
        //console.log('state.state > ',this.state.attributesState)
    },
    handleAttributesFilterReClick: function() {
        // Перерисовываем граф
        this.graphUpdate()        
    },

    handleOptionsFilterChange: function(state) {
        this.setState({ optionsState: state })
        //console.log('>>> ',state)
    },
    handleOptionsFilterReClick: function(state) {
        // Перерисовываем граф
        this.graphUpdate()        
    },

    handleReClick: function(state) {
        // Перерисовываем граф
        this.graphUpdate()        
    },
    handleSubmit: function(e) {
        e.preventDefault()
        
        // Перерисовываем граф
        this.graphUpdate()        

        nodesList = []
    },
    render: function() {
        // Обновляем граф при инициализации компонента
        this.graphUpdate()
        //console.log('> ','gogogo')

        return (
            <form onSubmit={this.handleSubmit} ref="forceGraphFilterForm">
                <input type="submit" className="btn btn-warning" value="Отфильтровать" />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <AttributesFilter
                    onChange={this.handleAttributesFilterChange}
                    onClick={this.handleReClick}
                    //onClick={this.handleAttributesFilterReClick}
                />
                <br /><br />
                <OptionsFilter 
                    onChange={this.handleOptionsFilterChange}
                    onClick={this.handleReClick}
                    //onClick={this.handleOptionsFilterReClick}
                />
            </form>
        )
    },
});


var OptionsFilter = React.createClass({
    getInitialState: function() {
        return {
            zeroDegreeProperties: [
                {value: 'yes', display: 'Отображать узлы без связей', checked: true},
                {value: 'no', display: 'не отображать', checked: false},
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
        this.props.onChange(state)
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
            <ZRadioGroup
                name='zero'
                properties={this.state.zeroDegreeProperties}
                onChange={this.handleChange}
                onClick={this.handleReClick}
            />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <ZRadioGroup
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
        // Получаем массив атрибутов с сервера в формате json
        this.loadDataFromServer()

        return {
            // Ассоциативный массив состояний группы чекбоксов
            checkboxGroupState: {},

            // Входной массив атрубутов
            attributesFilterProperties: [],
        }
    },
    handleChange: function(state) {
        this.setState({ checkboxGroupState: state })

        // Передаём родителю состояние массива checkboxGroupState
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
            <ZCheckboxGroup
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


