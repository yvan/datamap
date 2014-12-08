var handlebars = require('express-handlebars')
var express = require('express')
var three = require('three')
var app = express()

app.engine('handlebars', handlebars({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')
app.set('port', (process.env.PORT || 5000))

app.get('/', function(req,res){
  res.send('your mom')
  res.end()
})

app.get('/home', function(req, res){
  res.render('home',{'item':'pizza', 'description':'tasty'})
})

var template = 'Node app is running at localhost: {port~number}'
var txt = template.replace('{port~number}', app.get('port'))

app.listen(app.get('port'), function(){
  console.log(txt)
})
