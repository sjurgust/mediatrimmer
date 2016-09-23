app = require('express.io')()
app.http().io()

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
}

var fs = require("fs"), path = require("path")
var readdir = require('readdir-absolute');
GLOBAL['inpath'] = 'C:/Users/sjurl/mediatrimmer', GLOBAL['outpath']
var target_field

function set_globals(data){
	var key = data.target_field || GLOBAL['inpath']
	var val = data.selected || GLOBAL['inpath']
	GLOBAL[key] = val
	console.log(GLOBAL)
}

function fill_user(req){
	var return_list = req.return_content || []
	var target = req.target || '#'
	var display_type = req.display_type || 'normal'
	var html

	if (req.buffering) {
		html = '<i class="fa fa-1x fa-spinner fa-spin"></i>'
	} else {
		html = '<ul><a href="javascript:get_drives({target: \'#drives\'})"><li><i class="fa fa-1x fa-level-up"></i></li></a>'
		return_list.forEach( (item) => { html+='<a href="javascript:get_accessable({what_dir: \''+item.abs_path+'\', target: \''+target+'\', type:\'directories\'})"><li class="drives">'+item.filename+'<input type="checkbox" onMouseUp="select_dir({selected: \''+item.abs_path+'\', target_field: \''+target_field+'\'})" style="float:right;display:inline;" class="checkbox"></input></li></a>' } )
		html+='</ul>'
	}
	app.io.sockets.emit('fill_info_in_gui', {target: target, html: html})
}


app.io.route('get_accessable', function(req) {
	get_accessable(req.data)
})

app.io.route('get_drives', function(req) {
	require('./win_drives').refresh()
})

function get_accessable(data) {
	var what_dir 		= data.what_dir || process.cwd()
	// sikre at dir slitter med slash
	// if (what_dir.length>2 ) {what_dir = what_dir.replace(":", ":\\")}
	var target 			= data.target || ''
	var dirs_or_files 	= data.type || 'directories'
	var display_type 	= data.display_type || 'normal'
	var return_content 	= []
	var unwanted 		= /System Volume|\$Recycle.|\$RECYCLE.|bootmgr|Boot/
	var flag_has_accessed = false, flag_done_each = false

	readdir(what_dir, function(err, files){
		
		files = files || []
		files.forEach(function(fil, index, array){
			flag_has_accessed = false
			fs.access(fil, fs.R_OK, (err) => {
				var isDir_tmp = false
	        	if (!err && !unwanted.test(fil)) {
	        		fs.stat(fil, function(err, stat) {
	        			// console.log(stat && stat.isDirectory())
        				if (stat && stat.isDirectory()) { return_content.push({filename:fil, isDir: true, abs_path: fil.replace(/\\/g,"/")} )}
        			})
	        	}
	        	flag_has_accessed = true
			})
			if (index == array.length-1) {flag_done_each = true}
		})
	})
	fill_user({buffering:true})
	// vent inntil operasjoner er ferdige og sa kjor fill_info
	setInterval(function(){if (flag_has_accessed && flag_done_each){fill_user({return_content:return_content, target:target, display_type: display_type});clearInterval(this)}},500)
}


app.get('/', function(req, res) {
	res.sendfile(__dirname + '/mtrim.html')
})

app.get('/dirselector', function(req, res) {
	target_field = req.query.target_field || ''
	setTimeout(function() { require('./win_drives').refresh() }, 1000)
	res.sendfile(__dirname + '/select_dir.html')
})

app.get(/^.+.(svg|jpg|png)$/, function(req, res, next){
    if (fs.existsSync(decodeURIComponent(__dirname + '/img/' + req.url))) { res.sendfile( __dirname + '/img/' + req.url)}
})
app.get(/^.+.(js)$/, function(req, res, next){
    res.sendfile( req.url)
})



app.get(/^.+.(mp4)$/, function(req, res, next){

	var url = require('url')
	// // var path = require('path')

	var movie_webm, movie_mp4
	// ... [snip] ... (Read index page)
	movie_mp4 =fs.readFileSync(__dirname+req.url)



	var total;
    
    // if (reqResource == "/movie.mp4") {
        total = movie_mp4.length
    // }
    // ... [snip] ... handle two other formats for the video
    var range = req.headers.range;
    var positions = range.replace(/bytes=/, "").split("-");
    var start = parseInt(positions[0], 10);
    var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
    var chunksize = (end - start) + 1;
    // if (reqResource == "/movie.mp4") {
        res.writeHead(206, {
            "Content-Range": "bytes " + start + "-" + end + "/" + total,
                "Accept-Ranges": "bytes",
                "Content-Length": chunksize,
                "Content-Type": "video/mp4"
        });
        res.end(movie_mp4.slice(start, end + 1), "binary");
    // }
    // res.sendfile( GLOBAL['inpath'] + req.url)}
    // console.log(__dirname+req.url)
})

app.listen(6543)