var attributesList = ['yes','0']

var ForceGraphFilter = React.createClass({
    getInitialState: function() {
        return {
            attributes: [],
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
            attributesState: this.state.attributesState ,
            filterNodes: nodesList,
            filterOptions: this.state.optionsState,
        } 
        console.log('graphUpdate state attributesState ',this.state.attributesState)

        // Перерисовываем граф
        force.update(gid, graphFilter)
    },
    handleOptionsFilterReClick: function(state) {
        // Перерисовываем граф
        //this.graphUpdate()        
        console.log('state-- ',state)
    },
    handleReClick: function() {
        // Перерисовываем граф
        //this.graphUpdate()        
        //console.log(this.state.optionsState)
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
                    // массив значений фильтра атрибутов
                    attributesState={this.state.attributesState}

                    // массив значений фильтра опций
                    optionsState={this.state.optionsState}

                    reClick={this.handleReClick}
                />
                <br />
                <br />
                <OptionsFilter 
                    // массив значений фильтра опций
                    optionsState={this.state.optionsState}

                    reClick={this.handleOptionsFilterReClick}
                />
            </form>
        );
    },
});


React.render(
    <ForceGraphFilter />,
    document.getElementById('force-filter')
);


