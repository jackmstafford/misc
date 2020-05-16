'use strict';

console.log('ino.js running');

const $readerPane = $('#reader_pane');
const rph = $readerPane.height() * 0.95;
$('head').append(
  $('<style/>').text(`.article_content img:not([src~="questionablecontent"]) { max-height: ${rph}px !important; }`),
  $('<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">'),
);


let $con;
const rbIframeSrc = 'rbIframeSrc';
const comm_id = 'jack_comm';
const notes_id = 'jack_notes';
const comm_or_notes_selector = `#${comm_id}, #${notes_id}`;
const greeny = '#009688';
let stopImageLoading = false;

const Keys = {
  b: 66,
  i: 73,
  l: 76,
  q: 81,
  v: 86,
  ';': 186,
  ',': 188,
  '[': 219,
  ']': 221,
  "'": 222,
};

function articleKeypress(e) {
  if(e.altKey || e.ctrlKey || e.metaKey)
    return;

  const $art_ex = $('.article_expanded');
  const rbIframe = $con.attr(rbIframeSrc);
  if (rbIframe != null && e.which === Keys.b && e.shiftKey)
    // open reblog window
    window.open(rbIframe, '', 'width=540, height=55, left=1200, top=200');

  else if (e.which == Keys.v && e.shiftKey)
    openBgTab($art_ex.find('.article_title_link').attr('href'));
  
  else if (e.which === Keys.l && !e.shiftKey)
    // scroll to bottom of current article
    scrollToArticleBottom();

  else if (e.which === Keys[';'] && !e.shiftKey)
    // scroll to top of current article
    scrollToTop($art_ex[0]);

  else if (e.which === Keys.i && !e.shiftKey)
    // open comment/tree or notes
    $(comm_or_notes_selector).click();

  else if (e.which === Keys.i && e.shiftKey)
    formatStimboard();

  else if (e.which === Keys['['] && !e.shiftKey)
    // scroll up one image
    scrollImg(false);
  else if (e.which === Keys[']'] && !e.shiftKey)
    // scroll down one image
    scrollImg(true);
  else if (e.which == Keys[','])
    // scroll links
    scrollLink(!e.shiftKey);
  else if (e.which == 13 && e.shiftKey)
    // open selected link
    selected_link.click();
  else if (e.which === Keys["'"]) { // ' or "
    if(!e.shiftKey && !selected_img)
      selected_img = $('.article_content img')[0];
    var hover_me = selected_img;
    if(e.shiftKey)
      hover_me = $(".article_title>a")[0];
    // if not displaying imagus media
    if(!$('div:has(div + img + video + div)')[0] ||
        $('div:has(div + img + video + div):hidden')[0])
      $(hover_me).mouseover(); // simulate hover
    else // trigger imagus to stop displaying imagus media
      $readerPane.mousemove();
  }

  else if(e.which === Keys.q && e.shiftKey)
    stopImageLoading = !stopImageLoading;
  else if(e.which === Keys.l && e.shiftKey)
    loadImages();
}

function formatStimboard() {
  // format nine pic stimboard 
  $con.html($con.html().replace(/ &nbsp;/g, ''));
  $con.find('img ~ br').remove();
  $con.find('img:nth-of-type(10)').remove();
  var sz = '15em';
  $con.find('img').height(sz).width(sz).css('padding-right', '5px');
}

function swapImgSrc(img, doLoad) {
  let $img = $(img);
  let a = 'src';
  let b = 'jsrc';
  if(!doLoad) {
    a = b;
    b = 'src';
  }
  let at = $img.attr(a);
  if(at != null && at !== '') 
    return;
  $img.attr(a, $img.attr(b));
  $img.attr(b, '');
}

const loadOrUnloadImages = (load) => () =>
  $con.find('img').each((i, v) => swapImgSrc(v, load));

const loadImages = loadOrUnloadImages(true);
const unloadImages = loadOrUnloadImages(false);

const scrollToTopOrBottom = (top) => (element) =>
  element.scrollIntoView(top);

const scrollToTop = scrollToTopOrBottom(true);
const scrollToBottom = scrollToTopOrBottom(false);

function scrollToBottomAfterCheck(visEl, element) {
  // scroll to bottom of element if visEl not visible
  if(visEl == null || !isElementInViewport(visEl)) 
    scrollToBottom(element);
}

function scrollToArticleBottom(){
  scrollToBottomAfterCheck(
    $('.article_full_contents > .article_tags')[0], $('.article_expanded')[0]);
}

let selected_img = undefined;
function scrollImg(forward) {
  selected_img = scrollItems(forward, 'img, video');
  swapImgSrc(selected_img, true);
}

let selected_link = undefined;
function scrollLink(forward) {
  selected_link = scrollItems(forward, 'a');
}

const clamp = (min, num, max) => Math.min(Math.max(num, min), max);

// function scrollItems(forward, identifier, selection) {
function scrollItems(forward, identifier) {
  const selectorClass = 'jack_selected';
  const $items = $con.find(identifier);
  if ($items.size() === 0)
    return;
  const $currentSelection = $items.filter(`.${selectorClass}`);
  let index = $items.index($currentSelection);
  if (!forward && index === -1)
    index = $items.size();
  $items.removeClass(selectorClass);
  const nextI = index + (forward ? 1 : -1);
  const nextEl = $items[clamp(0, nextI, $items.size() - 1)];
  $(nextEl).addClass(selectorClass);
  scrollToTop(nextEl);
  return nextEl;
}

const unwrapeIfJQuery = (el) =>
  typeof jQuery === 'function' && el instanceof jQuery ? el[0] : el;

function isElementInViewport (el) {
  const rect = unwrapeIfJQuery(el).getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
  );
}

window.select20 = function() {
  $('#feed_log_dialog td:nth-of-type(3):contains(20)')
    .css('cssText', 'background-color: red !important');
}

window.expandMe = function(e) { 
  const $this = $(this);
  const expanded = $this.attr('expanded');
  const minimized = $this.attr('minimized');
  $this.html(minimized + (this.innerHTML === minimized ? expanded : ''));
  scrollToArticleBottom();
}

// return a string diff of the dates
function dateDiff(dat1, dat2) {
  const dif = Math.abs((dat2 - dat1) / 1000); // seconds diff
  const minDif = dif / 60; // minutes diff
  if(Math.ceil(minDif) < 60)
    return Math.ceil(minDif) + 'm';
  const hourDif = minDif / 60;
  if(Math.ceil(hourDif) < 24)
    return Math.ceil(hourDif) + 'h';
  const dayDif = hourDif / 24;
  if(Math.ceil(dayDif) < 7)
    return Math.ceil(dayDif) + 'd';
  const weekDif = dayDif / 7;
  return Math.ceil(weekDif) + 'w';
}

function makeDate(dat) {
  if(dat.startsWith('201'))
    return new Date(dat);
  else {
    const d1 = new Date();
    const dats = dat.split(':');
    d1.setHours(dats[0]);
    d1.setMinutes(dats[1]);
    return d1;
  }
}

const escapeHtmlCharacters = (text) =>
  text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const makeLinkElement = (src, text) => $('<a/>')
  .attr('target', '_blank')
  .attr('href', src)
  .css('color', 'green')
  .css('font-size', '1.3em')
  .text(text);

function makeVineElement(src) {
  const img = $('<img/>')
    .attr('src', 'https://vine.co/static/images/vine_glyph_2x.png');
  return $('<a/>')
    .attr('target', "_blank")
    .attr('href', "${src}")
    .append(img);
}

const makeCommentElement = (id, info, text) => $('<p/>')
  .css('color', '#049cdb')
  .attr('id', id)
  .attr('expanded', info)
  .attr('minimized', text)
  .text(text)
  .click(expandMe);

const makeImageElement = (src) => $('<img/>')
  .css('max-width', '320px')
  .css('max-height', '400px')
  .css('border', '2px dashed ' + greeny)
  .attr('src', src);

function removeAllAttributes(ele){
  const attrs = ele.attributes;
  while (attrs.length > 0)
		ele.removeAttribute(attrs[0].name);
  for(const child of ele.children)
    removeAllAttributes(child);
}

const getAndStripHtml = ($ele) => {
  const ele = $ele[0];
  removeAllAttributes(ele);
  return ele.innerHTML.replace(/[\n\t\s]+/g, '');
};

const arrayMax = (arr) => Math.max(...arr); 
const arrayMin = (arr) => Math.min(...arr);
const arrayDiff = (arr) => Math.abs(arrayMax(arr) - arrayMin(arr)); 

const appendTagDiv = (html) => {
  const $div = $('<div>')
    .css('color', '#be26d8')
    .css('border-top', greeny + ' dotted .2em')
    .html(html);
  $con.append($div);
}

window.gotTumblrJson = function(json) {
  const post = json.response.posts[0];
  
  // tags
  appendTagDiv((post.tags.length === 0 ? '' : '#') + post.tags.join('<br>#'));
  
  // reblog info
  const { reblog, reblogged_from_url } = post;
  if(reblogged_from_url != null){
    // added words
    if(reblog != null) { 
      const strippedCon = getAndStripHtml($con.clone()).replace(/> *</g, '><');
      const commentHtml = reblog.tree_html + reblog.comment;
      const strippedComment = getAndStripHtml($('<div>').html(commentHtml))
        .replace(/<figure>(<img>)<\/figure>/g, '$1');
      if(!strippedCon.includes(strippedComment)) {
        const commentNameArray = [];
        if(reblog.tree_html.length > 0) 
          commentNameArray.push('tree');
        if(reblog.comment.length > 0) 
          commentNameArray.push('comment');
        const commentName = `[${commentNameArray.join(' and ')}]`;
        $con.append(makeCommentElement(comm_id, commentHtml, commentName));
      }
    }

    const lText = post.reblogged_from_title + ': ' + post.reblogged_from_name;
    const rebloggedFromLink = makeLinkElement(reblogged_from_url, lText)
      .css('font-size', '.9em');
    $con.append($('<p/>').append(rebloggedFromLink));
  }
  // notes info
  else if(post.notes != null) {
    const noteArr = [];
    let counter = 0;
    const postNotes = Object.values(post.notes);
    postNotes.reverse();
    for(const note of postNotes) {
      const text = note.added_text ?? note.reply_text;
      if(text != null)
        noteArr.push(`${counter++}. ${escapeHtmlCharacters(text)}`);
    }
    const notes = noteArr.join('<br>');
    $con.append(makeCommentElement(notes_id, notes, '[notes]'));
  }

  // tumblr controls iframe
  const pid = post.id;
  const tumblelogName = json.response.blog.name;
  if(pid != null && tumblelogName != null) {
    const qs = $.param({ tumblelogName, pid });
    $con.attr(rbIframeSrc, `https://www.tumblr.com/dashboard/iframe?${qs}`);
  }
}

function doStuff(mutations){
  // if nothing was added
  if (!mutations.some(m => m.addedNodes.length > 0)) return;

  $con = $('.article_content');
  
  if(stopImageLoading)
    unloadImages();

  // handle keydown and removal
  var key_class = 'jack_key';
  if($con[0] != null && !$con.hasClass(key_class)) {
    $con.addClass(key_class);
    $(document).keydown(articleKeypress);
    $con.on('remove', function () { 
      selected_img = undefined;
      $(document).off('keydown', articleKeypress); 
    });
  }

  // show article posted date
  for(const header of $('.header_date')) {
    var hdAss = 'hd_found_jack';
    const $par = $(header.parentElement);
    if(!$par.hasClass(hdAss)) {
      $par.addClass(hdAss);
      const datR = header.title.match('Date received: (.*)')[1];
      const datP = header.title.match('Date posted: (.*)')[1];
      // const diff = dateDiff(makeDate(datP), makeDate(datR));
      const diff = 'm';
      if(diff.endsWith('d') || diff.endsWith('w'))
        header.innerHTML = 'Posted vs received: ' + diff;
    }
  }

  // handle images unable to load over https
  for (const image of $con.find('img')) {
    const proxy = '//images.weserv.nl/?url=';
    if(['dw.com','kk.org'].some(s =>
        image.src.includes(s)) && !image.src.includes(proxy))
      image.src = proxy + image.src.substr(image.src.indexOf(':') + 3);
  }

  const ass = 'jackson_handled_iframe';
  for(const frame of $con.find(`iframe:not(.${ass})`)) {
    const fsrc = frame.src;
    const $frame = $(frame);
    $frame.addClass(ass);

    let fele = null;

    if(['audio', 'soundcloud', 'embed.spotify'].some(t => fsrc.includes(t))) 
      fele = makeLinkElement(fsrc, 'AUDIO LINK');
    else if(fsrc.includes("vine.co/v"))
      fele = makeVineElement(fsrc);
    else if(fsrc.includes('vimeo'))
      fele = makeLinkElement(fsrc, 'VIMEO');
    else continue;

    frame.parentElement.replaceChild(fele, frame);
  }

  // remove instagram SPACE
  const ins = $('blockquote>div>p>a[href~="instagram.com/p"]')[0];
  if(ins != null) {
    const url = 'https://api.instagram.com/oembed/?url=' + ins.href;
    $.ajax({ dataType: 'jsonp', url }).done(function(json) {
      $(ins).empty();
      ins.append(makeImageElement(json.thumbnail_url));
    });
    const bq = ins.parentElement.parentElement.parentElement;
    $(bq).empty();
    bq.append(ins);
  }

  // replace tumblr video display (only does one)
  var vid = $con.find('video');
  if(vid.length > 0 && $(vid[0]).find('source').length > 0) {
    var sour = $(vid[0]).find('source')[0].src;
    if(!sour.endsWith('.mp4'))
      sour += ".mp4";
    const $aa = makeLinkElement(sour, '')
      .append(makeImageElement(vid[0].poster));
    vid[0].parentElement.replaceChild($aa[0], vid[0]);
  }

  // get tumblr post data
  const assc = 'jackson_handled_tags';
  const $pp = $('.article_full_contents').has($con);
  if($pp.length > 0 && !$con.hasClass(assc)) {
    // make pics go side by side
    const $articleImages = $con.find('>img').map((_, img) => $(img));
    const heights = $articleImages.map((_, $img) => $img.height());
    const widths = $articleImages.map((_, $img) => $img.width());
    if(heights.length % 2 == 0 && arrayDiff(heights) < 5 && arrayDiff(widths) < 10) 
      $con.html($con.html().replace(/(<img[^>]+>)(<br>)+/g, '$1 &nbsp;'));

    $con.addClass(assc);
    const fullTumbUrl =
      $pp.find('[id^="article_"][href*="tumblr"]').attr('href');
    if(fullTumbUrl != null) {    
      const $titleLink = $pp.find('.article_title_link');
      const postUrl = $titleLink.attr('href');
      const postId = postUrl.match('post/(\\d+)')[1];
      let tumbUrl = fullTumbUrl.match('.*:.{2}(.*%2F%2F)?(.*\.tumblr\.com)')[2];
      if(kold.includes(tumbUrl)) {
        tumbUrl = `${kurrent}.tumblr.com`;
        $titleLink.attr('href', `https://${tumbUrl}/post/${postId}`);
      }
      const url = `https://api.tumblr.com/v2/blog/${tumbUrl}/posts/`;
      const qs = {
        api_key: tumb_api_key,
        id: postId,
        notes_info: tumbUrl.includes('sbroxman'),
        reblog_info: true,
      };
      const aj = $.ajax({ dataType: 'jsonp', url, data: qs, })
        .success(gotTumblrJson)
        .fail(function() {
          rIframe = null;
          appendTagDiv('(POST DATA PULL FAILED)');
        });
      $con.on('remove', function () { aj.abort(); });
    }
  }
}

$(function() {
  new MutationObserver(doStuff).observe($('#reader_pane')[0], {
    childList: true,
    subtree: true
  });
});
