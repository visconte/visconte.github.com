function UserEmail() {
    $.ajax("https://api.github.com/users/visconte",
	   {
	       dataType : "jsonp",
	       crossDomain : false,
	       scriptCharset : "utf-8",
	       jsonpCallback : "loadUserInfo"
	   }
	  );
};
function loadUserInfo(info) {
    var emaillink = 'mailto:' + info.data.email + '?subject=Комментарий к посту "{{ page.title }}"';
    window.location.href = emaillink;
};