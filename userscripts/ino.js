'use strict';

console.log('ino.js running');

var rph = $('#reader_pane').height() * 0.95;
$('head').append($('<style>.article_content img:not([src~="questionablecontent"]) { max-height: ' + rph + 'px !important; }</style>'));
$('head').append($('<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">')[0]);


var con;
var rIframe;
var tags; 
var comm_id = 'jack_comm';
var notes_id = 'jack_notes';
var greeny = '#009688';

function articleKeypress(e) {
	if(!(e.altKey || e.ctrlKey || e.metaKey)) {
        var art_ex = $('.article_expanded')[0];
		if (rIframe !== null && e.which === 66 && e.shiftKey) { // uppercase b
			con.prepend(rIframe); // add iframe to reblog
            scrollToTop(art_ex);
        }

        else if (e.which == 86 && e.shiftKey) // V
        	openBgTab($(art_ex).find('.article_title_link')[0].href);
		
		else if (e.which === 76 && !e.shiftKey)  // l
            		scrollToArticleBottom(); // scroll to bottom of current article

		else if (e.which === 186 && !e.shiftKey) // ;
			scrollToTop(art_ex); // scroll to top of current article

		else if (e.which === 73 && !e.shiftKey) { // i
			if($('#' + comm_id)[0])  
				$('#' + comm_id)[0].click(); // open comment/tree
			else if ($('#' + notes_id)[0]) 
				$('#' + notes_id)[0].click(); // open notes
		}
		else if (e.which === 73 && e.shiftKey) { // I
			// format nine pic stimboard 
			con[0].innerHTML = con[0].innerHTML.replace(/ &nbsp;/g, '')
			$(con).find('img ~ br').remove();
			$(con).find('img:nth-of-type(10)').remove();
			var sz = '15em';
			$(con).find('img').height(sz).width(sz).css('padding-right', '5px');
		}

		else if (e.which === 219 && !e.shiftKey) // [
			scrollImg(false); // scroll up one image
		else if (e.which === 221 && !e.shiftKey) // ]
			scrollImg(true); // scroll down one image
		else if (e.which == 188) // , or <
			scrollLink(!e.shiftKey); // scroll links
		else if (e.which == 13 && e.shiftKey)
			selected_link.click(); // open selected link
        else if (e.which === 222) { // ' or "
            if(!e.shiftKey && !selected_img)
                selected_img = $('.article_content img')[0];
			var hover_me = selected_img;
			if(e.shiftKey)
				hover_me = $(".article_title>a")[0];
            if(!$('div:has(div + img + video + div)')[0]  || $('div:has(div + img + video + div):hidden')[0]) // if not displaying imagus media
                hover_me.dispatchEvent(new MouseEvent('mouseover')); // simulate hover
            else // trigger imagus to stop displaying imagus media
                $('#reader_pane')[0].dispatchEvent(new MouseEvent('mousemove', {clientX: '-1', clientY: '-1'})); 
        }
	}
}

function scrollToTop(element) {
    element.scrollIntoView(true);
}

function scrollToBottom(element) {
    element.scrollIntoView(false);
}

function scrollToBottomAfterCheck(visEl, element) {
    // scroll to bottom of element if visEl not visible
    if(visEl === undefined || !isElementInViewport(visEl)) 
        scrollToBottom(element);
}

function scrollToArticleBottom(){
    scrollToBottomAfterCheck($('.article_full_contents > .clearfix')[0], $('.article_expanded')[0]);
}

var selected_img = undefined;
function scrollImg(forward) {
	selected_img = scrollItems(forward, 'img', selected_img);
}

var selected_link = undefined;
function scrollLink(forward) {
	var selected_link_class = 'jack_selected_link';
	$(selected_link).removeClass(selected_link_class);
	selected_link = scrollItems(forward, 'a', selected_link);
	$(selected_link).addClass(selected_link_class);
}

function scrollItems(forward, identifier, selection){
	var items = $(con).find(identifier).toArray();
	if(!forward) items.reverse();
	if(selection !== undefined){
		var i = items.indexOf(selection);
		if(i == -1) 
			selection = items[0];
		else if(i + 1 < items.length)
			selection = items[i+1];
	}
	else
		selection = items[0];
	scrollToTop(selection);
	return selection;
}

function isElementInViewport (el) {
    if (typeof jQuery === "function" && el instanceof jQuery) {
        el = el[0];
    }

    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
}

window.expandMe = function(e) { 
    var text = e.data.text;
    if(this.innerHTML == text) 
        this.innerHTML += this.title; 
    else
        this.innerHTML = text;
    scrollToArticleBottom();
}

// return a string diff of the dates
function dateDiff(dat1, dat2) {
	var dif = Math.abs((dat2 - dat1) / 1000); // seconds diff
	var minDif = dif / 60; // minutes diff
	if(Math.ceil(minDif) < 60)
		return Math.ceil(minDif) + 'm';
	var hourDif = minDif / 60;
	if(Math.ceil(hourDif) < 24)
		return Math.ceil(hourDif) + 'h';
	var dayDif = hourDif / 24;
	if(Math.ceil(dayDif) < 7)
		return Math.ceil(dayDif) + 'd';
	var weekDif = dayDif / 7;
	return Math.ceil(weekDif) + 'w';
}

function makeDate(dat) {
	if(dat.startsWith('201'))
		return new Date(dat);
	else {
		var d1 = new Date();
		var dats = dat.split(':');
		d1.setHours(dats[0]);
		d1.setMinutes(dats[1]);
		return d1;
	}
}

function escapeHtml(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function makeLinkElement(src, text) {
	var linkStyle = " style='color: green; font-size: 1.3em;' ";
    return $('<a ' + linkStyle + 'target="_blank" href="' + src + '">' + text + '</a>')[0];
}

function makeVineElement(src) {
	return $('<a target="_blank" href="' + src + '"><img src="https://vine.co/static/images/vine_glyph_2x.png"></a>')[0];
}

function makeCommentElement(id, info, text) {
    return $('<p style="color: #049cdb" id="' + id + '" title="' + info + '">' + text + '</p>')[0];
}

function makeImageElement(src) {
    return $('<img style="max-width: 320px; max-height: 400px; border: 2px dashed ' + greeny + '" src="' + src + '">')[0];
}

function removeAllAttributes(ele){
	var notarr = ele.attributes;
	var attrs = [];
	for(var i = 0; i < notarr.length; i++)
		attrs[i] = notarr[i].name;
	for(i = 0; i < attrs.length; i++)
		ele.removeAttribute(attrs[i]);
	for(i = 0; i < ele.children.length; i++)
		removeAllAttributes(ele.children[i]);
}

function arrayMax(arr) { 
	return Math.max.apply(null, arr); 
}

function arrayMin(arr) { 
	return Math.min.apply(null, arr); 
}

function arrayDiff(arr) { 
	return Math.abs(arrayMax(arr) - arrayMin(arr)); 
}

window.gotJSON = function(json) {
    var po = json.response.posts[0];
    
    // tags
    var ts = po.tags;
    for(var i = 0; i < ts.length; i++)
        tags += '<br># ' + ts[i];
    tags += '</div><br>';
    con.append($(tags)[0]);
    
    //reblog info
    var rbUrl = po.reblogged_from_url;
    if(rbUrl !== undefined){
        // added words
        if(po.reblog !== undefined) { 
            var rebl = po.reblog;
            var comm_display_name = '';
            if(rebl.tree_html.length > 0 && rebl.comment.length > 0) 
                comm_display_name = '[tree and comment]';
            else if(rebl.tree_html.length > 0) 
                comm_display_name = '[tree]';
            else if(rebl.comment.length > 0) 
                comm_display_name = '[comment]';
            var comm_text = rebl.tree_html + rebl.comment;
			
			var cc = $(con).clone()[0];
			removeAllAttributes(cc);
			var rb = $('<div>' + comm_text + '</div>')[0];
			removeAllAttributes(rb);
			var ccomp = cc.outerHTML.replace(/[\n\t]/g, '').replace(/> *</g, '><');
			if(!ccomp.includes(rb.innerHTML)) {
				con.append(makeCommentElement(comm_id, escapeHtml(comm_text), comm_display_name));
				$('#' + comm_id).click({text: comm_display_name}, expandMe);
			}
        }
        
        var rb = '<p><a target="_blank" style="font-size: .9em; color: ' + greeny + ';" href="' + rbUrl + '">' + po.reblogged_from_title + ': ' + po.reblogged_from_name + '</a></p>';
        con.append($(rb)[0]);
    }
    // notes info
    else if(po.notes !== undefined) {
        var nots = '';
        var pon = Object.values(po.notes);
        var counter = 0;
        for(var noti = pon.length - 1; noti >= 0; noti--) {
            if(pon[noti].added_text !== undefined)
                nots += '<br>' + (counter++) + '. ' + escapeHtml(pon[noti].added_text);
            else if(pon[noti].reply_text !== undefined)
                nots += '<br>' + (counter++) + '. ' + escapeHtml(pon[noti].reply_text);
        }
        var notes_ = '[notes]';
        con.append($('<div id="' + notes_id + '" title="' + nots + '">' + notes_ + '</div>')[0]);
        $('#' + notes_id).click({text: notes_}, expandMe);
    }
    
    // tumblr controls iframe
    var rbId = po.id;
    var rbName = json.response.blog.name;
    if(rbId !== undefined && rbName !== undefined) {
        var ifSrc = 'https://www.tumblr.com/dashboard/iframe?tumblelogName=' + rbName + '&pid=' + rbId;
        rIframe = $('<div><iframe style="width: 540px; height: 55px" src="' + ifSrc + '"></iframe></div>')[0];
    }
}

function doStuff(mutations){
    var addedSummit = false;
    $(mutations).each(function() {
        if(this.addedNodes.length > 0)
            addedSummit = true;
    });
    if(!addedSummit) return;

	con = $('.article_content');

    // handle keydown and removal
    var key_class = 'jack_key';
    if(con[0] !== undefined && !$(con[0]).hasClass(key_class)) {
        $(con[0]).addClass(key_class);
        $(document).keydown(articleKeypress);
        $(con[0]).on("remove", function () { 
			selected_img = undefined;
			$(document).off('keydown', articleKeypress); 
		});
    }
	
	// show article posted date
	var hds = $('.header_date');
	for(var j = 0; j < hds.length; j++) {
		var hd = hds[j];
		var hdAss = 'hd_found_jack';
		if(!$(hd.parentElement).hasClass(hdAss)) {
			$(hd.parentElement).addClass(hdAss);
			var datR = hd.title.match('Date received: (.*)')[1];
			var datP = hd.title.match('Date posted: (.*)')[1];
			var diff = dateDiff(makeDate(datP), makeDate(datR));
			if(diff.endsWith('d') || diff.endsWith('w'))
				hd.innerHTML = 'Posted vs received: ' + diff;
		}
	}
	
	// handle images unable to load over https
	var images = con.find('img');
	for(var imgC = 0; imgC < images.length; imgC++) {
		var image = images[imgC];
		var proxy = '//images.weserv.nl/?url=';
		if((image.src.includes('dw.com') || image.src.includes('kk.org')) && !image.src.includes(proxy))
			image.src = proxy + image.src.substr(image.src.indexOf(':') + 3);
	}
	
	// handle iframe stuff
	var iffy = con.find('iframe');
	for(var i = 0; i < iffy.length; i++) {
		var frame = iffy[i];
        var fsrc = frame.src;
		
		// avoid handling iframes infinitely
        var ass = 'jackson_handled';
		if($(frame).hasClass(ass)) continue;
		$(frame).addClass(ass);
		
        var fele;

		// handle audio 
		if(fsrc.includes('audio') || fsrc.includes('soundcloud') || fsrc.includes('embed.spotify')) 
			fele = makeLinkElement(fsrc, 'AUDIO LINK');
		
		// handle vine stuff
		if(fsrc.includes("vine.co/v"))
			fele = makeVineElement(fsrc);
		
		// handle vimeo
		if(fsrc.includes('vimeo'))
			fele = makeLinkElement(fsrc, 'VIMEO');

        frame.parentElement.replaceChild(fele, frame);
	}
	
	// remove instagram SPACE
	var ins = $("blockquote>div>p>a");
	if(ins.length > 0 && ins[0].href.includes("instagram.com/p")) {
		var p = ins[0];
		$.ajax({ dataType: "jsonp", url: "https://api.instagram.com/oembed/?url=" + p.href, })
		.done(function(json) {
			$(p).empty();
			p.append(makeImageElement(json.thumbnail_url));
		});
		var bq = p.parentElement.parentElement.parentElement;
		$(bq).empty();
		bq.append(p);
	}
	
	// replace tumblr video display (only does one)
	var vid = $(con).find('video');
	if(vid.length > 0 && $(vid[0]).find('source').length > 0) {
		var sour = $(vid[0]).find('source')[0].src;
		if(sour.substring(sour.length - 4) != ".mp4")
			sour += ".mp4";
		var aa = $('<a target="_blank" href="' + sour + '"></a>')[0];
		aa.append(makeImageElement(vid[0].poster));
		vid[0].parentElement.replaceChild(aa, vid[0]);
	}
	
	// get tumblr post data
	var pp = $('.article_full_contents:has(.article_content)');
	var assc = 'jackson_handled_tags';
	if(pp.length > 0 && !$(con).hasClass(assc)) {
		// make pics go side by side
		var heights = $('.article_content>img').map(function() { return $(this).height() });
		var widths = $('.article_content>img').map(function() { return $(this).width() });
		if(heights.length % 2 == 0 && arrayDiff(heights) < 5 && arrayDiff(widths) < 10) 
			con[0].innerHTML = con[0].innerHTML.replace(/(<img[^>]+>)(<br>)+/g, '$1 &nbsp;');
		
		$(con).addClass(assc);
		pp = pp[0];
		var hre = $(pp).find('[id^="article_feed_info_link_"]')[0].href; // rss feed 
		if(hre.includes("tumblr")) {
			var postUrl = $(pp).find('.article_title_link')[0].href;
			var postId = postUrl.match('post/(\\d+)')[1];
			var tumb_url = hre.match('%2F%2F(.*)\.tumblr')[1];
			var blog_identifier = tumb_url + '.tumblr.com';
            var notes = '';
            if(tumb_url.includes('sbroxman'))
                notes = '&notes_info=true';
			var tur = "https://api.tumblr.com/v2/blog/" + blog_identifier + "/posts/?reblog_info=true&api_key=" + tumb_api_key + "&id=" + postId + notes;
            tags = "<div style='color: #be26d8; border-top: " + greeny + " dotted .2em'>";
			var aj = $.ajax({ dataType: "jsonp", url: tur, })
                    .success(gotJSON)
                    .fail(function() {
                        rIframe = null;
                        con.append($(tags + '(POST DATA PULL FAILED)</div>')[0]);
                    });
			$(con[0]).on("remove", function () { aj.abort(); });
		}
	}
}

$(function() {
    new MutationObserver(function(mutations){ doStuff(mutations); })
    .observe($('#reader_pane')[0], {
        childList: true,
        subtree: true
    });
});
