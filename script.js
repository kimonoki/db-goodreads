// ==UserScript==
// @name         Douban Goodreads Ratings
// @version      0.1
// @description  Show Goodreads ratings on Douban
// @description:zh-CN 在豆瓣读书界面上显示goodreads评分
// @author       kimonoki
// @match        *://book.douban.com/subject/*
// @match        *://www.goodreads.com/book/show/*
// @grant        GM_xmlhttpRequest
// @connect      api.douban.com
// @connect      app.godreads.com
// ==/UserScript==

function getJSON_GM(url, callback) {
    GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        onload: function(response) {
            if (response.status >= 200 && response.status < 400)  //success response 2xx Success
                callback(JSON.parse(response.responseText));
            else
                console.log('Error getting ' + url + ': ' + response.statusText);  //print error message
        },
        onerror: function(response) {
            console.log('Error during GM_xmlhttpRequest to ' + url + ': ' + response.statusText);
        }
    });
}



(function(){
    var host= location.hostname;
    if (host==='book.douban.com') {
        console.log('test');
        var dbbook_id=location.href.match(/douban\.com\/subject\/(\d+)/)[1]; 
        window.console.log(dbbook_id);
        
        getJSON_GM('https://api.douban.com/v2/book/' + dbbook_id , function (data){
            console.log(data});
    }

})();

