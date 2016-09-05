import express from 'express'
import routes from './routes'
import path from 'path'
import reload from 'reload'

import cors from 'cors'

const app = express()

/*
app.use(function noCacheForRoot(req, res, next) {
    if (req.url === '/') {
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      res.header("Pragma", "no-cache");
      res.header("Expires", 0);
    }
    next();
})
*/

//app.use('/', express.static('public'))
// Include static assets. Not advised for production
//app.use(express.static(path.join(__dirname, 'public')))
app.use('/static', express.static('public'))

// Allow Access-Control-Allow-Origin - CORS
app.use(cors())

// Set view path
app.set('views', path.join(__dirname, 'views'));
// set up ejs for templating. You can use whatever
//app.set('view engine', 'ejs')

/*
app.all('*', function(req, res, next) {
    console.log('update 2')
       //res.header("Access-Control-Allow-Origin", "*");
       res.header("Access-Control-Allow-Headers", "X-Requested-With");
       res.header('Access-Control-Allow-Headers', 'Content-Type');
       res.header('Access-Control-Allow-Credentials', 'true');
       next();
})
*/

// Set up Routes for the application
routes(app)

//Route not found -- Set 404
app.get('*', function(req, res) {
    //res.json({ 'route': 'Ресурс с данным uri не существует' });
    res.send('Ресурс с данным uri не существует')
    //res.send('404')
});


app.listen(process.env.PORT || 23004)


