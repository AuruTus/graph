/* 
Иерархия компонента:

OptionsFilter
- ZRadioGroup
-- ZRadioGroupButton

*/


var ForceGraphFilter = React.createClass({
    getInitialState: function() {
        return {
            attributesState: [],
            optionsState: [],
        }
    },
    componentDidMount: function() {
        //console.log('ForceFilter didmount')
    },
    graphUpdate: function() {
        // Формируем массив json-данных graphFilter
        var graphFilter = { 
            filterAttributes: this.state.attributesState ,
            filterNodes: nodesList,
            filterOptions: this.state.optionsState,
        } 
        console.log('state--> ',this.state.attributesState)
        console.log('graphFilter--> ',graphFilter)

        // Перерисовываем граф
        force.update(gid, graphFilter)
    },
    handleOptionsFilterReClick: function(state) {
        this.setState({ optionsState: state })
        // Перерисовываем граф
        this.graphUpdate()        
    },
    handleAttributesFilterReClick: function(state) {
        //console.log('> ',state)
        //console.log('> ',joinAsTrue(state))
        state = joinAsTrue(state)
        this.setState({ attributesState: state })
        console.log('state--> ',state)
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
        return (
            <form onSubmit={this.handleSubmit} ref="forceGraphFilterForm">
                <input type="submit" className="btn btn-warning" value="Отфильтровать" />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <AttributesFilter
                    reClick={this.handleAttributesFilterReClick}
                />
                <br /><br />
                <OptionsFilter 
                    reClick={this.handleOptionsFilterReClick}
                />
            </form>
        );
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
            componentState: {zero: 'yes', radius: 'byDegree'},
        }
    },
    handleReClick: function(key, value) {
        // Обновляем состояние массива optionsState
        var state = this.state.componentState
        state[key] = value
        this.setState({ componentState: state })

        // Передаём обработку родительскому компоненту
        this.props.reClick(state)
    },
    render: function() {
        return (
            <div>
            <ZRadioGroup
                name='zero'
                properties={this.state.zeroDegreeProperties}
                reClick={this.handleReClick}
            />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <ZRadioGroup
                name='radius'
                properties={this.state.nodeRadiusProperties}
                reClick={this.handleReClick}
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
            // Входной массив атрубутов
            attributesFilterProperties: [],
        }
    },
    handleReClick: function(state) {
        // Передаём обработку родительскому компоненту
        this.props.reClick(state)
    },
    render: function() {
        return (
            <ZCheckboxGroup
                name='attributes'
                properties={this.state.attributesFilterProperties}
                reClick={this.handleReClick}
            />
        )
    }
});


React.render(
    <ForceGraphFilter />,
    document.getElementById('force-filter')
);


