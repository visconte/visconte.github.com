---
layout: post
title: Добавление системы комментариев в GitHub Pages
---

GitHub --- это не только статические HTML страницы, но и замечательная
система комментариев... предназначенная для Issue-трекера. У
приверженцев хостинга GitHub рано или поздно должна была появиться
идея использовать Issue-трекер для комментирования постов на GitHub
Pages. Вашему вниманию представляется перевод поста
[GitHub hosted comments for GitHub hosted blogs](http://ivanzuzak.info/2011/02/18/github-hosted-comments-for-github-hosted-blogs.html)
пользователя [Ivan Zuzak](http://ivanzuzak.info/).

Недавно,
[при миграции](http://ivanzuzak.info/2011/01/02/enabling-pubsubhubbub-for-github-hosted-blogs.html)
хостинга блога с Wordpress.com на GitHub мне стало любопытно: не могли
бы комментарии блога быть также как-нибудь размещены на GitHub. Зачем
размещать комментарии на GitHub? Кроме того, что это по-настоящему
классно, открыто и изменяемо, это дало бы возможность держать *всё*
содержимое блога на GitHub.

Итак, что бы я хотел от будущей системы комментариев:

* должна полностью храниться на GitHub.

* должна быть привязана к GitHub-репозиторию, на котором находится
  блог.

* должна поддерживать имена пользователей, привязывать каждый
  комментарий к пользователю, что оставил его, предоставлять
  владельцам блогов и пользователям контроль над их комментариями.

* должна быть возможность извлекать комментарии для поста из системы и
  отображать их на Web-странице поста.

* должна быть проста при установке владельцем блога и при
  использовании читателями блога.

Эти требования исключают использование
[Gist'ов](https://gist.github.com/), требующих от пользователей
создания fork'а репозитория и представления pull-запроса в специальный
файл для комментариев (ох, это было фактически первое, о чём я
подумал) или использование внешних сервисов для создания и/или
хранения комментариев.

Решение, к которому я пришёл, это использовать
[issue-трекер GitHub'а](https://github.com/blog/411-github-issue-tracker)
для создания и хранения комментариев и
[GitHub API](http://developer.github.com/v3/) для извлечения
комментариев из issue-трекера на Web-страницу блога, а также
[GitHub Flavored Markdown](http://github.github.com/github-flavored-markdown/)
для представления комментариев на Web-странице, используя
JavaScript. Вот, как всё это работает.

![](/images/github/github_issues.png "{{ page.title }}"){:.aligncenter}

Во-первых, для каждого поста, что вы планируете опубликовать, создайте
issue на issue-трекере GitHub-репозитория вашего блога. Например, вот
[issue для данного поста](https://github.com/izuzak/izuzak.github.com/issues/12). Заметьте,
что все issue имеют общий базовый URL
(`https://github.com/izuzak/izuzak.github.com/issues/` в моём примере)
и уникальный id (`12` в моём примере). Читатели вашего блога будут
использовать этот issue-трекер, когда захотят оставить комментарий.

Во-вторых, добавьте ссылку к каждому посту, указывающую на
Web-страницу с issue, что вы создали для комментариев. Так как вы
вероятно используете [Jekyll](https://github.com/mojombo/jekyll) для
генерации вашего блога, то простой способ это сделать --- добавить
ранее упоминавшийся id для issue в
[YAML front matter](https://github.com/mojombo/jekyll/wiki/YAML-Front-Matter)
блок к посту блога и затем добавить
[Liquid-шаблон](https://github.com/mojombo/jekyll/wiki/Liquid-Extensions)
в [layout-файл](https://github.com/mojombo/jekyll/wiki/Usage) для
извлечения id и генерации полной ссылки на issue. Например, вот YAML
front matter для поста, что вы читаете (`commentIssueId` --- это id
для issue поста на issue-трекере репозитория):

{% highlight yaml linenos %}
---
layout: post
title: GitHub hosted comments for GitHub hosted blogs
tags: github, blog, comments, hosting
commentIssueId: 12
---
{% endhighlight %}

А вот фрагмент layout-файла для генерации постов блога
(часть `page.commentIssueId`, заключённая в фигурные скобки, --- это
Liquid-шаблон, который извлекает `commentIssueId` для поста):

{% assign special = '{{page.commentIssueId}}' %}
{% highlight html linenos %}
<div id="comments">
  <h2>Comments</h2>
  <div id="header">
    Want to leave a comment? Visit <a href="https://github.com/izuzak/izuzak.github.com/issues/{{special}}"> this post's issue page on GitHub</a> (you'll need a GitHub account. What? Like you already don't have one?!).
  </div>
</div>
{% endhighlight %}

В-третьих, добавьте JavaScript сценарий к каждому посту блога, который
будет извлекать комментарии поста из issue, используя GitHub
API. [GitHub issues API](http://developer.github.com/v3/issues/) как
раз то, что нам сейчас нужно --- сделать JSONP запрос на вход
API-сервера и получить все комментарии для конкретного issue. Для
каждого комментария вы получаете пользовательский GitHub id и id
граватара для пользователя, что оставил данный комментарий, id
комментария на issue, времена создания и модификации, а также сам
комментарий. Ещё, так как вы вероятно используете Jekyll, то проще
всего поместить соответствующий код в layout-файл для постов
блога. Например, вот код, чтобы забирать комментарии данного поста
посредством [jQuery](http://api.jquery.com/jQuery.ajax/) (отметьте
ещё, что вам нужен Liquid-шаблон для определения ссылки на issue, из
которого вы хотите извлекать комментарии):


Fourth, insert the pulled comment data into the blog post's HTML and
render the body of the comments using GitHub Flavored
Markdown. Inserting the comment data into the DOM is easy once you
decide which data you want to display. However, since issue comments
may be written in GitHub Flavored Markdown, some JavaScrip code is
needed to translate the comment to HTML. Fortunately, GitHub has a
JavaScript library for that also - a modified version of the Showdown
library for converting Markdown into HTML. Again, it's easiest if you
put the code in the layout file for blog posts. For example, here's
the code which I use for inserting comments:

Also notice that I use the DateJS library to pretty-print the comment
dates and that I fetch the Gravatar images of users who made the
comments.

Finally, add CSS rules to make the comments look pretty. And if you're
extra geeky and love GitHub like me, make the comments look like
GitHub code comments:

And that's it! Creating the system was really easy - GitHub already
had all the pieces necessary (Issue tracker, API, Markdown JavaScript
library) and all I needed was a bit of glue to tie all of them
together. I'm using this as the commenting system for my blog until
some serious problem turns up. I like how the system integrates with
GitHub login, how all blog comments are visible on the issue page and
the overall simplicity of using the system. What I didn't find an easy
way of doing is creating issue comments directly from the a blog
post's Web page, without making the user navigate to the Issue tracker
page (really hard to do without an external service since the blog is
a static site). Other than that, I'm not sure what will happen when
spam bots start invading GitHub issue trackers.

You can see the complete code I'm using for the commenting system in
the following files: general layout for blog posts and CSS rules. Let
me know if you find a better system for hosting blog comments on
GitHub or improving this one. @izuzak
