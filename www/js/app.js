// The main application
var app = (function ($, datasource) {

    var ds, settings;

    var defaultSettings = {
        maxWords: 5,
        maxTries: 5,
        enableAnalytics: true
    };

    var settings;

    var init = function () {

        settings = loadSettings() || defaultSettings;
        
        ds = datasource("wordnik");

        $("#startButton").on("click", function () {
            loadNextWord(1, {});
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

        $("#saveSettingsButton").on("click", function (e) {
            saveSettings(getUserSettings());
        });

        $("#settingsPage").on("pagebeforeshow", function () {
            setUserSettings(settings);
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
            enableAnalytics: $("#analyticsEnableflipSwitch").val() === "on"
        };
    };

    var setUserSettings = function (settings) {
        $("#numWordsSettingsSlider").val(settings.maxWords);
        $("#numWordsSettingsSlider").slider("refresh");
        $("#analyticsEnableflipSwitch").val((settings.enableAnalytics ? "on" : "off"));
        $("#analyticsEnableflipSwitch").slider("refresh");
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
            $("#maxWordsDisplay").text(settings.maxWords);
            $("#wordProgressBar").val((wordNum / settings.maxWords) * 100);
            $("#numTriesDisplay").text(numTries);
            $("#maxTriesDisplay").text(settings.maxTries);
            $("#wordDefinitionDisplay").html(word.definitions[0]);
            $("#wordInput").val("");
            $("#nextWordButton").text((wordNum === settings.maxWords) ? "Show results" : "Next word");
            $("#wordProgressBar").slider("refresh");
            $("#wordDefinitionCollapsible").collapsible("collapse");
        });

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
            results['skipped'] = (results['skipped'] || 0) + 1;
            
            $("#dialogHeading").text("Skipped word");
            $("#correctWord").text(word.word);
            $("#wordDonePopup").popup("open");
        });

        $("#checkAnswerButton").off("click").on("click", function () {
            numTries += 1;
            if ($("#wordInput").val().toLowerCase() === word.word.toLowerCase()) {
                // correct answer
                results['correct'] = (results['correct'] || 0) + 1;
                $("#dialogHeading").text("Correct answer!");
                $("#correctWord").text(word.word);
                $("#wordDonePopup").popup("open");
            } else {
                // incorrect answer
                if (numTries === settings.maxTries) {
                    // max number of tries reached
                    results['incorrect'] = (results['incorrect'] || 0) + 1;
                    $("#dialogHeading").text("Incorrect answer");
                    $("#correctWord").text(word.word);
                    $("#wordDonePopup").popup("open");
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
