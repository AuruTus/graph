var ForceFilterd3 = React.createClass({
    getInitialState: function() {
        return {
            determine: {},
            childSelectValue: '',
            nodesList: nodesList,
        }
    },
    handleSubmit: function(e) {
        e.preventDefault()
        console.log(this.constructor.displayName,' > ',this.state.determine)
        var filterArr = joinAsTrue(this.state.determine)
        filter = filterArr.join(';')
        color = this.state.childSelectValue
        console.log(this.constructor.displayName,' > ',filter)
        window.location.assign('/force-d3/'+gid+'/'+filter+'/'+nodesList+'/'+color+'/')
    },
    handleChange: function(e) {
        key = e.target.value
        console.log(this.constructor.displayName,' > ',key)
        var value = this.state.determine[key] ? false : true
        console.log(this.constructor.displayName,' > ',value)

        var state = this.state.determine
        state[key] = value
        this.setState({
            determine: state
        })
    },
    changeSelectHandler: function(e) {
        console.log(this.constructor.displayName,' > ',e.target.value)
        this.setState({
            childSelectValue: e.target.value
        })
    },
    render: function() {
        if (nodesList.length > 0) { nodesList = []}
        if (filter.length > 0) { filter = []}
        return (
            <form onSubmit={this.handleSubmit} ref="forceGraphFilterForm">
                <input type='checkbox' className='btn' value='zero' onChange={this.handleChange} />Спрятать вершины без связей
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <input type='checkbox' className='btn' value='radius' onClick={this.handleChange} />Выделять кол-во связей/атрибутов
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

                <div>
                <MySelect 
                    url="/json-attributes/"
                    value={this.state.childSelectValue}
                    onChange={this.changeSelectHandler} 
                />
                </div>

                <br /><br />
                <input type="submit" className="btn btn-warning" value="Отфильтровать" />
            </form>
        )
    },
})


var MySelect = React.createClass({
    propTypes: {
        url: React.PropTypes.string.isRequired
    },
    getInitialState: function() {
        return {
            options: [],
            properties: [],
        }
    },
    componentDidMount: function() {
        // get your data
        $.ajax({
            // url по которому на стороне сервера формируется массив атрибутов узлов в формате json
            url: this.props.url,

            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({properties: data})
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString())
            }.bind(this)
        })
    },
    handlerChange: function (e) {
        this.props.onChange(e)
    },
    render: function() {
        var optionsArray = []
        data = this.state.properties
        for (var i = 0; i < data.length; i++) {
            var option = data[i];
            //console.log(this.constructor.displayName,' > ',option)
            optionsArray.push(
                <option key={i} value={option.value} onChange={this.handlerChange}>{option.display}</option>
            );
        }
        return (
            <select onChange={this.handlerChange}>{optionsArray}</select>
        )
    }
});


React.render(
    <ForceFilterd3 />,
    document.getElementById('force-filterd3')
);


