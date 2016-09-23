// process.cwd()
// console.log("************************")

var exec = require('child_process').exec
var cmd = 'wmic logicaldisk get deviceid, volumename, description'
// var cmd = 'wmic logicaldisk get deviceid'
var drives = []

var execCallback = function(err, stdout, stderr) {
  if (err) {
    console.log('error running diskpart list command')
    console.log(err)
    return
  }
  //console.log('stdout data')
  drives = []
  var raw = stdout.split("\r\r\n")

  raw.forEach(function(drive) { 
  	drive = drive.replace(/ /g,"")
    if (/[A-Z]:/.test(drive)) {drives.push({dir: drive.match(/[A-Z]:/)[0] || '', disk_label: drive.match(/:.*/)[0].replace(":","") || ''})}
  })

  // lag fin html og emit
  var disks_html = '<ul>'

  drives.forEach( (drive) => { disks_html+='<a href="javascript:get_accessable({what_dir: \''+drive.dir+'\', target:\'#drives\', type:\'directories\'})"><li class="drives">'+drive.dir+' [ ' + drive.disk_label + ' ]</li></a>' } )
  disks_html+='</ul>'

  app.io.sockets.emit('fill_info_in_gui', {target: '#drives', html: disks_html})
  // GLOBAL["drivelist"] = drives   // GLOBAL["list_1"] = drives  // var middle_drive = drives[Math.floor(drives.length / 2)].letter  // console.log('vil endre katalog til: '+ middle_drive)  // process.chdir(middle_drive+"/")  // console.log('current_drive: ' + process.cwd())
}

module.exports.refresh = function(){
  exec(cmd, execCallback)
}
