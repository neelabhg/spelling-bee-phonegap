// Module to interface with the Wordnik developer API
var wordnik_client = (function ($, api_key) {

    var base_url = "http://api.wordnik.com:80/v4/";

    var getRandomWord = function (successFunc) {
		$.getJSON(
		    base_url + "words.json/randomWord",
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
		    base_url + "word.json/" + word + "/definitions",
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
		    base_url + "word.json/" + word + "/audio",
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

    return {
		getRandomWord: getRandomWord,
		getWordDefinitions: getWordDefinitions,
		getWordAudioUrl: getWordAudioUrl
    };

})(jQuery, wordnik_api_key);
