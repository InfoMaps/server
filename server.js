/**
 * Created by raph on 20/05/17.
 */
const
    express = require('express'),
    bodyParser      = require('body-parser'),
    methodOverride  = require('method-override'),
    https           = require('https'),
    request         = require('request');

const app = express();
var port = process.env.PORT || 8080;

app.use(bodyParser());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride());

app.set('port', port);

require('./server/routes')(app);

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
