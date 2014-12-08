var handlebars = require('handlebars')
                 .create({defaultLayout:'main'})
var express = require('express')
var three = require('three')
var app = express()

app.engine('handlebars', handlebars.engine)
app.set('view engine', handlebars)
app.set('port', (process.env.PORT || 5000))

app.get('/', function(req, res){
  res.render('index',greeting)
})

var template = 'Node app is running at localhost: {port~number}'
var txt = template.replace('{port~number}', app.get('port'))

app.listen(app.get('port'), function(){
  console.log(txt)
})
