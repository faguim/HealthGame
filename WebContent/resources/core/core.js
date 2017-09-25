/**
 * Copyright eLearning Brothers LLC 2012 All Rights Reserved
 */

var core = {};
/*Detect browser */


(function(){
    var support=-1; // -1- support  unknown; 0 -not support; 1-part support; 2-full support
    var N= navigator.appName, ua= navigator.userAgent.toLowerCase(), tem;
    var M= ua.match(/(android|opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
    M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
    M[1]=M[1].split(".");
    switch (M[0]) {
        case "chrome":
            support = (M[1][0] >= 20) ? 2 : 0;
            break;

        case "android":
            support = (M[1][0] >= 4) ? 2 : 0;
            break;

        case "safari":
            support = (M[1][0] >= 5) ? 2 : 0;
            break;

        case "firefox":
            support = (M[1][0] >= 15) ? 2 : 0;
            break;

        case "opera":
            support = (M[1][0] >= 12) ? 1 : 0;
            break;

        case "msie":
            support = (M[1][0] >= 9) ? 2 : 0;
            break;
    }
    switch  (support){
        case -1: break;
        case 0:
            alert("You are using an older or unsupported browser ("+ M[0]  + " " + M[1][0] +") that is not compatible with this game. Please use a newer browser such as Chrome 20+, Firefox 15+, Safari 5+ or IE 9+");
            break;
        case 1: break;
    }
})();


/*Core function*/

/* Detect IIS when ajax error */
$(document).ajaxError(function(event, jqxhr, settings, exception) {
    core.log(event, jqxhr, settings, exception);
    var url = settings.url;
    var extention = url.substr(url.length-4,4);
    var server = jqxhr.getResponseHeader('Server');
    if (server.toLowerCase().indexOf("iis") != -1){//By default, IIS will only serve files for which the extension matches a defined MIME type.
        alert("Can't download " + url + "\n" +
            "Please ask server administrator that IIS serves " + extention + " files.\n"+
            "Or look here: http://stackoverflow.com/questions/2358902/iis-wont-serve-an-ini-file");
    }
});

/*Setup jQuery ajax, mainly for configs for not configured .htaccess, we always want to have dataType: "text" instead of "xml"*/
$.ajaxSetup({
    dataType: "text"
});

// Avoid `console` errors in browsers that lack a console.And Debug system.
(function() {
    var method,
        noop = function noop() {},
         methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
         ],
        length = methods.length,
        console = (window.console = window.console || {}),
        isDebug = (/debug/).test(location.href);
    //window.core= {};

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
        if (!isDebug){
            window.core[method]= noop;
        }
    }
    if (isDebug){
        window.core = console;
        core.log("Debugging is enabled!");
    }
}());


/* A prefix for config files for better differentiation */
var GAMEPREFIX = "";

var hoverDisable = !!('ontouchstart' in document);// If touch event presents, we run on mobile => no hover
var suffix = "?cache="+(new Date()).getTime();

var moveEvent = function(e) {
    if(!empty(e.originalEvent.touches)) {
        return e.originalEvent.touches[0]
    }
    if(!empty(e.originalEvent.changedTouches)) {
        return e.originalEvent.changedTouches[0]
    }
    return e;
};

var pushColor = function (color) {
    // TODO probably don't need?  Delete this function?
//    if (!empty(color)) {
//        $(document).trigger('color', {color:color});
//    }
};

var standartQuestionPattern = function(line) {
        var m = line.match(/q([0-9]+)_text/);
        if(m!=null) return "\nq"+m[1]+"=#";

        var m = line.match(/q([0-9]+)_image/);
        if(m!=null) return "\nq"+m[1]+"=#";

        var m = line.match(/q([0-9]+)_score/);
        if(m!=null) return "\nq"+m[1]+"=#";

        return null;
    };

var defaultCutQuestionCount = function(questions, obj) {
    var qCount = 1;
    if(!empty(obj)) {
        qCount = parseInt(obj, 10);
        qCount++;
        while(!empty(questions["q"+qCount])) {
            delete questions["q"+qCount];
            qCount++;
        }
    }
    qCount = 1;
    while(!empty(questions["q"+qCount])) {
        qCount++;
    }
    return qCount-1;
};

/**
 * Returns number of questions (min of actual number & limiting parameter)
 * @param questions
 * @return {Number}
 */
var defaultQuestionCount = function(questions) {
    var qCount = 1;
    while(!empty(questions["q"+qCount])) {
        qCount++;
    }
    var questionsAmount = qCount-1;
    if(!empty(questions['questions_displayed_from_count'])) {
        questionsAmount = Math.min(questionsAmount, parseInt(value(questions['questions_displayed_from_count']), 10));
    }
    return questionsAmount;
};

/**
 * Applies question randomization, applies question count
 * @param questions
 */
var defaultQuestionPostProcesor = function(questions) {
    defaultCutQuestionCount(questions, questions['question_count']); /* Cut out question count. Forever. */
    var randomize_question_order = stringToBoolean(nvl(questions.randomize_question_order,"false"));
    if(!empty(questions['questions_displayed_from_count'])) {
        randomize_question_order = true;
    }
    var qlength = defaultQuestionCount(questions);
    for(var i=1;i<=qlength;i++) {
        questions['q' + i].path = empty(questions['q' + i].path) ? (((i) * 100 / qlength).toFixed(2) + "%") : questions['q' + i].path
    }
    if (randomize_question_order) {
        var newQ = [];
        var oldQ = [];
        var i = 1;
        while (!empty(questions['q' + i])) {
            newQ[newQ.length] = questions['q' + i];
            oldQ[oldQ.length] = empty(questions['q' + i].path) ? (((i) * 100 / qlength).toFixed(2) + "%") : questions['q' + i].path;
            i++;
        }

        newQ.sort(function () {
            return 0.5 - Math.random()
        });
        var ql = i;
        for (i = 1; i < ql; i++) {
            questions['q' + i] = newQ[i - 1];
            questions['q' + i].path = oldQ[i - 1];
        }
    }
    defaultCutQuestionCount(questions, defaultQuestionCount(questions));
};

var originalQuestions = null;
function setOriginalQuestions(questions) {
    originalQuestions = jQuery.extend({}, questions); /* Clone */
}
function getOriginalQuestions() {
    return jQuery.extend({},  originalQuestions); /* Clone */
}


var needToRemoveBackground = function(question) {
    var param = stringToBoolean(question['removeBackground']);
    var imageOnly = false;
    var result = param;
    var text = question['text'];
    var match = text.match(/\s*<img[^>]+>\s*$/gi);
    if ( match != null) {
        imageOnly = true;
        result = !(!empty(question['removeBackground']) && !param); /* if param forces to be false, make false */
    }
    return result;
};

var removeBackgroundApply = function(element, question) {
    var param = stringToBoolean(question['removeBackground']);
    var imageOnly = false;
    var result = param;
    var text = question['text'];
    var match = text.match(/^\s*<img[^>]+>\s*$/gi);
    if ( match != null) {
        imageOnly = true;
        //result = !(!empty(question['removeBackground']) && !param); /* if param forces to be false, make false */
    }
    if(result) {
        element.addClass('transparent');
    } else {
        element.removeClass('transparent');
    }
    if(imageOnly) {
        element.addClass('imageonly');
    } else {
        element.removeClass('imageonly');
    }
};

var prepareIni = function(text, funct) {
    var lines = text.split("\n");
    var add = "";
    for (var k in lines) {
        var item = lines[k];
        if(funct(item)!=null) {
            add+=funct(item);
        }
    }
    return add;
};
var parseIni = function (text, valueProcessor, pathQuestionsSounds) {
    var valueProcessor = (typeof(valueProcessor) === 'undefined') ? function (val) {
        return val;
    } : valueProcessor;

    var parseLine = function (line) {
        var line = line.trim();
        var result = {isValid:true};
        if (line.indexOf('#') == 0) {
            result['isValid'] = false;
            return result;
        }
        if (line.indexOf("=") <= 0) {
            result['isValid'] = false;
            return result;
        }
        result['key'] = line.substr(0, line.indexOf("=")).trim();
        result['value'] = line.substr(line.indexOf("=") + 1).trim().ReplaceAll("\\", "<br/>\r\n").ReplaceAll("~slash~", "\\");
        //result['value'] = line.substr(line.indexOf("=") + 1).trim().ReplaceAll("\\\\", "~slash~").ReplaceAll("\\", "<br/>\r\n").ReplaceAll("~slash~", "\\");
        return result;
    };
    var data = {};
    var setValue = function (object, key, value) {
        if (key==="audio"){//For questions audio cache. If key contain AUDIO then create sound for questions.
            if (pathQuestionsSounds){createSound(value, pathQuestionsSounds);} else{createSound(value, true);}
        }
        for (var k in object) {
            if (key.indexOf(k) == 0 && key.substr(k.length).indexOf('_') == 0) {
                if (typeof(object[k].substring) !== 'undefined') {
                    var title = object[k];
                    object[k] = {};
                    object[k]['#'] = title;
                }
                setValue(object[k], key.substr(k.length + 1), value);
                return;
            }
        }
        object[key] = valueProcessor(value);
    };
    var keys = [];
    var values = [];
    var text = text.ReplaceAll("\\\n\r", " \\").ReplaceAll("\\\n", " \\");
    var lines = text.split("\n");
    for (var k in lines) {
        var item = parseLine(lines[k]);
        if (item.isValid) {
            keys[keys.length] = item.key;
            values[item.key] = item.value;
        }
    }
    keys.sort();
    for (var k in keys) {
        var key = keys[k];
        setValue(data, key, values[key]);
    }
    return data;

};

var parseImgPath = function (text, forQuestions) {
    var base_game_url = window.location.href.slice(0,window.location.href.lastIndexOf("/")+1)
    var forQuestions = typeof(forQuestions) === 'undefined' ? false : forQuestions;
    if (forQuestions === true || forQuestions === "true"){forQuestions = "questions";}
    else{
        if (!forQuestions){forQuestions = "resources/img";}
    }
    var defaultPath = forQuestions;
//    var defaultPath = forQuestions ? base_game_url+"questions" : base_game_url+"config/images";
    if (text.indexOf("http") === 0){
        return text;
    }
    if (text.indexOf("/") ===0) {
        return base_game_url+text;
    }
    if (text.indexOf("%") == 0) {
        return base_game_url+"resources/" + text.substr(1);
    }
    return defaultPath + "/" + text;
};

var parseSndPath = function (text, isQuestion) {
    var isQuestion = typeof(isQuestion) === 'undefined' ? false : isQuestion;
    if (isQuestion === true || isQuestion === "true"){isQuestion = "questions";}
    else{
        if (!isQuestion){isQuestion = "resources/sounds";}
    }
    var defaultPath = isQuestion;
//        var defaultPath = isQuestion ? "questions" : "config/sounds";
    if ((text.indexOf("/") ===0)||(text.indexOf("http") === 0)) {
        return text;
    }
    if (text.indexOf("%") == 0) {
        return "/resources/" + text.substr(1);
    }
    return defaultPath + "/" + text;
};

/**
 * Returns ini property converted to string. If ini property is object, it's title is returned
 * @param val
 * @return {*}
 */
var value = function (val) {
    if (typeof(val) === 'undefined') {
        return null;
    } else if (typeof(val) === 'number') {
        return val;
    }
    /* If parameter is string, return string. If iniObject, return iniObject title */
    if (typeof(val.substring) !== 'undefined') {
        return "" + val;
    } else {
        return "" + val['#'];
    }
};

/**
 * Returns val if not null, else returns defaultVal
 * @param val
 * @param defaultVal
 * @return {*}
 */
var nvl = function (val, defaultVal) {
    return value(val) == null ? defaultVal : value(val);
};

var stringToBoolean = function (string) {
    if(typeof(string)==='undefined' || string==null) {
        return false;
    }
    switch (string.toLowerCase()) {
        case "true":
        case "yes":
        case "1":
            return true;
        case "false":
        case "no":
        case "0":
        case null:
            return false;
        default:
            return Boolean(string);
    }
};
var preloader = new function () {
    this.preloadCfgImage = function (image) {
        this.preload(parseImgPath(image));
    };
    this.preload = function (image) {
        var img = $('<img src="' + image + '"/>').css({position:'absolute', width:0, height:0, opacity:0});
        $('body').append(img);
    }
};
/**
 * Singleton for adding css rules dynamically
 */
var dynamicCssInstance = new function () {
    this.radialGradient = function (startColor, endColor, width) {
        var width = parseInt(width) / 2;

        var template = "background: $prev_bg, $start;" +
            "background: $prev_bg, -moz-radial-gradient(center, ellipse cover,  $start 0%, $end 100%);" +
            "background: $prev_bg, -webkit-gradient(radial, center center, 0, center center, $width, color-stop(0,$start), color-stop(1,$end));" +
            "background: $prev_bg, -webkit-radial-gradient(center, ellipse cover,  $start 0%,$end 100%);" +
            "background: $prev_bg, -o-radial-gradient(center, ellipse cover,  $start 0%,$end 100%);" +
            "background: $prev_bg, -ms-radial-gradient(center, ellipse cover,  $start 0%,$end 100%);" +
            "background: $prev_bg, radial-gradient(center, ellipse cover,  $start 0%,$end 100%);" +
            "filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='$start', endColorstr='$end',GradientType=1 );";


        return template.ReplaceAll("$start", startColor).ReplaceAll("$end", endColor).ReplaceAll('$width', width);
    };
    this.linearGradient = function (startColor, endColor) {

        var template = "background: $prev_bg, $start;" +
            "background: $prev_bg, -moz-linear-gradient(top,  $start 0%, $end 100%);" +
            "background: $prev_bg, -webkit-gradient(linear, left top, left bottom, color-stop(0%,$start), color-stop(100%,$end));" +
            "background: $prev_bg, -webkit-linear-gradient(top,  $start 0%,$end 100%);" +
            "background: $prev_bg, -o-linear-gradient(top,  $start 0%,$end 100%);" +
            "background: $prev_bg, -ms-linear-gradient(top,  $start 0%,$end 100%);" +
            "background: $prev_bg, linear-gradient(top,  $start 0%,$end 100%);" +
            "filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='$start', endColorstr='$end',GradientType=0 );";

        return template.ReplaceAll("$start", startColor).ReplaceAll("$end", endColor);
    };
    this.linearHGradient = function (startColor, endColor) {

        var template = "background: $prev_bg, $start;" +
            "background: $prev_bg, -moz-linear-gradient(left,  $start 0%, $end 100%);" +
            "background: $prev_bg, -webkit-gradient(linear, left top, right top, color-stop(0%,$start), color-stop(100%,$end));" +
            "background: $prev_bg, -webkit-linear-gradient(left,  $start 0%,$end 100%);" +
            "background: $prev_bg, -o-linear-gradient(left,  $start 0%,$end 100%);" +
            "background: $prev_bg, -ms-linear-gradient(left,  $start 0%,$end 100%);" +
            "background: $prev_bg, linear-gradient(left,  $start 0%,$end 100%);" +
            "filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='$start', endColorstr='$end',GradientType=1 );";

        return template.ReplaceAll("$start", startColor).ReplaceAll("$end", endColor);
    };

    var styles = {};
    var strStyle = "";
    var ruleCount = 0;

    this.flush = function () {
        var str = "";
        for (var key in styles) {
            str += key + "{ " + styles[key] + " }\r\n";
        }
        $("<style id='dnStyle' type='text/css'>" + strStyle + str + "</style>").appendTo("head");

        styles = {};
        strStyle = "";
    };

    this.flushIntoId = function (id) {
        var str = "";
        for (var key in styles) {
            str += key + "{ " + styles[key] + " }\r\n";
        }
        $("<style id='"+id+"' type='text/css'>" + strStyle + str + "</style>").appendTo("head");

        styles = {};
        strStyle = "";
    };

    var rule = function (vr, rule) {
        if (!empty(vr)) {
            return rule.ReplaceAll("$v", vr) + "\r\n";
        }
        return "";
    };
    var ruleForImage = function (vr, rule) {
        if (!empty(vr)) {
            return rule.ReplaceAll("$v", parseImgPath(vr)) + "\r\n";
        }
        return "";
    };

    this.clean = function () {
        $('#dnStyle').remove();
    };

    this.cleanId = function (id) {
        $('#'+id).remove();
    };

    this.add = function (selector, rule) {
        styles["/*" + (ruleCount++) + "*/" + selector] = rule;
    };

    /**
     * Adds rule if conditionalObject is defined. Replaces '$v' in ruleString to string value of object
     * @param selector
     * @param conditionalObject
     * @param ruleString
     */
    this.addRule = function (selector, conditionalObject, ruleString) {
        styles["/*" + (ruleCount++) + "*/" + selector] = rule(conditionalObject, ruleString);
    };

    /**
     * Adds rule if conditionalObject is defined. Replaces '$v' in ruleString to string value of object. Object is considered to be image path.
     * @param selector
     * @param conditionalObject
     * @param ruleString
     */
    this.addRuleForImage = function (selector, conditionalObject, ruleString) {
        styles["/*" + (ruleCount++) + "*/" + selector] = ruleForImage(conditionalObject, ruleString);
    };

    this.addCompiled = function (selector, object) {
        if (empty(object)) {
            console.error("Mandratory object missing for selector: " + selector);
        }
        this.add(selector, this.compile(object));
    };


    this.append = function (selector, rule) {
        strStyle += selector + "{ " + rule + " }\r\n";
    };


    this.rule = function (vr, rule) {
        if (!empty(vr)) {
            return rule.ReplaceAll("$v", vr) + "\r\n";
        }
        return "";
    };
    this.ruleForImage = function (vr, rule) {
        if (!empty(vr)) {
            return rule.ReplaceAll("$v", parseImgPath(vr)) + "\r\n";
        }
        return "";
    };
    function markDeprecated(obj, properties) {

        for (var key in properties) {
            if (!empty(obj[properties[key]])) {
                console.error("Deprecated design property should be removed: " + properties[key]);
            }
        }
    }

    /**
     * Tries to build a style from an object
     * @param object
     */
    this.compile = function (object) {
        markDeprecated(object, ["background", "top", "bottom", "text", "left", "right", "center", "edge", "gradientRadius", "size", "font"]);
        if (!empty(object.image)) {
            preloader.preloadCfgImage(object.image);
        }
        if (!empty(object.sprite)) {
            preloader.preloadCfgImage(object.sprite);
        }
        var style = "";

        var stylesObj = {
            X: "left: $vpx;",
            Y: "top: $vpx;",
            y: "bottom: $vpx;",
            width : "width: $vpx;",
            height: "height: $vpx;",
            maxHeight: "max-height: $vpx;",
            overflow: "overflow: $v;",
            overflowX: "overflow-x: $v;",
            overflowY: "overflow-y: $v;",
            border: "border: $v;",
            borderTop: "border-top: $v;",
            borderRight: "border-right: $v;",
            borderBottom: "border-bottom: $v;",
            borderLeft: "border-left: $v;",
            fontSize: "font-size: $v;",
            fontWeight: "font-weight: $v;",
            fontStyle: "font-style: $v;",
            padding: "padding: $vpx;",
            paddingX: "padding-left: $vpx;padding-right: $vpx;",
            paddingY: "padding-top: $vpx;padding-bottom: $vpx;",
            margin: "margin: $vpx;",
            marginY: "margin-top: $vpx;margin-bottom: $vpx;",
            marginX: "margin-left: $vpx;margin-right: $vpx;",
            marginTop: "margin-top: $vpx;",
            marginBottom: "margin-bottom: $vpx;",
            marginLeft: "margin-left: $vpx;",
            marginRight: "margin-right: $vpx;",
            paddingTop: "padding-top: $vpx;",
            paddingBottom: "padding-bottom: $vpx;",
            paddingLeft: "padding-left: $vpx;",
            paddingRight: "padding-right: $vpx;",
            radius: "-webkit-border-radius: $vpx;-moz-border-radius: $vpx;-o-border-radius: $vpx;border-radius: $vpx;",
            background: "background-color: $v;",
            background_color: "background-color: $v;",
            spriteShift: "background-position: 0 -$vpx;",
            font: 'font-family: "$v", Helvetica, Arial, sans-serif;',
            fontFamily: 'font-family: "$v", Helvetica, Arial, sans-serif;',
            lineHeight: "line-height: $vpx;",
            size: 'font-size: $v;',
            text: "color: $v;",
            text_color: "color: $v;",
            style: "/* Custom styles */\n\r$v\n\r;",
            backgroundRepeat: "background-repeat: $v;",
            //don't apply rule
            image: undefined,
            background_image: undefined,
            sprite: undefined,
            gradient_top: undefined,
            gradient_bottom: undefined,
            gradient_left: undefined,
            gradient_right: undefined,
            gradient_center: undefined,
            gradient_edge: undefined,
            shadow: undefined,
            gloss: undefined,
            glow: undefined,
            backgroundSize: undefined
        };
        this.getStyles = function(){return stylesObj};
        for (var key in object) {
            if (!empty(stylesObj[key] && key)){
                style += rule(object[key], stylesObj[key]);
            }
        }
        if (!empty(object.X) || !empty(object.Y)|| !empty(object.y)) {
            style += "position: absolute;";
        }
        if (!empty(object.centerText)) {
            style += "text-align: center;";
        }

        if (!empty(object.padding) && !empty(object.width)) {
            object.new_width = object.width - 2 * object.padding;
            style += rule(object.new_width, "width: $vpx;");
        }
        if (!empty(object.padding) && !empty(object.height)) {
            object.new_height = object.height - 2 * object.padding;
            style += rule(object.new_height, "height: $vpx;");
        }
        if (!empty(object.paddingX) && !empty(object.width)) {
            object.new_width = object.width - 2 * object.paddingX;
            style += rule(object.new_width, "width: $vpx;");
        }
        if (!empty(object.paddingY) && !empty(object.height)) {
            object.new_height = object.height - 2 * object.paddingY;
            style += rule(object.new_height, "height: $vpx;");
        }

        pushColor(object.background);
        pushColor(object.background_color);
        var gradient_style;
        if (!empty(object.top) && !empty(object.bottom)) {
            gradient_style= this.linearGradient(object.top, object.bottom);
            pushColor(object.top);
            pushColor(object.bottom);
        }
        if (!empty(object.gradient_top) && !empty(object.gradient_bottom)) {
            gradient_style= this.linearGradient(object.gradient_top, object.gradient_bottom);
            pushColor(object.gradient_top);
            pushColor(object.gradient_bottom);
        }
        if (!empty(object.left) && !empty(object.right)) {
            gradient_style= this.linearHGradient(object.left, object.right);
            pushColor(object.left);
            pushColor(object.right);
        }
        if (!empty(object.gradient_left) && !empty(object.gradient_right)) {
            gradient_style= this.linearHGradient(object.gradient_left, object.gradient_right);
            pushColor(object.gradient_left);
            pushColor(object.gradient_right);
        }
        if (!empty(object.center) && !empty(object.edge) && !empty(object.gradientRadius)) {
            gradient_style= this.radialGradient(object.center, object.edge, object.gradientRadius);
            pushColor(object.center);
            pushColor(object.edge);
        }
        if (!empty(object.gradient_center) && !empty(object.gradient_edge) && !empty(object.gradient_radius)) {
            gradient_style += this.radialGradient(object.gradient_center, object.gradient_edge, object.gradient_radius);
            pushColor(object.gradient_center);
            pushColor(object.gradient_edge);
        }

        style += ruleForImage(object.image, "background-size: cover; background-repeat: no-repeat; background-position: 50% 50%; background-image:url('$v');");
        style += ruleForImage(object.background_image, "background-size: cover; background-repeat: no-repeat; background-position: 50% 50%; background-image:url('$v');");
        style += ruleForImage(object.sprite, "background-size: auto; background-position: 0 0; background-image:url('$v');");
        if (empty(object.background_image) && (!empty(object.image))){
            object.background_image = object.image;
        }
        if (!empty(object.background_image) && !empty(gradient_style)) {
            style +=gradient_style.ReplaceAll("$prev_bg", ruleForImage(object.background_image, "url('$v')"));
        } else if (!empty(gradient_style)){
            style +=gradient_style.ReplaceAll("$prev_bg,", "");
        }

        if (!empty(object.sprite) && !empty(object.height)) {
            style += rule(object.height, "line-height: $vpx;")
        }

        pushColor(object.text);
        pushColor(object.text_color);

        if (!empty(object.shadow)) {
            var gloss = false;
            if (!empty(object.gloss)) {
                gloss = stringToBoolean(object.gloss);
            }
            var shadow = stringToBoolean(object.shadow);
            if (!shadow && gloss) {
                style += "-webkit-box-shadow: 0 2px 5px rgba(0,0,0,0.15), inset 0 -17px 0 rgba(0,0,0,0.10);";
                style += "-moz-box-shadow: 0 2px 5px rgba(0,0,0,0.15), inset 0 -17px 0 rgba(0,0,0,0.10);";
                style += "box-shadow: 0 2px 5px rgba(0,0,0,0.15), inset 0 -17px 0 rgba(0,0,0,0.10);";
                style += "border-collapse: separate;";
            }
            if (shadow && gloss) {
                style += "-webkit-box-shadow: 0 0 10px rgba(0,0,0,0.7),  0 2px 5px rgba(0,0,0,0.15), inset 0 -17px 0 rgba(0,0,0,0.10);";
                style += "-moz-box-shadow: 0 0 10px rgba(0,0,0,0.7),  0 2px 5px rgba(0,0,0,0.15), inset 0 -17px 0 rgba(0,0,0,0.10);";
                style += "box-shadow: 0 0 10px rgba(0,0,0,0.7),  0 2px 5px rgba(0,0,0,0.15), inset 0 -17px 0 rgba(0,0,0,0.10);";
                style += "border-collapse: separate;";
            }
            if (shadow && !gloss) {
                style += "-webkit-box-shadow: 0 0 10px rgba(0,0,0,0.7);";
                style += "-moz-box-shadow: 0 0 10px rgba(0,0,0,0.7);";
                style += "box-shadow: 0 0 10px rgba(0,0,0,0.7);";
                style += "border-collapse: separate;";
            }
            if (!shadow && !gloss) {
                style += "-webkit-box-shadow: none;";
                style += "-moz-box-shadow: none;";
                style += "box-shadow: none;";
            }
        } else {
            if (!empty(object.gloss)) {
                gloss = stringToBoolean(object.gloss);
                if (gloss) {
                    style += "-webkit-box-shadow: 0 2px 5px rgba(0,0,0,0.15), inset 0 -17px 0 rgba(0,0,0,0.10);";
                    style += "-moz-box-shadow: 0 2px 5px rgba(0,0,0,0.15), inset 0 -17px 0 rgba(0,0,0,0.10);";
                    style += "box-shadow: 0 2px 5px rgba(0,0,0,0.15), inset 0 -17px 0 rgba(0,0,0,0.10);";
                    style += "border-collapse: separate;";
                }
            }
        }
        if (!empty(object.glow) && !empty(object.background_color)) {
            var glow = stringToBoolean(object.glow);
            if (glow) {
                style += rule(object.background_color, "-moz-box-shadow: 0 0 4px $v;");
                style += rule(object.background_color, "-webkit-box-shadow: 0 0 4px $v;");
                style += rule(object.background_color, "box-shadow: 0 0 4px $v;");
            }
        }
        if(value(object.backgroundSize)!='fill') {
            style += rule(object.backgroundSize, 'background-size: $v;');
        } else {
            style += rule(object.backgroundSize, 'background-size: 100% 100%;');
        }

        return style;
    }
};

/* Styles and fonts */
var applyDefaultStyles = function (design) {

    /* Styles */
    dynamicCssInstance.clean();
    dynamicCssInstance.addCompiled('div.game', prepareBackground(design));
    if (!empty(design.body_texture)){
        dynamicCssInstance.addRuleForImage(".gamebody", design.body_texture, "background: url('$v') repeat;");
    }
    if (!empty(design.body_color)){
        dynamicCssInstance.addRule(".gamebody", design.body_color, "background-color: $v");
    }

    /* Fonts */
    if (!empty(design.font)){
        dynamicCssInstance.addRule("@font-face", "dummy", addFonts(design.font));
    }
    if (!empty(design.game.fontFamily)){
        dynamicCssInstance.addCompiled('div.game', { fontFamily: design.game.fontFamily});
    }
    /* eli specific settings */
    if (!empty(design.eli_anim_button_enabled)) {
        design.eli_anim_button_enabled = stringToBoolean(nvl(design.eli_anim_button_enabled, "false"));
        if (design.eli_anim_button_enabled) {
            design.eli_anim_button_opts = applyDefaultSpriteAnimProperties(design.eli_anim_button_opts);
        }
    }
    if (!empty(design.eli_anim_clickalert_enabled)) {
        design.eli_anim_clickalert_enabled = stringToBoolean(nvl(design.eli_anim_clickalert_enabled, "false"));
        if (design.eli_anim_clickalert_enabled) {
            design.eli_anim_clickalert_opts = applyDefaultSpriteAnimProperties(design.eli_anim_clickalert_opts);
        }
    }
};

/* eli Sprite Anim Properties */
var applyDefaultSpriteAnimProperties = function (opts) {
    try { // place inside a try loop since older interactions will not have the SpriteAnim class loaded
        if (!empty(opts)) {
            var defaultProps = new SpriteAnim().getDefaultProps();
            if (!empty(defaultProps)) {
                opts = parseEliObjectProperties(opts, defaultProps);
            }
        }
    } catch (ex) { }
    return opts;
};

var parseEliObjectProperties = function (opts, defaultProps) {
    for (var p in opts) {
        var proptype = (defaultProps[p] != null) ? typeof (defaultProps[p]) : null;
        switch (proptype) {
            case 'number':
                opts[p] = parseFloat(nvl(opts[p], defaultProps[p].toString()));
                break;
            case 'boolean':
                opts[p] = stringToBoolean(nvl(opts[p], defaultProps[p].toString()));
                break;
            case 'object':
                try {
                    opts[p] = $.parseJSON(nvl(opts[p], null));
                } catch (ex) { }
                break;
            default:
                break;
        }
    }
    return opts;
};

var loadEliSpriteAnimStyles = function (dynamicCssInstance, design) {
    if (!dynamicCssInstance || !design) { return; }

    if (!empty(design.eli_button)) {
        dynamicCssInstance.addCompiled("div.game .eli-button", design.eli_button);
    }
    if (!empty(design.eli_clickalert)) {
        dynamicCssInstance.addCompiled("div.game .eli-clickalert", design.eli_clickalert);
    }
};

var initEliSpriteAnims = function (design) {
    if (!design) { return; }

    if (design.eli_anim_button_enabled) {
        // if this interaction contains any animated buttons, then register them now
        var btnOpts = {
            fps: 24,
            frameCount: 50,
            repeatCount: 0,
            autoSize: true,
            autoStart: false,
            resetOnStart: true,
            resetOnStop: true,
            resetOnLastRepeat: false
        };

        if (!empty(design.eli_anim_button_opts)) {
            $.extend(btnOpts, design.eli_anim_button_opts);
        }

        $('.eli-button').spriteAnim(btnOpts).mouseover(function (e) {
            e.currentTarget.spriteAnim.start();
        }).mouseout(function (e) {
                e.currentTarget.spriteAnim.stop();
            });
    }

    if (design.eli_anim_clickalert_enabled) {
        // if this interaction contains any animated click alerts, then register them now
        var alertOpts = {
            fps: 24,
            frameCount: 20,
            frameSize: { w: 80, h: 80 },
            nextFrameShift: { x: 80, y: 0 },
            autoSize: true,
            autoStart: true,
            resetOnStart: false,
            resetOnStop: false,
            resetOnLastRepeat: false
        };

        if (!empty(design.eli_anim_clickalert_opts)) {
            $.extend(alertOpts, design.eli_anim_clickalert_opts);
        }

        $('.eli-clickalert').spriteAnim(alertOpts);
    }
};

/* Prepare fonts */
var addFonts = function (fonts){
    for (var font in fonts){
        if (font==="#") continue;
        var font_rule = "font-family: '"+font+"';" +
            "src: $v;";
        var fontSrc = fonts[font].split(',');
        var fontsTypes = {};
        for (var i in fontSrc) {
            var link="url('$url') format('$format'), $v ";
            var s = fontSrc[i];
            var ext = s.substr(s.lastIndexOf('.') + 1).trim().toLowerCase();
            fontsTypes[ext] = s.trim();
            switch (ext){
                case "woff":
                    link=link.replace("$url", parseImgPath(fontSrc[i],true));
                    link=link.replace("$format", "woff");
                    break;

                case "ttf":
                    link=link.replace("$url", parseImgPath(fontSrc[i],true));
                    link=link.replace("$format", "truetype");
            }
            font_rule= font_rule.replace('$v',link);
        }
        link= link.replace(', $v',"");
        return font_rule.replace(', $v',"")
    }
};

/* Значение функции безьер по параметрам */
var getBezier = function (t, A, B, D, C) {
    var a = t;
    var b = 1 - t;
    var p = {};
    p.x = A.x * Math.pow(b, 3) + 3 * B.x * Math.pow(b, 2) * a + 3 * C.x * b * Math.pow(a, 2) + D.x * Math.pow(a, 3);
    p.y = A.y * Math.pow(b, 3) + 3 * B.y * Math.pow(b, 2) * a + 3 * C.y * b * Math.pow(a, 2) + D.y * Math.pow(a, 3);
    return p;
};

/* Значение производной безьер по параметрам */
var getBezierSpeed = function (t, A, B, D, C) {
    var a = t;
    var b = 1 - t;
    var p = {};
    /* Производные по dt для X и Y */
    p.x = -3 * (A.x * Math.pow(b, 2) + 3 * B.x * (-3 * Math.pow(a, 2) + 4 * a - 1) + a * (3 * C.x * a - 2 * C.x - D.x * a));
    p.y = -3 * (A.y * Math.pow(b, 2) + 3 * B.y * (-3 * Math.pow(a, 2) + 4 * a - 1) + a * (3 * C.y * a - 2 * C.y - D.y * a));


    return p;
};

/* Значение скорости в точке */
var getBezierSpeedModule = function (t, A, B, D, C) {
    var p = getBezierSpeed(t, A, B, D, C);
    return Math.sqrt(Math.pow(p.x, 2) + Math.pow(p.y, 2));
};

/* Приблизительное расстояние, которое преодолела функция Безьер */
var getBezierAverageDistance = function (t1, t2, A, B, D, C) {
    var p1 = getBezier(t1, A, B, D, C);
    var p2 = getBezier(t2, A, B, D, C);
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

/* Приблизительное расстояние, которое преодолела функция Безьер через производные*/
var getBezierDistance = function (t1, t2, A, B, D, C) {
    var s1 = getBezierSpeedModule(t1, A, B, D, C);
    var s2 = getBezierSpeedModule(t2, A, B, D, C);
    return (s2 + s1) * (t2 - t1) / 2;
};

function p1(pa, pb, ps, smoothing) {
    var smoothing = typeof(smoothing) === 'undefined' ? 0.25 : parseFloat(smoothing);
    /* Нормализуем направления */
    var v1 = {x:pa.x - ps.x, y:pa.y - ps.y};
    var v2 = {x:pb.x - ps.x, y:pb.y - ps.y};
    var v1_length = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    var v2_length = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    var n1 = {x:v1.x / v1_length, y:v1.y / v1_length};
    var n2 = {x:v2.x / v2_length, y:v2.y / v2_length};
    var nm = {x:(n1.x + n2.x), y:(n1.y + n2.y)};
    if (nm.x == 0 && nm.y == 0) {
        nm = {x:n2.y, y:-n2.x};
    }

    var nm_length = Math.sqrt(nm.x * nm.x + nm.y * nm.y);

    nm.x /= nm_length;
    nm.y /= nm_length;

    var nor1 = {x:nm.y, y:-nm.x};
    var nor2 = {x:-nm.y, y:nm.x};

    var n1dist = Math.sqrt((nor1.x - n1.x) * (nor1.x - n1.x) + (nor1.y - n1.y) * (nor1.y - n1.y));
    var n2dist = Math.sqrt((nor2.x - n1.x) * (nor2.x - n1.x) + (nor2.y - n1.y) * (nor2.y - n1.y));

    var nor = nor2;
    if (n1dist < n2dist) {
        nor = nor1;
    }

    var pr = {x:v1_length * nor.x * smoothing, y:v1_length * nor.y * smoothing};

    pr.x = ps.x + pr.x;
    pr.y = ps.y + pr.y;

    return pr;
}

function p2(pa, pb, ps, smoothing) {
    var smoothing = typeof(smoothing) === 'undefined' ? 0.25 : parseFloat(smoothing);
    /* Нормализуем направления */
    var v1 = {x:pa.x - ps.x, y:pa.y - ps.y};
    var v2 = {x:pb.x - ps.x, y:pb.y - ps.y};
    var v1_length = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    var v2_length = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    var n1 = {x:v1.x / v1_length, y:v1.y / v1_length};
    var n2 = {x:v2.x / v2_length, y:v2.y / v2_length};

    var nm = {x:(n1.x + n2.x), y:(n1.y + n2.y)};
    if (nm.x == 0 && nm.y == 0) {
        nm = {x:n1.y, y:-n1.x};
    }

    var nm_length = Math.sqrt(nm.x * nm.x + nm.y * nm.y);

    nm.x /= nm_length;
    nm.y /= nm_length;

    var nor1 = {x:nm.y, y:-nm.x};
    var nor2 = {x:-nm.y, y:nm.x};

    var n1dist = Math.sqrt((nor1.x - n2.x) * (nor1.x - n2.x) + (nor1.y - n2.y) * (nor1.y - n2.y));
    var n2dist = Math.sqrt((nor2.x - n2.x) * (nor2.x - n2.x) + (nor2.y - n2.y) * (nor2.y - n2.y));

    var nor = nor2;
    if (n1dist < n2dist) {
        nor = nor1;
    }

    var pr = {x:v2_length * nor.x * smoothing, y:v2_length * nor.y * smoothing};

    pr.x = ps.x + pr.x;
    pr.y = ps.y + pr.y;

    return pr;
}

function makeCurve(points) {
    var i = 1;
    var prev1 = {x:points[i - 1].x - (points[i].x - points[i - 1].x), y:points[i - 1].y - (points[i].y - points[i - 1].y)};
    var prev2 = {x:points[i - 1].x - 2 * (points[i].x - points[i - 1].x), y:points[i - 1].y - 2 * (points[i].y - points[i - 1].y)};
    i = points.length - 1;
    var next = {x:points[i].x - (points[i - 1].x - points[i].x), y:points[i].y - (points[i - 1].y - points[i].y)};

    var result = [];
    result[result.length] = prev2;
    result[result.length] = prev1;
    for (var k in points) {
        result[result.length] = points[k];
    }
    result[result.length] = next;

    return result;
}

function makeBezierCurve(points, smoothing) {
    var smoothing = typeof(smoothing) === 'undefined' ? 0.25 : parseFloat(smoothing);
    var result = [];
    for (var i = 2; i < points.length - 1; i++) {
        var n1 = p2(points[i - 2], points[i], points[i - 1], smoothing);
        var n2 = p1(points[i - 1], points[i + 1], points[i], smoothing);
        var curveData = {
            a:points[i - 1],
            b:points[i],
            n1:n1,
            n2:n2
        };

        var preCalculated = preCalculatePoints(curveData);

        result[result.length] = {
            a:points[i - 1],
            b:points[i],
            n1:n1,
            n2:n2,
            data:preCalculated,
            length:preCalculated[preCalculated.length - 1].distance
        }
    }
    return result;
}
function makeBezierCurveLite(points, smoothing) {
    var smoothing = typeof(smoothing) === 'undefined' ? 0.25 : parseFloat(smoothing);
    var result = [];
    for (var i = 2; i < points.length - 1; i++) {
        var n1 = p2(points[i - 2], points[i], points[i - 1], smoothing);
        var n2 = p1(points[i - 1], points[i + 1], points[i], smoothing);
        var curveData = {
            a:points[i - 1],
            b:points[i],
            n1:n1,
            n2:n2
        };


        result[result.length] = {
            a:points[i - 1],
            b:points[i],
            n1:n1,
            n2:n2
        }
    }
    return result;
}
function preCalculatePoints(bezier) { /* Аппроксимировать кривую безье на куски с фиксированным шагом */
    var result = [];
    result[result.length] = {time:0.0, distance:0.0}
    //var step = 0.5;
    var step = 1;
    /* Длина дискретизации */
    //var timeStep = 0.01;
    var timeStep = 0.05;
    /* Шаг времени по умолчанию */
    var recDistance = 0.0;
    var curDistance = 0.0;
    var curDistanceDelta = 0.0;
    var time = 0.0;

    do {
        /* Прикинем нужный шаг */
        while (getBezierDistance(time, time + timeStep, bezier.a, bezier.n1, bezier.b, bezier.n2) > step) { /* Пока предсказанное расстояние больше шага уменьшаем шаг дискретизации */
            timeStep = timeStep / 2;
        }
        /* Проверим, не больно ли мелкий шаг */
        while (getBezierDistance(time, time + timeStep, bezier.a, bezier.n1, bezier.b, bezier.n2) < step / 10) { /* Пока предсказанное расстояние сильно меньше шага, увеличиваем шаг дискретизации */
            timeStep = timeStep * 2;
        }

        /* Делаем шаг */
        time += timeStep;
        if (time > 1.0) time = 1.0;
        /* Вот тут надо посмотреть, какая функция даст более точный результат */
        curDistanceDelta = getBezierAverageDistance(time - timeStep, time, bezier.a, bezier.n1, bezier.b, bezier.n2);
        curDistance += curDistanceDelta;
        /* Чуть чуть проползли */

        if (curDistance - recDistance > step) { /*Если накопили на шаг, пишем текущие показания */
            result[result.length] = {time:time, distance:curDistance}
            recDistance = curDistance;
        }
    } while (time < 1.0);
    return result;
}

function getTimeForPercent(calculatedPoints, percent, startFromIndex) {
    var totalDistance = calculatedPoints[calculatedPoints.length - 1].distance;
    var targetDistance = Math.min(1.0 * totalDistance * percent, totalDistance);
    for (var i = startFromIndex; i < calculatedPoints.length; i++) {
        if (calculatedPoints[i].distance >= targetDistance) {
            return {index:i, time:calculatedPoints[i].time};
        }
    }
    return null;
}

var dozerMapper = function (source, propertyList) {
    if (empty(source)) {
        return null;
    }
    var res = {};
    for (var k in propertyList) {
        var prop = propertyList[k];
        if (!empty(source[prop])) {
            res[prop] = source[prop];
        }
    }
    return res;
};

/**
 * DEPRECATED.
 * @param element
 * @param object
 */
var conditionalShow = function (element, object) {
    if (!empty(object)) {
        element.html("" + value(object)).show();
    } else {
        element.hide();
    }
};

function applyDefaultQuestionBoxImage(cssLoader, object, wrapper_selector) {
    var trX = 0; var trY = 0;
    var trMaxWidth = object.width;
    var maxWidth = object.width;
    var trMaxHeight = object.height;
    var maxHeight = object.height;
    if (!empty(object.padding)) {
        maxWidth = trMaxWidth - 2 * object.padding;
        maxHeight = trMaxHeight - 2 * object.padding;
        trX = object.padding;
        trY = object.padding;
    }
    if (!empty(object.paddingX)) {
        maxWidth = trMaxWidth - 2 * object.paddingX;
        trX = object.paddingX;
    }
    if (!empty(object.paddingY)) {
        maxHeight = trMaxHeight - 2 * object.paddingY;
        trY = object.paddingY;
    }
    wrapper_selector = wrapper_selector || "div.game .question-block-wrapper";
    cssLoader.addRule(wrapper_selector +" img.fit",maxHeight, "max-height: $vpx");
    cssLoader.addRule(wrapper_selector +" img.fit",maxWidth, "max-width: $vpx");
    cssLoader.addRule(wrapper_selector +" img.fit",maxHeight, "height: $vpx");//fit all height
    cssLoader.addRule(wrapper_selector +".transparent img.fit",trMaxHeight, "max-height: $vpx");
    cssLoader.addRule(wrapper_selector +".transparent img.fit",trMaxWidth, "max-width: $vpx");

    var qBlockStyle = window.getComputedStyle($(wrapper_selector +" div.scrollable").get(0));
    if ( qBlockStyle!= null){
        var pTop = parseInt(qBlockStyle['paddingTop'],10) || 0 + parseInt(qBlockStyle['marginTop'],10) || 0;
        var pRight = parseInt(qBlockStyle['paddingRight'],10) || 0 + parseInt(qBlockStyle['marginRight'],10) || 0;
        var pBottom = parseInt(qBlockStyle['paddingBottom'],10) || 0 + parseInt(qBlockStyle['marginBottom'],10) || 0;
        var pLeft = parseInt(qBlockStyle['paddingLeft'],10) || 0 + parseInt(qBlockStyle['marginLeft'],10) || 0;
        maxHeight -= (pTop + pBottom);
        maxWidth -= (pRight + pLeft);
    }
    cssLoader.addRule(wrapper_selector +" img:not(.keep_size):not(.fit)",maxHeight, "max-height: $vpx");
    cssLoader.addRule(wrapper_selector +" img:not(.keep_size):not(.fit)",maxWidth, "max-width: $vpx");
    cssLoader.addRule(wrapper_selector +".transparent img:not(.keep_size):not(.fit)",trMaxHeight, "max-height: $vpx");
    cssLoader.addRule(wrapper_selector +".transparent img:not(.keep_size):not(.fit)",trMaxWidth, "max-width: $vpx");
    //cssLoader.addRule("div.game .question-block-wrapper.transparent img",trX, "margin-left: -$vpx");
    cssLoader.addRule(wrapper_selector +".transparent>div.question-block-wrapper-inner",trX, "padding: 0");
    cssLoader.addRule(wrapper_selector +".imageonly>div.question-block-wrapper-inner",trX, "text-align: center");
    cssLoader.addRule(wrapper_selector +".transparent>div.question-block-wrapper-inner",trMaxHeight, "height: $vpx");
    cssLoader.addRule(wrapper_selector +".transparent>div.question-block-wrapper-inner",trMaxWidth, "width: $vpx");
    cssLoader.addRule(wrapper_selector +".transparent img",trX, "margin: 0 auto");

}

function prepareBackgroundStack(design) {
    var image = design.game.background_image;
    $('div.game>.bg-stack').remove();
    if(!empty(image)) {
        if(!empty(image.overlay)) {
            image['#']+=","+image.overlay;
        }
        var images = value(image).split(',');
        for(var ind in images) {
            var curImage = parseImgPath(images[ind].trim());
            var div = $("<div class='bg-stack bg-stack-"+ind+"'></div>");
            div.css({
                position: 'absolute',
                'z-index':0,
                width:720,
                height: 540,
                'background-size': nvl(design.game.backgroundSize, "cover"),
                'display':'block',
                'background':'url("'+curImage+'") 50% 50%',
                'backgroundRepeat': nvl(design.game.backgroundRepeat, 'no-repeat')
            });
            if(ind==0) {
                $('div.game').prepend(div);
            } else {
                $('div.game .bg-stack:last').after(div);
            }
        }
    } else {
        $('div.game').prepend("<div class='bg-stack'></div>");
    }
    $("<div class='bg-flash'></div>").insertAfter('div.game .bg-stack:last').css({
        'position':'absolute',
        'z-index':0,
        width:720,
        height: 540,
        'background-size': 'cover',
        'display':'block',
        'background-color': 'white',
        'opacity':0
    });
    $('div.game>div').each(function() {
       if($(this).css('position')!='absolute') {
           $(this).css('position','relative');
       }
    });
}
function prepareBackground(design) {
    var target = {};
    target.background_color = nvl(design.game.background_color, null);
    target.gradient_top = nvl(design.game.background_gradient_top, null);
    target.gradient_bottom = nvl(design.game.background_gradient_bottom, null);
    target.gradient_left = nvl(design.game.background_gradient_left, null);
    target.gradient_right = nvl(design.game.background_gradient_right, null);
    target.gradient_center = nvl(design.game.background_gradient_center, null);
    target.gradient_edge = nvl(design.game.background_gradient_edge, null);
    target.gradient_radius = nvl(design.game.background_gradient_radius, 720);

    prepareBackgroundStack(design);

    return target;
}

function flashBackground (stateOfFlash,maxOpacity){
    maxOpacity = (maxOpacity !== undefined)? maxOpacity:1;
    switch(stateOfFlash) {
        case "start":
            $('.bg-flash').animate({opacity:maxOpacity}, 50).animate({opacity:0}, 50).animate({opacity:maxOpacity}, 50).animate({opacity:0}, 50).animate({opacity:maxOpacity}, 50).animate({opacity:0}, 1400);
        break;
        case "stop":
            $('.bg-flash').stop(true).css({'opacity':0});
        break;

        default:
            console.log("flashBackground(stateOfFlash) - Only stop and start is allow");


    }
}

String.prototype.hashCode = function(){
    var hash = 0;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
        var hash_char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+hash_char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

// Determine whether touch handling is supported
var touchSupport = 'ontouchstart' in window;

/**
 * Instantiate fast-clicking listeners on the specificed layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 */
function FastClick(layer) {
    "use strict";
    var oldOnClick, self = this;
    this.trackingClick = false;
    this.trackingClickStart = 0;
    this.targetElement = null;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.lastTouchIdentifier = 0;
    this.touchBoundary = 10;
    this.layer = layer;
    if (!layer || !layer.nodeType) {
        throw new TypeError("Layer must be a document node")
    }
    this.onClick = function () {
        return FastClick.prototype.onClick.apply(self, arguments)
    };
    this.onMouse = function () {
        return FastClick.prototype.onMouse.apply(self, arguments)
    };
    this.onTouchStart = function () {
        return FastClick.prototype.onTouchStart.apply(self, arguments)
    };
    this.onTouchMove = function () {
        return FastClick.prototype.onTouchMove.apply(self, arguments)
    };
    this.onTouchEnd = function () {
        return FastClick.prototype.onTouchEnd.apply(self, arguments)
    };
    this.onTouchCancel = function () {
        return FastClick.prototype.onTouchCancel.apply(self, arguments)
    };
    if (FastClick.notNeeded(layer)) {
        return
    }
    if (this.deviceIsAndroid) {
        layer.addEventListener("mouseover", this.onMouse, true);
        layer.addEventListener("mousedown", this.onMouse, true);
        layer.addEventListener("mouseup", this.onMouse, true)
    }
    layer.addEventListener("click", this.onClick, true);
    layer.addEventListener("touchstart", this.onTouchStart, false);
    layer.addEventListener("touchmove", this.onTouchMove, false);
    layer.addEventListener("touchend", this.onTouchEnd, false);
    layer.addEventListener("touchcancel", this.onTouchCancel, false);
    if (!Event.prototype.stopImmediatePropagation) {
        layer.removeEventListener = function (type, callback, capture) {
            var rmv = Node.prototype.removeEventListener;
            if (type === "click") {
                rmv.call(layer, type, callback.hijacked || callback, capture)
            } else {
                rmv.call(layer, type, callback, capture)
            }
        };
        layer.addEventListener = function (type, callback, capture) {
            var adv = Node.prototype.addEventListener;
            if (type === "click") {
                adv.call(layer, type, callback.hijacked || (callback.hijacked = function (event) {
                    if (!event.propagationStopped) {
                        callback(event)
                    }
                }), capture)
            } else {
                adv.call(layer, type, callback, capture)
            }
        }
    }
    if (typeof layer.onclick === "function") {
        oldOnClick = layer.onclick;
        layer.addEventListener("click", function (event) {
            oldOnClick(event)
        }, false);
        layer.onclick = null
    }
}
FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf("Android") > 0;
FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && /OS 4_\d(_\d)?/.test(navigator.userAgent);
FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && /OS ([6-9]|\d{2})_\d/.test(navigator.userAgent);
FastClick.prototype.needsClick = function (target) {
    "use strict";
    switch (target.nodeName.toLowerCase()) {
        case"button":
        case"select":
        case"textarea":
            if (target.disabled) {
                return true
            }
            break;
        case"input":
            if (this.deviceIsIOS && target.type === "file" || target.disabled) {
                return true
            }
            break;
        case"label":
        case"video":
            return true
    }
    return/\bneedsclick\b/.test(target.className)
};
FastClick.prototype.needsFocus = function (target) {
    "use strict";
    switch (target.nodeName.toLowerCase()) {
        case"textarea":
            return true;
        case"select":
            return!this.deviceIsAndroid;
        case"input":
            switch (target.type) {
                case"button":
                case"checkbox":
                case"file":
                case"image":
                case"radio":
                case"submit":
                    return false
            }
            return!target.disabled && !target.readOnly;
        default:
            return/\bneedsfocus\b/.test(target.className)
    }
};
FastClick.prototype.sendClick = function (targetElement, event) {
    "use strict";
    var clickEvent, touch;
    if (document.activeElement && document.activeElement !== targetElement) {
        document.activeElement.blur()
    }
    touch = event.changedTouches[0];
    clickEvent = document.createEvent("MouseEvents");
    clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
    clickEvent.forwardedTouchEvent = true;
    targetElement.dispatchEvent(clickEvent)
};
FastClick.prototype.determineEventType = function (targetElement) {
    "use strict";
    if (this.deviceIsAndroid && targetElement.tagName.toLowerCase() === "select") {
        return"mousedown"
    }
    return"click"
};
FastClick.prototype.focus = function (targetElement) {
    "use strict";
    var length;
    if (this.deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf("date") !== 0 && targetElement.type !== "time"
        ) {
        length = targetElement.value.length;
        targetElement.setSelectionRange(length, length)
    } else {
        targetElement.focus()
    }
};
FastClick.prototype.updateScrollParent = function (targetElement) {
    "use strict";
    var scrollParent, parentElement;
    scrollParent = targetElement.fastClickScrollParent;
    if (!scrollParent || !scrollParent.contains(targetElement)) {
        parentElement = targetElement;
        do {
            if (parentElement.scrollHeight > parentElement.offsetHeight) {
                scrollParent = parentElement;
                targetElement.fastClickScrollParent = parentElement;
                break
            }
            parentElement = parentElement.parentElement
        } while (parentElement)
    }
    if (scrollParent) {
        scrollParent.fastClickLastScrollTop = scrollParent.scrollTop
    }
};
FastClick.prototype.getTargetElementFromEventTarget = function (eventTarget) {
    "use strict";
    if (eventTarget.nodeType === Node.TEXT_NODE) {
        return eventTarget.parentNode
    }
    return eventTarget
};
FastClick.prototype.onTouchStart = function (event) {
    "use strict";
    var targetElement, touch, selection;
    if (event.targetTouches.length > 1) {
        return true
    }
    targetElement = this.getTargetElementFromEventTarget(event.target);
    touch = event.targetTouches[0];
    if (this.deviceIsIOS) {
        selection = window.getSelection();
        if (selection.rangeCount && !selection.isCollapsed) {
            return true
        }
        if (!this.deviceIsIOS4) {
            if (touch.identifier === this.lastTouchIdentifier) {
                event.preventDefault();
                return false
            }
            this.lastTouchIdentifier = touch.identifier;
            this.updateScrollParent(targetElement)
        }
    }
    this.trackingClick = true;
    this.trackingClickStart = event.timeStamp;
    this.targetElement = targetElement;
    this.touchStartX = touch.pageX;
    this.touchStartY = touch.pageY;
    if (event.timeStamp - this.lastClickTime < 200) {
        event.preventDefault()
    }
    return true
};
FastClick.prototype.touchHasMoved = function (event) {
    "use strict";
    var touch = event.changedTouches[0], boundary = this.touchBoundary;
    if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
        return true
    }
    return false
};
FastClick.prototype.onTouchMove = function (event) {
    "use strict";
    if (!this.trackingClick) {
        return true
    }
    if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
        this.trackingClick = false;
        this.targetElement = null
    }
    return true
};
FastClick.prototype.findControl = function (labelElement) {
    "use strict";
    if (labelElement.control !== undefined) {
        return labelElement.control
    }
    if (labelElement.htmlFor) {
        return document.getElementById(labelElement.htmlFor)
    }
    return labelElement.querySelector("button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea")
};
FastClick.prototype.onTouchEnd = function (event) {
    "use strict";
    var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;
    if (!this.trackingClick) {
        return true
    }
    if (event.timeStamp - this.lastClickTime < 200) {
        this.cancelNextClick = true;
        return true
    }
    this.cancelNextClick = false;
    this.lastClickTime = event.timeStamp;
    trackingClickStart = this.trackingClickStart;
    this.trackingClick = false;
    this.trackingClickStart = 0;
    if (this.deviceIsIOSWithBadTarget) {
        touch = event.changedTouches[0];
        targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
        targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent
    }
    targetTagName = targetElement.tagName.toLowerCase();
    if (targetTagName === "label") {
        forElement = this.findControl(targetElement);
        if (forElement) {
            this.focus(targetElement);
            if (this.deviceIsAndroid) {
                return false
            }
            targetElement = forElement
        }
    } else if (this.needsFocus(targetElement)) {
        if (event.timeStamp - trackingClickStart > 100 || this.deviceIsIOS && window.top !== window && targetTagName === "input") {
            this.targetElement = null;
            return false
        }
        this.focus(targetElement);
        if (!this.deviceIsIOS4 || targetTagName !== "select") {
            this.targetElement = null;
            event.preventDefault()
        }
        return false
    }
    if (this.deviceIsIOS && !this.deviceIsIOS4) {
        scrollParent = targetElement.fastClickScrollParent;
        if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
            return true
        }
    }
    if (!this.needsClick(targetElement)) {
        event.preventDefault();
        this.sendClick(targetElement, event)
    }
    return false
};
FastClick.prototype.onTouchCancel = function () {
    "use strict";
    this.trackingClick = false;
    this.targetElement = null
};
FastClick.prototype.
    onMouse = function (event) {
    "use strict";
    if (!this.targetElement) {
        return true
    }
    if (event.forwardedTouchEvent) {
        return true
    }
    if (!event.cancelable) {
        return true
    }
    if (!this.needsClick(this.targetElement) || this.cancelNextClick) {
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation()
        } else {
            event.propagationStopped = true
        }
        event.stopPropagation();
        event.preventDefault();
        return false
    }
    return true
};
FastClick.prototype.onClick = function (event) {
    "use strict";
    var permitted;
    if (this.trackingClick) {
        this.targetElement = null;
        this.trackingClick = false;
        return true
    }
    if (event.target.type === "submit" && event.detail === 0) {
        return true
    }
    permitted = this.onMouse(event);
    if (!permitted) {
        this.targetElement = null
    }
    return permitted
};
FastClick.prototype.destroy = function () {
    "use strict";
    var layer = this.layer;
    if (this.deviceIsAndroid) {
        layer.removeEventListener("mouseover", this.onMouse, true);
        layer.removeEventListener("mousedown", this.onMouse, true);
        layer.removeEventListener("mouseup", this.onMouse, true)
    }
    layer.removeEventListener("click", this.onClick, true);
    layer.removeEventListener("touchstart", this.onTouchStart, false);
    layer.removeEventListener("touchmove", this.onTouchMove, false);
    layer.removeEventListener("touchend", this.onTouchEnd, false);
    layer.removeEventListener("touchcancel", this.onTouchCancel, false)
};
FastClick.notNeeded = function (layer) {
    "use strict";
    var metaViewport;
    var chromeVersion;
    if (typeof window.ontouchstart === "undefined") {
        return true
    }
    chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1];
    if (chromeVersion) {
        if (FastClick.prototype.deviceIsAndroid) {
            metaViewport = document.querySelector("meta[name=viewport]");
            if (metaViewport) {
                if (metaViewport.content.indexOf("user-scalable=no") !== -1) {
                    return true
                }
                if (chromeVersion > 31 && window.innerWidth <= window.screen.width) {
                    return true
                }
            }
        } else {
            return true
        }
    }
    if (layer.style.msTouchAction === "none") {
        return true
    }
    return false
};
FastClick.attach = function (layer) {
    "use strict";
    return new FastClick(layer)
};
if (typeof define !== "undefined" && define.amd) {
    define(function () {
        "use strict";
        return FastClick
    })
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = FastClick.attach;
    module.exports.FastClick = FastClick
} else {
    window.FastClick = FastClick
}

$(document).ready(function () {
    var games = document.getElementsByClassName("game");
    for (var g = 0, l = games.length; g < l; g++) {
        new FastClick(games[g]);
    }
});

function liveFastClick(sel, fn) {//TODO refactor
    var indexOfGameClass = sel.indexOf(".game ");
    if (indexOfGameClass >= 0) {
        if (sel.indexOf(",")) {
            sel.split(",").forEach(function (sel) {
                indexOfGameClass = sel.indexOf(".game ");
                if (indexOfGameClass >= 0) {
                    $(document).ready(function () {
                        $(sel.slice(0, indexOfGameClass + 5)).on("click", sel.slice(indexOfGameClass + 5), fn);
                    });
                } else {
                    $(document).ready(function () {
                        $(".game").on("click", sel, fn);
                    });
                }
            })
        } else {
            $(document).ready(function () {
                $(sel.slice(0, indexOfGameClass + 5)).on("click", sel.slice(indexOfGameClass + 5), fn);
            });
        }
    } else {
        $(document).ready(function () {
            $(".game").on("click", sel, fn);
        });
    }
}

function orientationChange(){
    var viewport = document.querySelector("meta[name=viewport]");
    if (Math.abs(window.orientation) === 90) {
        viewport.setAttribute('content', 'width=1024;');
    } else {
        viewport.setAttribute('content', 'width=830;');
    }
}

function orientationChange_ipad(){
    var viewport = document.querySelector("meta[name=viewport]");
    if ($("#game").hasClass('width960')) {
        if (Math.abs(window.orientation) === 90) {
            setViewPort(960, 1.06, 0);//working scale 1.06
        } else {
            setViewPort(960, 0.792, 0);//working scale 0.792
        }
    } else {
        if (Math.abs(window.orientation) === 90) {
            setViewPort(720, 1.191, 0);//working scale 1.191
        } else {
            setViewPort(720, 1.061, 0);//working scale 1.001
        }
    }
    document.body.scrollLeft = 0;
    function setViewPort(width, scale, scalable){
        viewport.setAttribute('content', 'width=' + width + '; minimum-scale=' + scale + '; maximum-scale=' + scale + '; user-scalable=' + scalable + ';');
    }
}

function orientationChange_iphone_iframe(){
    var scale= {
        'width': outerWidth/720,
        'height': outerHeight/540
    };
    scale.scale = Math.min(scale.width,scale.height);
    scale.x = Math.ceil(720*(1-scale.scale)/2/scale.scale);
    scale.y = Math.ceil(540*(1-scale.scale)/2/scale.scale);
    scale.margin_x=Math.ceil((outerWidth-720*scale.scale)/2);
    scale.margin_y=Math.ceil((outerHeight-540*scale.scale)/2);
    $("body.gamebody").css({
        '-webkit-transform': 'scale('+scale.scale+') translate3d(-'+scale.x+'px,-'+scale.y+'px,0)',
        'margin-top': scale.margin_y,
        'margin-left': scale.margin_x
    });
}

$(document).ready(function() {
    $(document).trigger('htmlupdated');
    /*Set viewport to Ipad*/
    if (onlyOneSound) {
        var viewport = document.querySelector("meta[name=viewport]");
        if (viewport != null) {
            if (!navigator.userAgent.match(/iPad/i)) {
                window.onorientationchange = orientationChange;
                if (window!=window.top){// in iframe
                    orientationChange_iphone_iframe();
                    window.onorientationchange = orientationChange_iphone_iframe;
                } else {
                    $("body.gamebody").css({
                        'width': '100%',
                        'height': '100%'});
                }
                orientationChange();
            } else {
//                viewport.setAttribute('content', 'width=830; user-scalable=0;');//old viewpoprt for ipad, delete
                orientationChange_ipad();
                window.onorientationchange = orientationChange_ipad;
                addEventListener('touchmove', function (e) {
                    var canScroll = ($(e.target).closest('.scrollable').length > 0);
                    if (!canScroll) {//prevent scrolling in most divs, but still allow it in certain divs
                        e.preventDefault();
                    }else{e.target.style.opacity = 0.99;}//quick fix for redraw in ios}
                }, true);
            }
        } else {
            console.warn('viewport=null, no iPad optimization. Update version of game');
        }
    }

    $('.question-image').hide();

});

var oHtml = jQuery.fn.html;
jQuery.fn.html = function() {
    var result = oHtml.apply(this, arguments);
    $(document).trigger('htmlupdated');
    return result;
};
var oAppend = jQuery.fn.append;
jQuery.fn.append = function() {
    var result = oAppend.apply(this, arguments);
    $(document).trigger('htmlupdated');
    return result;
};
var oPrepend = jQuery.fn.prepend;
jQuery.fn.prepend = function() {
    var result = oPrepend.apply(this, arguments);
    $(document).trigger('htmlupdated');
    return result;
};

/* AUDIO */
var myAudio = new Audio();
var canPlayMp3 = !!myAudio.canPlayType && "" != myAudio.canPlayType('audio/mpeg');
var canPlayOgg = !!myAudio.canPlayType && "" != myAudio.canPlayType('audio/ogg; codecs="vorbis"');
var audio_cache = {}; //cache for audio
var CUR_SOUND = null;
var CUR_SOUND_PRIORITY = 0;

var PRIORITY_LOW = 0;
var PRIORITY_LOWPLUS = 0.5;
var PRIORITY_NORMAL = 1;
var PRIORITY_HI = 2;

var onlyOneSound = false;

/* If iPhone/iPad/iPod or default/chrome android browser switch to one sound mode */
if ((navigator.userAgent.match(/iPhone/i)) ||
    (navigator.userAgent.match(/iPad/i)) ||
    (navigator.userAgent.match(/iPod/i)) ||
    (navigator.userAgent.match(/Android/))) {
    onlyOneSound = true;
} else {

}

/*Web Audio Api player */
var web_audio_api_player = new function () {
    "use strict" //ESMAScript 5 Strict mode

    var context,
        is_init = false,
        source= [],
        soundsBuffer = [],
        web_audio_api_player = this;


    this.init = function () {//Initialise the Audio Context. There can be only one!
        if (is_init) {
            return true
        }
        if (typeof AudioContext != "undefined") {
            context = new AudioContext();
            return true;
        } else if (typeof webkitAudioContext != "undefined") {
            context = new webkitAudioContext();
            return true;
        } else {
            //console.error('Web Audio Api - AudioContext not supported. :(');
            return false;
        }
    };

    this.loadAudio = function (audio_file,index) {
        soundsBuffer[index]={
            "buffer": null,
            "status":0,
            /*
             * Statuses:
             * 0 - call from loadAudio
             * 1 - send request to load
             * 2 - decoding
             * 3 - decoded and ready
             * */
            "need_play":0
        };
        var request = new XMLHttpRequest();// This loads asynchronously
        request.open("GET", audio_file, true);
        request.responseType = "arraybuffer";
        request.onload = function () {// Our asynchronous callback
            soundsBuffer[index].status =2;
            context.decodeAudioData(// Asynchronously decode the audio file data in request.response
                request.response,
                function (buffer) {//Call this function on success
                    if (!buffer) {
                        console.error('error decoding file data: ' + url);
                        return;
                    }
                    soundsBuffer[index].buffer = buffer;
                    soundsBuffer[index].status =3;
                    if (soundsBuffer[index].need_play){
                        web_audio_api_player.playAudio(index,soundsBuffer[index].delay, soundsBuffer[index].callback_funct);
                        soundsBuffer[index].need_play = false;
                    }
                },
                function (error) {//Call this function on decode error
                    console.error('decodeAudioData error', error);
                }
            );
        };

        request.onerror = function (e) {//call this function on request error
            alert('BufferLoader: XHR error');
            console.log('BufferLoader: XHR error', request, e);
        };

        request.send(null);
        soundsBuffer[index].status =1;
    };

    this.playAudio = function (audio_name,delay,callback_funct) {
        if (soundsBuffer[audio_name] != undefined) {
            if (soundsBuffer[audio_name].status === 3) {//If audio ready
                source[audio_name] = context.createBufferSource(); // creates a sound source
                if (!source[audio_name].gain) {
                    var gain = context.createGain();
                    source[audio_name].connect(gain);
                    source[audio_name].gain = gain;
                }
                source[audio_name].buffer = soundsBuffer[audio_name].buffer; // tell the source which sound to play
                source[audio_name].connect(context.destination);      // connect the source to the context's destination (the speakers)
                delay = (delay != undefined)? delay:0; // check delay
                var playMethod = (source[audio_name].start) ? "start" : "noteOn";//detect witch method is available
                source[audio_name][playMethod](context.currentTime + delay);// play the source after delay
                soundsBuffer[audio_name].timer = setTimeout(function(){call_callback(audio_name)}, source[audio_name].buffer.duration * 1000);//callback on ended
            } else {
                soundsBuffer[audio_name].need_play = true; // Play when ready
                soundsBuffer[audio_name].delay = delay; //Remember delay
            }
            soundsBuffer[audio_name].callback_funct = callback_funct; //Remember callback
        }
    };

    this.stopAudio = function (audio_name, fade_time, delay) {// stop the source now
        if (soundsBuffer[audio_name] != undefined) {
            if (soundsBuffer[audio_name].status === 3) {//If audio ready
                if (source[audio_name] != undefined) {
                    delay = (delay != undefined) ? delay : 0; // check delay
                    fade_time = (fade_time != undefined) ? fade_time : 0;// check fade_time
                    if (fade_time > 0) {
                        if (source[audio_name].gain.gain != undefined) {//switch between standarted methods and webkit
                            source[audio_name].gain.gain.linearRampToValueAtTime(1, context.currentTime + delay);
                            source[audio_name].gain.gain.linearRampToValueAtTime(0, context.currentTime + delay + fade_time);
                        } else {
                            source[audio_name].gain.linearRampToValueAtTime(1, context.currentTime + delay);
                            source[audio_name].gain.linearRampToValueAtTime(0, context.currentTime + delay + fade_time);
                        }
                    }
                    var stopMethod = (source[audio_name].stop) ? "stop" : "noteOff";//detect witch method is available

                    try {
                        source[audio_name][stopMethod](context.currentTime + delay + fade_time);
                    } catch (error) {
                        console.error(error);
                    }

                    clearTimeout(soundsBuffer[audio_name].timer);
                    soundsBuffer[audio_name].timer = setTimeout(function(){call_callback(audio_name)},  (delay + fade_time)*1000);//callback on ended
                }
            } else {
                soundsBuffer[audio_name].need_play = false; // Do not play when ready
                clearTimeout(soundsBuffer[audio_name].timer);
                call_callback(audio_name); //call calback
            }
        } else {
            //console.log ("there no are sound with id" + audio_name)
        }
    };

    var call_callback = function(audio_name){
        if (soundsBuffer[audio_name].callback_funct != undefined){
            soundsBuffer[audio_name].callback_funct();
        }
    }
};



var createSound = function (val, isQuestion) {
    var isQuestion = typeof(isQuestion) === 'undefined' ? false : isQuestion;
    var soundsSrc = val.split(',');
    var soundsTypes = {};
    if (audio_cache[val] != undefined){ //Audios cache
        return audio_cache[val];//If audio in cache return audio
    }
    var audioElement = document.createElement('audio');
    audioElement.setAttribute("preload", "auto");
    audioElement.autobuffer = true;

    /*Push all non-wav */
    for (var i in soundsSrc) {
        var s = soundsSrc[i];
        var ext = s.substr(s.lastIndexOf('.') + 1).trim().toLowerCase();
        soundsTypes[ext] = s.trim();
        if (ext != 'wav') {
            var source1 = document.createElement('source');
            if(ext=="mp3") {
                if(canPlayMp3) {
                    source1.type= 'audio/mpeg';
                    source1.src = parseSndPath(s.trim(), isQuestion);
                    audioElement.appendChild(source1);
                }
            } else
            if(ext=="ogg") {
                if(canPlayOgg) {
                    source1.type= 'audio/ogg';
                    source1.src = parseSndPath(s.trim(), isQuestion);
                    audioElement.appendChild(source1);
                }
            } else {
                source1.src = parseSndPath(s.trim(), isQuestion);
                audioElement.appendChild(source1);
            }
        }
    }
    /*Push all wav */
    for (var i in soundsSrc) {
        var s = soundsSrc[i];
        var ext = s.substr(s.lastIndexOf('.') + 1).trim().toLowerCase();
        soundsTypes[ext] = s.trim();
        if (ext == 'wav') {
            var source1 = document.createElement('source');
            source1.src = parseSndPath(s.trim(), isQuestion);
            audioElement.appendChild(source1);
        }
    }
    /* Let browser choose for himself */
    audioElement.load();
    audio_cache[val]=audioElement; //else cache audio
    return audioElement;
};

var tPlay = function (sound, priority, delay, callback_funct) {
    var priority = typeof(priority) === 'undefined' ? PRIORITY_LOW : priority;
    if (onlyOneSound) {
        if (CUR_SOUND != null && !(CUR_SOUND.ended || CUR_SOUND.paused)) {
            if (priority >= CUR_SOUND_PRIORITY) {
                tRewind(CUR_SOUND);
                CUR_SOUND = sound;
                CUR_SOUND_PRIORITY = priority;
            } else {return;}
        } else {
            CUR_SOUND = sound;
            CUR_SOUND_PRIORITY = priority;
        }
    }

    var play = function(){
        try{
            if (sound.canPlayType) {
                core.log("start play", sound);
                if (typeof callback_funct == "function") {
                    $(sound).unbind("ended");
                    $(sound).bind("ended", callback_funct);
                }
                else {
                    if(typeof callback_funct != "undefined"){core.warn("Callback is not a function.")}
                }
                sound.play();
            }
        } catch (e) {
            core.warn("Failed to play", e);
        }
    };

    if (!delay){play();}
    else{
        setTimeout(function(){
            play();
        }, delay*1000);//delay should be set in seconds
    }
};

var tRewind = function (sound, fade_time, delay) {

    if (!sound){return}

    if (sound.canPlayType) {
        var fade = function(){
            if(!fade_time){stop();}
            else{
                var vol = sound.volume/100; //set 1% of current volume
                var interval = fade_time*1000/100; //set 1% of fade_time in milliseconds
                var fadeout = setInterval(
                    function() {
                        if (sound.volume-vol > 0) {sound.volume -= vol;}
                        else {
                            clearInterval(fadeout);
                            stop();
                        }
                    }, interval);
            }
        };

        var stop = function(){
            if (sound.paused){return}
            core.log("stop play", sound);
            sound.pause();
            if (onlyOneSound) {sound.currentTime = 0.01;}
            else {sound.currentTime = 0.0;}
            $(sound).trigger("ended");
        };

        if (!delay){fade();}
        else{
            setTimeout(function(){
                fade();
            }, delay*1000);//delay should be set in seconds
        }
    }
};


if (web_audio_api_player.init()) { //Reload function
    var audio_index = 1;
    createSound = function (val, isQuestion) {
        if (audio_cache[val] != undefined) { //Audios cache
            return audio_cache[val];//If audio in cache return audio index
        }
        audio_cache[val] = audio_index; //else cache audio
        var isQuestion = typeof(isQuestion) === 'undefined' ? false : isQuestion;
        var soundsSrc = val.split(',');
        var soundsTypes = {};
        for (var i in soundsSrc) {
            var s = soundsSrc[i];
            var ext = s.substr(s.lastIndexOf('.') + 1).trim().toLowerCase();
            soundsTypes[ext] = s.trim();
        }
        if (soundsTypes.hasOwnProperty("ogg") && canPlayOgg) {
            web_audio_api_player.loadAudio(parseSndPath(soundsTypes["ogg"], isQuestion), audio_index);
        } else if (soundsTypes.hasOwnProperty("mp3") && canPlayMp3) {
            web_audio_api_player.loadAudio(parseSndPath(soundsTypes["mp3"], isQuestion), audio_index);
        } else if (soundsTypes.hasOwnProperty("wav")) {
            web_audio_api_player.loadAudio(parseSndPath(soundsTypes["wav"], isQuestion), audio_index);
        } else {
            console.error("Unsupported audio type: " + soundsTypes)
        }
        return audio_index++;
    };

    tPlay = function (sound,priority,delay,callback_funct) {
        web_audio_api_player.playAudio(sound,delay,callback_funct);
    };

    tRewind = function (sound,fade_time,delay) {
        web_audio_api_player.stopAudio(sound,fade_time,delay);
    };
}



