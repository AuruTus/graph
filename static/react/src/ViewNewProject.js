var NewProjectFilter = React.createClass({
    getInitialState: function() {
        return {
            attributes: {},
            taxonomy: {},
            options: {},
        }
    },
    handleSubmit: function(e) {
        e.preventDefault();
        // Формируем массив json-данных graphFilter
        var graphFilter = { 
            filterAttributes: this.state.attributes ,
            filterOptions: this.state.options,
            filterTaxonomy: this.state.taxonomy,
        } 
        // Преобразовываем массив json-данных graphFilter для передачи через url 
        graphFilter = encodeURIComponent(JSON.stringify(graphFilter))
        // Формируем и отправляен get-запрос на сервер
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

    },
    updateAttributesFilter(state) {
        this.setState({ attributes: state })
    },
    updateTaxonomy(state) {
        this.setState({ taxonomy: state })
    },
    updateOptions(state) {
        this.setState({ options: state })
    },
    render: function() {

                    /*
                    <AttributesFilter updateAttributesFilter={this.updateAttributesFilter} />
                    <hr/>
                    */
        return (
            <div>
                <form onSubmit={this.handleSubmit} ref="forceGraphFilterForm">
                    <TaxonomyFilter updateTaxonomy={this.updateTaxonomy} />
                    <OptionsFilter updateOptions={this.updateOptions} />
                    <input type="submit" className="btn btn-warning" value="Создать" />
                </form>
            </div>
        );
    },
});


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


var OptionsFilter = React.createClass({
    getInitialState: function() {
        return {
            // ассоциативный массив данных, полученный с сервера в формате json
            properties: [
                { "checked": true, "display": "Убирать узлы без связей", "value": 'removeZero' },
            ],
            optionsState: {},
        }
    },
    handleChange: function(checkboxGroupState) {
        this.setState({ optionsState: checkboxGroupState })
        // Передаём обновлённый словарь состояний родительскому компоненту
        if (typeof this.props.updateOptions === 'function') {
            this.props.updateOptions(checkboxGroupState)
        }
    },
    render: function() {
        return (
            <CMCheckboxGroup
                name='options'
                properties={this.state.properties}
                onChange={this.handleChange}
            />
        );
    },
})


/*
var NewGraph = React.createClass({
    loadDataFromServer: function() {
        $.ajax({
            // url по которому на стороне сервера формируется ассоциативный массив атрибутов узлов в формате json
            url: '/json-main-graph/377/',

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
    render: function() {
        //console.log(this.state.data)
        return (
            <div>
                {this.state.data}
            </div>
        );
    },
})
*/


React.render( <NewProjectFilter/>, mountNewProject)


