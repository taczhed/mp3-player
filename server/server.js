var http = require("http");
var fs = require("fs");
var formidable = require('formidable');
const { stat, createReadStream } = require("fs");
const { pipeline } = require("stream");
var Datastore = require('nedb');
var playlist = new Datastore({
    filename: 'playlist.db',
    autoload: true
});
let state = 0
let dirs = []
let currentAlbum
let link


var server = http.createServer(function (req, res) {

    // console.log(req.method)
    console.log(req.url)

    switch (req.method) {
        case "GET":

            if (req.url == "/admin") {

                fs.readFile(__dirname + "/static/public/admin.html", function (error, data) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(data);
                    res.end();
                })

            } else if (req.url.indexOf(".mp3") != -1) {

                link = __dirname + "/static/mp3/" + currentAlbum + "" + decodeURI(req.url)

                fs.stat(link, function (error, stats) {

                    let range = req.headers.range
                    let size = stats.size

                    if (range) {
                        let [start, end] = range.replace(/bytes=/, "").split("-")
                        start = parseInt(start, 10)
                        end = end ? parseInt(end, 10) : size - 1

                        if (!isNaN(start) && isNaN(end)) {
                            start = start
                            end = end - 1
                        }
                        if (isNaN(start) && !isNaN(end)) {
                            start = size - end
                            end = size - 1
                        }

                        res.writeHead(206, {
                            "Content-type": "audio/mpeg",
                            "Content-Length": end - start + 1,
                            "Accept-Ranges": "bytes",
                            "Content-Range": `bytes ${start}-${end}/${size}`
                        })

                        let readable = createReadStream(link, { start: start, end: end })
                        pipeline(readable, res, err => {
                            // console.log(err)
                        })
                    }
                })

            } else if (req.url == "/uploadIcon") {

                fs.readFile(__dirname + "/static/img/file-audio-regular.svg", function (error, data) {
                    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
                    res.write(data);
                    res.end();
                })

            } else {

                for (let url of dirs) {

                    if ("/" + encodeURI(url) == req.url) {

                        let albumName = decodeURI(req.url)
                        albumName = albumName.substring(1)

                        let loadDefault = true

                        fs.readdir("static/mp3/" + albumName, function (err, files) {

                            for (let file of files) {
                                if (file.indexOf(".jpg") != -1 || file.indexOf(".png") != -1) {

                                    loadDefault = false

                                    fs.readFile("static/mp3/" + albumName + "/" + file, function (error, data) {
                                        res.writeHead(200, { 'Content-Type': 'image/png' });
                                        res.write(data);
                                        res.end();
                                    })

                                }
                            }

                            if (loadDefault == true) {

                                fs.readFile("static/img/default-cover.png", function (error, data) {
                                    res.writeHead(200, { 'Content-Type': 'image/png' });
                                    res.write(data);
                                    res.end();
                                })

                            }

                        })

                    }
                }

            }

            break;

        case "POST":

            if (req.url == "/first" || req.url == "/next") {

                if (req.url == "/first") {
                    state = 0

                } else if (req.url == "/next") {

                    let allData = ""

                    req.on("data", function (data) {
                        allData += data;
                        let obj = JSON.parse(allData)
                        state = obj.index
                    })
                }

                let albumInformation = {
                    info: req.url,
                    files: [],
                }

                fs.readdir(__dirname + "/static/mp3/", (err, albums) => {

                    if (err) {
                        return console.log(err);
                    }

                    albumInformation.dirs = albums
                    albumInformation.album = albums[state]

                    fs.readdir(__dirname + "/static/mp3/" + albums[state], function (err, files) {

                        new Promise((resolve, reject) => {
                            let counter = 0
                            for (let fileName of files) {
                                fs.stat(__dirname + "/static/mp3/" + albums[state] + "/" + fileName, function (error, stats) {
                                    counter++
                                    if (fileName.indexOf(".mp3") != -1) {
                                        albumInformation.files.push({ file: fileName, size: stats.size, album: albumInformation.album })
                                    }
                                    if (counter == files.length) {
                                        resolve(albumInformation)
                                    }
                                })
                            }
                        }).then((response) => {
                            dirs = response.dirs
                            currentAlbum = response.album
                            console.log(response)
                            res.writeHead(200, { 'content-type': 'application/json;charset=utf-8' });
                            res.end(JSON.stringify(response));
                        })
                    })
                });
            }

            if (req.url == "/addToPlaylist" || req.url == "/removeFromPlaylist") {

                let allData = ""

                req.on("data", function (data) {
                    allData += data;
                    let obj = JSON.parse(allData)

                    // console.log(obj)
                    let title = obj.file

                    new Promise((resolve, reject) => {
                        if (obj != "empty" && req.url == "/addToPlaylist") {
                            playlist.findOne({ file: title }, function (err, doc) {
                                if (doc == null) {
                                    playlist.insert(obj, function (err, newDoc) {
                                        console.log("dodano!")
                                        resolve()
                                    });
                                } else {
                                    resolve()
                                }
                            });
                        } else if (req.url == "/removeFromPlaylist") {

                            playlist.findOne({ file: title }, function (err, doc) {
                                if (doc != null) {
                                    playlist.remove(obj, {}, function (err, numRemoved) {
                                        console.log("usunięto!")
                                        resolve()
                                    });
                                } else {
                                    resolve()
                                }
                            });

                        } else {
                            resolve()
                        }
                    })
                        .then(() => {
                            playlist.find({}, function (err, docs) {
                                res.writeHead(200, { 'content-type': 'application/json;charset=utf-8' });
                                res.end(JSON.stringify({ files: docs, album: "Playlist" }));
                            });
                        })
                })
            }

            if (req.url == "/updateCurrentAlbum") {

                let allData = ""

                req.on("data", function (data) {
                    allData += data;
                    let obj = JSON.parse(allData)
                    currentAlbum = obj.album
                    // console.log(currentAlbum)
                    res.writeHead(200, { 'content-type': 'application/json;charset=utf-8' });
                    res.end(JSON.stringify({ album: currentAlbum }));
                })
            }

            if (req.url == "/currentSize") {
                let allData = ""

                req.on("data", function (data) {
                    allData += data;
                    let obj = JSON.parse(allData)
                    currentSize = obj.currentSize
                    allSize = obj.allSize
                    res.writeHead(200, { 'content-type': 'application/json;charset=utf-8' });
                    res.end(JSON.stringify({ currentSize: currentSize, allSize: allSize }));
                })
            }

            if (req.url == "/upload") {

                const form = formidable({ multiples: true });
                form.keepExtensions = true
                var dir = './static/mp3/'

                for (let x = 0; x < 20; x++) {
                    let random = Math.floor(Math.random() * 10);
                    dir = dir + random
                }

                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }

                form.uploadDir = dir

                form.parse(req, function (err, fields, files) {

                    let filesObj = files.file

                    if (files.file.length == undefined) {
                        filesObj = [files.file]
                    }
                    let counter = 0
                    new Promise((resolve, reject) => {
                        for (let file of filesObj) {
                            fs.rename(file.path, dir + "/" + file.name, function (err) {
                                counter++
                                if (counter == filesObj.length) {
                                    resolve()
                                }
                            });
                        }
                    })
                        .then(() => {
                            fs.readdir(dir, (err, filesNames) => {

                                let obj = {
                                    title: "files uploaded!",
                                    files: filesNames,
                                    date: new Date(),
                                }
                                res.writeHead(200, { 'content-type': 'text/plain;charset=utf-8' });
                                res.end(JSON.stringify(obj));
                            })

                        })
                })
            }

            break;

    }
})

server.listen(3000, function () {
    console.log("serwer startuje na porcie 3000")
});