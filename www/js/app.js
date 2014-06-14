// The main application
var app = (function($, datasource) {

    var startGame;

    startGame = function (difficulty, numWords) {
	var ds;

	console.log("Starting game.");
	ds = datasource("wordnik");
	ds.getRandomWords(numWords, function (data) {
	    console.log(data);
	});
    };

    $(document).on("ready", function () {

	var numWords = 10;
	
        $("#startButtonEasy").on("click", function () {
	    startGame(0, numWords);
        });
	$("#startButtonMedium").on("click", function () {
	    startGame(1, numWords);
        });
	$("#startButtonHard").on("click", function () {
	    startGame(2, numWords);
        });
        
    });

    $(document).on("deviceready", function() {
    });

    return {};

})(jQuery, datasource);
