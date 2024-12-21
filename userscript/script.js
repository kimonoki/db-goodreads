// ==UserScript==
// @name         Douban Goodreads Ratings
// @version      2.0
// @description  Show Goodreads ratings on Douban
// @description:zh-CN Show Goodreads ratings on Douban books
// @author       kimonoki
// @match        *://book.douban.com/subject/*
// @match        *://www.goodreads.com/book/show/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

// Utility functions
function getDoubanISBN() {
    const regex = /ISBN: (\d*)/gm;
    const str = $('#info').text();
    const match = regex.exec(str);
    const isbn = match ? match[1] : null;

    if (!isbn) {
        console.log('ISBN not found');
        return null;
    }
    console.log('Found ISBN:', isbn);
    return isbn;
}

function getGoodreadsISBN() {
    const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
    if (!jsonLdScript) {
        console.log('JSON-LD script not found');
        return null;
    }

    try {
        const jsonData = JSON.parse(jsonLdScript.textContent);
        const isbn = jsonData.isbn;
        if (isbn) {
            console.log('Found ISBN:', isbn);
            return isbn.replace(/-/g, '');
        }
    } catch (e) {
        console.log('Error parsing JSON-LD:', e);
    }
    return null;
}

function isPlural(n) {
    return n > 1 ? 's' : '';
}

// Rating display functions
function insertRatingDB(parent, title, rating, ratings_count, text_reviews_count, link) {
    rating = rating * 2; // Convert to 10-point scale
    const star = (5 * Math.round(rating)).toString().padStart(2, '0');
    
    parent.insertAdjacentHTML('beforeEnd',
        '<div class="rating_logo">' + title + '</div>' +
        '<div class="rating_self clearfix">' +
        '<strong class="ll rating_num ">' + rating.toFixed(1) + '</strong>' +
        '<div class="rating_right">' +
        '<div class="ll bigstar' + star + '"></div>' +
        '<div class="rating_sum">' + '<a href=' + link + '>' + ratings_count + ' Rating' + isPlural(ratings_count) + '</a>' +
        '<div class="rating_sum">' + text_reviews_count + ' Review' + isPlural(text_reviews_count) + '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    );
}

// Rating fetch functions
function getDoubanRating(isbn, callback) {
    GM_xmlhttpRequest({
        method: 'GET',
        url: `https://book.douban.com/isbn/${isbn}`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        onload: function(response) {
            if (response.status === 200) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');

                const ratingElement = doc.querySelector('strong.rating_num[property="v:average"]');
                const ratingCountElement = doc.querySelector('.rating_people span');

                if (ratingElement && ratingCountElement) {
                    const rating = parseFloat(ratingElement.textContent.trim());
                    const ratingCount = parseInt(ratingCountElement.textContent);
                    
                    if (!isNaN(rating) && !isNaN(ratingCount)) {
                        callback({
                            average: rating,
                            numRaters: ratingCount
                        });
                        return;
                    }
                    console.log('Invalid rating data found on Douban');
                }
                console.log('Could not find rating information on Douban');
            } else {
                console.log('Failed to fetch Douban page');
            }
            callback(null);
        },
        onerror: function(response) {
            console.log('Error occurred while requesting Douban page');
            callback(null);
        }
    });
}

function getGoodreadsRating(isbn, callback) {
    GM_xmlhttpRequest({
        method: 'GET',
        url: `https://www.goodreads.com/book/isbn/${isbn}`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        onload: function(response) {
            if (response.status === 200) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');

                // Get rating
                const ratingElement = doc.querySelector('.RatingStatistics__rating');
                if (!ratingElement) {
                    console.log('Could not find rating information');
                    callback(null);
                    return;
                }
                const rating = parseFloat(ratingElement.textContent.trim());

                // Get ratings and reviews count using regex
                const statsElement = doc.querySelector('[aria-label*="ratings and"]');
                if (!statsElement) {
                    console.log('Could not find ratings and reviews count');
                    callback(null);
                    return;
                }

                const statsText = statsElement.getAttribute('aria-label');
                const statsMatch = statsText.match(/(\d+,?\d*) ratings and (\d+,?\d*) reviews/);
                
                if (statsMatch) {
                    const ratingsCount = parseInt(statsMatch[1].replace(/,/g, ''));
                    const reviewsCount = parseInt(statsMatch[2].replace(/,/g, ''));

                    callback({
                        average_rating: rating,
                        ratings_count: ratingsCount,
                        text_reviews_count: reviewsCount
                    });
                } else {
                    console.log('Failed to parse ratings and reviews count');
                    callback(null);
                }
            } else {
                console.log('Failed to fetch Goodreads page');
                callback(null);
            }
        },
        onerror: function(response) {
            console.log('Error occurred while requesting Goodreads page');
            callback(null);
        }
    });
}

function insertRatingGR(parent, link, rating, ratersnumber) {
    rating = rating / 2;
    let star = '';
    
    // Create star HTML using the new SVG format
    function createStar(fill) {
        return `<span class="baseClass RatingStar--medium">
            <svg viewBox="0 0 24 24" role="presentation">
                <path class="RatingStar__fill" style="fill: ${fill ? '#FFB400' : '#DEE1E3'}" 
                d="M24 9.63469C24 9.35683 23.7747 9.13158 23.4969 9.13158H15.0892L12.477 1.34327C12.4269 1.19375 12.3095 1.0764 12.16 1.02625C11.8966 0.937894 11.6114 1.07983 11.523 1.34327L8.91088 9.13158H0.503157C0.33975 9.13158 0.186521 9.21094 0.0922364 9.3444C-0.0680877 9.57134 -0.0140806 9.88529 0.212865 10.0456L7.00408 14.8432L4.40172 22.6166C4.35092 22.7683 4.37534 22.9352 4.46749 23.066C4.6275 23.2932 4.94137 23.3476 5.16853 23.1876L12 18.3758L18.8317 23.183C18.9625 23.2751 19.1293 23.2994 19.281 23.2486C19.5445 23.1604 19.6865 22.8752 19.5983 22.6117L16.996 14.8432L23.7872 10.0456C23.9206 9.95133 24 9.7981 24 9.63469Z"></path>
            </svg>
        </span>`;
    }

    // Add full stars
    for (let i = 0; i < Math.floor(rating); i++) {
        star += createStar(true);
    }

    // Add half star if needed
    if (rating % 1 >= 0.5) {
        star += `<span class="baseClass RatingStar--medium">
            <svg viewBox="0 0 24 24" role="presentation">
                <defs>
                    <clipPath id="clip_RatingStar_undefined${rating % 1}medium">
                        <path d="M24 9.63469C24 9.35683 23.7747 9.13158 23.4969 9.13158H15.0892L12.477 1.34327C12.4269 1.19375 12.3095 1.0764 12.16 1.02625C11.8966 0.937894 11.6114 1.07983 11.523 1.34327L8.91088 9.13158H0.503157C0.33975 9.13158 0.186521 9.21094 0.0922364 9.3444C-0.0680877 9.57134 -0.0140806 9.88529 0.212865 10.0456L7.00408 14.8432L4.40172 22.6166C4.35092 22.7683 4.37534 22.9352 4.46749 23.066C4.6275 23.2932 4.94137 23.3476 5.16853 23.1876L12 18.3758L18.8317 23.183C18.9625 23.2751 19.1293 23.2994 19.281 23.2486C19.5445 23.1604 19.6865 22.8752 19.5983 22.6117L16.996 14.8432L23.7872 10.0456C23.9206 9.95133 24 9.7981 24 9.63469Z"></path>
                    </clipPath>
                    <path id="path_RatingStar_undefined${rating % 1}medium" d="M24 9.63469C24 9.35683 23.7747 9.13158 23.4969 9.13158H15.0892L12.477 1.34327C12.4269 1.19375 12.3095 1.0764 12.16 1.02625C11.8966 0.937894 11.6114 1.07983 11.523 1.34327L8.91088 9.13158H0.503157C0.33975 9.13158 0.186521 9.21094 0.0922364 9.3444C-0.0680877 9.57134 -0.0140806 9.88529 0.212865 10.0456L7.00408 14.8432L4.40172 22.6166C4.35092 22.7683 4.37534 22.9352 4.46749 23.066C4.6275 23.2932 4.94137 23.3476 5.16853 23.1876L12 18.3758L18.8317 23.183C18.9625 23.2751 19.1293 23.2994 19.281 23.2486C19.5445 23.1604 19.6865 22.8752 19.5983 22.6117L16.996 14.8432L23.7872 10.0456C23.9206 9.95133 24 9.7981 24 9.63469Z"></path>
                </defs>
                <use clip-path="url(#clip_RatingStar_undefined${rating % 1}medium)" href="#path_RatingStar_undefined${rating % 1}medium" class="RatingStar__backgroundFill" style="fill: #DEE1E3"></use>
                <path class="RatingStar__fill" style="fill: #FFB400" d="M6 9.13135H0.503157C0.33975 9.13135 0.186521 9.21071 0.0922364 9.34417C-0.0680877 9.57112 -0.0140806 9.88506 0.212865 10.0454L6 14.1337V9.13135Z M6 17.8422L4.40172 22.6164C4.35092 22.7681 4.37534 22.935 4.46749 23.0658C4.6275 23.293 4.94137 23.3474 5.16853 23.1874L6 22.6018V17.8422Z"></path>
            </svg>
        </span>`;
    }

    // Add empty stars
    const emptyStars = Math.floor(5 - Math.ceil(rating));
    for (let i = 0; i < emptyStars; i++) {
        star += createStar(false);
    }

    // Create rating stars container with accessibility
    const starsHtml = `<span aria-label="Rating ${rating.toFixed(2)} out of 5" role="img" class="RatingStars RatingStars__medium">${star}</span>`;

    parent.insertAdjacentHTML('afterend',
        '<div class="uitext stacked hreview-aggregate" style="position: relative; border-top:1px solid #ddd; padding-top:10px" itemprop="aggregateRating" itemscope="" itemtype="http://schema.org/AggregateRating">' +
        '<div style="display: flex; align-items: center;">' +
        starsHtml +
        '<span class="value rating"><span class="RatingStatistics__rating" itemprop="ratingValue"> ' + rating.toFixed(2) + '</span></span>' +
        '<a class="RatingStatistics__meta"  href="' + link + '">' + ' Douban Page ' + '</a>' +
        '<span class="RatingStatistics__meta">' + '&nbsp;·&nbsp;' + '</span>' +
        '<a class="RatingStatistics__meta" href="' + link + '/collections' + '">' +
        '<span class="RatingStatistics__meta" title="' + ratersnumber + '">' + ratersnumber + '</span>' + ' ratings' + '</a>' +
        '<span class="RatingStatistics__meta">' + '&nbsp;·&nbsp;' + '</span>' +
        '<a class="RatingStatistics__meta" href="' + link + '/reviews' + '">' + 'All Reviews' + '</a>' +
        '</div>' +
        '</div>'
    );
}

// Main execution
(function () {
    const host = location.hostname;

    if (host === 'book.douban.com') {
        const isbn = getDoubanISBN();
        if (!isbn) return;

        const sectl = document.getElementById('interest_sectl');
        const ratings = document.createElement('div');
        ratings.style.marginBottom = '15px';
        
        const rating_wrap = document.querySelector('.friends_rating_wrap') || 
                           document.querySelector('.rating_wrap');

        getGoodreadsRating(isbn, function(data) {
            if (data) {
                sectl.insertBefore(ratings, rating_wrap.previousSibling);
                insertRatingDB(ratings, 'Goodreads Rating', data.average_rating,
                             data.ratings_count, data.text_reviews_count,
                             'https://www.goodreads.com/book/isbn/' + isbn);

                if (data.ratings_count && document.getElementsByClassName('rating_num')[1].innerText === '') {
                    document.getElementsByClassName('rating_wrap')[0].style.display = 'none';
                }
            }
        });
    } else if (host === 'www.goodreads.com') {
        const isbn = getGoodreadsISBN();
        if (!isbn) return;

        const bookMetaCollection = document.getElementsByClassName('BookPageMetadataSection__ratingStats');
        if (!bookMetaCollection || bookMetaCollection.length === 0) {
            console.log('Could not find book meta section');
            return;
        }

        getDoubanRating(isbn, function(data) {
            if (data && data.average > 0) {
                console.log('Douban rating:', data.average);
                insertRatingGR(bookMetaCollection[0], 
                    'https://book.douban.com/isbn/' + isbn, 
                    data.average, 
                    data.numRaters
                );
            } else {
                console.log('Not enough ratings on Douban');
            }
        });
    }
})();