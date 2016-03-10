$(function() {

    $('#side-menu').metisMenu();

});

//Loads the correct sidebar on window load,
//collapses the sidebar on window resize.
// Sets the min-height of #page-wrapper to window size
$(function() {
    $(window).bind("load resize", function() {

        topOffset = 146;
        width = (this.window.innerWidth > 0) ? this.window.innerWidth : this.screen.width;
        if (width < 768) {
            //$('div.navbar-collapse').addClass('collapse')
            topOffset = 70; // 2-row-menu
        } else {
            //$('div.navbar-collapse').removeClass('collapse')
        }

        height = (this.window.innerHeight > 0) ? this.window.innerHeight : this.screen.height;
        height = height - topOffset;
        if (height < 1) height = 1;
        if (height > topOffset) {
            $("#page-wrapper").css("min-height", (height) + "px");
            $("#side-menu").css("min-height", (height) + "px");
        }

        if(width < 768){
        	$("#iguana_page_panel").css("min-height", (height) + "px");
        }
    });
})

