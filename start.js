const request = require('request')
const https = require('https')
const cheerio = require('cheerio')
const fs = require('fs')
const Iconv = require('iconv-lite');

function init () {
    request({url: `https://www.dytt8.net`, encoding: null}, function (error, response, body) {
        let data = Iconv.decode(body, 'gb2312').toString()
        var $ = cheerio.load(data)
        var lists = $('.co_content2 ul a')
        let total = Array.from(lists).length - 2
        let finishs = 0
        Array.from(lists).forEach((li, key) => {
            var path = $(li).attr('href')
            if (path && key > 1) {
                request({url: `https://www.dytt8.net${path}`, encoding: null}, function (error, response, sondata) {
                    let page = Iconv.decode(sondata, 'gb2312').toString()
                    var $ = cheerio.load(page)
                    var title = $('.bd3r .title_all font').text()
                    var posterimg = $('.bd3r #Zoom').find('img').length > 0 ? $('.bd3r #Zoom img').eq(0) : ''
                    if(posterimg === '') return
                    try {
                        title = title.replace(/[\s\/\\]/, '')
                        if (!fs.existsSync('./data/')) {
                            fs.mkdirSync('./data/');
                        }
                        let ws = title && fs.createWriteStream(`./data/${title}.txt`)
                        var imgurl = posterimg && posterimg.attr('src')
                        let imgws = fs.createWriteStream(`./data/${title}.png`)
                        let profile = unescape(escape($('.bd3r #Zoom').text()).match(/%u7B80%u3000%u3000%u4ECB(.+)%u3010%u4E0B%u8F7D%u5730%u5740%u3011/)[1]).trim()
                        let url = $('.bd3r #Zoom table a').text()
                        request(imgurl, { timeout: 15000 }, function (err, response, imgBody) {
                            if (err) {
                                imgws.end()
                                fs.unlink(`./data/${title}.png`, function(err) {
                                    if (err) {
                                        return console.error(err);
                                    }
                                    console.log(`文件删除成功！${title}.png`);
                                });
                                fs.unlink(`./data/${title}.txt`, function(err) {
                                    if (err) {
                                        return console.error(err);
                                    }
                                    console.log(`文件删除成功！${title}.txt`);
                                });
                            }
                        }).pipe(imgws)
                        imgws.on('finish', function(err) {
                            // finishs++
                            // console.log(finishs)
                        })
                        imgws.on('error', function (err) {
                            console.log(err)
                        })
                        ws.write(`标题\r\n${title}\r\n\r\n简介\r\n${profile}\r\n\r\n下载地址\r\n${url}`)
                        ws.end()
                    } catch (e) {
                        console.log(e, imgurl, title)
                    }
                });
            }
        });
    })
}
init()

