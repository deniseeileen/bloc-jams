var animatePoints = function() {

    var revealPoint = function() {
         $(this).css({
             opacity: 1,
             transform: 'scaleX(1) translateY(0)'
         });
     };
    
    $.each($('.point'), revealPoint);
    
}; 

$(window).load(function() {

    if ($(window).height() > 950) {
        animatePoints();
    }

    var scrollDistance = $('.selling-points').offset().top - $(window).height() + 200;
    //since you don't pass aruguments into height function, you GET the height automatically

    $(window).scroll(function(event) {
        if ($(window).scrollTop() >= scrollDistance) {
            animatePoints();
        }
    });
    
});
