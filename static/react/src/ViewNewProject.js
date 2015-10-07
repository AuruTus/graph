var NewProjectFilter = React.createClass({
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
            <form onSubmit={this.handleSubmit} ref="forceGraphFilterForm">
                <AttributesFilter
                    updateAttributesFilter={this.updateAttributesFilter}
                />
                <hr/>
                <TaxonomyFilter
                    updateTaxonomy={this.updateTaxonomy}
                />
                <hr/>
                <input type="submit" className="btn btn-warning" value="Создать" />
            </form>
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


React.render( <NewProjectFilter/>, mountNode)


