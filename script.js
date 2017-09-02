//todo: delay 1 second after every request to goodreads

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
// @connect      www.goodreads.com
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

function isEmpty(s){
    return !s;
}

function getIsbn(isbn13,isbn10){
    return isbn13||isbn10;
}


(function(){
    var host= location.hostname;
    var isbn10=0; 
    var isbn13=0;
    if (host==='book.douban.com') {
        var dbbook_id=location.href.match(/douban\.com\/subject\/(\d+)/)[1]; 
        getJSON_GM('https://api.douban.com/v2/book/'+dbbook_id,function (data){
            isbn10=data.isbn10;
            isbn13=data.isbn13;
            console.log(getIsbn(isbn13,isbn10));
            if (!isbn10&&!isbn13) {  //no isbn data returned
                console.log('no isbn data,please find another id of this book')}
            getJSON_GM('https://www.goodreads.com/book/review_counts.json?key=hqtHAxKsgeHAQ189LEVjg&isbns='+isbn13,function(data){
            console.log(data.books[0].average_rating);
         })
        });


    }

})();

