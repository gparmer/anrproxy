var _cardDB           = {};
var _userInputElem    = $('#UserInput');
var _cardListElem     = $('#Cards');
var _cardListHtml     = '';


// loadCards() load cardDB from local storage
function loadCards() {
    _cardDB = localStorage.getItem('cardDB');
    _cardDB = JSON.parse(_cardDB);

    if (!_cardDB) {
	fetchAllCards();
    } else {
	buildList();
    }
}

// saveCards() save cardDB in local storage
function saveCards() {
    localStorage.setItem('cardDB', JSON.stringify(_cardDB));
}

// reset alias
function reset() {
    return fetchAllCards();
}

// fetchAllCards() get cards from api
function fetchAllCards() {
    localStorage.removeItem('cardDB');
    _cardListElem.html('<span class="text-muted" data-loading>loading cards ...</span>');

    $.getJSON( "https://netrunnerdb.com/api/2.0/public/cards", function(response) {
	_cardDB = {};

	$.each(response.data, function(key, item) {
    	    var image = 'https://netrunnerdb.com/card_image/' + item.code + '.png';

	    // console.log(item);

	    if (typeof item.image_url != "undefined") {
		console.log(item.image_url);
		// cardgamedb https images are broken, so hack this until anrdb fixes the links
		image = item.image_url.replace(/^https:/, "http:");
		console.log(image);
	    }

            _cardDB[item.code] = {
		code: item.code,
		title: item.title,
		image: image
            }
	});

	console.log('cards fetched from api');
	saveCards();
	buildList();
    });
}

// buildList() generate image list
function buildList() {
    var html = '';
    var deckInput = _userInputElem.val().toLowerCase();
    var unfound = 0;
    var deckidregex = /\d\d\d\d\d/;
    if (!_cardDB) {
	return false;
    }

    match = deckidregex.exec(deckInput);
    if (match == null) return;

    deckid = match[0];
    $.getJSON("https://netrunnerdb.com/api/2.0/public/decklist/" + deckid, function (response) {
	input = response.data[0].cards;
	keys = Object.keys(input);

	for (var i=0; i<keys.length; i++) {
	    if (keys[i] in _cardDB) {
		var card = _cardDB[keys[i]];

		for (var j=0; j<input[keys[i]]; j++) {
		    var newCard = '';
	    	    newCard += '<a href="https://netrunnerdb.com/en/card/' + card.code + '" title="' + card.title + '" target="_blank">';
	    	    newCard += '  <img src="' + card.image + '" alt="' + card.code + '" />';
	    	    newCard += '</a>';

	    	    // console.log(JSON.stringify(card) + ' ' + cardname);

	    	    // append
	    	    html += newCard;
		}
	    }
	}

	if (_cardListHtml != html) {
	    // save current html
	    _cardListHtml = html;
	    // show images html
	    _cardListElem.html(_cardListHtml);
	}
    });
    _userInputElem.val(deckid);

    var newloc = location.origin + location.pathname + "?id=" + deckid;
    $('#DeckURL').html("Share link to this deck: <a href=\"" + newloc + "\">" + newloc + "</a>");
}

// assignEvents() rebuild image list when textarea changes
function assignEvents() {
    $(document).on('input propertychange', _userInputElem, function() {
	buildList();
    });
}

function findGetParameter(parameterName) {
    var result = null,
    tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

function fillDeckId() {
    var deckId = findGetParameter("id");
    _userInputElem.text(deckId);
}

$(document).ready(function() {
    fillDeckId();
    assignEvents();
    loadCards();
});
