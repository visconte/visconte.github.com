function UserEmail() {
    $.ajax('https://api.github.com/users/visconte', {
	dataType: 'json',
	success: function(info) {
	    loadUserInfo(info);
	}
    });
};
function loadUserInfo(info) {
    var emaillink = 'mailto:' + info.email + '?subject=Комментарий к посту "{{ page.title }}"';
    window.location.href = emaillink;
};