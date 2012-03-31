---
layout: post
title: "GitHub Pages: дальнейшая интеграция, или комментарии блога на GitHub"
category: github
commentIssueId: 1
---

Если бы системы комментариев ограничивались только Disqus,
IntenseDebate и тому подобными, то окружающий мир блогов был бы чуть
скучнее, а гитхабберы, размещающие свои странички на [GitHub Pages]
[], были бы лишены тех возможностей, что так полюбились им на
GitHub. Хочу представить вам новую интегрированную с GitHub систему
комментариев, действующую на этом блоге. И хотя это потребует
[регистрации на GitHub] [gh-reg], надеюсь, что комментарии блога и их
возможности придутся вам по душе.

[GitHub Pages]: http://pages.github.com/
[gh-reg]: https://github.com/signup/free

<!-- more -->

Для отправки комментария достаточно перейти по ссылке в
соответствующем [разделе](#comments) в конце поста. Ссылка ведёт на
Issue-трекер GitHub, хранящий комментарии блога и предоставляющий им
тот же арсенал средств, что и в проектах на GitHub. На страницах блога
комментарии отображаются посредством JavaScript. Хотите больше узнать
об их возможностях?  Читайте дальше.

### Создавайте разметку текста легко

Если вы ещё не знакомы с [Markdown] [], облегчённым языком разметки,
то сделать это можно в непринуждённой обстановке обсуждения. Помимо
простого текста, Markdown распознаёт структурные вставки для создания
разметки, добавления гиперссылок и картинок, и всё это --- на простом
и интуитивном уровне. Недаром эта разметка так полюбилась
пользователям GitHub, что они придумали собственное расширение,
[GitHub Flavored Markdown] [gfm], и используют его повсеместно, в том
числе --- в комментариях.

[Markdown]: http://daringfireball.net/projects/markdown/syntax
[gfm]: http://github.github.com/github-flavored-markdown/

### Выражайте эмоции посредством Emoji
{: #section-emoji}

Достигнуть эффекта большей выразительности и эмоциональности вам
поможет уникальный набор иконок Emoji. GitHub использует наборы
символов, которые преобразуются в замечательные иконки в соответствии
с таблицей ниже.

{% for item in (1..75) %}{% capture imoji_name %}{% cycle '+1', '-1', 'airplane', 'apple', 'art', 'bear', 'beer', 'bike', 'bomb', 'book', 'broken_heart', 'bulb', 'bus', 'cake', 'calling', 'cat', 'clap', 'computer', 'cool', 'cop', 'couple', 'dog', 'dolphin', 'email', 'feet', 'fire', 'fish', 'fist', 'gift', 'hammer', 'heart', 'horse', 'iphone', 'key', 'kiss', 'koala', 'leaves', 'lips', 'lipstick', 'lock', 'mag', 'mega', 'memo', 'metal', 'moneybag', 'nail_care', 'new', 'octocat', 'ok', 'pencil', 'princess', 'punch', 'rainbow', 'rose', 'runner', 'scissors', 'shipit', 'ski', 'smoking', 'sparkles', 'star', 'sunflower', 'sunny', 'taxi', 'thumbsdown', 'thumbsup', 'tm', 'tophat', 'train', 'v', 'vs', 'warning', 'wheelchair', 'zap', 'zzz' %}{% endcapture %}
* ![:{{ imoji_name }}:]({{ site.cloud }}/images/icons/emoji/{{ imoji_name }}.png ":{{ imoji_name }}:"){: .emoji} `:{{ imoji_name }}:`{% endfor %}
{: #github-emoji}

### Принимайте участие в дискуссиях

Пригласить пользователя в дискуссию очень просто --- достаточно в
комментарии набрать `@имя_пользователя`, и ваш собеседник получит
уведомление об этом.

[![]({{ site.cloud }}/images/github/mentioning-in-a-comment.jpg)]({{ site.cloud }}/images/github/mentioning-in-a-comment.jpg)

Если вы оставили комментарий к посту или получили приглашение, вы
будете автоматически подписаны на всё дальнейшее обсуждение. Ссылка
внизу страницы с комментариями позволяет подписаться на дискуссию
самостоятельно или, наоборот, отписаться от неё.

[![]({{ site.cloud }}/images/github/comments-notifications.jpg)]({{ site.cloud }}/images/github/comments-notifications.jpg)

Если нет желания вступать в дискуссии, то оповещения о вашем
упоминании в комментариях можно отключить в [Notification Center] [].

[Notification Center]: https://github.com/account/notifications

[![]({{ site.cloud }}/images/github/managing-notifications.jpg)]({{ site.cloud }}/images/github/managing-notifications.jpg)

### Отправляйте ответы по email

Свой ответ на комментарий вы можете послать по email, используя
почтовый ящик, указанный в аккаунте GitHub.

[![]({{ site.cloud }}/images/github/sending-an-email.jpg)]({{ site.cloud }}/images/github/sending-an-email.jpg)

На сегодняшний день обеспечена поддержка только простого текста,
поэтому вставки HTML-кода и прикреплённые файлы
игнорируются. Отправленный по email ответ будет опубликован в
комментариях.

[![]({{ site.cloud }}/images/github/plaintext-comment.jpg)]({{ site.cloud }}/images/github/plaintext-comment.jpg)

### Используйте поиск по комментариям

Данный поиск доступен на странице с комментариями.

[![]({{ site.cloud }}/images/github/issue-search.png)]({{ site.cloud }}/images/github/issue-search.png)

### Полезные ссылки

1. [Emoji cheat sheet for Campfire and GitHub](http://www.emoji-cheat-sheet.com/)
2. [Mention @somebody. They're notified](https://github.com/blog/821-mention-somebody-they-re-notified)
3. [Reply to Comments from Email](https://github.com/blog/811-reply-to-comments-from-email)

<!-- Local IspellDict: russian -->
