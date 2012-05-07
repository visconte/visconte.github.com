---
layout: post
title: Создание системы комментариев на основе GitHub
commentIssueId: 2
category: GitHub
---

После того, как была [описана] [comments] система комментариев на
основе GitHub, возникает законный вопрос о том, как же её получить. В
отличие от статических страниц [GitHub Pages] [], использование только
[Jekyll] [] для этих целей недостаточно. Нам понадобится сценарий
JavaScript для загрузки и отображения комментариев, а также место для
их хранения, в качестве которого используется [Issue-трекер] [tracker]
GitHub.

[comments]: /GitHub/2011/12/09/github-hosted-comments-features.html
[GitHub Pages]: http://pages.github.com/
[Jekyll]: https://github.com/mojombo/jekyll
[tracker]: https://github.com/blog/411-github-issue-tracker

<!--more-->

### Создание ветки комментариев

Создайте issue на Issue-трекере в репозитории блога для хранения
комментариев к вашему посту. Например, [вот] [id] issue для
комментариев предыдущего поста, ссылка на который состоит из базового
URL `https://github.com/visconte/visconte.github.com/issues/` и
уникального id (`1` в данном примере). Данный issue используется
читателями блога для отправки комментариев, что выглядит примерно так:

[![]({{ site.cloud }}/images/GitHub/issue-tracker-comments.png)]({{ site.cloud }}/images/GitHub/issue-tracker-comments.png)

После этого включите полученный id в [YAML-заголовок] [YAML] исходного
текста поста, чтобы использовать его для загрузки комментариев на
соответствующую страницу блога (значение id указано напротив
`commentIssueId`):

[id]: https://github.com/visconte/visconte.github.com/issues/1
[YAML]: https://github.com/mojombo/jekyll/wiki/YAML-Front-Matter

{% highlight yaml %}
---
layout: post
title: "GitHub Pages: дальнейшая интеграция, или комментарии блога на GitHub"
commentIssueId: 1
category: GitHub
---
{% endhighlight %}

Вот фрагмент [layout-файла] [layout], генерирующего страницы блога
(`post.html` в данном примере), с ссылкой на issue. Внутри неё
используется [Liquid-шаблон] [Liquid], извлекающий id для issue (часть
`page.commentIssueId`, заключённая в двойные фигурные скобки):

[layout]: https://github.com/mojombo/jekyll/wiki/Usage
[Liquid]: https://github.com/mojombo/jekyll/wiki/Liquid-Extensions

{% assign special = '{{ page.commentIssueId }}' %}

{% highlight html %}
<div id="comments">
  <h2>Отправить комментарий</h2>
  <p>
    Комментарии блога предоставлены сервисом
    <a href="https://github.com/">GitHub</a>.
    Вы можете отправить комментарий с
    <a href="https://github.com/visconte/visconte.github.com/issues/{{ special }}#discussion_bucket">данной страницы</a>
    (необходима <a href="https://github.com/signup/free">регистрация на GitHub</a>)
    или связаться со мной по
    <a href="" class="user-email">email</a>.
  </p>
</div>
{% endhighlight %}

### Загрузка комментариев с Issue-трекера

Добавим JavaScript сценарий, извлекающий комментарии к посту блога из
соответствующего issue на GitHub. [GitHub issues API] [] как раз то,
что нам сейчас нужно --- сделать XHR-запрос и получить все комментарии
для конкретного issue. Для каждого комментария вы таким образом
получаете id пользователя GitHub, что оставил данный комментарий, id
его Gravatar-изображения; порядковый номер комментария на issue, время
его создания и модификации, а также сам комментарий. Вот часть
layout-файла, которая забирает комментарии поста посредством [jQuery]
[] (заметьте, что вам нужен Liquid-шаблон для определения ссылки на
issue, чтобы извлекать оттуда комментарии):

[GitHub issues API]: http://developer.github.com/v3/issues/
[jQuery]: http://api.jquery.com/jQuery.ajax/

{% highlight html %}
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js"></script>

<script type="text/javascript">
$.ajax('https://api.github.com/repos/visconte/visconte.github.com/issues/{{ special }}/comments', {
    dataType: 'json',
    headers: {Accept: 'application/vnd.github.html+json'},
    success: function(comments) {
        loadComments(comments);
    }
})
</script>
{% endhighlight %}

Подождите, разве не применяется [Правило ограничения домена] [SOP] в
случае XHR-запроса к GitHub API со страницы блога? Да, конечно
применяется. И до недавнего времени, единственный способ обойти это
ограничение состоял в использовании [JSONP] []. Однако, JSONP не
позволяет изменять HTTP-заголовок запроса, что необходимо для задания
требуемого [Mime-типа] [Mime] отклика GitHub API в заголовке `Accept`
(смотри код выше). Но с недавних пор GitHub поддерживает
[спецификацию CORS] [CORS], позволяющую делать кросс-доменные запросы.
Способ, которым [GitHub API реализует CORS] [API], состоит в
регистрации веб-сайтов как OAuth-приложений для доступа к API. Чтобы
разрешить CORS блогу на GitHub, необходимо перейти к
[форме регистрации OAuth-приложений] [new] и создать новое приложение,
указав при этом URL блога в полях <<Main URL>> и <<Callback URL>>.
Заметьте, что данный способ подходит (и остаётся неизменным) не только
для блогов внутри доменной зоны GitHub (например,
`visconte.github.com`), но и для блогов на GitHub, имеющих
[собственный домен] [domains].

[SOP]: http://ru.wikipedia.org/wiki/Правило_ограничения_домена
[JSONP]: http://en.wikipedia.org/wiki/JSONP
[Mime]: http://developer.github.com/v3/mime/
[CORS]: http://www.w3.org/TR/cors/
[API]: http://developer.github.com/v3/#cross-origin-resource-sharing
[new]: https://github.com/settings/applications/new
[domains]: http://pages.github.com/#custom_domains

[![]({{ site.cloud }}/images/GitHub/github_oauth.png)]({{ site.cloud }}/images/GitHub/github_oauth.png)

### Отображение комментариев в блоге

Включим скачиваемые комментарии в layout-файл, генерирующий страницы
постов. Например, вот мой код для вставки комментариев:

{% highlight html %}
<script type="text/javascript" src="http://datejs.googlecode.com/svn/trunk/build/date-ru-RU.js"></script>

<script>
function loadComments(comments) {
    for (var i=0; i<comments.length; i++) {
    var cuser = comments[i].user.login;
    var cuserlink = 'https://www.github.com/' + cuser;
    var clink = 'https://github.com/visconte/visconte.github.com/issues/{{ special }}#issuecomment-' + comments[i].id;
    var cbody = comments[i].body_html;
    var cavatarlink = comments[i].user.avatar_url;
    var cdate = Date.parse(comments[i].created_at).toString("MMMM d, yyyy HH:mm");

    $('#comments').append('<div class="comment"><div class="cmeta"><p class="author"><span class="gravatar"><img height="20" width="20" src="' + cavatarlink + '"></span> <strong><a href="' + cuserlink + '">' + cuser + '</a></strong> <a href="' + clink + '">комментирует</a></p><p class="date"><a href="' + clink + '">' + cdate + '</a> <span class="icon"></span></p></div><div class="body">' + cbody + '</div></div>')
    }
};
</script>
{% endhighlight %}

Для придания лучшего вида комментариям, мною используется
[библиотека DateJS] [DateJS] для представления даты комментария, а к
пользователям добавляются их Gravatar-изображения. Остаётся добавить
CSS-правила для комментариев, чтобы получить следующий вид:

[DateJS]: http://www.datejs.com/

[![]({{ site.cloud }}/images/GitHub/blog-post-comments.png)]({{ site.cloud }}/images/GitHub/blog-post-comments.png)

Вот и всё! Создание системы комментариев было достаточно просто, ведь
у GitHub уже есть все необходимые составляющие (Issue-трекер, GitHub
API, регистрация OAuth-приложений), и всё, что нам было нужно --- это
немного клея, чтобы связать это воедино. Мне нравится, что система
интегрируется с аккаунтами GitHub, комментарии блога можно видеть на
страницах с issue, а также простота использования системы комментариев
в целом. Весь код, что используется для системы комментариев, ---
единый layout-файл для постов блога и CSS-правила --- вы найдёте
[здесь] [gist]. Дайте мне знать, если вы обнаружите лучший способ для
размещения комментариев блога на GitHub или найдёте, как улучшить
этот.

[gist]: https://gist.github.com/2595062

*Прим.* Этот пост представляет собой близкие к оригиналу изложение
поста [GitHub hosted comments for GitHub hosted blogs] [original]
пользователя [Ivan Zuzak] []. Выражаю глубокую признательность автору
за проделанный труд.

[original]: http://ivanzuzak.info/2011/02/18/github-hosted-comments-for-github-hosted-blogs.html
[Ivan Zuzak]: http://ivanzuzak.info/

<!-- Local IspellDict: russian -->
