$.ajax('https://api.github.com/repos/visconte/visconte.github.com/issues/{{ page.commentIssueId }}/comments', {
    dataType: 'json',
    headers: { Accept: 'application/vnd.github.html+json' },
    success: function(comments) {
        loadComments(comments);
    }
});

function loadComments(comments) {
    for (var i=0; i<comments.length; i++) {
        var cuser = comments[i].user.login;
        var cuserlink = 'https://www.github.com/' + cuser;
        var clink = 'https://github.com/visconte/visconte.github.com/issues/\
{{ page.commentIssueId }}#issuecomment-' + comments[i].id;
        var cbody = comments[i].body_html;
        var cavatarlink = comments[i].user.avatar_url;
        var cdate = Date.parse(comments[i].created_at).toString("MMMM d, yyyy HH:mm");

        $('#comments').append('\
<div class="comment">\
  <div class="cmeta">\
    <p class="author">\
      <span class="gravatar"><img height="20" width="20" src="' + cavatarlink + '"></span>\
      <strong><a href="' + cuserlink + '">' + cuser + '</a></strong>\
      <a href="' + clink + '">комментирует</a>\
    </p>\
    <p class="date"><a href="' + clink + '">' + cdate + '</a> <span class="icon"></span></p>\
  </div>\
  <div class="body">' + cbody + '</div>\
</div>')
    }
};
