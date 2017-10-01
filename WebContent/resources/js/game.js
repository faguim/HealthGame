/**
 * Copyright eLearning Brothers LLC 2012 All Rights Reserved
 */

h = 'http://'
host = "localhost:8080/gameserver";
//host = "ebm.lis.ic.unicamp.br/game/GameServer";

var URL_RESTSERVICE = h + host + '/rest';

var game = new function () {
    var designFile = "design.ini";
    var questionsFile = "questions.ini";
    var soundsFile = "sounds.ini";

    var questions_config;
    var questionCount = 0;
    var design;
    var sounds;
    var validity = -3;
    var instance = this;
    var score = 0;
    var answers = [ ];
    var answersMaxScore = {};
    var answerCount;
    var questionIndex = 0;
    var timerOn = false;
    var timerPrev = null;
    var timerCount = 0;
    var angle = 0;
    var gameScore = 0;
    var gamePercent = 0;
    var gameTime = 0;
    var timeout = 0; /* NO TIMEOUT */
    var gameTime_question=0;
    var correctQuestionCount = 0;
    var currentQuestionSound = null;
    var statistic = {};
    var start_time;
    var current_time;

    /* -----------------------  LOADING ------------------------- */

    this.reloadStyles = function () {
        $.get("resources/config/" + designFile, function (iniData) {
            design = parseIni(iniData);
            loadStyles();
        });
    };

    this.readConfig = function () {
    	$.ajax({
    		type: 'GET',
    		url: URL_RESTSERVICE + '/case/'+ 1,
    		dataType: "json",
    		success: function(data){
    			console.log('d');
    			mcase = data;
    		},
			error : function(e, url) { 
    			console.log('e');

	            console.error("Falha ao requisitar dados.", e.status);
			}
    	});
        $.get("resources/config/" + questionsFile, function (iniData) {
            iniData+=prepareIni(iniData,standartQuestionPattern);
            questions_config = parseIni(iniData);
            setOriginalQuestions(questions_config); 
            defaultQuestionPostProcesor(questions_config);
            validity++;
            if (validity == 0) {
                $(document).trigger('gameLoaded');
            }
        });
        $.get("resources/config/" + designFile, function (iniData) {
            design = parseIni(iniData);
            validity++;
            if (validity == 0) {
                $(document).trigger('gameLoaded');
            }
        });
        $.get("resources/config/" + soundsFile, function (iniData) {
            sounds = parseIni(iniData, function (val) {
                var media = createSound(val);

                return media;
            });
            validity++;
            if (validity == 0) {
                $(document).trigger('gameLoaded');
            }
        });
    };

    var loadStyles = function () {
        instance.loadStyles();
    };
    var bindSounds = function () {
        instance.loadSounds();
    };
    var fillData = function () {
        instance.loadData();
    };

    $(document).bind('gameLoaded', function () {
        loadStyles();
        bindSounds();
        fillData();

        $('div.game').addClass('step-1');

        instance.onGameLoaded();

        setInterval(function () {
            if (timerOn) {
                var newTime = new Date().getTime();
                instance.onTimePassed((newTime - timerPrev));
                timerPrev = newTime;
            }
        }, 100);
    });

    /* -----------------------  FUNCTIONS ------------------------- */

    function recalculateScore() {
        var answeredCount = 0;
        var maxScore = 0;
        var answeredScore = 0;
        var answeredScore_quiz = 0;
        for (var k in answers) {
            answeredCount++;
            answeredScore += answers[k];
            if (answers[k]>0){
                answeredScore_quiz += answers[k];
            }
        }
        
        for ( var j in mcase.questions) {
        	maxScore += parseInt(mcase.questions[j].max_score);
		}

        gameScore = answeredScore;
        instance.onUpdateScore(gameScore);
        instance.updateQuizPercent(answeredScore_quiz/maxScore);
        instance.updateProgressText();
    }

    this.updateQuizPercent = function(count) {
        statistic.game_percent = (100*statistic.correct_answers/(statistic.incorrect_answers+statistic.correct_answers)).toFixed(0);
        gamePercent = (100.0*count).toFixed(0);
        var p = (100.0*count).toFixed(2);
        $('.quiz-percent-value').html(p+"%");
    };
    this.updateProgressText = function() {
        $('.progress-text').html(questionIndex+" / "+questionCount);
    };

    function startTimer() {
        timerPrev = new Date().getTime();
        timerOn = true;
    }

    function stopTimer() {
        timerOn = false;
    }

    /* -----------------------  STEP-1 Logo ------------------------- */

    liveFastClick('a.button-game-start-1', function () {
        $('#game').removeClass('step-1').addClass('step-2');
        if (onlyOneSound) {
            tRewind(sounds.start);
            if (web_audio_api_player.init()){
                if (sounds.introduction!=null){
                    tPlay(sounds.start, PRIORITY_NORMAL);
                    if ($('#game').hasClass('step-2')){
                        tRewind(sounds.start, 3, 1);
                        tPlay(sounds.introduction, PRIORITY_NORMAL,4);
                    }
                }
                else {tPlay(sounds.start, PRIORITY_NORMAL);}
            }
            else {
                if (sounds.introduction!=null){
                    tPlay(sounds.introduction, PRIORITY_NORMAL);
                }
                else {tPlay(sounds.start, PRIORITY_NORMAL);}
            }
        } else {
            tRewind(sounds.start);
            if (sounds.introduction!=null){
                tPlay(sounds.introduction, PRIORITY_NORMAL);
            }
        }
    });

    /* -----------------------  STEP-2 Intro ------------------------- */

    liveFastClick('#step2continuebutton', function() {
        $('#game').removeClass('step-2');
        tRewind(sounds.start);
        tRewind(sounds.introduction);
        questionIndex=0;
        correctQuestionCount = 0;
        game.updateProgressText();
        nextQuestion();
    });
    /* -----------------------  STEP-3 Questions ------------------------- */

    function nextQuestion() {
    	if (mcase.questions[questionIndex] != undefined ) {
            gameTime_question=0;
            startTimer();
            $('#game').removeClass('step-3');
            questionShow(questionIndex);
        } else {
            finishGame();
        }
        
//        if (!empty(questions['q' + questionIndex])) {
//            gameTime_question=0;
//            startTimer();
//            $('#game').removeClass('step-3');
//            questionShow(questionIndex);
//        } else {
//            finishGame();
//        }
    }

    $(document).bind('endDraw', function () {
        questionIndex++;
        $('#game').addClass('step-3');
    });

    function finishGame() {
        $('#game').removeClass('step-3');
        $('#game').removeClass('step-4');
        $('#game').addClass('step-5');
        $('.quiz-results').show();
        $('div.result-block div.description').html("" + value(mcase.conclusion_won_text));
        flashBackground('start');

        if (sounds.conclusion!=null){
            tPlay(sounds.conclusion, PRIORITY_NORMAL);
        }
        else {tPlay(sounds.finish, PRIORITY_NORMAL);}

        recalculateScore();
        
//        Retirei do jogo algo relacionado a JCA SCORM. Preciso ver depois o que é
        $(document).trigger('gameFinished',[statistic]);
    }

    /* -----------------------  STEP-4 Answers ------------------------- */

    function questionShow(i) {
        $('#game').addClass('step-4');

        var question = mcase.questions[i];
        var score = nvl(question.right_score,1);
        var wscore = nvl(question.wrong_score,1); /* Question wscore is optional, default 1 per question */
        var srscore = nvl(question.semi_right_score,1)

        current_time= (new Date().getTime());
//        if (statistic.questions_answers['q' + i] != 0) 
//        	statistic.questions_time['q' + i] = 0;//reset question time on start/correct/fail (don't reset on incorrect)

        $('#game').data('question', question).data('score', score).data('wscore', wscore).data('srscore', srscore);
        $('.step-4').removeClass("type-multiple");

        conditionalShow($('.question-block h1'),question.title);
        
        $('.question-block div').html(value(question.description));
        $('.question-choose').html("");
        
//        var correct = value(question.correct_answer).split(',');
//        var not_wrong = value(question.not_wrong).split(',');
        
        var i = 0;
        var order = [];

        // optionally include eli animbutton and clickalert state when specified by ini settings
        var eliAnimButtonDivOpen = (design.eli_anim_button_enabled) ? "<div class='eli-button'>" : "";
        var eliAnimButtonDivClose = (design.eli_anim_button_enabled) ? "</div>" : "";
        var eliAnimClickAlertDiv = (design.eli_anim_clickalert_enabled) ? "<div class='eli-clickalert'></div>" : "";

        while (!empty(value(question.answers[i]))) {
            var variant = $("<div class='variant-wrapper'>" +
            					"<div class='variant'>" + eliAnimButtonDivOpen + 
            		        		"<div class='table'>" +
            		        			"<div>" + value(question.answers[i].text) + 
            		        			"</div>" +
            		        		"</div>" + eliAnimClickAlertDiv + eliAnimButtonDivClose + 
            		        	"</div>" +
            		        "</div>");
            
            variant.data({'correctness': question.answers[i].correctness, 'number': i});
            
            order[order.length] = variant;
            i++;
        }
        if (mcase.randomize_answer_order) {
            order.sort(function () {
                return 0.5 - Math.random()
            });
        }

        for (var k in order) {
            $('.question-choose').append(order[k]);
        }

        if (!empty(question.type)) {
            $('.step-4').addClass("type-" + value(question.type));
        }
        if(!empty(question.audio)) {
            currentQuestionSound = createSound(value(question.audio), true);
            tPlay(currentQuestionSound, PRIORITY_HI);
        } else {
            currentQuestionSound = null;
        }
        $('.question-block-wrapper').removeClass('transparent');

        removeBackgroundApply($('.question-block-wrapper'), question);

        $('.question-block-wrapper').show();

        $('#game .step-4').removeClass('answered').addClass('unanswered').removeClass('correct').removeClass('incorrect');

        // call core helper to init eli sprite anims
        initEliSpriteAnims(design);
    }

    function questionHide(i) {
        instance.onQuestionHide(i);
    }

    var answerChanged = function () {
    	if (!$('div.step-4').hasClass('type-multiple')) {
    		answerConfirmed();
    	}
    };
    
    liveFastClick('div.question-choose .variant', function () {
        $(this).toggleClass('choosed');
        answerChanged();
    });

    liveFastClick('a.button-question-confirm', function () {
        answerConfirmed();
    });

    var answerConfirmed = function () {
    	if(currentQuestionSound) {
            tRewind(currentQuestionSound);
        }
        var question = $('#game').data('question');
        var lscore = $('#game').data('score');
        var wscore = $('#game').data('wscore');
        var srscore = $('#game').data('srscore');

        
        var answerIndex = -1;
        var answerNumber = 0;
        statistic.questions_time['q'+questionIndex]+= (new Date().getTime())-current_time;

        var allCorrectRequired = $('div.step-4').hasClass('type-multiple');
        var correctness = 0;
        $('div.question-choose').find('.variant-wrapper').each(function () {

            /* If required all correct answers to be choosed */
//        	Preciso ajeitar isto para questões que aceita várias respostas
            if (allCorrectRequired && $(this).children().hasClass('choosed') != $(this).data('correct')) {
                correct = false;
            }

            /* If required one correct answers to be choosed */
            if (!allCorrectRequired && $(this).children().hasClass('choosed') && $(this).data('correctness')==2) {
                correctness = 2;

            }
            if (!allCorrectRequired && $(this).children().hasClass('choosed') && $(this).data('correctness')==1) {
                correctness = 1;
            }


            if($(this).children().hasClass('choosed')) {
                answerIndex=$(this).index();
                answerNumber=$(this).data('number');
            }
        });
        stopTimer();
        
        answersMaxScore[questionIndex] = parseInt(question.max_score);
        if (correctness==0) {
            tRewind(sounds.incorrect);
            tPlay(sounds.incorrect, 1);

            if ((score = parseInt($('div.score').html()) + parseInt(wscore) >= 0)|| stringToBoolean(nvl(mcase.allow_negative_score,"false"))) {
            	answers.push(parseInt(wscore));
            } else {
                score=0;
                answers.push(-parseInt($('div.score').html()));
            }
            statistic.questions_answers['q' + questionIndex] = 0;
            statistic.incorrect_answers++;
            statistic.fail_answers++;
            $('div.game .question-answered-block div').html((allCorrectRequired) ? value(question.incorrect_feedback_text) : value(question.answers[answerNumber].feedback_text));

            $('#game .step-4').addClass('incorrect');
        }
        
        if (correctness==1) {
            tRewind(sounds.correct);
            tPlay(sounds.correct, 1);

            answers.push(parseInt(srscore));
            score = parseInt($('div.score').html()) + parseInt(srscore);
            statistic.questions_answers['q' + questionIndex] = 1;
            statistic.correct_answers++;

            $('div.game .question-answered-block div').html((allCorrectRequired) ? value(question.correct_feedback_text) : value(question.answers[answerNumber].feedback_text));
            $('#game .step-4').addClass('semi-correct');

            correctQuestionCount++;
        } 
        
        if (correctness==2) {
            tRewind(sounds.correct);
            tPlay(sounds.correct, 1);


            answers.push(parseInt(lscore));
            score = parseInt($('div.score').html()) + parseInt(lscore);
            statistic.questions_answers['q' + questionIndex] = 1;
            statistic.correct_answers++;

            $('div.game .question-answered-block div').html((allCorrectRequired) ? value(question.correct_feedback_text) : value(question.answers[answerNumber].feedback_text));
            $('#game .step-4').addClass('correct');

            correctQuestionCount++;
        } 
        
        $('#game .step-4').removeClass('unanswered').addClass('answered');
        recalculateScore();
        instance.onAnswerConfirmed(correctness, answerIndex);
    	answerCount += 1;

    };

    liveFastClick('a.button-question-continue', function () {
        var ans_div=$('.step-4');
        if (ans_div.hasClass('incorrect')){
        	questionShow(questionIndex);

        	/* Else go to next question */
//            questionIndex++;
//            questionHide(questionIndex);
            recalculateScore();
        } else if (ans_div.hasClass('correct')){
            questionIndex++;
            questionHide(questionIndex);
            recalculateScore();
        } else if (ans_div.hasClass('semi-correct')){
        	questionShow(questionIndex);
            recalculateScore();
        }
    });

    /* -----------------------  STEP-5 Results ------------------------- */

    liveFastClick('a.button-result-continue', function () {
        flashBackground('stop');
        $('#game').removeClass('step-5');
        game.resetAnimation();
        game.start();
    });

    this.start = function () {
    	questions_config = getOriginalQuestions(); 
    	defaultQuestionPostProcesor(questions_config);
        instance.loadData();
        tRewind(sounds.finish);
        tRewind(sounds.conclusion);
        if (!onlyOneSound) {
                tRewind(sounds.start);
                tPlay(sounds.start, 1);
        }

        statistic.correct_answers=0;    //every correct answer
        statistic.incorrect_answers=0;  //every incorrect attempt
        statistic.fail_answers=0;       //when all attempts was incorrect
        statistic.questions_time={};
        statistic.questions_answers={};

        answersMaxScore = {};
        questionIndex = 0;
        timerCount = 0;

        gameTime = 0;
        gameScore = 0;

        stopTimer();

        $('div.score').html(0);
        $('div.time').html("");

        $('#game').removeClass('step-0').addClass('step-1');
        $(document).trigger('gameStarted');
    };

    /* ----------------- GAME SPECIFIC LOADERS ------------------- */
    this.loadStyles = function () {
        applyDefaultStyles(design);

        /* eli sprite anims */
        loadEliSpriteAnimStyles(dynamicCssInstance, design);

        if (!hoverDisable) {
            dynamicCssInstance.addCompiled("div.game .vertical .question-choose .variant:hover", design.question_button_over);
            dynamicCssInstance.addCompiled("div.game a.button:hover", design.button_over);
            dynamicCssInstance.addCompiled("div.game .vertical .question-choose .variant-wrapper:hover", design.question_button_bordercolor_over);
        }

        dynamicCssInstance.addRuleForImage("#texture", design.overlay_image, "background: url('$v') 50% 50% no-repeat;");

        dynamicCssInstance.addRule("div.game .question-vertical-shift", design['margin_top_for_questions_screen'], "height: $vpx");
        dynamicCssInstance.addRule("div.game .question-feedback-vertical-shift", design['margin_top_for_questions_feedback'], "height: $vpx");

        dynamicCssInstance.addCompiled("div.game div.logo1", design.logo1);
        dynamicCssInstance.addCompiled("div.game div.logo2", design.logo2);
        dynamicCssInstance.addCompiled("div.game div.logo3", design.logo3);
        dynamicCssInstance.addCompiled("div.game div.logo5", design.logo5);

        dynamicCssInstance.addCompiled("div.game .vertical .question-choose .variant", design.question_button_up);
        dynamicCssInstance.addCompiled("div.game .vertical .question-choose .variant:active", design.question_button_down);
        dynamicCssInstance.addCompiled("div.game .vertical .question-choose .variant.choosed", design.question_button_selected);

        dynamicCssInstance.addCompiled("div.game .question-choose .variant-wrapper", dozerMapper(design.question_button_up, ["radius"]));
        dynamicCssInstance.addCompiled("div.game .vertical .question-choose .variant-wrapper", design.question_button_bordercolor_up);
        dynamicCssInstance.addCompiled("div.game .vertical .question-choose .variant-wrapper:active", design.question_button_bordercolor_down);
        dynamicCssInstance.addCompiled("div.game .vertical .question-choose .variant-wrapper.choosed", design.question_button_bordercolor_selected);

        dynamicCssInstance.addCompiled("div.game a.button", design.button_up);
        dynamicCssInstance.addCompiled("div.game a.button:active", design.button_down);
        if(!empty(design.score_box)) {
            dynamicCssInstance.addCompiled("div.game div.score", design.score_box);
        }
        if(!empty(design.timer_box)) {
            dynamicCssInstance.addCompiled("div.game div.time", design.timer_box);
        }
        dynamicCssInstance.addCompiled("div.game .vertical .question-choose-wrapper",design.question_choose_wrapper);

        dynamicCssInstance.addCompiled("div.game .vertical .question-answered-block-wrapper", design.question_feedback_box);
        dynamicCssInstance.addCompiled("div.game .vertical .question-block-wrapper>div.question-block-wrapper-inner", design.question_box);
        dynamicCssInstance.addCompiled('div.game .quiz-percent-value', design.quiz_percent_value);
        var object = dozerMapper(design.question_box, ["width", "height", "X", "Y", "padding", "paddingX", "paddingY"]);
        applyDefaultQuestionBoxImage(dynamicCssInstance, design.question_box);

        dynamicCssInstance.addCompiled("div.game div.step-2-description", design.description_panel);
        dynamicCssInstance.addCompiled("div.game div.result-block-wrapper", design.result_panel);
        dynamicCssInstance.addCompiled("div.game .progressbar", design.progressbar_container);

        dynamicCssInstance.addRule("div.game .step-4.answered.correct .question-answered-block-wrapper h1", design.question_answer_correct_color, "color: $v");
        dynamicCssInstance.addRule("div.game .step-4.answered.incorrect .question-answered-block-wrapper h1", design.question_answer_incorrect_color, "color: $v");

        $('div.game .step-4').addClass('vertical').removeClass('horizontal');

        dynamicCssInstance.addCompiled("div.game #step1continuebutton", design.splash_continuebutton);
        dynamicCssInstance.addCompiled("div.game #step2continuebutton", design.intro_continuebutton);
        dynamicCssInstance.addCompiled("div.game #step4continuebutton", design.question_continuebutton);
        dynamicCssInstance.addCompiled("div.game #step4confirmbutton", design.question_confirmbutton);
        dynamicCssInstance.addCompiled("div.game #step5replaybutton", design.results_replaybutton);

        dynamicCssInstance.flush();
    };
    this.loadSounds = function () {
        if (questions_config.introduction_audio != null){
            sounds.introduction = createSound(questions.introduction_audio, true);
        }
        if (questions_config.conclusion_audio != null){
            sounds.conclusion = createSound(questions.conclusion_audio, true);
        }
        if (questions_config.conclusion_lost_audio != null){
            sounds.conclusion_lost = createSound(questions_config.conclusion_lost_audio, true);
        }
        if (onlyOneSound) {
            liveFastClick('.game a:not(#step4confirmbutton)', function () {
                tPlay(sounds.select, PRIORITY_LOW);
            });
            liveFastClick('.game .questions div.question:not(.answered):not(.hasOwnSound)', function () {
                tPlay(sounds.select, PRIORITY_LOW);
            });
            liveFastClick('.type-multiple .question-choose .variant', function () {
                tPlay(sounds.select, PRIORITY_LOW);
            });
        } else {
            liveFastClick('.game a, .game .questions div.question:not(.answered), .question-choose .variant', function () {
                tPlay(sounds.select, PRIORITY_LOW);
            });
            if (!hoverDisable) {
                $('.game a, .game .questions div.question:not(.answered), .question-choose .variant').live('mouseenter', function () {
                    tPlay(sounds.hover, PRIORITY_LOW);
                });
            }
        }
    };
    this.loadData = function () {
        timeout = nvl(mcase.timeout,0) * 1000;

       /* FILL GAME TEXT */
        $("#step1continuebutton").html("" + value(questions_config.splash_page_button_continue_text));
        $("#step2continuebutton").html("" + value(questions_config.intro_page_button_continue_text));
        $("#step4continuebutton").html("" + value(questions_config.question_page_button_continue_text));
        $("#step4confirmbutton").html("" + value(questions_config.question_page_button_confirm_text));
        $("#step5replaybutton").html("" + value(questions_config.result_page_button_replay_text));
        $(".gamebody div.step-5 h2.quiz-results").html("" + value(questions_config.results)+" <span class='quiz-percent-value'></span>");
        conditionalShow($('div.step-2-description h1'), questions_config.introduction_title);
        $('div.step-2-description div.description div').html("" + value(questions_config.introduction_text));
        $('div.step-2-description div.racer-description').html("" + value(questions_config.introduction_racer_description));
        questionCount = mcase.questions.length;
    };

    this.onGameLoaded = function () {
        instance.prepareAnimationFrame();
    };

    this.onQuestionHide = function(questionI) {
        nextQuestion();
    };

    /* TIMER */
    this.onTimePassed = function (deltaTime) {
        gameTime+=deltaTime;
        gameTime_question+=deltaTime;
        if (timeout != 0) {
            $('div.time').html((timeout / 1000 - parseFloat(gameTime_question) / 1000).toFixed(0));
            if (timeout && gameTime_question > timeout) {
                this.onTimeOut();
            }
        }
    };

    this.onTimeOut = function () {
        stopTimer();
        $('#game').removeClass('step-3');
        $('#game').removeClass('step-4');
        $('#game').addClass('step-5');
        flashBackground('start');
//        tPlay(sounds.lost, PRIORITY_NORMAL);
        if (sounds.conclusion_lost != null){tPlay(sounds.conclusion_lost, PRIORITY_NORMAL);}
        $('.quiz-results').hide();
        $('div.result-block div.description').html("" + value(mcase.conclusion_lost_text));
        /* PUT TIMEOUT CODE HERE IF ANY */
    };

    /* ANIMATIONS */
    this.prepareAnimationFrame = function () {};

    this.runAnimationToQuestion = function (i) {};

    this.resetAnimation = function () {
        this.runAnimationToQuestion(0);
    };

    this.onAnswerConfirmed = function(correct, answerIndex) {
        this.runAnimationToQuestion(correctQuestionCount);
    };

    this.onUpdateScore = function(score) {
        $('div.score').html(score);
    };
};