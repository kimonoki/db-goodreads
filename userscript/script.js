//todo: showing google book rating, ratnum and link
//      if no douban ratings, push goodreads ratings to the front(nonedisplay douban ratings)
//      handle 

// ==UserScript==
// @name         Douban Goodreads Ratings
// @version      1.1
// @description  Show Goodreads ratings on Douban
// @description:zh-CN 在豆瓣读书界面上显示goodreads评分
// @author       kimonoki
// @match        *://book.douban.com/subject/*
// @match        *://www.goodreads.com/book/show/*
// @grant        GM_xmlhttpRequest
// @connect      api.douban.com
// @connect      www.goodreads.com
// @connect      www.googleapis.com
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


//Adding s to a string if the number is plural
function isPlural(n){
    if(n>1){
        return 's';
    }
    else{
        return '';
    }
}

function getIsbn(isbn13,isbn10){
    return isbn13||isbn10;
}

function insertRatingDB(parent,title,rating,ratings_count,text_reviews_count,link){
    rating=rating*2;
    let star = (5 * Math.round(rating)).toString();
    if (star.length == 1)
        star = '0' + star;
        parent.insertAdjacentHTML('beforeEnd',
        '<div class="rating_logo" style="background-color: red !important ">'+title+'</div>'+
        '<div class="rating_self clearfix">'+
            '<strong class="ll rating_num ">'+rating.toFixed(1)+'</strong>'+
            '<div class="rating_right">'+
                '<div class="ll bigstar' +star+'"></div>'+
                '<div class="rating_sum">'+ '<a href='+link+'>'+ ratings_count+' Rating'+isPlural(ratings_count)+'</a>'+
                '<div class="rating_sum">'+ text_reviews_count + ' Review'+isPlural(text_reviews_count) +'</div>'+
                '</div>'+
            '</div>'+
        '</div>'
    );

    
}



(function(){

    //DOM handeling on db
    //insert goodreads ratings
    let dbratings=document.getElementById('ratings');
    let sectl = document.getElementById('interest_sectl');
    let ratings = document.createElement('div');
    //set same css style as the original site
    ratings.style.padding = '15px 0';
    ratings.style.borderTop = '1px solid #eaeaea';
    //if there's friends' rating,insert after it
    let rating_wrap = document.querySelector('.friends_rating_wrap');
    if (!rating_wrap) //if no insert directly
        rating_wrap = document.querySelector('.rating_wrap');
    // insert the wrapper of the rating section


    //DOM handling on gr

    

    let host= location.hostname;
    let isbn10=0; 
    let isbn13=0;
    let isbn=0;
    if (host==='book.douban.com') {
        let sectl = document.getElementById('interest_sectl');
        let dbbook_id=location.href.match(/douban\.com\/subject\/(\d+)/)[1]; 
        getJSON_GM('https://api.douban.com/v2/book/'+dbbook_id,function (data){
            isbn10=data.isbn10;
            isbn13=data.isbn13;
            let isbn=getIsbn(isbn13,isbn10);
            console.log(getIsbn(isbn13,isbn10));
            if (!isbn) {  //no isbn data returned
                console.log('no isbn data,please find another id of this book')}
            setTimeout(function(){ //limitation of GR's api: once per second
            },500);

            //get goodreads rating and info
            getJSON_GM('https://www.goodreads.com/book/review_counts.json?'+'key='+'hqtHAxKsgeHAQ189LEVjg&isbns='+isbn,function(data){
            
            // test goodreads data response
            console.log('goodreads rating: '+data.books[0].average_rating);

            //change dbrating into nondisplay elements
                if(data.books[0].reviews_count&&dbratings==0){
                    dbratings.style.display='none';
                }

            //insert goodreading ratings
                if(data.books[0].reviews_count){
                    sectl.insertBefore(ratings, rating_wrap.previousSibling);
                    insertRatingDB(ratings,'Goodreads Rating',data.books[0].average_rating,data.books[0].ratings_count,data.books[0].text_reviews_count,'https://www.goodreads.com/book/isbn/'+isbn);
            }

            })



            //get google books rating and info
            getJSON_GM('https://www.googleapis.com/books/v1/volumes?q=isbn:'+getIsbn(isbn10,isbn13),function(data){
                if(!isEmpty(data.items[0])){
                    console.log('google books rating: '+data.items[0].volumeInfo.averageRating);
                }
            //rating_wrap.insertAdjacentHTML(ratings,'Google Books Info')
            })
        });

        


    }





    else if (host==='www.goodreads.com'){
        console.log('success')
        let details=document.getElementById('bookDataBox');
        let ISBN =details.querySelector('.infoBoxRowItem').innerText.match(/(\d+).+ISBN13:\s(\d+)/);
        let isbn10 =ISBN[1];
        let isbn13 =ISBN[2];
        let isbn=getIsbn(isbn13,isbn10);
        //let grbook_id=location.href.match(/goodreads.com\/book\/show\/(\d)\s/)[1];
        getJSON_GM('https://api.douban.com/v2/book/isbn/'+isbn,function(data){
            if(!isEmpty(data.rating)){
                console.log(data.rating.avaerage);
            }


        })

    }

})();

