$(document).ready(function () {
    game.readConfig();
    $('.game').css('opacity', 0.1);
});

$(window).load(function () {

});

$(document).bind('gameLoaded', function () {
    $('.game').css('opacity', 1);
    game.start();
});