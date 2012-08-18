---
layout: post
title: Установка Linux на компьютер с предустановленной Windows
commentIssueId: 3
category: Linux
---

Сегодня многие компьютеры и ноутбуки попадают в руки поклонников Linux
с предустановленной Windows, любезно предоставленной
заводом-изготовителем. Возникает дилемма: удалять или не удалять, и
способ установки уже любимой OS зависит от её решения. Как правило,
изготовитель заранее побеспокоился о том, чтобы установка
дополнительной OS доставила вам множество незабываемых минут, часов,
дней и прочих радостей. Труден путь тех, кто не решился стереть все
воспоминания о Windows с диска, но дорогу осилит идущий.

<!--more-->

### Подготовка разделов диска

Способов установки дополнительной системы к Windows мало, поскольку
последняя поддерживает только таблицу разделов [MBR] [], возможности
которой ограничены 4 первичными разделами или 3 первичными и одним
расширенным. Как правило, три первичных раздела уже задействованы:
один --- под восстановление системы, и ещё два --- под Windows. Мы же
силами Linux LiveCD и редактора разделов Gparted подвинем полномочия
Windows, уменьшив его раздел, а на освободившемся пространстве
создадим расширенный (Extended) раздел под Linux. Предварительно,
полезно ознакомиться с тем, как правильно [выравнивать разделы диска]
[align]. Для Linux желательно создавать не менее трёх логических
разделов: подкачки (swap), корневой и под домашний каталог.

[MBR]: http://ru.wikipedia.org/wiki/Главная_загрузочная_запись
[align]: http://www.linux.org.ru/wiki/en/Выравнивание_разделов_диска

[![]({{ site.imgdir }}/Linux/gparted-partition-table.png)]({{ site.imgdir }}/Linux/gparted-partition-table.png)

### Установка загрузчика

Можно было бы поместить загрузчик Grub на один из Windows-разделов,
если бы не неприкрытая любовь MicroSoft к NTFS. Для Grub эта файловая
система не подходит, поэтому установите Grub в корневой раздел Linux и
скопируйте файл настройки (`/boot/grub/grub.cfg` для Grub 2) в место,
доступное из-под Windows. BIOS будет передавать управление Windows, а
уже потом будет грузиться Grub. Однако, Windows не обладает
способностью грузить разделы с файловыми системами Linux. Нам нужен
посредник, для чего можно воспользоваться проектом [Grub For DOS]
[grub4dos] или [Grub 2 For DOS] [grub24dos]. Оба они равноправны,
первый создан на основе Grub, второй --- на основе Grub 2. Об
использовании Grub For DOS очень обстоятельно рассказано [здесь]
[article], ну а для пользователей дистрибутивов на основе Grub 2
настоящей находкой является Grub 2 For DOS, о котором и пойдёт речь
дальше.

[grub4dos]: http://sourceforge.net/projects/grub4dos/
[grub24dos]: http://sourceforge.net/projects/grub24dos/
[article]: http://ru.d-ws.biz/articles/install-ubuntu-from-flash-on-s205.shtml

Установка Grub 2 For DOS очень проста: скачайте архив с сайта и
распакуйте в корень Windows-раздела (обычно, это диск `C`), там должна
появиться папка `grub`. Запустите `C:\grub\install\grub24dos.exe` и
выполните его настройку, после этого инсталлятор добавит новую запись
<<Grub 2 For DOS>> в меню загрузки Windows. Для наших целей достаточно
выставить <<Windows boot timeout>>, остальные данные продублируйте из
своего дистрибутива, поместив сохранённый `grub.cfg` в `C:\grub`.
Теперь выбор <<Grub 2 For DOS>> в меню загрузки перенесёт вас в Grub
2.

*Прим. При любых изменениях, вносимых в конфигурацию Grub 2, не
забывайте обновлять меню, подкладывая Grub 2 For DOS изменённый
`grub.cfg`.*

### Ручная настройка BCD

Наверняка вам известно, что для загрузки, начиная с Windows Vista,
используется [Boot Configuration Data] [bcd] (BCD), которую
модифицирует Grub 2 For DOS. Для тонкой настройки меню загрузки
предназначена специальная утилита **bcdedit**. Желательно перед любыми
изменениями создавать резервную копию BCD в соответствии с
[инструкцией] [backup].

[bcd]: http://en.wikipedia.org/wiki/Windows_Vista_startup_process#Boot_Configuration_Data
[backup]: http://sourcedaddy.com/windows-7/how-to-back-up-and-restore-settings.html

С помощью строки поиска в главном меню Windows найдите интерпретатор
командной строки `cmd` и выберите вариант запуска <<Run as
administrator>>. Используя подробную справку `bcdedit /v` по записям в
BCD, каждой из которых соответствует уникальный GIUD, найдите <<Grub 2
For DOS>>. Можно выставить <<Grub 2 For DOS>> первым в меню

{% highlight bat %}
bcdedit /displayorder {GUID} /addfirst
{% endhighlight %}

а также сделать пунктом по умолчанию

{% highlight bat %}
bcdedit /default {GUID}
{% endhighlight %}

Дальнейшее описывает шаги по созданию записи <<Grub 2 For DOS>> с нуля
на тот случай, если вы пожелаете это сделать самостоятельно. Новая
запись в BCD создаётся командой

{% highlight bat %}
bcdedit /set {GUID} path \grub\winloader\grub.boot
{% endhighlight %}

После этого будет отображен GUID новой записи, который нужно
подставлять в следующих командах. Укажем раздел, на котором находится
Grub 2 For DOS

{% highlight bat %}
bcdedit /set {GUID} device partition=C:
{% endhighlight %}

и местоположение загрузчика

{% highlight bat %}
bcdedit /set {GUID} path \grub\winloader\grub.boot
{% endhighlight %}

Новая запись будет добавлена в меню загрузки только после выполнения
команды

{% highlight bat %}
bcdedit /displayorder {GUID} /addfirst
{% endhighlight %}

Если `/addfirst` заменить на `/addlast`, то новая запись будет
добавлена в меню загрузки не первой, а последней. Остаётся сделать
запись выбором по умолчанию

{% highlight bat %}
bcdedit /default {GUID}
{% endhighlight %}

и установить время ожидания меню

{% highlight bat %}
bcdedit /timeout 5
{% endhighlight %}