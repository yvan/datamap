var handlebars = require('express-handlebars')
var express = require('express')
var path = require('path')
var app = express()

app.use(express.static(__dirname + '/static'));
app.set('port', (process.env.PORT || 5000))

app.get('/', function(req, res){
  res.sendFile(__dirname +'/index.html')
})

var template = 'Node app is running at localhost: {port~number}'
var txt = template.replace('{port~number}', app.get('port'))

app.listen(app.get('port'), function(){
  console.log(txt)
})
