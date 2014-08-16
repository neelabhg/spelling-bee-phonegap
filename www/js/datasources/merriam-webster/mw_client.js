// Module to interface with The Merriam-Webster Dictionary API
var mw_client = (function ($, api_keys) {

	var baseUrls = {
		// Merriam-Webster's Intermediate Dictionary with Audio (Grades 6-8)
		sd3: "http://www.dictionaryapi.com/api/v1/references/sd3/xml/", 

		// Merriam-Webster's School Dictionary with Audio (Grades 9-11)
		sd4: "http://www.dictionaryapi.com/api/v1/references/sd4/xml/"
	};

	var audioBaseUrl = "http://media.merriam-webster.com/soundc11/";

	var getAudioFileSubdirectory = function (audioFile) {
		if (audioFile.substr(0, 3) === "bix") {
			return "bix";
		} else if (audioFile.substr(0, 2) === "gg") {
			return "gg";
		} else if ($.isNumeric(audioFile[0])) {
			return "number";
		} else {
			return audioFile[0];
		}
	};

	var parseXmlResponse = function (word, xmlDoc) {
		var wordEntry = $(xmlDoc).find("entry").first();
				
		var functionalLabel = wordEntry.find("fl").text();

		var definitions = wordEntry.find("dt").map(function () {
		  return functionalLabel + " " + $(this).text();
		}).get();

		var audioFile = wordEntry.find("wav").text();
		var audioUrl = audioBaseUrl + getAudioFileSubdirectory(audioFile) + "/" + audioFile;

		return {
			word: word,
			definitions: definitions,
			audioUrl: audioUrl
		};
	};

	var getDataForWord = function (word, successFunc) {
		$.get(
			baseUrls["sd4"] + word,
			{
				key: api_keys["sd4"]
			},
			function (xmlDoc) {
				successFunc(parseXmlResponse(word, xmlDoc));
			},
			"xml"
		);
	};

	var getDataForWords = function (words, successFunc) {
		var result = [];

		// a function for implementing an async loop
		function loop (i) {
			if (i >= words.length) {
				successFunc(result);
				return;
			}

			getDataForWord(words[i], function (wordData) {
				result[i] = wordData;
				loop(i + 1);
			});
		};

		loop(0);
	};

	return {
		getDataForWords: getDataForWords
	};

})(jQuery, mw_api_keys);
