'use strict';

console.log('ino.js running');

var con;
var rIframe;
var comm_id = 'jack_comm';
var greeny = '#009688';

function articleKeypress(e) {
	if(!(e.altKey || e.ctrlKey || e.metaKey)) {
		if (rIframe !== null && e.which == 66 && e.shiftKey) // uppercase b
			con.prepend(rIframe); // add iframe to reblog

        else if (e.which == 67 && e.shiftKey) { // C
            // open comment
            var comm = $('#' + comm_id);
            if(comm.length == 1)
                $(comm[0]).click();
        }
		
		else if (e.which == 76 && !e.shiftKey)  // l
			con[0].parentElement.scrollIntoView(false); // scroll to bottom of current article
		
		else if (e.which == 186 && !e.shiftKey) // ;
			con[0].parentElement.scrollIntoView(true); // scroll to top of current article
	}
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

function makeImageElement(src) {
    return $('<img style="max-width: 320px; max-height: 400px; border: 2px dashed ' + greeny + '" src="' + src + '">')[0];
}

//var doStuff = function() {
function doStuff(){
	con = $('.article_content');
	
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
	
	// handle iframe stuff
	var iffy = con.find('iframe');
    var ass = 'jackson_handled';
	for(var i = 0; i < iffy.length; i++) {
		var frame = iffy[i];
		
		// avoid handling iframes infinitely
		if($(frame).hasClass(ass)) continue;
		$(frame).addClass(ass);
		
		// handle audio 
		if(frame.src.includes('audio') || frame.src.includes('soundcloud')) 
			frame.parentElement.replaceChild(makeLinkElement(frame.src, 'AUDIO LINK'), frame);
		
		// handle vine stuff
		if(frame.src.includes("vine.co/v")){
			frame.parentElement.replaceChild(makeLinkElement(frame.src, 'VINE'), frame);
			//var thumbRequestUrl = 'https://vine.co/oembed.json?url=' + frame.src;
			/*
			$(frame).ajax({
				dataType: "json",
				url: url,
			})
			.done(function(json) {
				var turl = json.thumbnail_url;
				console.log(json);
				var img = $('<img style="border: 2px dashed ' + greeny + '" width="320" src="' + turl + '">')[0];
				el.appent(img);
				frame.parentElement.replaceChild(el, frame);
			});
			frame.contentWindow.addEventListener("message", function(event) {
				console.log(event);
				console.log(this);
			}, false);
			frame.onload = function() {
				console.log('frame loaded');
				//console.log(this);
				this.contentWindow.postMessage({}, url);
			};
			*/
			//frame.contentWindow.postMessage( {}, url);
		}
	}
	
	// remove instagram SPACE
	var ins = $("blockquote>div>p>a");
	if(ins.length > 0 && ins[0].href.includes("instagram.com/p")) {
		var p = ins[0];
		$.ajax({
			dataType: "jsonp",
			url: "https://api.instagram.com/oembed/?url=" + p.href,
		})
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
		$(con).addClass(assc);
		pp = pp[0];
		var hre = $(pp).find('[id^="article_feed_info_link_"]')[0].href; // rss feed 
		if(hre.includes("tumblr")) {
			var postUrl = $(pp).find('.article_title_link')[0].href;
			var postId = postUrl.match('post/(\\d+)')[1];
			var tumb_url = hre.match('%2F%2F(.*)\.tumblr')[1];
			var blog_identifier = tumb_url + '.tumblr.com';
			var tur = "https://api.tumblr.com/v2/blog/" + blog_identifier + "/posts/?reblog_info=true&api_key=" + tumb_api_key + "&id=" + postId;
			var tags = "<div style='color: #be26d8; border-top: " + greeny + " dotted .2em'>";
			var aj = $.ajax({
				dataType: "jsonp",
				url: tur,
			})
			.success(function(json) {
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
					if(po.reblog !== undefined && po.reblog.comment.length > 0) {
						con.append($('<p style="color: #049cdb" id="' + comm_id + '" title="' + escapeHtml(po.reblog.comment) + '">[comment added]</p>')[0]);
						$('#' + idd).click(function() { this.innerHTML += this.title; });
					}
					
					var rb = '<p><a target="_blank" style="font-size: .9em; color: ' + greeny + ';" href="' + rbUrl + '">' + po.reblogged_from_title + ': ' + po.reblogged_from_name + '</a></p>';
					con.append($(rb)[0]);
				}
				
				// reblog button
				var rbId = po.id;
				var rbName = json.response.blog.name;
				if(rbId !== undefined && rbName !== undefined) {
					var ifSrc = 'https://www.tumblr.com/dashboard/iframe?tumblelogName=' + rbName + '&pid=' + rbId;
					rIframe = $('<div><iframe style="width: 540px; height: 55px" src="' + ifSrc + '"></iframe></div>')[0];
				}
			})
			.fail(function() {
				rIframe = null;
				con.append($(tags + '(POST DATA PULL FAILED)' + '</div>')[0]);
			});
			$(document).keydown(articleKeypress);
			$(con[0]).on("remove", function () {
				aj.abort();
				$(document).off('keydown', articleKeypress);
			});
		}
	}
}

new MutationObserver(function(mutations){
		doStuff();
}).observe(document, {
	childList: true,
	subtree: true
});

/*
$(window).on("message", function( event ){
	//if (event.origin !== "https://vine.co") return;
	if(event.data !== undefined)
		console.log( event.data ); // Logs {name: "Someone", avatar: "url.jpg"}
});
*/
