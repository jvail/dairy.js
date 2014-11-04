var fs = require('fs');
// var csv = fs.readFileSync('./feed_table.txt', { encoding: 'ucs-2'} ); /* windows */
var csv = fs.readFileSync('./feed_table.csv', { encoding: 'utf-8'} );
var js = '';
function escape(s) {
  return s.replace(/'/g, "\\'");
}

var lines = csv.trim().split('\n')
  , t = []
  , y = []
  , sep = (lines[0].indexOf(';') > 0) ? ';' : '\t'
  ;

var header = lines[0].split(sep);  
var units = lines[1].split(sep);  
console.log(header);
console.log(units);

/* add comment with units */
js += '/*\n'; 
for (var c = 0, cs = header.length; c < cs; c++) {
  js += '  ' + header[c] + ' [' + units[c] + ']\n'
}
js += '*/\n'; 

for (var l = 2, ls = lines.length; l < ls; l++) {
  var line = lines[l].split(sep);
  //console.log(line);
  js += '{\n';
  for (var c = 0, cs = line.length; c < cs; c++)
    js += '  ' + header[c] + ': ' + (isNaN(line[c]) ? "'" + escape(line[c]) + "'" :  parseFloat(line[c])) + (c === cs - 1 ? '\n' : ',\n');

  js += (l === ls - 1 ? '}\n' : '},\n');
}

fs.writeFileSync('./feeds.js', js, { encoding: 'utf-8'} );

