// Module to interface with the Wordnik developer API
var wordnik_client = (function ($, api_key) {

    var baseUrl = "http://api.wordnik.com:80/v4/";

    var getRandomWord = function (successFunc) {
		$.getJSON(
		    baseUrl + "words.json/randomWord",
		    {
				api_key: api_key
		    },
		    function (word) {
				successFunc(word.word);
		    }
		);
    };

    var getWordDefinitions = function (word, successFunc) {
		$.getJSON(
		    baseUrl + "word.json/" + word + "/definitions",
		    {
				api_key: api_key
		    },
		    function (definitions) {
				// filter the returned JSON to contain only the
				// word definitions, and then call successFunc
				var i, filtered = [];
				for (i = 0; i < definitions.length; i++) {
				    filtered[i] = definitions[i].text;
				}
				successFunc(filtered);
		    }
		);
    };

    var getWordAudioUrl = function (word, successFunc) {
		$.getJSON(
		    baseUrl + "word.json/" + word + "/audio",
		    {
				api_key: api_key,
				limit: 1
		    },
		    function (audioFiles) {
				// filter the returned JSON to contain only the
				// fileUrls, and then call successFunc with one result
				var i, filtered = [];
				for (i = 0; i < audioFiles.length; i++) {
				    filtered[i] = audioFiles[i].fileUrl;
				}
				successFunc(filtered[0]);
		    }
		);
    };

    var getRandomWords = function (numWords, successFunc) {
	    var result = [];
		// get a list of random words

		// a function which loops until we have the required number of words
		function loop (i) {
		    if (i >= numWords) {
				successFunc(result);
				return;
		    }

		    getRandomWord(function (word) {
				result[i] = {"word": word};
				// get the definition for this word
				getWordDefinitions(word, function (definitions) {
				    result[i].definitions = definitions;
				    // get the url containing the pronunciation audio
				    getWordAudioUrl(word, function (audioUrl) {
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
		};
		
		// call the looping function
		loop(0);
	};

    return {
		getRandomWords: getRandomWords
    };

})(jQuery, wordnik_api_key);
