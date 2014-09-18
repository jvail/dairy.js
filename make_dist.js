var fs = require('fs')
  , uglify = require("uglify-js")
  , files = [
      'dairy.milk',
      'dairy.body',
      'dairy.intake',
      'dairy.requirements',
      'dairy.herd',
      'dairy.group',
      'dairy.diet',
      'feed.evaluation',
      'feed.feeds'
    ]
  ;

fs.writeFileSync('./dairy.js', '');
fs.writeFileSync('./dairy.min.js', '');

for (var f = 0; f < files.length; f++) {

  fs.appendFileSync('./dairy.min.js', uglify.minify('./src/' + files[f] + '.js').code + '\n\n');
  fs.appendFileSync('./dairy.js', fs.readFileSync('./src/' + files[f] + '.js', { encoding: 'utf8' }) + '\n\n');

}



