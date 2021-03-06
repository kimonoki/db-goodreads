function getApikey(){
    // get the Api Key via https://www.goodreads.com/api/keys
    return 'Enter your API key here';
}


function getJSON(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);

    xhr.onload = function () {
        if (this.status >= 200 && this.status < 400)
            callback(JSON.parse(this.responseText));
        else
            console.log('Error getting ' + url + ': ' + this.statusText);
    };

    xhr.onerror = function () {
        console.log('Error during XMLHttpRequest to ' + url);
    };

    xhr.send();
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
        '<div class="rating_logo">'+title+'</div>'+
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

function insertRatingGR(parent,link,rating,ratersnumber){
    rating=rating/2;
    let star;
    for(var i = 0;i<Math.floor(rating);i++){
        star+='<span size="12x12" class="staticStar p10"></span>';
    }
    if((rating-Math.floor(rating))>0.5){
        star+='<span size="12x12" class="staticStar p6"></span>';
    }
    else if(rating-Math.floor(rating)>0&&rating-Math.floor(rating)<0.5) {
        star+='<span size="12x12" class="staticStar p3"></span>';
    }
    if(5-Math.ceil(rating)){
        star+='<span size="12x12" class="staticStar p0"></span>'
    }
    parent.insertAdjacentHTML('afterend',
   ' <div class="uitext stacked hreview-aggregate" style="position: relative; border-top:1px solid #ddd; padding-top:10px" itemprop="aggregateRating" itemscope="" itemtype="http://schema.org/AggregateRating">'+
        '<span class="stars staticStars">'+star+'</span>'+
        '<span class="value rating">'+'<span class="average" itemprop="ratingValue">'+' '+rating+'</span>'+'</span>'+
        '<span class="greyText">'+'&nbsp;·&nbsp;'+'</span>'+
        '<a class="actionLinkLite" style="cursor: pointer; " href="'+link+'">'+' 豆瓣页面'+'</a>'+
        '<span class="greyText">'+'&nbsp;·&nbsp;'+'</span>'+
        '<a class="gr-hyperlink" href="'+link+'/collections'+'">'+
        '<span class="votes value-title" title="'+ratersnumber+'">'+ratersnumber+'</span>'+ '人评价' +'</a>'+
        '<span class="greyText">'+'&nbsp;·&nbsp;'+'</span>'+
        '<a class="gr-hyperlink" href="+'+link+'+/reviews'+'">'+'全部书评'+'</a>'+
        '</div>'
    );
}



(function(){
    
    const grapikey= getApikey();
    let host= window.location.hostname;
    
    let isbn10=0; 
    let isbn13=0;
    let isbn=0;

    
    if (host==='book.douban.com') {
        console.log(host);
        //insert goodreads ratings
        let sectl = document.getElementById('interest_sectl');
        let ratings = document.createElement('div');
        ratings.style.marginBottom  = '15px';
        //if there's friends' rating,insert after it
        let rating_wrap = document.querySelector('.friends_rating_wrap');
        if (!rating_wrap) //if no insert directly
            rating_wrap = document.querySelector('.rating_wrap');
        // insert the wrapper of the rating section

        let dbbook_id=location.href.match(/douban\.com\/subject\/(\d+)/)[1]; 
        console.log(dbbook_id);
        getJSON('https://api.douban.com/v2/book/'+dbbook_id,function (data){
            isbn10=data.isbn10;
            isbn13=data.isbn13;
            let isbn=getIsbn(isbn13,isbn10);
            console.log(getIsbn(isbn13,isbn10));
            if (!isbn) {  //no isbn data returned
                console.log('no isbn data,please find another id of this book')}
            setTimeout(function(){ //limitation of GR's api: once per second
            },500);

            //get goodreads rating and info
            getJSON('https://www.goodreads.com/book/review_counts.json?'+'key='+grapikey+'&isbns='+isbn,function(data){
            
            // test goodreads data response
            console.log('goodreads rating: '+data.books[0].average_rating);



            //insert goodreading ratings
                if(data.books[0].reviews_count){
                    sectl.insertBefore(ratings, rating_wrap.previousSibling);
                    insertRatingDB(ratings,'Goodreads Rating',data.books[0].average_rating,data.books[0].ratings_count,data.books[0].text_reviews_count,'https://www.goodreads.com/book/isbn/'+isbn);
            }

                //change dbrating into nondisplay elements if there is none
                if(data.books[0].reviews_count&&document.getElementsByClassName('rating_num')[1].innerText===''){
                    document.getElementsByClassName('rating_wrap')[0].style.display='none';
                }

            })



            //get google books rating and info
            getJSON('https://www.googleapis.com/books/v1/volumes?q=isbn:'+getIsbn(isbn10,isbn13),function(data){
                if(!isEmpty(data.items[0])){
                    console.log('google books rating: '+data.items[0].volumeInfo.averageRating);
                }
            //rating_wrap.insertAdjacentHTML(ratings,'Google Books Info')
            })
        });

        


    }





    else if (host==='www.goodreads.com'){
        let ISBN;
        let details=document.getElementById('bookDataBox');
        let bookMeta=document.getElementById('bookMeta');
        if(details.querySelector('.infoBoxRowTitle').innerText=='Original Title'){
            let clearFloats =details.querySelector('.clearFloats').nextElementSibling;
            ISBN = clearFloats.querySelector('.infoBoxRowItem').innerText.match(/(\d+).+ISBN13:\s(\d+)/);
        }
        else{
            ISBN =details.querySelector('.infoBoxRowItem').innerText.match(/(\d+).+ISBN13:\s(\d+)/);
        }
        
        isbn10 =ISBN[1];
        isbn13 =ISBN[2];
        isbn=getIsbn(isbn13,isbn10);
        //let grbook_id=location.href.match(/goodreads.com\/book\/show\/(\d)\s/)[1];
        getJSON('https://api.douban.com/v2/book/isbn/'+isbn,function(data){
            if(!isEmpty(data.rating) || data.rating.average!=0){
                console.log(data.rating.average);
                insertRatingGR(bookMeta,'https://book.douban.com/subject/'+data.id,data.rating.average,data.rating.numRaters);
            }


        })

    }



})();
    




