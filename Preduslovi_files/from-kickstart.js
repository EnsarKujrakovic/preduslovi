/*
   From:
	99Lime.com HTML KickStart by Joshua Gatcke
	kickstart.js
*/


jQuery.noConflict(); // Reverts '$' variable back to other JS libraries

jQuery(document).ready(function($){

	/*---------------------------------
		MENU Dropdowns
	-----------------------------------*/
	$('ul.menu').each(function(){
		// add the menu toggle
		$(this).prepend('<li class="menu-toggle"><a href="#"><span class="icon" data-icon="Y"></span> Menu</a></li>');

		// find menu items with children.
		$(this).find('li').has('ul').addClass('has-menu')
		.find('a:first').append('<span class="arrow">&nbsp;</span>');
	});

	$('ul.menu li').hover(function(){
		$(this).find('ul:first').stop(true, true).fadeIn('fast');
		$(this).addClass('hover');
	},
	function(){
		$(this).find('ul').stop(true, true).fadeOut('slow');
		$(this).removeClass('hover');
	});

	/*---------------------------------
		Tabs
	-----------------------------------*/
	// tab setup
	$('.tab-content').addClass('clearfix').not(':first').hide();
	$('ul.tabs').each(function(){
		var current = $(this).find('li.current');
    //if(current == null){
    //  current = $(this).find('p.current')
    //}
		if(current.length < 1) { $(this).find('li:first').addClass('current'); }
		current = $(this).find('li.current a').attr('href');
		$(current).show();
	});

	// tab click
	$(document).on('click', 'ul.tabs a[href^="#"]', function(e){
		e.preventDefault();
		var tabs = $(this).parents('ul.tabs').find('li');
		var tab_next = $(this).attr('href');
		var tab_current = tabs.filter('.current').find('a').attr('href');

    var asciidoctor_flag = true;
    // alert(tab_next);
    // alert('current 1: ' + tab_current);

    if(tab_current == null){ // asciidoctor adds <p> so we have to check for it
		  tab_current = tabs.find('p').filter('.current').find('a').attr('href');
      // alert('current 2: ' + tab_current);
    }

    if(asciidoctor_flag){ // asciidoctor
      // alert('asciidoctor ');
      $(tab_current).parents('.tab-content').hide();
      tabs.removeClass('current');
      tabs.find('p').removeClass('current');
      $(this).parents('li').addClass('current');
      $(tab_next).parents('.tab-content').show();
    }
    else{ // ordinar markdown
      $(tab_current).hide();
      tabs.removeClass('current');
      $(this).addClass('current');
      $(tab_next).show();
    }
		history.pushState( null, null, window.location.search + $(this).attr('href') );
		return false;
	});

 	// tab hashtag identification and auto-focus
    	var wantedTag = window.location.hash;
    	if (wantedTag != "")
    	{
			// This code can and does fail, hard, killing the entire app.
			// Esp. when used with the jQuery.Address project.
			try {
				var allTabs = $("ul.tabs a[href^=" + wantedTag + "]").parents('ul.tabs').find('li');
				var defaultTab = allTabs.filter('.current').find('a').attr('href');
				$(defaultTab).hide();
				allTabs.removeClass('current');
				$("ul.tabs a[href^=" + wantedTag + "]").parent().addClass('current');
				$("#" + wantedTag.replace('#','')).show();
			} catch(e) {
				// I have no idea what to do here, so I'm leaving this for the maintainer.
			}
    	}
});
jQuery.noConflict(); // Reverts '$' variable back to other JS libraries

;
