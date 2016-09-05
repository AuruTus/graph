import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'

import MainReact from './components/MainReact'


var ReactApp = React.createFactory(MainReact)

var routes = function(app) {
    app.get('/',function(req,res){
        res.sendFile(path.join(__dirname+'/public/index.html'))
    })

    app.get('/map', function(req, res){
        //var reactHtml = 'static'
        // React.renderToString takes your component and generates the markup
        var reactHtml = ReactDOMServer.renderToString(ReactApp({}))
        // Output html rendered by react
        res.render('index.ejs', {reactOutput: reactHtml})
    })

    app.get('/test', function(req, res){
        //res.send('Helloooo World!');
        var reactHtml = 'test inject'
        res.render('test.ejs', {reactOutput: reactHtml})
    })
}

module.exports = routes


