var express = require('express')
var three = require('three')
var app = express()

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname+'/public'))

app.get('/', function(req, res){
  res.send('blah')
})

var template = 'Node app is running at localhost: {port~number}'
var txt = template.replace('{port~number}', app.get('port'))

app.listen(app.get('port'), function(){
  console.log(txt)
})
