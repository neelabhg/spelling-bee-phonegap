// Wrapper for the various sources of word data
var datasource = (function ($, clients) {

    return function (datasource) {
	var client = clients[datasource];

	var getRandomWords = function (numWords, successFunc) {
	    var result = [];
	    
	    if (datasource === "wordnik") {
		// get a list of random words

		// a function which loops until we have the required number of words
		function loop(i) {
		    if (i >= numWords) {
			successFunc(result);
			return;
		    }

		    client.getRandomWord(function (word) {
			result[i] = {"word": word};
			// get the definition for this word
			client.getWordDefinitions(word, function (definitions) {
			    result[i].definitions = definitions;
			    // get the url containing the pronunciation audio
			    client.getWordAudioUrl(word, function (audioUrl) {
				result[i].audioUrl = audioUrl;
				// check if we have all data - if yes, then get next word
				// otherwise, discard this word and get another one
				if (result[i] && result[i].word &&
				    result[i].definitions && result[i].audioUrl) {
				    loop(i + 1);
				}
				else {
				    loop(i);
				}
			    });
			});
		    });
		}
		
		// call the looping function
		loop(0);
	    }
	};

	return {
	    getRandomWords: getRandomWords
	};
    };

})(jQuery, {"wordnik": wordnik_client});
