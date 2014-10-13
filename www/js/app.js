// The main application
var app = (function ($, mw_client) {

    var ds, settings, gameWordData;

    var defaultSettings = {
        maxWords: 5,
        maxTries: 5,
        enableAnalytics: true,
        enableCellularDownloads: false
    };

    var init = function () {

        settings = loadSettings() || defaultSettings;
        
        $("#startButton").on("click", function () {
            startGame();
        });

        $("#exitButton").on("click", function () {
            navigator.app.exitApp();
        });

        $("#settingsPageBackButton").on("click", handleDiscardSettingsAction);
        $("#discardSettingsButton").on("click", handleDiscardSettingsAction);

        $("#restoreDefaultsSettingsButton").on("click", function (e) {
            if (JSON.stringify(getUserSettings()) !== JSON.stringify(defaultSettings)) {
                // entered settings are different than default settings
                $("#restoreDefaultSettingsConfirmationPopup").popup("open");
                e.preventDefault();
            }
        });

        $("#confirmDiscardSettingsButton").on("click", function () {
            setUserSettings(settings);
        });

        $("#confirmRestoreDefaultSettingsButton").on("click", function () {
            setUserSettings(defaultSettings);
        });

        $("#saveSettingsButton").on("click", function () {
            saveSettings(getUserSettings());
            changePage("#mainPage");
        });

        $("#settingsPage").on("pagebeforeshow", function () {
            setUserSettings(settings);
        });

        $("#spellingPage").on("pagebeforeshow", function () {
            $("#wordProgressBar").slider("refresh");
            $("#wordDefinitionCollapsible").collapsible("collapse");
        });
    };

    var handleDiscardSettingsAction = function (userClickEvent) {
        if (JSON.stringify(settings) !== JSON.stringify(getUserSettings())) {
            // unsaved settings
            $("#discardSettingsChangesConfirmationPopup").popup("open");
            userClickEvent.preventDefault();
        } else {
            changePage("#mainPage");
        }
    };

    var saveSettings = function (newSettings) {
        settings = newSettings;
        localStorage.setItem("settings", JSON.stringify(settings));
    };

    var loadSettings = function () {
        // From http://stackoverflow.com/a/3146971
        var settings = localStorage.getItem("settings");
        if (settings) {
            settings = JSON.parse(settings);
            settings.maxWords = parseInt(settings.maxWords);
            settings.maxTries = parseInt(settings.maxTries);
        }
        return settings;
    };

    var getUserSettings = function () {
        return {
            maxWords: parseInt($("#numWordsSettingsSlider").val()),
            maxTries: 5,
            enableAnalytics: $("#analyticsEnableFlipSwitch").val() === "on",
            enableCellularDownloads: $("#cellularDownloadEnableFlipSwitch").val() === "on"
        };
    };

    var setUserSettings = function (settings) {
        $("#numWordsSettingsSlider").val(settings.maxWords).slider("refresh");
        $("#analyticsEnableFlipSwitch").val((settings.enableAnalytics ? "on" : "off")).slider("refresh");
        $("#cellularDownloadEnableFlipSwitch").val((settings.enableCellularDownloads ? "on" : "off")).slider("refresh");
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
        } else if ($.mobile.activePage.is('#spellingPage')) {
            $("#homeNavigationConfirmationPopup").popup("open");
            e.preventDefault();
        } else if ($.mobile.activePage.is('#settingsPage')) {
            handleDiscardSettingsAction(e);
        } else {
            navigator.app.backHistory()
        }
    });

    var changePage = function (target, options) {
        $(":mobile-pagecontainer").pagecontainer("change", target, options || {});
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

    var startGame = function () {
        changePage("#emptyPage");
        showLoadingSpinner("Loading words");
        if (!isInternetAvailable()) {
            hideLoadingSpinner();
            $("#noConnectionPopup").popup("open");
            return;
        }

        // Load all words from preset list
        var wordList = ["accept", "manual"];
        if (!(wordList && wordList.length === settings.maxWords)) {
            hideLoadingSpinner();
            $("#loadErrorPopup").popup("open");
            return;
        }

        // Get their data from Merriam-Webster
        mw_client.getDataForWords(wordList, function (newWordData) {
            gameWordData = newWordData;
            hideLoadingSpinner();
            if (!(gameWordData && gameWordData.length === settings.maxWords)) {
                $("#loadErrorPopup").popup("open");
                return;   
            }
            loadNextWord(1, {
                correctCount: 0,
                incorrectCount: 0,
                skippedCount: 0,
                words:[]
            });
        });
    };

    // a separate function for loading words, rather than passing an array of words,
    // so that we can control how to get the next word
    var loadNextWord = function (wordNum, accumulatedResults) {
        // get the next word from the list of already loaded words
        spellView(wordNum, gameWordData[wordNum - 1], accumulatedResults);
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

        var initView = function () {
            $("#numWordsDisplay").text(wordNum);
            $("#maxWordsDisplay").text(settings.maxWords);
            $("#wordProgressBar").val((wordNum / settings.maxWords) * 100).slider("refresh");
            $("#numTriesDisplay").text(numTries);
            $("#maxTriesDisplay").text(settings.maxTries);
            $("#wordDefinitionDisplay").html(word.definitions[0]);
            $("#wordInput").val("");
            $("#nextWordButton").text((wordNum === settings.maxWords) ? "Show results" : "Next word");
            $("#wordDefinitionCollapsible").collapsible("collapse");
        };

        // Attach click handlers to the buttons in the UI.
        // First remove the already attached event handlers because we set these
        // handlers every time spellView is called, i.e, when loading a new word.
        // If we don't remove the previous handlers, the new handlers will get
        // attached in addition to the already attached handlers, and when the
        // event fires, all the previously attached handlers will also be called,
        // which will wreak havoc.

        $("#nextWordButton").off("click").on("click", function () {
            if (wordNum === settings.maxWords) {
                displayResults(results);
            } else {
                loadNextWord(wordNum + 1, results);
            }
        });

        $("#sayWordButton").off("click").on("click", function () {
            wordAudio.play();
        });

        $("#showAnswerButton").off("click").on("click", function () {
            results['skippedCount'] += 1;
            results.words.push({
                word: word.word,
                result: 'skipped'
            });
            $("#dialogHeading").text("Skipped word");
            $("#correctWord").text(word.word);
            $("#wordDonePopup").popup("open");
        });

        $("#checkAnswerButton").off("click").on("click", function () {
            numTries += 1;
            if ($("#wordInput").val().toLowerCase() === word.word.toLowerCase()) {
                // correct answer
                results['correctCount'] += 1;
                results.words.push({
                    word: word.word,
                    result: 'correct'
                });
                $("#dialogHeading").text("Correct answer!");
                $("#correctWord").text(word.word);
                $("#wordDonePopup").popup("open");
            } else {
                // incorrect answer
                if (numTries === settings.maxTries) {
                    // max number of tries reached
                    results['incorrectCount'] += 1;
                    results.words.push({
                        word: word.word,
                        result: 'incorrect'
                    });
                    $("#dialogHeading").text("Incorrect answer");
                    $("#correctWord").text(word.word);
                    $("#wordDonePopup").popup("open");
                } else {
                    $("#numTriesDisplay").text(numTries);
                }
            }
        });

        changePage("#spellingPage");
        initView();
    };

    var displayResults = function (results) {
        $("#correctWordsCount").text(results['correctCount'] || 0);
        $("#incorrectWordsCount").text(results['incorrectCount'] || 0);
        $("#skippedWordsCount").text(results['skippedCount'] || 0);
        $("#wordReport").html("");
        results.words.forEach(function (wordResult) {
            $("#wordReport").append($("<li></li>", {
                text: wordResult.word + ": " + wordResult.result
            }));
        });
        changePage("#resultsPage");
    };

    var isInternetAvailable = function () {
        if (!(navigator && navigator.connection && navigator.connection.type)) {
            return false;
        }
        var networkState = navigator.connection.type;
        if (networkState === Connection.NONE || networkState === Connection.UNKNOWN) {
            return false;
        } else if (networkState === Connection.WIFI || networkState === Connection.ETHERNET) {
            return true;
        } else {
            return settings.enableCellularDownloads;
        }
    };

    return {};

})(jQuery, mw_client);
