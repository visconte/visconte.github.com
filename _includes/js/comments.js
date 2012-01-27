$.ajax("https://api.github.com/repos/visconte/visconte.github.com/issues/{{ page.commentIssueId }}/comments",
       {
	   headers : { "Accept": "application/vnd.github.html+json" },
	   dataType : "jsonp",
	   crossDomain : false,
	   scriptCharset : "utf-8",
	   jsonpCallback : "loadComments"
       }
);
function loadComments(comments) {
    for (var i=0; i<comments.data.length; i++) {
	var cuser = comments.data[i].user.login;
	var cuserlink = 'https://www.github.com/' + cuser;
	var clink = 'https://github.com/visconte/visconte.github.com/issues/{{ page.commentIssueId }}#issuecomment-' + comments.data[i].id;
	var cbody = comments.data[i].body_html;
	var cavatarlink = comments.data[i].user.avatar_url;
	var cdate = Date.parse(comments.data[i].created_at).toString("MMMM d, yyyy HH:mm");
	
	$('#comments').append('<div class="comment"><div class="cmeta"><p class="author"><span class="gravatar"><img height="20" width="20" src="' + cavatarlink + '"></span> <strong><a href="' + cuserlink + '">' + cuser + '</a></strong> <a href="' + clink + '">комментирует</a></p><p class="date"><a href="' + clink + '">' + cdate + '</a> <span class="icon"></span></p></div><div class="body">' + cbody + '</div></div>')
    }
};