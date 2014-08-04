// The main application
var app = (function ($, datasource) {

    var maxWords, maxTries, ds;

	var init = function () {

    	maxWords = 5;
    	maxTries = 5;

    	ds = datasource("wordnik");

	    $("#startButton").on("click", function () {
		    loadNextWord(1, {});
	    });

	    $("#homeButton").on("click", function () {
	    	changePage("#homeNavigationConfirmationDialogPage");
	    });

	    $("#exitButton").on("click", function () {
	    	navigator.app.exitApp();
	    });
    };

    $(document).on("ready", function () {
    	init();
    });

    $(document).on("deviceready", function () {
    });

    $(document).on("backbutton", function (e) {
    	// From http://stackoverflow.com/a/8662401
    	if ($.mobile.activePage.is('#mainPage')) {
			e.preventDefault();
			navigator.app.exitApp();
	    } else {
			navigator.app.backHistory()
	    }
    });

    var changePage = function (target) {
    	$(":mobile-pagecontainer").pagecontainer("change", target, {});
    };

    var showLoadingSpinner = function (text) {
    	$.mobile.loading('show', {
			text: text,
			textVisible: true,
			theme: 'z',
			html: ""
		});
    };

    var hideLoadingSpinner = function () {
    	$.mobile.loading('hide');
    };

    var loadNextWord = function (wordNum, accumulatedResults) {
		changePage("#emptyPage");
		showLoadingSpinner("Loading next word");
		ds.getRandomWords(1, function (newWordData) {
		    hideLoadingSpinner();
		    spellView(wordNum, newWordData[0], accumulatedResults);
		});
    };

    var spellView = function (wordNum, word, results) {
    	
		var numTries = 0;
		var wordAudio;

		if (window.Media) {
			wordAudio = new Media(word.audioUrl);
		} else {
			// Media not supported
			wordAudio = {
				// for debugging
				play: function () { console.log(word); }
			};
		}

		// Attach click handlers to the buttons in the UI.
		// First remove the already attached event handlers because we set these
		// handlers every time spellView is called, i.e, when loading a new word.
		// If we don't remove the previous handlers, the new handlers will get
		// attached in addition to the already attached handlers, and when the
		// event fires, all the previously attached handlers will also be called,
		// which will wreak havoc.

		$("#spellingPage").off("pagebeforeshow").on("pagebeforeshow", function () {
			$("#numWordsDisplay").text(wordNum);
			$("#maxWordsDisplay").text(maxWords);
			$("#wordProgressBar").val((wordNum / maxWords) * 100);
			$("#numTriesDisplay").text(numTries);
			$("#maxTriesDisplay").text(maxTries);
			$("#wordDefinitionDisplay").html(word.definitions[0]);
			$("#wordInput").val("");
			$("#nextWordButton").text((wordNum === maxWords) ? "Show results" : "Next word");

			// From http://stackoverflow.com/a/23728076
		    $("#wordProgressBar").hide();
		    $(".ui-slider-handle").hide();
		    $('.ui-slider-track').css('margin','0 15px 0 15px').css('pointer-events','none');

		    $("#wordProgressBar").slider("refresh");
		    $("#wordDefinitionCollapsible").collapsible("collapse");
		});

		$("#nextWordButton").off("click").on("click", function () {
			if (wordNum === maxWords) {
				displayResults(results);
			} else {
				loadNextWord(wordNum + 1, results);
			}
		});

		$("#sayWordButton").off("click").on("click", function () {
			wordAudio.play();
		});

		$("#showAnswerButton").off("click").on("click", function () {
			results['skipped'] = (results['skipped'] || 0) + 1;
			
			$("#dialogHeading").text("Skipped word");
			$("#correctWord").text(word.word);
	    	changePage("#wordDoneDialogPage");
	    });

	    $("#checkAnswerButton").off("click").on("click", function () {
	    	numTries += 1;
	    	if ($("#wordInput").val().toLowerCase() === word.word.toLowerCase()) {
	    		// correct answer
	    		results['correct'] = (results['correct'] || 0) + 1;
	    		$("#dialogHeading").text("Correct answer!");
	    		$("#correctWord").text(word.word);
	    		changePage("#wordDoneDialogPage");
	    	} else {
	    		// incorrect answer
	    		if (numTries === maxTries) {
	    			// max number of tries reached
	    			results['incorrect'] = (results['incorrect'] || 0) + 1;
	    			$("#dialogHeading").text("Incorrect answer");
	    			$("#correctWord").text(word.word);
	    			changePage("#wordDoneDialogPage");
	    		} else {
	    			$("#numTriesDisplay").text(numTries);
	    		}
	    	}
	    });

	    changePage("#spellingPage");
    };

    var displayResults = function (results) {
    	$("#correctWordsCount").text(results['correct'] || 0);
    	$("#incorrectWordsCount").text(results['incorrect'] || 0);
    	$("#skippedWordsCount").text(results['skipped'] || 0);
    	changePage("#resultsPage");
    };

    return {};

})(jQuery, datasource);
