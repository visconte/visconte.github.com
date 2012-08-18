function clippyCopiedCallback(a) {
    var b = $("#clippy_tooltip_" + a);
    if (b.length == 0) return;
    b.attr("title", "copied!").trigger("tipsy.reload"), setTimeout(function () {
        b.attr("title", "copy to clipboard")
    }, 500)
}
function defineNetwork(a) {
    var b = function (a, b, c) {
            this.container = a, this.width = b, this.height = c, this.loaderInterval = null, this.loaderOffset = 0, this.ctx = this.initCanvas(a, b, c), this.startLoader("Loading graph data"), this.loadMeta()
        };
    return b.prototype = {
        initCanvas: function (b, c, d) {
            var e = a(b).find("canvas")[0];
            return e.style.zIndex = "0", e.getContext("2d")
        },
        startLoader: function (a) {
            this.ctx.save(), this.ctx.font = "14px Monaco, monospace", this.ctx.fillStyle = "#99b2cc", this.ctx.textAlign = "center", this.ctx.fillText(a, this.width / 2, 85), this.ctx.restore();
            var b = this;
            this.loaderInterval = setInterval(function () {
                b.displayLoader()
            }, 75)
        },
        stopLoader: function () {
            clearInterval(this.loaderInterval)
        },
        displayLoader: function () {
            colors = ["#36689a", "#4a77a4", "#5e86ae", "#9cb4cd"], this.ctx.save(), this.ctx.translate(this.width / 2 + .5, 50), this.ctx.clearRect(-16, -16, 32, 32), this.ctx.rotate(this.loaderOffset * (Math.PI / 6));
            for (var a = 0; a < 12; a++) this.ctx.fillStyle = colors[a] || "#c4d2e1", this.ctx.beginPath(), this.ctx.moveTo(-1.5, -8), this.ctx.lineTo(-1.5, -15), this.ctx.lineTo(0, -16), this.ctx.lineTo(1.5, -15), this.ctx.lineTo(1.5, -8), this.ctx.lineTo(-1.5, -8), this.ctx.fill(), this.ctx.rotate(-Math.PI / 6);
            this.ctx.restore(), this.loaderOffset = (this.loaderOffset + 1) % 12
        },
        waitForCurrent: function (b) {
            var c = this;
            if (c.current) {
                b({
                    current: !0
                });
                return
            }
            a(".js-network-poll").each(function () {
                var d = a(this).attr("rel");
                a.smartPoller(function (e) {
                    a.getJSON("/cache/network_current/" + d, function (a) {
                        a && a.current ? (c.current = !0, b(a)) : e()
                    })
                })
            })
        },
        loadMeta: function () {
            var b = this;
            b.loaded = !1, a.smartPoller(function (c) {
                a.ajax({
                    url: "network_meta",
                    dataType: "json",
                    success: function (d) {
                        d && d.nethash ? (b.loaded = !0, b.init(d)) : b.waitForCurrent(function () {
                            a(".js-network-poll").hide(), a(".js-network-current").show(), b.loaded || c()
                        })
                    },
                    error: function () {
                        c()
                    }
                })
            })
        },
        init: function (a) {
            this.focus = a.focus, this.nethash = a.nethash, this.spaceMap = a.spacemap, this.userBlocks = a.blocks, this.commits = [];
            for (var c = 0; c < a.dates.length; c++) this.commits.push(new b.Commit(c, a.dates[c]));
            this.users = {};
            for (var c = 0; c < a.users.length; c++) {
                var d = a.users[c];
                this.users[d.name] = d
            }
            this.chrome = new b.Chrome(this, this.ctx, this.width, this.height, this.focus, this.commits, this.userBlocks, this.users), this.graph = new b.Graph(this, this.ctx, this.width, this.height, this.focus, this.commits, this.users, this.spaceMap, this.userBlocks, this.nethash), this.mouseDriver = new b.MouseDriver(this.container, this.chrome, this.graph), this.keyDriver = new b.KeyDriver(this.container, this.chrome, this.graph), this.stopLoader(), this.graph.drawBackground(), this.chrome.draw(), this.graph.requestInitialChunk()
        },
        initError: function () {
            this.stopLoader(), this.ctx.clearRect(0, 0, this.width, this.height), this.startLoader("Graph could not be drawn due to a network IO problem.")
        }
    }, b.Commit = function (a, b) {
        this.time = a, this.date = Date.parseISO8601(b), this.requested = null, this.populated = null
    }, b.Commit.prototype = {
        populate: function (a, b, c) {
            this.user = b, this.author = a.author, this.date = Date.parseISO8601(a.date), this.gravatar = a.gravatar, this.id = a.id, this.login = a.login, this.message = a.message, this.space = a.space, this.time = a.time, this.parents = this.populateParents(a.parents, c), this.requested = !0, this.populated = new Date
        },
        populateParents: function (a, b) {
            var c = [];
            for (var d = 0; d < a.length; d++) {
                var e = a[d],
                    f = b[e[1]];
                f.id = e[0], f.space = e[2], c.push(f)
            }
            return c
        }
    }, b.Chrome = function (a, b, c, d, e, f, g, h) {
        this.namesWidth = 100, this.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], this.userBgColors = ["#EBEBFF", "#E0E0FF"], this.network = a, this.ctx = b, this.width = c, this.height = d, this.commits = f, this.userBlocks = g, this.users = h, this.offsetX = this.namesWidth + (c - this.namesWidth) / 2 - e * 20, this.offsetY = 0, this.contentHeight = this.calcContentHeight(), this.graphMidpoint = this.namesWidth + (c - this.namesWidth) / 2, this.activeUser = null
    }, b.Chrome.prototype = {
        moveX: function (a) {
            this.offsetX += a, this.offsetX > this.graphMidpoint ? this.offsetX = this.graphMidpoint : this.offsetX < this.graphMidpoint - this.commits.length * 20 && (this.offsetX = this.graphMidpoint - this.commits.length * 20)
        },
        moveY: function (a) {
            this.offsetY += a, this.offsetY > 0 || this.contentHeight < this.height - 40 ? this.offsetY = 0 : this.offsetY < -this.contentHeight + this.height / 2 && (this.offsetY = -this.contentHeight + this.height / 2)
        },
        calcContentHeight: function () {
            var a = 0;
            for (var b = 0; b < this.userBlocks.length; b++) {
                var c = this.userBlocks[b];
                a += c.count
            }
            return a * 20
        },
        hover: function (a, b) {
            for (var c = 0; c < this.userBlocks.length; c++) {
                var d = this.userBlocks[c];
                if (a > 0 && a < this.namesWidth && b > 40 + this.offsetY + d.start * 20 && b < 40 + this.offsetY + (d.start + d.count) * 20) return this.users[d.name]
            }
            return null
        },
        draw: function () {
            this.drawTimeline(this.ctx), this.drawUsers(this.ctx), this.drawFooter(this.ctx)
        },
        drawTimeline: function (a) {
            a.fillStyle = "#111111", a.fillRect(0, 0, this.width, 20), a.fillStyle = "#333333", a.fillRect(0, 20, this.width, 20);
            var b = parseInt((0 - this.offsetX) / 20);
            b < 0 && (b = 0);
            var c = b + parseInt(this.width / 20);
            c > this.commits.length && (c = this.commits.length), a.save(), a.translate(this.offsetX, 0), a.font = "10px Helvetica, sans-serif";
            var d = null,
                e = null;
            for (var f = b; f < c; f++) {
                var g = this.commits[f],
                    h = this.months[g.date.getMonth()];
                h != d && (a.fillStyle = "#ffffff", a.fillText(h, f * 20 - 3, 14), d = h);
                var i = parseInt(g.date.getDate());
                i != e && (a.fillStyle = "#ffffff", a.fillText(i, f * 20 - 3, 33), e = i)
            }
            a.restore()
        },
        drawUsers: function (a) {
            a.fillStyle = "#FFFFFF", a.fillRect(0, 0, this.namesWidth, this.height), a.save(), a.translate(0, 40 + this.offsetY);
            for (var b = 0; b < this.userBlocks.length; b++) {
                var c = this.userBlocks[b];
                a.fillStyle = this.userBgColors[b % 2], a.fillRect(0, c.start * 20, this.namesWidth, c.count * 20), this.activeUser && this.activeUser.name == c.name && (a.fillStyle = "rgba(0, 0, 0, 0.05)", a.fillRect(0, c.start * 20, this.namesWidth, c.count * 20)), a.fillStyle = "#DDDDDD", a.fillRect(0, c.start * 20, 1, c.count * 20), a.fillRect(this.namesWidth - 1, c.start * 20, 1, c.count * 20), a.fillRect(this.width - 1, c.start * 20, 1, c.count * 20), a.fillRect(0, (c.start + c.count) * 20 - 1, this.namesWidth, 1);
                var d = a.measureText(c.name).width,
                    e = (c.start + c.count / 2) * 20 + 3;
                a.fillStyle = "#000000", a.font = "12px Monaco, monospace", a.textAlign = "center", a.fillText(c.name, this.namesWidth / 2, e, 96)
            }
            a.restore(), a.fillStyle = "#111111", a.fillRect(0, 0, this.namesWidth, 20), a.fillStyle = "#333333", a.fillRect(0, 20, this.namesWidth, 20)
        },
        drawFooter: function (a) {
            a.fillStyle = "#F4F4F4", a.fillRect(0, this.height - 20, this.width, 20), a.fillStyle = "#CCCCCC", a.fillRect(0, this.height - 20, this.width, 1), a.fillStyle = "#000000", a.font = "11px Monaco, monospace", a.fillText("GitHub Network Graph Viewer v4.0.0", 5, this.height - 5)
        }
    }, b.Graph = function (a, b, c, d, e, f, g, h, i, j) {
        this.namesWidth = 100, this.spaceColors = [], this.bgColors = ["#F5F5FF", "#F0F0FF"], this.spaceColors.push("#FF0000"), this.spaceColors.push("#0000FF"), this.spaceColors.push("#00FF00"), this.spaceColors.push("#FF00FF"), this.spaceColors.push("#E2EB00"), this.spaceColors.push("#FFA600"), this.spaceColors.push("#00FFFC"), this.spaceColors.push("#DD458E"), this.spaceColors.push("#AD7331"), this.spaceColors.push("#97AD31"), this.spaceColors.push("#51829D"), this.spaceColors.push("#70387F"), this.spaceColors.push("#740000"), this.spaceColors.push("#745C00"), this.spaceColors.push("#419411"), this.spaceColors.push("#37BE8C"), this.spaceColors.push("#6C5BBD"), this.spaceColors.push("#F300AA"), this.spaceColors.push("#586D41"), this.spaceColors.push("#3B4E31"), this.network = a, this.ctx = b, this.width = c, this.height = d, this.focus = e, this.commits = f, this.users = g, this.spaceMap = h, this.userBlocks = i, this.nethash = j, this.offsetX = this.namesWidth + (c - this.namesWidth) / 2 - e * 20, this.offsetY = 0, this.bgCycle = 0, this.marginMap = {}, this.gravatars = {}, this.activeCommit = null, this.contentHeight = this.calcContentHeight(), this.graphMidpoint = this.namesWidth + (c - this.namesWidth) / 2, this.showRefs = !0, this.lastHotLoadCenterIndex = null, this.connectionMap = {}, this.spaceUserMap = {};
        for (var k = 0; k < i.length; k++) {
            var l = i[k];
            for (var m = l.start; m < l.start + l.count; m++) this.spaceUserMap[m] = g[l.name]
        }
        this.headsMap = {};
        for (var k = 0; k < i.length; k++) {
            var l = i[k],
                n = g[l.name];
            for (var m = 0; m < n.heads.length; m++) {
                var o = n.heads[m];
                this.headsMap[o.id] || (this.headsMap[o.id] = []);
                var p = {
                    name: n.name,
                    head: o
                };
                this.headsMap[o.id].push(p)
            }
        }
    }, b.Graph.prototype = {
        moveX: function (a) {
            this.offsetX += a, this.offsetX > this.graphMidpoint ? this.offsetX = this.graphMidpoint : this.offsetX < this.graphMidpoint - this.commits.length * 20 && (this.offsetX = this.graphMidpoint - this.commits.length * 20), this.hotLoadCommits()
        },
        moveY: function (a) {
            this.offsetY += a, this.offsetY > 0 || this.contentHeight < this.height - 40 ? this.offsetY = 0 : this.offsetY < -this.contentHeight + this.height / 2 && (this.offsetY = -this.contentHeight + this.height / 2)
        },
        toggleRefs: function () {
            this.showRefs = !this.showRefs
        },
        calcContentHeight: function () {
            var a = 0;
            for (var b = 0; b < this.userBlocks.length; b++) {
                var c = this.userBlocks[b];
                a += c.count
            }
            return a * 20
        },
        hover: function (a, b) {
            var c = this.timeWindow();
            for (var d = c.min; d <= c.max; d++) {
                var e = this.commits[d],
                    f = this.offsetX + e.time * 20,
                    g = this.offsetY + 50 + e.space * 20;
                if (a > f - 5 && a < f + 5 && b > g - 5 && b < g + 5) return e
            }
            return null
        },
        hotLoadCommits: function () {
            var a = 200,
                b = parseInt((-this.offsetX + this.graphMidpoint) / 20);
            b < 0 && (b = 0), b > this.commits.length - 1 && (b = this.commits.length - 1);
            if (this.lastHotLoadCenterIndex && Math.abs(this.lastHotLoadCenterIndex - b) < 10) return;
            this.lastHotLoadCenterIndex = b;
            var c = this.backSpan(b, a),
                d = this.frontSpan(b, a);
            if (c || d) {
                var e = c ? c[0] : d[0],
                    f = d ? d[1] : c[1];
                this.requestChunk(e, f)
            }
        },
        backSpan: function (a, b) {
            var c = null;
            for (var d = a; d >= 0 && d > a - b; d--) if (!this.commits[d].requested) {
                c = d;
                break
            }
            if (c != null) {
                var e = null,
                    f = null;
                for (var d = c; d >= 0 && d > c - b; d--) if (this.commits[d].requested) {
                    e = d;
                    break
                }
                return e ? f = e + 1 : (f = c - b, f < 0 && (f = 0)), [f, c]
            }
            return null
        },
        frontSpan: function (a, b) {
            var c = null;
            for (var d = a; d < this.commits.length && d < a + b; d++) if (!this.commits[d].requested) {
                c = d;
                break
            }
            if (c != null) {
                var e = null,
                    f = null;
                for (var d = c; d < this.commits.length && d < c + b; d++) if (this.commits[d].requested) {
                    e = d;
                    break
                }
                return e ? f = e - 1 : c + b >= this.commits.length ? f = this.commits.length - 1 : f = c + b, [c, f]
            }
            return null
        },
        requestInitialChunk: function () {
            var b = this;
            a.getJSON("network_data_chunk?nethash=" + this.nethash, function (a) {
                b.importChunk(a), b.draw(), b.network.chrome.draw()
            })
        },
        requestChunk: function (b, c) {
            for (var d = b; d <= c; d++) this.commits[d].requested = new Date;
            var e = this,
                f = "network_data_chunk?nethash=" + this.nethash + "&start=" + b + "&end=" + c;
            a.getJSON(f, function (a) {
                e.importChunk(a), e.draw(), e.network.chrome.draw(), e.lastHotLoadCenterIndex = this.focus
            })
        },
        importChunk: function (a) {
            for (var b = 0; b < a.commits.length; b++) {
                var c = a.commits[b],
                    d = this.spaceUserMap[c.space],
                    e = this.commits[c.time];
                e.populate(c, d, this.commits);
                for (var f = 0; f < e.parents.length; f++) {
                    var g = e.parents[f];
                    for (var h = g.time + 1; h < e.time; h++) this.connectionMap[h] = this.connectionMap[h] || [], this.connectionMap[h].push(e)
                }
            }
        },
        timeWindow: function () {
            var a = parseInt((this.namesWidth - this.offsetX + 20) / 20);
            a < 0 && (a = 0);
            var b = a + parseInt((this.width - this.namesWidth) / 20);
            return b > this.commits.length - 1 && (b = this.commits.length - 1), {
                min: a,
                max: b
            }
        },
        draw: function () {
            this.drawBackground();
            var a = this.timeWindow(),
                b = a.min,
                c = a.max;
            this.ctx.save(), this.ctx.translate(this.offsetX, this.offsetY + 50);
            var d = {};
            for (var e = 0; e < this.spaceMap.length; e++) {
                var f = this.spaceMap.length - e - 1;
                for (var g = b; g <= c; g++) {
                    var h = this.commits[g];
                    h.populated && h.space == f && (this.drawConnection(h), d[h.id] = !0)
                }
            }
            for (var e = b; e <= c; e++) {
                var i = this.connectionMap[e];
                if (i) for (var g = 0; g < i.length; g++) {
                    var h = i[g];
                    d[h.id] || (this.drawConnection(h), d[h.id] = !0)
                }
            }
            for (var e = 0; e < this.spaceMap.length; e++) {
                var f = this.spaceMap.length - e - 1;
                for (var g = b; g <= c; g++) {
                    var h = this.commits[g];
                    h.populated && h.space == f && (h == this.activeCommit ? this.drawActiveCommit(h) : this.drawCommit(h))
                }
            }
            if (this.showRefs) for (var g = b; g <= c; g++) {
                var h = this.commits[g];
                if (h.populated) {
                    var j = this.headsMap[h.id];
                    if (j) {
                        var k = 0;
                        for (var l = 0; l < j.length; l++) {
                            var m = j[l];
                            if (this.spaceUserMap[h.space].name == m.name) {
                                var n = this.drawHead(h, m.head, k);
                                k += n
                            }
                        }
                    }
                }
            }
            this.ctx.restore(), this.activeCommit && this.drawCommitInfo(this.activeCommit)
        },
        drawBackground: function () {
            this.ctx.clearRect(0, 0, this.width, this.height), this.ctx.save(), this.ctx.translate(0, this.offsetY + 50), this.ctx.clearRect(0, -10, this.width, this.height);
            for (var a = 0; a < this.userBlocks.length; a++) {
                var b = this.userBlocks[a];
                this.ctx.fillStyle = this.bgColors[a % 2], this.ctx.fillRect(0, b.start * 20 - 10, this.width, b.count * 20), this.ctx.fillStyle = "#DDDDDD", this.ctx.fillRect(0, (b.start + b.count) * 20 - 11, this.width, 1)
            }
            this.ctx.restore()
        },
        drawCommit: function (a) {
            var b = a.time * 20,
                c = a.space * 20;
            this.ctx.strokeStyle = "#F7F7FF", this.ctx.lineWidth = 1.5, this.ctx.fillStyle = this.spaceColor(a.space), this.ctx.beginPath(), this.ctx.arc(b, c, 4, 0, Math.PI * 2, !1), this.ctx.fill(), this.ctx.stroke()
        },
        drawActiveCommit: function (a) {
            var b = a.time * 20,
                c = a.space * 20;
            this.ctx.strokeStyle = "#F7F7FF", this.ctx.lineWidth = 1.5, this.ctx.fillStyle = this.spaceColor(a.space), this.ctx.beginPath(), this.ctx.arc(b, c, 6, 0, Math.PI * 2, !1), this.ctx.fill(), this.ctx.stroke()
        },
        drawCommitInfo: function (a) {
            var b = this.splitLines(a.message, 54),
                c = 80 + 15 * b.length,
                d = this.offsetX + a.time * 20,
                e = 50 + this.offsetY + a.space * 20,
                f = 0,
                g = 0;
            d < this.graphMidpoint ? f = d + 10 : f = d - 410, e < 40 + (this.height - 40) / 2 ? g = e + 10 : g = e - c - 10, this.ctx.save(), this.ctx.translate(f, g), this.ctx.fillStyle = "#FFFFFF", this.ctx.strokeStyle = "#000000", this.ctx.lineWidth = "2", this.ctx.beginPath(), this.ctx.moveTo(0, 5), this.ctx.quadraticCurveTo(0, 0, 5, 0), this.ctx.lineTo(395, 0), this.ctx.quadraticCurveTo(400, 0, 400, 5), this.ctx.lineTo(400, c - 5), this.ctx.quadraticCurveTo(400, c, 395, c), this.ctx.lineTo(5, c), this.ctx.quadraticCurveTo(0, c, 0, c - 5), this.ctx.lineTo(0, 5), this.ctx.fill(), this.ctx.stroke();
            var h = this.gravatars[a.gravatar];
            if (h) this.drawGravatar(h, 10, 10);
            else {
                var i = this,
                    j = window.location.protocol;
                h = new Image, h.src = "https://secure.gravatar.com/avatar/" + a.gravatar + "?s=32&d=https%3A%2F%2Fgithub.com%2Fimages%2Fgravatars%2Fgravatar-32.png", h.onload = function () {
                    i.activeCommit == a && (i.drawGravatar(h, f + 10, g + 10), i.gravatars[a.gravatar] = h)
                }
            }
            this.ctx.fillStyle = "#000000", this.ctx.font = "bold 14px Helvetica, sans-serif", this.ctx.fillText(a.author, 55, 32), this.ctx.fillStyle = "#888888", this.ctx.font = "12px Monaco, monospace", this.ctx.fillText(a.id, 12, 65), this.drawMessage(b, 12, 85), this.ctx.restore()
        },
        drawGravatar: function (a, b, c) {
            this.ctx.strokeStyle = "#AAAAAA", this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.strokeRect(b + .5, c + .5, 35, 35), this.ctx.drawImage(a, b + 2, c + 2)
        },
        drawMessage: function (a, b, c) {
            this.ctx.font = "12px Monaco, monospace", this.ctx.fillStyle = "#000000";
            for (var d = 0; d < a.length; d++) {
                var e = a[d];
                this.ctx.fillText(e, b, c + d * 15)
            }
        },
        splitLines: function (a, b) {
            var c = a.split(" "),
                d = [],
                e = "";
            for (var f = 0; f < c.length; f++) {
                var g = c[f];
                e.length + 1 + g.length < b ? e = e == "" ? g : e + " " + g : (d.push(e), e = g)
            }
            return d.push(e), d
        },
        drawHead: function (a, b, c) {
            this.ctx.font = "10.25px Monaco, monospace", this.ctx.save();
            var d = this.ctx.measureText(b.name).width;
            this.ctx.restore();
            var e = a.time * 20,
                f = a.space * 20 + 5 + c;
            return this.ctx.save(), this.ctx.translate(e, f), this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)", this.ctx.beginPath(), this.ctx.moveTo(0, 0), this.ctx.lineTo(-4, 10), this.ctx.quadraticCurveTo(-9, 10, -9, 15), this.ctx.lineTo(-9, 15 + d), this.ctx.quadraticCurveTo(-9, 15 + d + 5, -4, 15 + d + 5), this.ctx.lineTo(4, 15 + d + 5), this.ctx.quadraticCurveTo(9, 15 + d + 5, 9, 15 + d), this.ctx.lineTo(9, 15), this.ctx.quadraticCurveTo(9, 10, 4, 10), this.ctx.lineTo(0, 0), this.ctx.fill(), this.ctx.fillStyle = "#FFFFFF", this.ctx.font = "12px Monaco, monospace", this.ctx.textBaseline = "middle", this.ctx.scale(.85, .85), this.ctx.rotate(Math.PI / 2), this.ctx.fillText(b.name, 17, -1), this.ctx.restore(), d + 20
        },
        drawConnection: function (a) {
            for (var b = 0; b < a.parents.length; b++) {
                var c = a.parents[b];
                b == 0 ? c.space == a.space ? this.drawBasicConnection(c, a) : this.drawBranchConnection(c, a) : this.drawMergeConnection(c, a)
            }
        },
        drawBasicConnection: function (a, b) {
            var c = this.spaceColor(b.space);
            this.ctx.strokeStyle = c, this.ctx.lineWidth = 2, this.ctx.beginPath(), this.ctx.moveTo(a.time * 20, b.space * 20), this.ctx.lineTo(b.time * 20, b.space * 20), this.ctx.stroke()
        },
        drawBranchConnection: function (a, b) {
            var c = this.spaceColor(b.space);
            this.ctx.strokeStyle = c, this.ctx.lineWidth = 2, this.ctx.beginPath(), this.ctx.moveTo(a.time * 20, a.space * 20), this.ctx.lineTo(a.time * 20, b.space * 20), this.ctx.lineTo(b.time * 20 - 14, b.space * 20), this.ctx.stroke(), this.threeClockArrow(c, b.time * 20, b.space * 20)
        },
        drawMergeConnection: function (a, b) {
            var c = this.spaceColor(a.space);
            this.ctx.strokeStyle = c, this.ctx.lineWidth = 2, this.ctx.beginPath();
            if (a.space > b.space) {
                this.ctx.moveTo(a.time * 20, a.space * 20);
                var d = this.safePath(a.time, b.time, a.space);
                if (d) this.ctx.lineTo(b.time * 20 - 10, a.space * 20), this.ctx.lineTo(b.time * 20 - 10, b.space * 20 + 15), this.ctx.lineTo(b.time * 20 - 7.7, b.space * 20 + 9.5), this.ctx.stroke(), this.oneClockArrow(c, b.time * 20, b.space * 20);
                else {
                    var e = this.closestMargin(a.time, b.time, a.space, -1);
                    a.space == b.space + 1 && a.space == e + 1 ? (this.ctx.lineTo(a.time * 20, e * 20 + 10), this.ctx.lineTo(b.time * 20 - 15, e * 20 + 10), this.ctx.lineTo(b.time * 20 - 9.5, e * 20 + 7.7), this.ctx.stroke(), this.twoClockArrow(c, b.time * 20, e * 20), this.addMargin(a.time, b.time, e)) : a.time + 1 == b.time ? (e = this.closestMargin(a.time, b.time, b.space, 0), this.ctx.lineTo(a.time * 20, e * 20 + 10), this.ctx.lineTo(b.time * 20 - 15, e * 20 + 10), this.ctx.lineTo(b.time * 20 - 15, b.space * 20 + 10), this.ctx.lineTo(b.time * 20 - 9.5, b.space * 20 + 7.7), this.ctx.stroke(), this.twoClockArrow(c, b.time * 20, b.space * 20), this.addMargin(a.time, b.time, e)) : (this.ctx.lineTo(a.time * 20 + 10, a.space * 20 - 10), this.ctx.lineTo(a.time * 20 + 10, e * 20 + 10), this.ctx.lineTo(b.time * 20 - 10, e * 20 + 10), this.ctx.lineTo(b.time * 20 - 10, b.space * 20 + 15), this.ctx.lineTo(b.time * 20 - 7.7, b.space * 20 + 9.5), this.ctx.stroke(), this.oneClockArrow(c, b.time * 20, b.space * 20), this.addMargin(a.time, b.time, e))
                }
            } else {
                var e = this.closestMargin(a.time, b.time, b.space, -1);
                e < b.space ? (this.ctx.moveTo(a.time * 20, a.space * 20), this.ctx.lineTo(a.time * 20, e * 20 + 10), this.ctx.lineTo(b.time * 20 - 12.7, e * 20 + 10), this.ctx.lineTo(b.time * 20 - 12.7, b.space * 20 - 10), this.ctx.lineTo(b.time * 20 - 9.4, b.space * 20 - 7.7), this.ctx.stroke(), this.fourClockArrow(c, b.time * 20, b.space * 20), this.addMargin(a.time, b.time, e)) : (this.ctx.moveTo(a.time * 20, a.space * 20), this.ctx.lineTo(a.time * 20, e * 20 + 10), this.ctx.lineTo(b.time * 20 - 12.7, e * 20 + 10), this.ctx.lineTo(b.time * 20 - 12.7, b.space * 20 + 10), this.ctx.lineTo(b.time * 20 - 9.4, b.space * 20 + 7.7), this.ctx.stroke(), this.twoClockArrow(c, b.time * 20, b.space * 20), this.addMargin(a.time, b.time, e))
            }
        },
        addMargin: function (a, b, c) {
            var d = c;
            this.marginMap[d] || (this.marginMap[d] = []), this.marginMap[d].push([a, b])
        },
        oneClockArrow: function (a, b, c) {
            this.ctx.fillStyle = a, this.ctx.beginPath(), this.ctx.moveTo(b - 6.3, c + 13.1), this.ctx.lineTo(b - 10.8, c + 9.7), this.ctx.lineTo(b - 2.6, c + 3.5), this.ctx.fill()
        },
        twoClockArrow: function (a, b, c) {
            this.ctx.fillStyle = a, this.ctx.beginPath(), this.ctx.moveTo(b - 12.4, c + 6.6), this.ctx.lineTo(b - 9.3, c + 10.6), this.ctx.lineTo(b - 3.2, c + 2.4), this.ctx.fill()
        },
        threeClockArrow: function (a, b, c) {
            this.ctx.fillStyle = a, this.ctx.beginPath(), this.ctx.moveTo(b - 14, c - 2.5), this.ctx.lineTo(b - 14, c + 2.5), this.ctx.lineTo(b - 4, c), this.ctx.fill()
        },
        fourClockArrow: function (a, b, c) {
            this.ctx.fillStyle = a, this.ctx.beginPath(), this.ctx.moveTo(b - 12.4, c - 6.6), this.ctx.lineTo(b - 9.3, c - 10.6), this.ctx.lineTo(b - 3.2, c - 2.4), this.ctx.fill()
        },
        safePath: function (a, b, c) {
            for (var d = 0; d < this.spaceMap[c].length; d++) {
                var e = this.spaceMap[c][d];
                if (this.timeInPath(a, e)) return e[1] == b
            }
            return !1
        },
        closestMargin: function (a, b, c, d) {
            var e = this.spaceMap.length,
                f = d,
                g = !1,
                h = !1,
                i = !1;
            while (!h || !g) {
                if (c + f >= 0 && this.safeMargin(a, b, c + f)) return c + f;
                c + f < 0 && (g = !0), c + f > e && (h = !0), i == 0 && f == 0 ? (f = -1, i = !0) : f < 0 ? f = -f - 1 : f = -f - 2
            }
            return c > 0 ? c - 1 : 0
        },
        safeMargin: function (a, b, c) {
            var d = c;
            if (!this.marginMap[d]) return !0;
            var e = this.marginMap[d];
            for (var f = 0; f < e.length; f++) {
                var g = e[f];
                if (this.pathsCollide([a, b], g)) return !1
            }
            return !0
        },
        pathsCollide: function (a, b) {
            return this.timeWithinPath(a[0], b) || this.timeWithinPath(a[1], b) || this.timeWithinPath(b[0], a) || this.timeWithinPath(b[1], a)
        },
        timeInPath: function (a, b) {
            return a >= b[0] && a <= b[1]
        },
        timeWithinPath: function (a, b) {
            return a > b[0] && a < b[1]
        },
        spaceColor: function (a) {
            return a == 0 ? "#000000" : this.spaceColors[a % this.spaceColors.length]
        }
    }, b.MouseDriver = function (b, c, d) {
        this.container = b, this.chrome = c, this.graph = d, this.dragging = !1, this.lastPoint = {
            x: 0,
            y: 0
        }, this.lastHoverCommit = null, this.lastHoverUser = null, this.pressedCommit = null, this.pressedUser = null;
        var e = a(b).eq(0),
            f = a("canvas", e)[0];
        f.style.cursor = "move";
        var g = this;
        this.up = function (a) {
            g.dragging = !1, g.pressedCommit && g.graph.activeCommit == g.pressedCommit ? window.open("/" + g.graph.activeCommit.user.name + "/" + g.graph.activeCommit.user.repo + "/commit/" + g.graph.activeCommit.id) : g.pressedUser && g.chrome.activeUser == g.pressedUser && (window.location = "/" + g.chrome.activeUser.name + "/" + g.chrome.activeUser.repo + "/network"), g.pressedCommit = null, g.pressedUser = null
        }, this.down = function (a) {
            g.graph.activeCommit ? g.pressedCommit = g.graph.activeCommit : g.chrome.activeUser ? g.pressedUser = g.chrome.activeUser : g.dragging = !0
        }, this.docmove = function (a) {
            var b = a.pageX,
                c = a.pageY;
            g.dragging && (g.graph.moveX(b - g.lastPoint.x), g.graph.moveY(c - g.lastPoint.y), g.graph.draw(), g.chrome.moveX(b - g.lastPoint.x), g.chrome.moveY(c - g.lastPoint.y), g.chrome.draw()), g.lastPoint.x = b, g.lastPoint.y = c
        }, this.move = function (a) {
            var b = a.pageX,
                c = a.pageY;
            if (g.dragging) g.graph.moveX(b - g.lastPoint.x), g.graph.moveY(c - g.lastPoint.y), g.graph.draw(), g.chrome.moveX(b - g.lastPoint.x), g.chrome.moveY(c - g.lastPoint.y), g.chrome.draw();
            else {
                var d = g.chrome.hover(b - a.target.offsetLeft, c - a.target.offsetTop);
                if (d != g.lastHoverUser) d ? f.style.cursor = "pointer" : f.style.cursor = "move", g.chrome.activeUser = d, g.chrome.draw(), g.lastHoverUser = d;
                else {
                    var e = g.graph.hover(b - a.target.offsetLeft, c - a.target.offsetTop);
                    e != g.lastHoverCommit && (e ? f.style.cursor = "pointer" : f.style.cursor = "move", g.graph.activeCommit = e, g.graph.draw(), g.chrome.draw(), g.lastHoverCommit = e)
                }
            }
            g.lastPoint.x = b, g.lastPoint.y = c
        }, this.out = function (a) {
            g.graph.activeCommit = null, g.chrome.activeUser = null, g.graph.draw(), g.chrome.draw(), g.lastHoverCommit = null, g.lastHoverUser = null
        }, a("body")[0].onmouseup = this.up, a("body")[0].onmousemove = this.docmove, f.onmousedown = this.down, f.onmousemove = this.move, f.onmouseout = this.out
    }, b.KeyDriver = function (b, c, d) {
        this.container = b, this.chrome = c, this.graph = d, this.dirty = !1, this.moveBothX = function (a) {
            this.graph.moveX(a), this.chrome.moveX(a), this.graph.activeCommit = null, this.dirty = !0
        }, this.moveBothY = function (a) {
            this.graph.moveY(a), this.chrome.moveY(a), this.graph.activeCommit = null, this.dirty = !0
        }, this.toggleRefs = function () {
            this.graph.toggleRefs(), this.dirty = !0
        }, this.redraw = function () {
            this.dirty && (this.graph.draw(), this.chrome.draw()), this.dirty = !1
        };
        var e = this;
        this.down = function (a) {
            var b = !1;
            if (a.shiftKey) switch (a.which) {
            case 37:
            case 72:
                e.moveBothX(999999), b = !0;
                break;
            case 38:
            case 75:
                e.moveBothY(999999), b = !0;
                break;
            case 39:
            case 76:
                e.moveBothX(-999999), b = !0;
                break;
            case 40:
            case 74:
                e.moveBothY(-999999), b = !0
            } else switch (a.which) {
            case 37:
            case 72:
                e.moveBothX(100), b = !0;
                break;
            case 38:
            case 75:
                e.moveBothY(20), b = !0;
                break;
            case 39:
            case 76:
                e.moveBothX(-100), b = !0;
                break;
            case 40:
            case 74:
                e.moveBothY(-20), b = !0;
                break;
            case 84:
                e.toggleRefs(), b = !0
            }
            b && e.redraw()
        }, this.press = function (b) {
            (a.browser.mozilla || a.browser.opera) && e.down({
                shiftKey: !1,
                which: b.keyCode
            })
        }, a(document).keydown(this.down), a(document).keypress(this.press)
    }, b
}
function getParams(a, b) {
    arguments.length < 2 && (b = location.href);
    if (arguments.length > 0 && a != "") {
        if (a == "#") var c = new RegExp("[#]([^$]*)");
        else if (a == "?") var c = new RegExp("[?]([^#$]*)");
        else var c = new RegExp("[?&]" + a + "=([^&#]*)");
        var d = c.exec(b);
        return d == null ? "" : d[1]
    }
    b = b.split("?");
    var d = {};
    return b.length > 1 && (b = b[1].split("#"), b.length > 1 && (d.hash = b[1]), $.each(b[0].split("&"), function (a, b) {
        b = b.split("="), d[b[0]] = b[1]
    })), d
}((function () {
    var a, b;
    if (typeof $ == "undefined" || $ === null) return;
    b = !1, $(window).bind("beforeunload", function () {
        b = !0
    }), $(window).bind("unload", function () {
        b = !0
    }), a = function () {
        return $.browser != null && ($.browser.webkit || $.browser.opera || $.browser.msie && parseInt($.browser.version) >= 8 || $.browser.mozilla) && $.browser.version != null && $.browser.version !== "0"
    }();
    if (!a) return;
    window.onerror = function (a, c, d) {
        var e, f;
        if (b || !d) return;
        if (c != null ? !c.match(/assets.github.com|github.dev/) : !void 0) return;
        e = {
            message: a,
            filename: c,
            lineno: d,
            url: window.location.href,
            readyState: document.readyState,
            referrer: document.referrer,
            browser: $.browser
        }, $.ajax({
            type: "POST",
            url: "/errors",
            data: {
                error: e
            }
        }), (f = window.errors) != null ? f : window.errors = [], window.errors.push(e)
    }, window.location.hash === "#b00m" && b00m()
})).call(this), window.Modernizr = function (a, b, c) {
    function B(a) {
        k.cssText = a
    }
    function C(a, b) {
        return B(o.join(a + ";") + (b || ""))
    }
    function D(a, b) {
        return typeof a === b
    }
    function E(a, b) {
        return !!~ ("" + a).indexOf(b)
    }
    function F(a, b) {
        for (var d in a) if (k[a[d]] !== c) return b == "pfx" ? a[d] : !0;
        return !1
    }
    function G(a, b) {
        var c = a.charAt(0).toUpperCase() + a.substr(1),
            d = (a + " " + p.join(c + " ") + c).split(" ");
        return F(d, b)
    }
    function I() {
        e.input = function (a) {
            for (var b = 0, c = a.length; b < c; b++) t[a[b]] = a[b] in l;
            return t
        }("autocomplete autofocus list placeholder max min multiple pattern required step".split(" ")), e.inputtypes = function (a) {
            for (var d = 0, e, f, h, i = a.length; d < i; d++) l.setAttribute("type", f = a[d]), e = l.type !== "text", e && (l.value = m, l.style.cssText = "position:absolute;visibility:hidden;", /^range$/.test(f) && l.style.WebkitAppearance !== c ? (g.appendChild(l), h = b.defaultView, e = h.getComputedStyle && h.getComputedStyle(l, null).WebkitAppearance !== "textfield" && l.offsetHeight !== 0, g.removeChild(l)) : /^(search|tel)$/.test(f) || (/^(url|email)$/.test(f) ? e = l.checkValidity && l.checkValidity() === !1 : /^color$/.test(f) ? (g.appendChild(l), g.offsetWidth, e = l.value != m, g.removeChild(l)) : e = l.value != m)), s[a[d]] = !! e;
            return s
        }("search tel url email datetime date month week time datetime-local number range color".split(" "))
    }
    var d = "2.0.6",
        e = {},
        f = !0,
        g = b.documentElement,
        h = b.head || b.getElementsByTagName("head")[0],
        i = "modernizr",
        j = b.createElement(i),
        k = j.style,
        l = b.createElement("input"),
        m = ":)",
        n = {}.toString,
        o = " -webkit- -moz- -o- -ms- -khtml- ".split(" "),
        p = "Webkit Moz O ms Khtml".split(" "),
        q = {
            svg: "http://www.w3.org/2000/svg"
        },
        r = {},
        s = {},
        t = {},
        u = [],
        v, w = function (a, c, d, e) {
            var f, h, j, k = b.createElement("div");
            if (parseInt(d, 10)) while (d--) j = b.createElement("div"), j.id = e ? e[d] : i + (d + 1), k.appendChild(j);
            return f = ["&shy;", "<style>", a, "</style>"].join(""), k.id = i, k.innerHTML += f, g.appendChild(k), h = c(k, a), k.parentNode.removeChild(k), !! h
        },
        x = function (b) {
            if (a.matchMedia) return matchMedia(b).matches;
            var c;
            return w("@media " + b + " { #" + i + " { position: absolute; } }", function (b) {
                c = (a.getComputedStyle ? getComputedStyle(b, null) : b.currentStyle)["position"] == "absolute"
            }), c
        },
        y = function () {
            function d(d, e) {
                e = e || b.createElement(a[d] || "div"), d = "on" + d;
                var f = d in e;
                return f || (e.setAttribute || (e = b.createElement("div")), e.setAttribute && e.removeAttribute && (e.setAttribute(d, ""), f = D(e[d], "function"), D(e[d], "undefined") || (e[d] = c), e.removeAttribute(d))), e = null, f
            }
            var a = {
                select: "input",
                change: "input",
                submit: "form",
                reset: "form",
                error: "img",
                load: "img",
                abort: "img"
            };
            return d
        }(),
        z = {}.hasOwnProperty,
        A;
    !D(z, "undefined") && !D(z.call, "undefined") ? A = function (a, b) {
        return z.call(a, b)
    } : A = function (a, b) {
        return b in a && D(a.constructor.prototype[b], "undefined")
    };
    var H = function (c, d) {
            var f = c.join(""),
                g = d.length;
            w(f, function (c, d) {
                var f = b.styleSheets[b.styleSheets.length - 1],
                    h = f.cssRules && f.cssRules[0] ? f.cssRules[0].cssText : f.cssText || "",
                    i = c.childNodes,
                    j = {};
                while (g--) j[i[g].id] = i[g];
                e.touch = "ontouchstart" in a || (j.touch && j.touch.offsetTop) === 9, e.csstransforms3d = (j.csstransforms3d && j.csstransforms3d.offsetLeft) === 9, e.generatedcontent = (j.generatedcontent && j.generatedcontent.offsetHeight) >= 1, e.fontface = /src/i.test(h) && h.indexOf(d.split(" ")[0]) === 0
            }, g, d)
        }(['@font-face {font-family:"font";src:url("https://")}', ["@media (", o.join("touch-enabled),("), i, ")", "{#touch{top:9px;position:absolute}}"].join(""), ["@media (", o.join("transform-3d),("), i, ")", "{#csstransforms3d{left:9px;position:absolute}}"].join(""), ['#generatedcontent:after{content:"', m, '";visibility:hidden}'].join("")], ["fontface", "touch", "csstransforms3d", "generatedcontent"]);
    r.flexbox = function () {
        function a(a, b, c, d) {
            b += ":", a.style.cssText = (b + o.join(c + ";" + b)).slice(0, -b.length) + (d || "")
        }
        function c(a, b, c, d) {
            a.style.cssText = o.join(b + ":" + c + ";") + (d || "")
        }
        var d = b.createElement("div"),
            e = b.createElement("div");
        a(d, "display", "box", "width:42px;padding:0;"), c(e, "box-flex", "1", "width:10px;"), d.appendChild(e), g.appendChild(d);
        var f = e.offsetWidth === 42;
        return d.removeChild(e), g.removeChild(d), f
    }, r.canvas = function () {
        var a = b.createElement("canvas");
        return !!a.getContext && !! a.getContext("2d")
    }, r.canvastext = function () {
        return !!e.canvas && !! D(b.createElement("canvas").getContext("2d").fillText, "function")
    }, r.webgl = function () {
        return !!a.WebGLRenderingContext
    }, r.touch = function () {
        return e.touch
    }, r.geolocation = function () {
        return !!navigator.geolocation
    }, r.postmessage = function () {
        return !!a.postMessage
    }, r.websqldatabase = function () {
        var b = !! a.openDatabase;
        return b
    }, r.indexedDB = function () {
        for (var b = -1, c = p.length; ++b < c;) if (a[p[b].toLowerCase() + "IndexedDB"]) return !0;
        return !!a.indexedDB
    }, r.hashchange = function () {
        return y("hashchange", a) && (b.documentMode === c || b.documentMode > 7)
    }, r.history = function () {
        return !!a.history && !! history.pushState
    }, r.draganddrop = function () {
        var a = b.createElement("div");
        return "draggable" in a || "ondragstart" in a && "ondrop" in a
    }, r.websockets = function () {
        for (var b = -1, c = p.length; ++b < c;) if (a[p[b] + "WebSocket"]) return !0;
        return "WebSocket" in a
    }, r.rgba = function () {
        return B("background-color:rgba(150,255,150,.5)"), E(k.backgroundColor, "rgba")
    }, r.hsla = function () {
        return B("background-color:hsla(120,40%,100%,.5)"), E(k.backgroundColor, "rgba") || E(k.backgroundColor, "hsla")
    }, r.multiplebgs = function () {
        return B("background:url(https://),url(https://),red url(https://)"), /(url\s*\(.*?){3}/.test(k.background)
    }, r.backgroundsize = function () {
        return G("backgroundSize")
    }, r.borderimage = function () {
        return G("borderImage")
    }, r.borderradius = function () {
        return G("borderRadius")
    }, r.boxshadow = function () {
        return G("boxShadow")
    }, r.textshadow = function () {
        return b.createElement("div").style.textShadow === ""
    }, r.opacity = function () {
        return C("opacity:.55"), /^0.55$/.test(k.opacity)
    }, r.cssanimations = function () {
        return G("animationName")
    }, r.csscolumns = function () {
        return G("columnCount")
    }, r.cssgradients = function () {
        var a = "background-image:",
            b = "gradient(linear,left top,right bottom,from(#9f9),to(white));",
            c = "linear-gradient(left top,#9f9, white);";
        return B((a + o.join(b + a) + o.join(c + a)).slice(0, -a.length)), E(k.backgroundImage, "gradient")
    }, r.cssreflections = function () {
        return G("boxReflect")
    }, r.csstransforms = function () {
        return !!F(["transformProperty", "WebkitTransform", "MozTransform", "OTransform", "msTransform"])
    }, r.csstransforms3d = function () {
        var a = !! F(["perspectiveProperty", "WebkitPerspective", "MozPerspective", "OPerspective", "msPerspective"]);
        return a && "webkitPerspective" in g.style && (a = e.csstransforms3d), a
    }, r.csstransitions = function () {
        return G("transitionProperty")
    }, r.fontface = function () {
        return e.fontface
    }, r.generatedcontent = function () {
        return e.generatedcontent
    }, r.video = function () {
        var a = b.createElement("video"),
            c = !1;
        try {
            if (c = !! a.canPlayType) {
                c = new Boolean(c), c.ogg = a.canPlayType('video/ogg; codecs="theora"');
                var d = 'video/mp4; codecs="avc1.42E01E';
                c.h264 = a.canPlayType(d + '"') || a.canPlayType(d + ', mp4a.40.2"'), c.webm = a.canPlayType('video/webm; codecs="vp8, vorbis"')
            }
        } catch (e) {}
        return c
    }, r.audio = function () {
        var a = b.createElement("audio"),
            c = !1;
        try {
            if (c = !! a.canPlayType) c = new Boolean(c), c.ogg = a.canPlayType('audio/ogg; codecs="vorbis"'), c.mp3 = a.canPlayType("audio/mpeg;"), c.wav = a.canPlayType('audio/wav; codecs="1"'), c.m4a = a.canPlayType("audio/x-m4a;") || a.canPlayType("audio/aac;")
        } catch (d) {}
        return c
    }, r.localstorage = function () {
        try {
            return !!localStorage.getItem
        } catch (a) {
            return !1
        }
    }, r.sessionstorage = function () {
        try {
            return !!sessionStorage.getItem
        } catch (a) {
            return !1
        }
    }, r.webworkers = function () {
        return !!a.Worker
    }, r.applicationcache = function () {
        return !!a.applicationCache
    }, r.svg = function () {
        return !!b.createElementNS && !! b.createElementNS(q.svg, "svg").createSVGRect
    }, r.inlinesvg = function () {
        var a = b.createElement("div");
        return a.innerHTML = "<svg/>", (a.firstChild && a.firstChild.namespaceURI) == q.svg
    }, r.smil = function () {
        return !!b.createElementNS && /SVG/.test(n.call(b.createElementNS(q.svg, "animate")))
    }, r.svgclippaths = function () {
        return !!b.createElementNS && /SVG/.test(n.call(b.createElementNS(q.svg, "clipPath")))
    };
    for (var J in r) A(r, J) && (v = J.toLowerCase(), e[v] = r[J](), u.push((e[v] ? "" : "no-") + v));
    return e.input || I(), e.addTest = function (a, b) {
        if (typeof a == "object") for (var d in a) A(a, d) && e.addTest(d, a[d]);
        else {
            a = a.toLowerCase();
            if (e[a] !== c) return;
            b = typeof b == "boolean" ? b : !! b(), g.className += " " + (b ? "" : "no-") + a, e[a] = b
        }
        return e
    }, B(""), j = l = null, a.attachEvent &&
    function () {
        var a = b.createElement("div");
        return a.innerHTML = "<elem></elem>", a.childNodes.length !== 1
    }() &&
    function (a, b) {
        function s(a) {
            var b = -1;
            while (++b < g) a.createElement(f[b])
        }
        a.iepp = a.iepp || {};
        var d = a.iepp,
            e = d.html5elements || "abbr|article|aside|audio|canvas|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|subline|summary|time|video",
            f = e.split("|"),
            g = f.length,
            h = new RegExp("(^|\\s)(" + e + ")", "gi"),
            i = new RegExp("<(/*)(" + e + ")", "gi"),
            j = /^\s*[\{\}]\s*$/,
            k = new RegExp("(^|[^\\n]*?\\s)(" + e + ")([^\\n]*)({[\\n\\w\\W]*?})", "gi"),
            l = b.createDocumentFragment(),
            m = b.documentElement,
            n = b.getElementsByTagName("script")[0].parentNode,
            o = b.createElement("body"),
            p = b.createElement("style"),
            q = /print|all/,
            r;
        d.getCSS = function (a, b) {
            try {
                if (a + "" === c) return ""
            } catch (e) {
                return ""
            }
            var f = -1,
                g = a.length,
                h, i = [];
            while (++f < g) {
                h = a[f];
                if (h.disabled) continue;
                b = h.media || b, q.test(b) && i.push(d.getCSS(h.imports, b), h.cssText), b = "all"
            }
            return i.join("")
        }, d.parseCSS = function (a) {
            var b = [],
                c;
            while ((c = k.exec(a)) != null) b.push(((j.exec(c[1]) ? "\n" : c[1]) + c[2] + c[3]).replace(h, "$1.iepp-$2") + c[4]);
            return b.join("\n")
        }, d.writeHTML = function () {
            var a = -1;
            r = r || b.body;
            while (++a < g) {
                var c = b.getElementsByTagName(f[a]),
                    d = c.length,
                    e = -1;
                while (++e < d) c[e].className.indexOf("iepp-") < 0 && (c[e].className += " iepp-" + f[a])
            }
            l.appendChild(r), m.appendChild(o), o.className = r.className, o.id = r.id, o.innerHTML = r.innerHTML.replace(i, "<$1font")
        }, d._beforePrint = function () {
            if (d.disablePP) return;
            p.styleSheet.cssText = d.parseCSS(d.getCSS(b.styleSheets, "all")), d.writeHTML()
        }, d.restoreHTML = function () {
            if (d.disablePP) return;
            o.swapNode(r)
        }, d._afterPrint = function () {
            d.restoreHTML(), p.styleSheet.cssText = ""
        }, s(b), s(l);
        if (d.disablePP) return;
        n.insertBefore(p, n.firstChild), p.media = "print", p.className = "iepp-printshim", a.attachEvent("onbeforeprint", d._beforePrint), a.attachEvent("onafterprint", d._afterPrint)
    }(a, b), e._version = d, e._prefixes = o, e._domPrefixes = p, e.mq = x, e.hasEvent = y, e.testProp = function (a) {
        return F([a])
    }, e.testAllProps = G, e.testStyles = w, e.prefixed = function (a) {
        return G(a, "pfx")
    }, g.className = g.className.replace(/(^|\s)no-js(\s|$)/, "$1$2") + (f ? " js " + u.join(" ") : ""), e
}(this, this.document);
if (window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype.getImageData) {
    var defaultOffsets = {
        destX: 0,
        destY: 0,
        sourceX: 0,
        sourceY: 0,
        width: "auto",
        height: "auto"
    };
    CanvasRenderingContext2D.prototype.blendOnto = function (a, b, c) {
        var d = {};
        for (var e in defaultOffsets) defaultOffsets.hasOwnProperty(e) && (d[e] = c && c[e] || defaultOffsets[e]);
        d.width == "auto" && (d.width = this.canvas.width), d.height == "auto" && (d.height = this.canvas.height), d.width = Math.min(d.width, this.canvas.width - d.sourceX, a.canvas.width - d.destX), d.height = Math.min(d.height, this.canvas.height - d.sourceY, a.canvas.height - d.destY);
        var f = this.getImageData(d.sourceX, d.sourceY, d.width, d.height),
            g = a.getImageData(d.destX, d.destY, d.width, d.height),
            h = f.data,
            i = g.data,
            j, k, l = i.length,
            m, n, o, p, q, r, s, t;
        for (var u = 0; u < l; u += 4) {
            j = h[u + 3] / 255, k = i[u + 3] / 255, s = j + k - j * k, i[u + 3] = s * 255, m = h[u] / 255 * j, p = i[u] / 255 * k, n = h[u + 1] / 255 * j, q = i[u + 1] / 255 * k, o = h[u + 2] / 255 * j, r = i[u + 2] / 255 * k, t = 255 / s;
            switch (b) {
            case "normal":
            case "src-over":
                i[u] = (m + p - p * j) * t, i[u + 1] = (n + q - q * j) * t, i[u + 2] = (o + r - r * j) * t;
                break;
            case "screen":
                i[u] = (m + p - m * p) * t, i[u + 1] = (n + q - n * q) * t, i[u + 2] = (o + r - o * r) * t;
                break;
            case "multiply":
                i[u] = (m * p + m * (1 - k) + p * (1 - j)) * t, i[u + 1] = (n * q + n * (1 - k) + q * (1 - j)) * t, i[u + 2] = (o * r + o * (1 - k) + r * (1 - j)) * t;
                break;
            case "difference":
                i[u] = (m + p - 2 * Math.min(m * k, p * j)) * t, i[u + 1] = (n + q - 2 * Math.min(n * k, q * j)) * t, i[u + 2] = (o + r - 2 * Math.min(o * k, r * j)) * t;
                break;
            case "src-in":
                s = j * k, t = 255 / s, i[u + 3] = s * 255, i[u] = m * k * t, i[u + 1] = n * k * t, i[u + 2] = o * k * t;
                break;
            case "plus":
            case "add":
                s = Math.min(1, j + k), i[u + 3] = s * 255, t = 255 / s, i[u] = Math.min(m + p, 1) * t, i[u + 1] = Math.min(n + q, 1) * t, i[u + 2] = Math.min(o + r, 1) * t;
                break;
            case "overlay":
                i[u] = p <= .5 ? 2 * h[u] * p / k : 255 - (2 - 2 * p / k) * (255 - h[u]), i[u + 1] = q <= .5 ? 2 * h[u + 1] * q / k : 255 - (2 - 2 * q / k) * (255 - h[u + 1]), i[u + 2] = r <= .5 ? 2 * h[u + 2] * r / k : 255 - (2 - 2 * r / k) * (255 - h[u + 2]);
                break;
            case "hardlight":
                i[u] = m <= .5 ? 2 * i[u] * m / k : 255 - (2 - 2 * m / j) * (255 - i[u]), i[u + 1] = n <= .5 ? 2 * i[u + 1] * n / k : 255 - (2 - 2 * n / j) * (255 - i[u + 1]), i[u + 2] = o <= .5 ? 2 * i[u + 2] * o / k : 255 - (2 - 2 * o / j) * (255 - i[u + 2]);
                break;
            case "colordodge":
            case "dodge":
                h[u] == 255 && p == 0 ? i[u] = 255 : i[u] = Math.min(255, i[u] / (255 - h[u])) * t, h[u + 1] == 255 && q == 0 ? i[u + 1] = 255 : i[u + 1] = Math.min(255, i[u + 1] / (255 - h[u + 1])) * t, h[u + 2] == 255 && r == 0 ? i[u + 2] = 255 : i[u + 2] = Math.min(255, i[u + 2] / (255 - h[u + 2])) * t;
                break;
            case "colorburn":
            case "burn":
                h[u] == 0 && p == 0 ? i[u] = 0 : i[u] = (1 - Math.min(1, (1 - p) / m)) * t, h[u + 1] == 0 && q == 0 ? i[u + 1] = 0 : i[u + 1] = (1 - Math.min(1, (1 - q) / n)) * t, h[u + 2] == 0 && r == 0 ? i[u + 2] = 0 : i[u + 2] = (1 - Math.min(1, (1 - r) / o)) * t;
                break;
            case "darken":
            case "darker":
                i[u] = (m > p ? p : m) * t, i[u + 1] = (n > q ? q : n) * t, i[u + 2] = (o > r ? r : o) * t;
                break;
            case "lighten":
            case "lighter":
                i[u] = (m < p ? p : m) * t, i[u + 1] = (n < q ? q : n) * t, i[u + 2] = (o < r ? r : o) * t;
                break;
            case "exclusion":
                i[u] = (p + m - 2 * p * m) * t, i[u + 1] = (q + n - 2 * q * n) * t, i[u + 2] = (r + o - 2 * r * o) * t;
                break;
            default:
                i[u] = i[u + 3] = 255, i[u + 1] = u % 8 == 0 ? 255 : 0, i[u + 2] = u % 8 == 0 ? 0 : 255
            }
        }
        a.putImageData(g, d.destX, d.destY)
    };
    var modes = CanvasRenderingContext2D.prototype.blendOnto.supportedBlendModes = "normal src-over screen multiply difference src-in plus add overlay hardlight colordodge dodge colorburn burn darken lighten exclusion".split(" "),
        supports = CanvasRenderingContext2D.prototype.blendOnto.supports = {};
    for (var i = 0, len = modes.length; i < len; ++i) supports[modes[i]] = !0
}((function () {
    var a;
    a = ["form[data-remote] input[type=submit]", "form[data-remote] button[type=submit]", "form[data-remote] button:not([type])"], $(document).delegate(a.join(", "), "click", function () {
        var a, b, c, d, e, f;
        return e = $(this), b = e.closest("form"), c = b.find(".js-submit-button-value"), (d = e.attr("name")) ? (a = e.is("input[type=submit]") ? "Submit" : "", f = e.val() || a, c[0] ? (c.attr("name", d), c.attr("value", f)) : b.prepend("<input class='js-submit-button-value' type='hidden' name='" + d + "' value='" + f + "'>")) : c.remove()
    })
})).call(this), function (a) {
    a.fn.autoResize = function (b) {
        var c = a.extend({
            onResize: function () {},
            animate: !0,
            animateDuration: 150,
            animateCallback: function () {},
            extraSpace: 20,
            limit: 1e3
        }, b);
        return this.filter("textarea").each(function () {
            var b = a(this),
                d = 0,
                e = function () {
                    var c = ["height", "width", "lineHeight", "textDecoration", "letterSpacing"],
                        d = {};
                    return a.each(c, function (a, c) {
                        d[c] = b.css(c)
                    }), b.clone().removeAttr("id").removeAttr("name").css({
                        position: "absolute",
                        top: 0,
                        left: -9999
                    }).css(d).attr("tabIndex", "-1").insertBefore(b)
                }(),
                f = null,
                g = function () {
                    e.height(0).val(a(this).val()).scrollTop(1e4), d == 0 && (d = b.height());
                    var g = Math.max(e.scrollTop() + c.extraSpace, d),
                        h = a(this).add(e);
                    if (f === g) return;
                    f = g;
                    if (g >= c.limit) {
                        a(this).css("overflow-y", "");
                        return
                    }
                    c.onResize.call(this), c.animate && b.css("display") === "block" ? h.stop().animate({
                        height: g
                    }, c.animateDuration, c.animateCallback) : h.height(g)
                };
            b.unbind(".dynSiz").bind("resize.dynSiz", g)
        }), this
    }
}(jQuery), function (a) {
    a.fn.extend({
        autocomplete: function (b, c) {
            var d = typeof b == "string";
            return c = a.extend({}, a.Autocompleter.defaults, {
                url: d ? b : null,
                data: d ? null : b,
                delay: d ? a.Autocompleter.defaults.delay : 10,
                max: c && !c.scroll ? 10 : 150
            }, c), c.highlight = c.highlight ||
            function (a) {
                return a
            }, c.formatMatch = c.formatMatch || c.formatItem, this.each(function () {
                new a.Autocompleter(this, c)
            })
        },
        result: function (a) {
            return this.bind("result", a)
        },
        search: function (a) {
            return this.trigger("search", [a])
        },
        flushCache: function () {
            return this.trigger("flushCache")
        },
        setOptions: function (a) {
            return this.trigger("setOptions", [a])
        },
        unautocomplete: function () {
            return this.trigger("unautocomplete")
        }
    }), a.Autocompleter = function (b, c) {
        function n() {
            var d = l.selected();
            if (!d) return !1;
            var f = d.result;
            g = f;
            if (c.multiple) {
                var h = p(e.val());
                if (h.length > 1) {
                    var i = c.multipleSeparator.length,
                        j = a(b).selection().start,
                        k, m = 0;
                    a.each(h, function (a, b) {
                        m += b.length;
                        if (j <= m) return k = a, !1;
                        m += i
                    }), h[k] = f, f = h.join(c.multipleSeparator)
                }
                f += c.multipleSeparator
            }
            return e.val(f), v(), e.trigger("result", [d.data, d.value]), !0
        }
        function o(a, b) {
            if (j == d.DEL) {
                l.hide();
                return
            }
            var f = e.val();
            if (!b && f == g) return;
            g = f, f = q(f), f.length >= c.minChars ? (e.addClass(c.loadingClass), c.matchCase || (f = f.toLowerCase()), x(f, w, v)) : (z(), l.hide())
        }
        function p(b) {
            return b ? c.multiple ? a.map(b.split(c.multipleSeparator), function (c) {
                return a.trim(b).length ? a.trim(c) : null
            }) : [a.trim(b)] : [""]
        }
        function q(d) {
            if (!c.multiple) return d;
            var e = p(d);
            if (e.length == 1) return e[0];
            var f = a(b).selection().start;
            return f == d.length ? e = p(d) : e = p(d.replace(d.substring(f), "")), e[e.length - 1]
        }
        function r(f, h) {
            c.autoFill && q(e.val()).toLowerCase() == f.toLowerCase() && j != d.BACKSPACE && (e.val(e.val() + h.substring(q(g).length)), a(b).selection(g.length, g.length + h.length))
        }
        function s(a, b) {
            if (!c.autoResult || !b.length) return;
            var d = b[0],
                f = d.result;
            q(e.val()).toLowerCase() == f.toLowerCase() && (e.trigger("result", [d.data, d.value]), b.length == 1 && u())
        }
        function u() {
            clearTimeout(f), f = setTimeout(v, 200), t = !0
        }
        function v() {
            var a = l.visible();
            l.hide(), clearTimeout(f), z(), c.mustMatch && e.search(function (a) {
                if (!a) if (c.multiple) {
                    var b = p(e.val()).slice(0, -1);
                    e.val(b.join(c.multipleSeparator) + (b.length ? c.multipleSeparator : ""))
                } else e.val(""), e.trigger("result", null)
            })
        }
        function w(a, b) {
            b && b.length && i ? (z(), t = !1, l.display(b, a), r(a, b[0].value), s(a, b), t || l.show()) : v()
        }
        function x(d, e, f) {
            c.matchCase || (d = d.toLowerCase());
            var g = h.load(d);
            if (g && g.length) e(d, g);
            else if (typeof c.url == "string" && c.url.length > 0) {
                var i = {
                    timestamp: +(new Date)
                };
                a.each(c.extraParams, function (a, b) {
                    i[a] = typeof b == "function" ? b() : b
                }), a.ajax({
                    mode: "abort",
                    port: "autocomplete" + b.name,
                    dataType: c.dataType,
                    url: c.url,
                    data: a.extend({
                        q: q(d),
                        limit: c.max
                    }, i),
                    success: function (a) {
                        var b = c.parse && c.parse(a) || y(a);
                        h.add(d, b), e(d, b)
                    }
                })
            } else l.emptyList(), f(d)
        }
        function y(b) {
            var d = [],
                e = b.split("\n");
            for (var f = 0; f < e.length; f++) {
                var g = a.trim(e[f]);
                g && (g = g.split("|"), d[d.length] = {
                    data: g,
                    value: g[0],
                    result: c.formatResult && c.formatResult(g, g[0]) || g[0]
                })
            }
            return d
        }
        function z() {
            e.removeClass(c.loadingClass)
        }
        var d = {
            UP: 38,
            DOWN: 40,
            DEL: 46,
            TAB: 9,
            RETURN: 13,
            ESC: 27,
            COMMA: 188,
            PAGEUP: 33,
            PAGEDOWN: 34,
            BACKSPACE: 8
        },
            e = a(b).attr("autocomplete", "off").addClass(c.inputClass),
            f, g = "",
            h = a.Autocompleter.Cache(c),
            i = 0,
            j, k = {
                mouseDownOnSelect: !1
            },
            l = a.Autocompleter.Select(c, b, n, k),
            m;
        a.browser.opera && a(b.form).bind("submit.autocomplete", function () {
            if (m) return m = !1, !1
        }), e.bind((a.browser.opera ? "keypress" : "keydown") + ".autocomplete", function (b) {
            i = 1, j = b.keyCode;
            switch (b.keyCode) {
            case d.UP:
                b.preventDefault(), l.visible() ? l.prev() : o(0, !0);
                break;
            case d.DOWN:
                b.preventDefault(), l.visible() ? l.next() : o(0, !0);
                break;
            case d.PAGEUP:
                b.preventDefault(), l.visible() ? l.pageUp() : o(0, !0);
                break;
            case d.PAGEDOWN:
                b.preventDefault(), l.visible() ? l.pageDown() : o(0, !0);
                break;
            case c.multiple && a.trim(c.multipleSeparator) == "," && d.COMMA:
            case d.TAB:
            case d.RETURN:
                if (n()) return b.preventDefault(), m = !0, !1;
                break;
            case d.ESC:
                l.hide();
                break;
            default:
                clearTimeout(f), f = setTimeout(o, c.delay)
            }
        }).focus(function () {
            i++
        }).blur(function () {
            i = 0, k.mouseDownOnSelect || u()
        }).click(function () {
            i++ > 1 && !l.visible() && o(0, !0)
        }).bind("search", function () {
            function c(a, c) {
                var d;
                if (c && c.length) for (var f = 0; f < c.length; f++) if (c[f].result.toLowerCase() == a.toLowerCase()) {
                    d = c[f];
                    break
                }
                typeof b == "function" ? b(d) : e.trigger("result", d && [d.data, d.value])
            }
            var b = arguments.length > 1 ? arguments[1] : null;
            a.each(p(e.val()), function (a, b) {
                x(b, c, c)
            })
        }).bind("flushCache", function () {
            h.flush()
        }).bind("setOptions", function () {
            a.extend(c, arguments[1]), "data" in arguments[1] && h.populate()
        }).bind("unautocomplete", function () {
            l.unbind(), e.unbind(), a(b.form).unbind(".autocomplete")
        });
        var t = !1
    }, a.Autocompleter.defaults = {
        inputClass: "ac_input",
        resultsClass: "ac_results",
        loadingClass: "ac_loading",
        minChars: 1,
        delay: 400,
        matchCase: !1,
        matchSubset: !0,
        matchContains: !1,
        cacheLength: 10,
        max: 100,
        mustMatch: !1,
        extraParams: {},
        selectFirst: !0,
        formatItem: function (a) {
            return a[0]
        },
        formatMatch: null,
        autoFill: !1,
        autoResult: !0,
        width: 0,
        multiple: !1,
        multipleSeparator: ", ",
        highlight: function (a, b) {
            return a.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + b.replace(/([\^\$\(\)\[\]\{\}\*\.\+\?\|\\])/gi, "\\$1") + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<strong>$1</strong>")
        },
        scroll: !0,
        scrollHeight: 180
    }, a.Autocompleter.Cache = function (b) {
        function e(a, c) {
            b.matchCase || (a = a.toLowerCase());
            var d = a.indexOf(c);
            return b.matchContains == "word" && (d = a.toLowerCase().search("\\b" + c.toLowerCase())), d == -1 ? !1 : d == 0 || b.matchContains
        }
        function f(a, e) {
            d > b.cacheLength && h(), c[a] || d++, c[a] = e
        }
        function g() {
            if (!b.data) return !1;
            var c = {},
                d = 0;
            b.url || (b.cacheLength = 1), c[""] = [];
            for (var e = 0, g = b.data.length; e < g; e++) {
                var h = b.data[e];
                h = typeof h == "string" ? [h] : h;
                var i = b.formatMatch(h, e + 1, b.data.length);
                if (i === !1) continue;
                var j = i.charAt(0).toLowerCase();
                c[j] || (c[j] = []);
                var k = {
                    value: i,
                    data: h,
                    result: b.formatResult && b.formatResult(h) || i
                };
                c[j].push(k), d++ < b.max && c[""].push(k)
            }
            a.each(c, function (a, c) {
                b.cacheLength++, f(a, c)
            })
        }
        function h() {
            c = {}, d = 0
        }
        var c = {},
            d = 0;
        return setTimeout(g, 25), {
            flush: h,
            add: f,
            populate: g,
            load: function (f) {
                if (!b.cacheLength || !d) return null;
                if (!b.url && b.matchContains) {
                    var g = [];
                    for (var h in c) if (h.length > 0) {
                        var i = c[h];
                        a.each(i, function (a, b) {
                            e(b.value, f) && g.push(b)
                        })
                    }
                    return g
                }
                if (c[f]) return c[f];
                if (b.matchSubset) for (var j = f.length - 1; j >= b.minChars; j--) {
                    var i = c[f.substr(0, j)];
                    if (i) {
                        var g = [];
                        return a.each(i, function (a, b) {
                            e(b.value, f) && (g[g.length] = b)
                        }), g
                    }
                }
                return null
            }
        }
    }, a.Autocompleter.Select = function (b, c, d, e) {
        function n() {
            if (!k) return;
            l = a("<div/>").hide().addClass(b.resultsClass).css("position", "absolute").appendTo(document.body), m = a("<ul/>").appendTo(l).mouseover(function (b) {
                o(b).nodeName && o(b).nodeName.toUpperCase() == "LI" && (h = a("li", m).removeClass(f.ACTIVE).index(o(b)), a(o(b)).addClass(f.ACTIVE))
            }).click(function (b) {
                return a(o(b)).addClass(f.ACTIVE), d(), c.focus(), !1
            }).mousedown(function () {
                e.mouseDownOnSelect = !0
            }).mouseup(function () {
                e.mouseDownOnSelect = !1
            }), b.width > 0 && l.css("width", b.width), k = !1
        }
        function o(a) {
            var b = a.target;
            while (b && b.tagName != "LI") b = b.parentNode;
            return b ? b : []
        }
        function p(a) {
            g.slice(h, h + 1).removeClass(f.ACTIVE), q(a);
            var c = g.slice(h, h + 1).addClass(f.ACTIVE);
            if (b.scroll) {
                var d = 0;
                g.slice(0, h).each(function () {
                    d += this.offsetHeight
                }), d + c[0].offsetHeight - m.scrollTop() > m[0].clientHeight ? m.scrollTop(d + c[0].offsetHeight - m.innerHeight()) : d < m.scrollTop() && m.scrollTop(d)
            }
        }
        function q(a) {
            h += a, h < 0 ? h = g.size() - 1 : h >= g.size() && (h = 0)
        }
        function r(a) {
            return b.max && b.max < a ? b.max : a
        }
        function s() {
            m.empty();
            var c = r(i.length);
            for (var d = 0; d < c; d++) {
                if (!i[d]) continue;
                var e = b.formatItem(i[d].data, d + 1, c, i[d].value, j);
                if (e === !1) continue;
                var k = a("<li/>").html(b.highlight(e, j)).addClass(d % 2 == 0 ? "ac_even" : "ac_odd").appendTo(m)[0];
                a.data(k, "ac_data", i[d])
            }
            g = m.find("li"), b.selectFirst && (g.slice(0, 1).addClass(f.ACTIVE), h = 0), a.fn.bgiframe && m.bgiframe()
        }
        var f = {
            ACTIVE: "ac_over"
        },
            g, h = -1,
            i, j = "",
            k = !0,
            l, m;
        return {
            display: function (a, b) {
                n(), i = a, j = b, s()
            },
            next: function () {
                p(1)
            },
            prev: function () {
                p(-1)
            },
            pageUp: function () {
                h != 0 && h - 8 < 0 ? p(-h) : p(-8)
            },
            pageDown: function () {
                h != g.size() - 1 && h + 8 > g.size() ? p(g.size() - 1 - h) : p(8)
            },
            hide: function () {
                l && l.hide(), g && g.removeClass(f.ACTIVE), h = -1
            },
            visible: function () {
                return l && l.is(":visible")
            },
            current: function () {
                return this.visible() && (g.filter("." + f.ACTIVE)[0] || b.selectFirst && g[0])
            },
            show: function () {
                var d = a(c).offset();
                l.css({
                    width: typeof b.width == "string" || b.width > 0 ? b.width : a(c).width(),
                    top: d.top + c.offsetHeight,
                    left: d.left
                }).show();
                if (b.scroll) {
                    m.scrollTop(0), m.css({
                        maxHeight: b.scrollHeight,
                        overflow: "auto"
                    });
                    if (a.browser.msie && typeof document.body.style.maxHeight == "undefined") {
                        var e = 0;
                        g.each(function () {
                            e += this.offsetHeight
                        });
                        var f = e > b.scrollHeight;
                        m.css("height", f ? b.scrollHeight : e), f || g.width(m.width() - parseInt(g.css("padding-left")) - parseInt(g.css("padding-right")))
                    }
                }
            },
            selected: function () {
                var b = g && g.filter("." + f.ACTIVE).removeClass(f.ACTIVE);
                return b && b.length && a.data(b[0], "ac_data")
            },
            emptyList: function () {
                m && m.empty()
            },
            unbind: function () {
                l && l.remove()
            }
        }
    }, a.fn.selection = function (a, b) {
        if (a !== undefined) return this.each(function () {
            if (this.createTextRange) {
                var c = this.createTextRange();
                b === undefined || a == b ? (c.move("character", a), c.select()) : (c.collapse(!0), c.moveStart("character", a), c.moveEnd("character", b), c.select())
            } else this.setSelectionRange ? this.setSelectionRange(a, b) : this.selectionStart && (this.selectionStart = a, this.selectionEnd = b)
        });
        var c = this[0];
        if (c.createTextRange) {
            var d = document.selection.createRange(),
                e = c.value,
                f = "<->",
                g = d.text.length;
            d.text = f;
            var h = c.value.indexOf(f);
            return c.value = e, this.selection(h, h + g), {
                start: h,
                end: h + g
            }
        }
        if (c.selectionStart !== undefined) return {
            start: c.selectionStart,
            end: c.selectionEnd
        }
    }
}(jQuery), function (a) {
    a.fn.autocompleteField = function (b) {
        var c = a.extend({
            searchVar: "q",
            url: null,
            delay: 250,
            useCache: !1,
            extraParams: {},
            autoClearResults: !0,
            dataType: "html",
            minLength: 1
        }, b);
        return a(this).each(function () {
            function h(e) {
                d && d.readyState < 4 && d.abort();
                if (c.useCache && g[e]) b.trigger("autocomplete.finish", g[e]);
                else {
                    var f = {};
                    f[c.searchVar] = e, f = a.extend(!0, c.extraParams, f), b.trigger("autocomplete.beforesend"), d = a.get(c.url, f, function (a) {
                        c.useCache && (g[e] = a), b.val() === e && b.trigger("autocomplete.finish", a)
                    }, c.dataType)
                }
            }
            function i(a) {
                a.length >= c.minLength ? f != a && (h(a), f = a) : b.trigger("autocomplete.clear")
            }
            var b = a(this),
                d, e, f, g = {};
            c.url != null && (b.attr("autocomplete", "off"), b.keyup(function (a) {
                a.preventDefault(), clearTimeout(e), e = setTimeout(function () {
                    clearTimeout(e), i(b.val())
                }, c.delay)
            }), b.blur(function () {
                f = null
            }))
        })
    }
}(jQuery), function (a) {
    a.fn.autosaveField = function (b) {
        var c = a.extend({}, a.fn.autosaveField.defaults, b);
        return this.each(function () {
            var b = a(this),
                d = b.attr("data-field-type") || ":text",
                e = b.find(d),
                f = b.find(".error"),
                g = b.find(".success"),
                h = b.attr("data-action"),
                i = b.attr("data-name"),
                j = e.val(),
                k = function (d) {
                    e.spin(), a.ajax({
                        url: h,
                        type: "POST",
                        data: {
                            _method: c.method,
                            field: i,
                            value: e.val()
                        },
                        success: function () {
                            e.stopSpin(), g.show(), j = e.val()
                        },
                        error: function () {
                            e.stopSpin(), b.attr("data-reset-on-error") && e.val(j), f.show()
                        }
                    })
                };
            d == ":text" ? (e.blur(function () {
                a(this).val() != j && k()
            }), e.keyup(function () {
                f.hide(), g.hide()
            })) : d == "input[type=checkbox]" && e.change(function () {
                f.hide(), g.hide(), k()
            })
        })
    }, a.fn.autosaveField.defaults = {
        method: "put"
    }
}(jQuery), function (a) {
    function b(a) {
        var b = Math.floor(a / 1e3),
            c = Math.floor(b / 60);
        return b %= 60, b = b < 10 ? "0" + b : b, c + ":" + b
    }
    function c(a) {
        var b = 0;
        if (a.offsetParent) while (a.offsetParent) b += a.offsetLeft, a = a.offsetParent;
        else a.x && (b += a.x);
        return b
    }
    BaconPlayer = {
        sound: null,
        playing: !1,
        sm2: "/js/soundmanager2.js",
        flashURL: "/flash/",
        playOrPause: function (a) {
            this.initSound(a, function () {
                this.playing ? this.pause() : this.play()
            })
        },
        play: function () {
            if (!this.sound) return;
            return this.playing = !0, this.sound.play(), a(".baconplayer .play, .baconplayer .pause").toggle(), "playing"
        },
        pause: function () {
            if (!this.sound) return;
            return this.playing = !1, this.sound.pause(), a(".baconplayer .play, .baconplayer .pause").toggle(), "paused"
        },
        initSound: function (b, c) {
            if (!window.soundManager) return a.getScript(this.sm2, function () {
                soundManager.url = BaconPlayer.flashURL, soundManager.debugMode = !1, soundManager.onready(function () {
                    BaconPlayer.initSound(b, c)
                })
            });
            this.sound = soundManager.createSound({
                id: "baconplayer",
                url: b,
                whileplaying: function () {
                    BaconPlayer.moveProgressBar(this), BaconPlayer.setPositionTiming(this)
                },
                whileloading: function () {
                    BaconPlayer.moveLoadingBar(this), BaconPlayer.setDurationTiming(this)
                },
                onload: function () {
                    BaconPlayer.setDurationTiming(this, !0)
                }
            }), c.call(this)
        },
        moveProgressBar: function (b) {
            var c = b.position / b.durationEstimate;
            a(".baconplayer .inner-progress").width(this.progressBar().width() * c)
        },
        moveLoadingBar: function (b) {
            var c = b.bytesLoaded / b.bytesTotal;
            a(".baconplayer .loading-progress").width(this.progressBar().width() * c)
        },
        setPositionTiming: function (c) {
            var d = b(c.position);
            a(".baconplayer .position").text(d)
        },
        setDurationTiming: function (c, d) {
            if (!d && this.durationTimingTimer) return;
            this.durationTimingTimer = setTimeout(function () {
                BaconPlayer.setDurationTiming(c), BaconPlayer.durationTimingTimer = null
            }, 2e3);
            var e = b(c.durationEstimate);
            a(".baconplayer .duration").text(e)
        },
        progressBar: function () {
            return a(".baconplayer .progress")
        },
        setPosition: function (a) {
            var b = this.progressBar()[0],
                d = this.sound,
                e = parseInt(a.clientX),
                f = Math.floor((e - c(b) - 4) / b.offsetWidth * d.durationEstimate);
            isNaN(f) || (f = Math.min(f, d.duration)), isNaN(f) || d.setPosition(f)
        },
        startDrag: function (a) {
            if (this.dragging || !this.sound) return;
            this.attachDragHandlers(), this.dragging = !0, this.pause(), this.setPosition(a)
        },
        drag: function (a) {
            this.setPosition(a)
        },
        stopDrag: function (a) {
            this.removeDragHandlers(), this.dragging = !1, this.setPosition(a), this.play()
        },
        attachDragHandlers: function () {
            a(document).bind("mousemove.baconplayer", function (a) {
                BaconPlayer.drag(a)
            }), a(document).bind("mouseup.baconplayer", function (a) {
                BaconPlayer.stopDrag(a)
            })
        },
        removeDragHandlers: function () {
            a(document).unbind("mousemove.baconplayer"), a(document).unbind("mouseup.baconplayer")
        }
    }, a(function () {
        a(".baconplayer .play, .baconplayer .pause").click(function () {
            return BaconPlayer.playOrPause(this.href), !1
        }), a(".baconplayer .progress").mousedown(function (a) {
            BaconPlayer.startDrag(a)
        })
    })
}(jQuery), function () {
    var a;
    a = document.documentElement, $.browser.webkit ? a.className += " webkit" : $.browser.mozilla ? a.className += " mozilla" : $.browser.msie ? (a.className += " msie", $.browser.version === "9.0" ? a.className += " ie9" : $.browser.version === "8.0" ? a.className += " ie8" : $.browser.version === "7.0" && (a.className += " ie7")) : $.browser.opera && (a.className += " opera")
}.call(this), function (a) {
    function b(b) {
        var c;
        return b && b.constructor == Array && b.length == 3 ? b : (c = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(b)) ? [parseInt(c[1]), parseInt(c[2]), parseInt(c[3])] : (c = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(b)) ? [parseFloat(c[1]) * 2.55, parseFloat(c[2]) * 2.55, parseFloat(c[3]) * 2.55] : (c = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(b)) ? [parseInt(c[1], 16), parseInt(c[2], 16), parseInt(c[3], 16)] : (c = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(b)) ? [parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16), parseInt(c[3] + c[3], 16)] : d[a.trim(b).toLowerCase()]
    }
    function c(c, d) {
        var e;
        do {
            e = a.curCSS(c, d);
            if (e != "" && e != "transparent" || a.nodeName(c, "body")) break;
            d = "backgroundColor"
        } while (c = c.parentNode);
        return b(e)
    }
    a.each(["backgroundColor", "borderBottomColor", "borderLeftColor", "borderRightColor", "borderTopColor", "color", "outlineColor"], function (d, e) {
        a.fx.step[e] = function (a) {
            a.state == 0 && (a.start = c(a.elem, e), a.end = b(a.end)), a.elem.style[e] = "rgb(" + [Math.max(Math.min(parseInt(a.pos * (a.end[0] - a.start[0]) + a.start[0]), 255), 0), Math.max(Math.min(parseInt(a.pos * (a.end[1] - a.start[1]) + a.start[1]), 255), 0), Math.max(Math.min(parseInt(a.pos * (a.end[2] - a.start[2]) + a.start[2]), 255), 0)].join(",") + ")"
        }
    });
    var d = {
        aqua: [0, 255, 255],
        azure: [240, 255, 255],
        beige: [245, 245, 220],
        black: [0, 0, 0],
        blue: [0, 0, 255],
        brown: [165, 42, 42],
        cyan: [0, 255, 255],
        darkblue: [0, 0, 139],
        darkcyan: [0, 139, 139],
        darkgrey: [169, 169, 169],
        darkgreen: [0, 100, 0],
        darkkhaki: [189, 183, 107],
        darkmagenta: [139, 0, 139],
        darkolivegreen: [85, 107, 47],
        darkorange: [255, 140, 0],
        darkorchid: [153, 50, 204],
        darkred: [139, 0, 0],
        darksalmon: [233, 150, 122],
        darkviolet: [148, 0, 211],
        fuchsia: [255, 0, 255],
        gold: [255, 215, 0],
        green: [0, 128, 0],
        indigo: [75, 0, 130],
        khaki: [240, 230, 140],
        lightblue: [173, 216, 230],
        lightcyan: [224, 255, 255],
        lightgreen: [144, 238, 144],
        lightgrey: [211, 211, 211],
        lightpink: [255, 182, 193],
        lightyellow: [255, 255, 224],
        lime: [0, 255, 0],
        magenta: [255, 0, 255],
        maroon: [128, 0, 0],
        navy: [0, 0, 128],
        olive: [128, 128, 0],
        orange: [255, 165, 0],
        pink: [255, 192, 203],
        purple: [128, 0, 128],
        violet: [128, 0, 128],
        red: [255, 0, 0],
        silver: [192, 192, 192],
        white: [255, 255, 255],
        yellow: [255, 255, 0]
    }
}(jQuery), jQuery.cookie = function (a, b, c) {
    if (typeof b == "undefined") {
        var i = null;
        if (document.cookie && document.cookie != "") {
            var j = document.cookie.split(";");
            for (var k = 0; k < j.length; k++) {
                var l = jQuery.trim(j[k]);
                if (l.substring(0, a.length + 1) == a + "=") {
                    i = decodeURIComponent(l.substring(a.length + 1));
                    break
                }
            }
        }
        return i
    }
    c = c || {}, b === null && (b = "", c.expires = -1);
    var d = "";
    if (c.expires && (typeof c.expires == "number" || c.expires.toUTCString)) {
        var e;
        typeof c.expires == "number" ? (e = new Date, e.setTime(e.getTime() + c.expires * 24 * 60 * 60 * 1e3)) : e = c.expires, d = "; expires=" + e.toUTCString()
    }
    var f = c.path ? "; path=" + c.path : "",
        g = c.domain ? "; domain=" + c.domain : "",
        h = c.secure ? "; secure" : "";
    document.cookie = [a, "=", encodeURIComponent(b), d, f, g, h].join("")
}, function () {
    $.ajaxPrefilter(function (a, b, c) {
        var d;
        if (a.crossDomain) return;
        if (d = $('meta[name="csrf-token"]').attr("content")) return c.setRequestHeader("X-CSRF-Token", d)
    })
}.call(this), DateInput = function (a) {
    function b(c, d) {
        typeof d != "object" && (d = {}), a.extend(this, b.DEFAULT_OPTS, d), this.input = a(c), this.bindMethodsToObj("show", "hide", "hideIfClickOutside", "keydownHandler", "selectDate"), this.build(), this.selectDate(), this.hide(), this.input.data("datePicker", this)
    }
    return b.DEFAULT_OPTS = {
        month_names: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        short_month_names: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        short_day_names: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        start_of_week: 1
    }, b.prototype = {
        build: function () {
            var b = a('<p class="month_nav"><span class="button prev" title="[Page-Up]">&#171;</span> <span class="month_name"></span> <span class="button next" title="[Page-Down]">&#187;</span></p>');
            this.monthNameSpan = a(".month_name", b), a(".prev", b).click(this.bindToObj(function () {
                this.moveMonthBy(-1)
            })), a(".next", b).click(this.bindToObj(function () {
                this.moveMonthBy(1)
            }));
            var c = a('<p class="year_nav"><span class="button prev" title="[Ctrl+Page-Up]">&#171;</span> <span class="year_name"></span> <span class="button next" title="[Ctrl+Page-Down]">&#187;</span></p>');
            this.yearNameSpan = a(".year_name", c), a(".prev", c).click(this.bindToObj(function () {
                this.moveMonthBy(-12)
            })), a(".next", c).click(this.bindToObj(function () {
                this.moveMonthBy(12)
            }));
            var d = a('<div class="nav"></div>').append(b, c),
                e = "<table><thead><tr>";
            a(this.adjustDays(this.short_day_names)).each(function () {
                e += "<th>" + this + "</th>"
            }), e += "</tr></thead><tbody></tbody></table>", this.dateSelector = this.rootLayers = a('<div class="date_selector"></div>').append(d, e).insertAfter(this.input), a.browser.msie && a.browser.version < 7 && (this.ieframe = a('<iframe class="date_selector_ieframe" frameborder="0" src="#"></iframe>').insertBefore(this.dateSelector), this.rootLayers = this.rootLayers.add(this.ieframe), a(".button", d).mouseover(function () {
                a(this).addClass("hover")
            }), a(".button", d).mouseout(function () {
                a(this).removeClass("hover")
            })), this.tbody = a("tbody", this.dateSelector), this.input.change(this.bindToObj(function () {
                this.selectDate()
            })), this.selectDate()
        },
        selectMonth: function (b) {
            var c = new Date(b.getFullYear(), b.getMonth(), 1);
            if (!this.currentMonth || this.currentMonth.getFullYear() != c.getFullYear() || this.currentMonth.getMonth() != c.getMonth()) {
                this.currentMonth = c;
                var d = this.rangeStart(b),
                    e = this.rangeEnd(b),
                    f = this.daysBetween(d, e),
                    g = "";
                for (var h = 0; h <= f; h++) {
                    var i = new Date(d.getFullYear(), d.getMonth(), d.getDate() + h, 12, 0);
                    this.isFirstDayOfWeek(i) && (g += "<tr>"), i.getMonth() == b.getMonth() ? g += '<td class="selectable_day" date="' + this.dateToString(i) + '">' + i.getDate() + "</td>" : g += '<td class="unselected_month" date="' + this.dateToString(i) + '">' + i.getDate() + "</td>", this.isLastDayOfWeek(i) && (g += "</tr>")
                }
                this.tbody.empty().append(g), this.monthNameSpan.empty().append(this.monthName(b)), this.yearNameSpan.empty().append(this.currentMonth.getFullYear()), a(".selectable_day", this.tbody).click(this.bindToObj(function (b) {
                    this.changeInput(a(b.target).attr("date"))
                })), a("td[date='" + this.dateToString(new Date) + "']", this.tbody).addClass("today"), a("td.selectable_day", this.tbody).mouseover(function () {
                    a(this).addClass("hover")
                }), a("td.selectable_day", this.tbody).mouseout(function () {
                    a(this).removeClass("hover")
                })
            }
            a(".selected", this.tbody).removeClass("selected"), a('td[date="' + this.selectedDateString + '"]', this.tbody).addClass("selected")
        },
        selectDate: function (a) {
            typeof a == "undefined" && (a = this.stringToDate(this.input.val())), a || (a = new Date), this.selectedDate = a, this.selectedDateString = this.dateToString(this.selectedDate), this.selectMonth(this.selectedDate)
        },
        changeInput: function (a) {
            this.input.val(a).change(), this.hide()
        },
        show: function () {
            this.rootLayers.css("display", "block"), a([window, document.body]).click(this.hideIfClickOutside), this.input.unbind("focus", this.show), this.rootLayers.keydown(this.keydownHandler), this.setPosition()
        },
        hide: function () {
            this.rootLayers.css("display", "none"), a([window, document.body]).unbind("click", this.hideIfClickOutside), this.input.focus(this.show), this.rootLayers.unbind("keydown", this.keydownHandler)
        },
        hideIfClickOutside: function (a) {
            a.target != this.input[0] && !this.insideSelector(a) && this.hide()
        },
        insideSelector: function (a) {
            var b = this.dateSelector.position();
            return b.right = b.left + this.dateSelector.outerWidth(), b.bottom = b.top + this.dateSelector.outerHeight(), a.pageY < b.bottom && a.pageY > b.top && a.pageX < b.right && a.pageX > b.left
        },
        keydownHandler: function (a) {
            switch (a.keyCode) {
            case 9:
            case 27:
                this.hide();
                return;
            case 13:
                this.changeInput(this.selectedDateString);
                break;
            case 33:
                this.moveDateMonthBy(a.ctrlKey ? -12 : -1);
                break;
            case 34:
                this.moveDateMonthBy(a.ctrlKey ? 12 : 1);
                break;
            case 38:
                this.moveDateBy(-7);
                break;
            case 40:
                this.moveDateBy(7);
                break;
            case 37:
                this.moveDateBy(-1);
                break;
            case 39:
                this.moveDateBy(1);
                break;
            default:
                return
            }
            a.preventDefault()
        },
        stringToDate: function (a) {
            var b;
            return (b = a.match(/^(\d{1,2}) ([^\s]+) (\d{4,4})$/)) ? new Date(b[3], this.shortMonthNum(b[2]), b[1], 12, 0) : null
        },
        dateToString: function (a) {
            return a.getDate() + " " + this.short_month_names[a.getMonth()] + " " + a.getFullYear()
        },
        setPosition: function () {
            var a = this.input.offset();
            this.rootLayers.css({
                top: a.top + this.input.outerHeight(),
                left: a.left
            }), this.ieframe && this.ieframe.css({
                width: this.dateSelector.outerWidth(),
                height: this.dateSelector.outerHeight()
            })
        },
        moveDateBy: function (a) {
            var b = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate() + a);
            this.selectDate(b)
        },
        moveDateMonthBy: function (a) {
            var b = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + a, this.selectedDate.getDate());
            b.getMonth() == this.selectedDate.getMonth() + a + 1 && b.setDate(0), this.selectDate(b)
        },
        moveMonthBy: function (a) {
            var b = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + a, this.currentMonth.getDate());
            this.selectMonth(b)
        },
        monthName: function (a) {
            return this.month_names[a.getMonth()]
        },
        bindToObj: function (a) {
            var b = this;
            return function () {
                return a.apply(b, arguments)
            }
        },
        bindMethodsToObj: function () {
            for (var a = 0; a < arguments.length; a++) this[arguments[a]] = this.bindToObj(this[arguments[a]])
        },
        indexFor: function (a, b) {
            for (var c = 0; c < a.length; c++) if (b == a[c]) return c
        },
        monthNum: function (a) {
            return this.indexFor(this.month_names, a)
        },
        shortMonthNum: function (a) {
            return this.indexFor(this.short_month_names, a)
        },
        shortDayNum: function (a) {
            return this.indexFor(this.short_day_names, a)
        },
        daysBetween: function (a, b) {
            return a = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()), b = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()), (b - a) / 864e5
        },
        changeDayTo: function (a, b, c) {
            var d = c * (Math.abs(b.getDay() - a - c * 7) % 7);
            return new Date(b.getFullYear(), b.getMonth(), b.getDate() + d)
        },
        rangeStart: function (a) {
            return this.changeDayTo(this.start_of_week, new Date(a.getFullYear(), a.getMonth()), -1)
        },
        rangeEnd: function (a) {
            return this.changeDayTo((this.start_of_week - 1) % 7, new Date(a.getFullYear(), a.getMonth() + 1, 0), 1)
        },
        isFirstDayOfWeek: function (a) {
            return a.getDay() == this.start_of_week
        },
        isLastDayOfWeek: function (a) {
            return a.getDay() == (this.start_of_week - 1) % 7
        },
        adjustDays: function (a) {
            var b = [];
            for (var c = 0; c < a.length; c++) b[c] = a[(c + this.start_of_week) % 7];
            return b
        }
    }, a.fn.date_input = function (a) {
        return this.each(function () {
            new b(this, a)
        })
    }, a.date_input = {
        initialize: function (b) {
            a("input.date_input").date_input(b)
        }
    }, b
}(jQuery), jQuery.easing.jswing = jQuery.easing.swing, jQuery.extend(jQuery.easing, {
    def: "easeOutQuad",
    swing: function (a, b, c, d, e) {
        return jQuery.easing[jQuery.easing.def](a, b, c, d, e)
    },
    easeInQuad: function (a, b, c, d, e) {
        return d * (b /= e) * b + c
    },
    easeOutQuad: function (a, b, c, d, e) {
        return -d * (b /= e) * (b - 2) + c
    },
    easeInOutQuad: function (a, b, c, d, e) {
        return (b /= e / 2) < 1 ? d / 2 * b * b + c : -d / 2 * (--b * (b - 2) - 1) + c
    },
    easeInCubic: function (a, b, c, d, e) {
        return d * (b /= e) * b * b + c
    },
    easeOutCubic: function (a, b, c, d, e) {
        return d * ((b = b / e - 1) * b * b + 1) + c
    },
    easeInOutCubic: function (a, b, c, d, e) {
        return (b /= e / 2) < 1 ? d / 2 * b * b * b + c : d / 2 * ((b -= 2) * b * b + 2) + c
    },
    easeInQuart: function (a, b, c, d, e) {
        return d * (b /= e) * b * b * b + c
    },
    easeOutQuart: function (a, b, c, d, e) {
        return -d * ((b = b / e - 1) * b * b * b - 1) + c
    },
    easeInOutQuart: function (a, b, c, d, e) {
        return (b /= e / 2) < 1 ? d / 2 * b * b * b * b + c : -d / 2 * ((b -= 2) * b * b * b - 2) + c
    },
    easeInQuint: function (a, b, c, d, e) {
        return d * (b /= e) * b * b * b * b + c
    },
    easeOutQuint: function (a, b, c, d, e) {
        return d * ((b = b / e - 1) * b * b * b * b + 1) + c
    },
    easeInOutQuint: function (a, b, c, d, e) {
        return (b /= e / 2) < 1 ? d / 2 * b * b * b * b * b + c : d / 2 * ((b -= 2) * b * b * b * b + 2) + c
    },
    easeInSine: function (a, b, c, d, e) {
        return -d * Math.cos(b / e * (Math.PI / 2)) + d + c
    },
    easeOutSine: function (a, b, c, d, e) {
        return d * Math.sin(b / e * (Math.PI / 2)) + c
    },
    easeInOutSine: function (a, b, c, d, e) {
        return -d / 2 * (Math.cos(Math.PI * b / e) - 1) + c
    },
    easeInExpo: function (a, b, c, d, e) {
        return b == 0 ? c : d * Math.pow(2, 10 * (b / e - 1)) + c
    },
    easeOutExpo: function (a, b, c, d, e) {
        return b == e ? c + d : d * (-Math.pow(2, -10 * b / e) + 1) + c
    },
    easeInOutExpo: function (a, b, c, d, e) {
        return b == 0 ? c : b == e ? c + d : (b /= e / 2) < 1 ? d / 2 * Math.pow(2, 10 * (b - 1)) + c : d / 2 * (-Math.pow(2, -10 * --b) + 2) + c
    },
    easeInCirc: function (a, b, c, d, e) {
        return -d * (Math.sqrt(1 - (b /= e) * b) - 1) + c
    },
    easeOutCirc: function (a, b, c, d, e) {
        return d * Math.sqrt(1 - (b = b / e - 1) * b) + c
    },
    easeInOutCirc: function (a, b, c, d, e) {
        return (b /= e / 2) < 1 ? -d / 2 * (Math.sqrt(1 - b * b) - 1) + c : d / 2 * (Math.sqrt(1 - (b -= 2) * b) + 1) + c
    },
    easeInElastic: function (a, b, c, d, e) {
        var f = 1.70158,
            g = 0,
            h = d;
        if (b == 0) return c;
        if ((b /= e) == 1) return c + d;
        g || (g = e * .3);
        if (h < Math.abs(d)) {
            h = d;
            var f = g / 4
        } else var f = g / (2 * Math.PI) * Math.asin(d / h);
        return -(h * Math.pow(2, 10 * (b -= 1)) * Math.sin((b * e - f) * 2 * Math.PI / g)) + c
    },
    easeOutElastic: function (a, b, c, d, e) {
        var f = 1.70158,
            g = 0,
            h = d;
        if (b == 0) return c;
        if ((b /= e) == 1) return c + d;
        g || (g = e * .3);
        if (h < Math.abs(d)) {
            h = d;
            var f = g / 4
        } else var f = g / (2 * Math.PI) * Math.asin(d / h);
        return h * Math.pow(2, -10 * b) * Math.sin((b * e - f) * 2 * Math.PI / g) + d + c
    },
    easeInOutElastic: function (a, b, c, d, e) {
        var f = 1.70158,
            g = 0,
            h = d;
        if (b == 0) return c;
        if ((b /= e / 2) == 2) return c + d;
        g || (g = e * .3 * 1.5);
        if (h < Math.abs(d)) {
            h = d;
            var f = g / 4
        } else var f = g / (2 * Math.PI) * Math.asin(d / h);
        return b < 1 ? -0.5 * h * Math.pow(2, 10 * (b -= 1)) * Math.sin((b * e - f) * 2 * Math.PI / g) + c : h * Math.pow(2, -10 * (b -= 1)) * Math.sin((b * e - f) * 2 * Math.PI / g) * .5 + d + c
    },
    easeInBack: function (a, b, c, d, e, f) {
        return f == undefined && (f = 1.70158), d * (b /= e) * b * ((f + 1) * b - f) + c
    },
    easeOutBack: function (a, b, c, d, e, f) {
        return f == undefined && (f = 1.70158), d * ((b = b / e - 1) * b * ((f + 1) * b + f) + 1) + c
    },
    easeInOutBack: function (a, b, c, d, e, f) {
        return f == undefined && (f = 1.70158), (b /= e / 2) < 1 ? d / 2 * b * b * (((f *= 1.525) + 1) * b - f) + c : d / 2 * ((b -= 2) * b * (((f *= 1.525) + 1) * b + f) + 2) + c
    },
    easeInBounce: function (a, b, c, d, e) {
        return d - jQuery.easing.easeOutBounce(a, e - b, 0, d, e) + c
    },
    easeOutBounce: function (a, b, c, d, e) {
        return (b /= e) < 1 / 2.75 ? d * 7.5625 * b * b + c : b < 2 / 2.75 ? d * (7.5625 * (b -= 1.5 / 2.75) * b + .75) + c : b < 2.5 / 2.75 ? d * (7.5625 * (b -= 2.25 / 2.75) * b + .9375) + c : d * (7.5625 * (b -= 2.625 / 2.75) * b + .984375) + c
    },
    easeInOutBounce: function (a, b, c, d, e) {
        return b < e / 2 ? jQuery.easing.easeInBounce(a, b * 2, 0, d, e) * .5 + c : jQuery.easing.easeOutBounce(a, b * 2 - e, 0, d, e) * .5 + d * .5 + c
    }
}), function (a) {
    function b(b) {
        if (a.facebox.settings.inited) return !0;
        a.facebox.settings.inited = !0, a(document).trigger("init.facebox"), e();
        var c = a.facebox.settings.imageTypes.join("|");
        a.facebox.settings.imageTypesRegexp = new RegExp(".(" + c + ")$", "i"), b && a.extend(a.facebox.settings, b), a("body").append(a.facebox.settings.faceboxHtml);
        var d = [new Image, new Image];
        d[0].src = a.facebox.settings.closeImage, d[1].src = a.facebox.settings.loadingImage, a("#facebox").find(".b:first, .bl").each(function () {
            d.push(new Image), d.slice(-1).src = a(this).css("background-image").replace(/url\((.+)\)/, "$1")
        }), a("#facebox .close").click(a.facebox.close).append('<img src="' + a.facebox.settings.closeImage + '" class="close_image" title="close">')
    }
    function c() {
        var a, b;
        return self.pageYOffset ? (b = self.pageYOffset, a = self.pageXOffset) : document.documentElement && document.documentElement.scrollTop ? (b = document.documentElement.scrollTop, a = document.documentElement.scrollLeft) : document.body && (b = document.body.scrollTop, a = document.body.scrollLeft), new Array(a, b)
    }
    function d() {
        var a;
        return self.innerHeight ? a = self.innerHeight : document.documentElement && document.documentElement.clientHeight ? a = document.documentElement.clientHeight : document.body && (a = document.body.clientHeight), a
    }
    function e() {
        var b = a.facebox.settings;
        b.loadingImage = b.loading_image || b.loadingImage, b.closeImage = b.close_image || b.closeImage, b.imageTypes = b.image_types || b.imageTypes, b.faceboxHtml = b.facebox_html || b.faceboxHtml
    }
    function f(b, c) {
        if (b.match(/#/)) {
            var d = window.location.href.split("#")[0],
                e = b.replace(d, "");
            if (e == "#") return;
            a.facebox.reveal(a(e).html(), c)
        } else b.match(a.facebox.settings.imageTypesRegexp) ? g(b, c) : h(b, c)
    }
    function g(b, c) {
        var d = new Image;
        d.onload = function () {
            a.facebox.reveal('<div class="image"><img src="' + d.src + '" /></div>', c)
        }, d.src = b
    }
    function h(b, c) {
        a.get(b, function (b) {
            a.facebox.reveal(b, c)
        })
    }
    function i() {
        return a.facebox.settings.overlay == 0 || a.facebox.settings.opacity === null
    }
    function j() {
        if (i()) return;
        return a("#facebox_overlay").length == 0 && a("body").append('<div id="facebox_overlay" class="facebox_hide"></div>'), a("#facebox_overlay").hide().addClass("facebox_overlayBG").css("opacity", a.facebox.settings.opacity).click(function () {
            a(document).trigger("close.facebox")
        }).fadeIn(200), !1
    }
    function k() {
        if (i()) return;
        return a("#facebox_overlay").fadeOut(200, function () {
            a("#facebox_overlay").removeClass("facebox_overlayBG"), a("#facebox_overlay").addClass("facebox_hide"), a("#facebox_overlay").remove()
        }), !1
    }
    a.facebox = function (b, c) {
        a.facebox.loading(), b.ajax ? h(b.ajax, c) : b.image ? g(b.image, c) : b.div ? f(b.div, c) : a.isFunction(b) ? b.call(a) : a.facebox.reveal(b, c)
    }, a.extend(a.facebox, {
        settings: {
            opacity: .2,
            overlay: !0,
            loadingImage: "/facebox/loading.gif",
            closeImage: "/facebox/closelabel.png",
            imageTypes: ["png", "jpg", "jpeg", "gif"],
            faceboxHtml: '    <div id="facebox" style="display:none;">       <div class="popup">         <div class="content">         </div>         <a href="#" class="close"></a>       </div>     </div>'
        },
        loading: function () {
            b();
            if (a("#facebox .loading").length == 1) return !0;
            j(), a("#facebox .content").empty().append('<div class="loading"><img src="' + a.facebox.settings.loadingImage + '"/></div>'), a("#facebox").show().css({
                top: c()[1] + d() / 10,
                left: a(window).width() / 2 - a("#facebox .popup").outerWidth() / 2
            }), a(document).bind("keydown.facebox", function (b) {
                return b.keyCode == 27 && a.facebox.close(), !0
            }), a(document).trigger("loading.facebox")
        },
        reveal: function (b, c) {
            a(document).trigger("beforeReveal.facebox"), c && a("#facebox .content").addClass(c), a("#facebox .content").append(b), a("#facebox .loading").remove(), a("#facebox .popup").children().fadeIn("normal"), a("#facebox").css("left", a(window).width() / 2 - a("#facebox .popup").outerWidth() / 2), a(document).trigger("reveal.facebox").trigger("afterReveal.facebox")
        },
        close: function () {
            return a(document).trigger("close.facebox"), !1
        }
    }), a.fn.facebox = function (c) {
        function d() {
            a.facebox.loading(!0);
            var b = this.rel.match(/facebox\[?\.(\w+)\]?/);
            return b && (b = b[1]), f(this.href, b), !1
        }
        if (a(this).length == 0) return;
        return b(c), this.bind("click.facebox", d)
    }, a(document).bind("close.facebox", function () {
        a(document).unbind("keydown.facebox"), a("#facebox").fadeOut(function () {
            a("#facebox .content").removeClass().addClass("content"), a("#facebox .loading").remove(), a(document).trigger("afterClose.facebox")
        }), k()
    })
}(jQuery), function (a) {
    a.fn.fancyplace = function (b) {
        var c = a.extend({}, a.fn.fancyplace.defaults, b);
        return this.each(function () {
            var b = a(this).hide(),
                c = a("#" + b.attr("for")),
                d = b.attr("data-placeholder-mode") == "sticky";
            d ? (c.keyup(function () {
                a.trim(c.val()) == "" ? b.show() : b.hide()
            }), c.keyup()) : (c.focus(function () {
                b.hide()
            }), c.blur(function () {
                a.trim(c.val()) == "" && b.show()
            }), c.blur())
        })
    }, a.fn.fancyplace.defaults = {}
}(jQuery), jQuery.fn.farbtastic = function (a) {
    return $.farbtastic(this, a), this
}, jQuery.farbtastic = function (a, b) {
    var a = $(a).get(0);
    return a.farbtastic || (a.farbtastic = new jQuery._farbtastic(a, b))
}, jQuery._farbtastic = function (a, b) {
    var c = this;
    $(a).html('<div class="farbtastic"><div class="color"></div><div class="wheel"></div><div class="overlay"></div><div class="h-marker marker"></div><div class="sl-marker marker"></div></div>');
    var d = $(".farbtastic", a);
    c.wheel = $(".wheel", a).get(0), c.radius = 84, c.square = 100, c.width = 194, navigator.appVersion.match(/MSIE [0-6]\./) && $("*", d).each(function () {
        if (this.currentStyle.backgroundImage != "none") {
            var a = this.currentStyle.backgroundImage;
            a = this.currentStyle.backgroundImage.substring(5, a.length - 2), $(this).css({
                backgroundImage: "none",
                filter: "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true, sizingMethod=crop, src='" + a + "')"
            })
        }
    }), c.linkTo = function (a) {
        typeof c.callback == "object" && $(c.callback).unbind("keyup", c.updateValue), c.color = null;
        if (typeof a == "function") c.callback = a;
        else if (typeof a == "object" || typeof a == "string") c.callback = $(a), c.callback.bind("keyup", c.updateValue), c.callback.get(0).value && c.setColor(c.callback.get(0).value);
        return this
    }, c.updateValue = function (a) {
        this.value && this.value != c.color && c.setColor(this.value)
    }, c.setColor = function (a) {
        var b = c.unpack(a);
        return c.color != a && b && (c.color = a, c.rgb = b, c.hsl = c.RGBToHSL(c.rgb), c.updateDisplay()), this
    }, c.setHSL = function (a) {
        return c.hsl = a, c.rgb = c.HSLToRGB(a), c.color = c.pack(c.rgb), c.updateDisplay(), this
    }, c.widgetCoords = function (a) {
        var b, d, e = a.target || a.srcElement,
            f = c.wheel;
        if (typeof a.offsetX != "undefined") {
            var g = {
                x: a.offsetX,
                y: a.offsetY
            },
                h = e;
            while (h) h.mouseX = g.x, h.mouseY = g.y, g.x += h.offsetLeft, g.y += h.offsetTop, h = h.offsetParent;
            var h = f,
                i = {
                    x: 0,
                    y: 0
                };
            while (h) {
                if (typeof h.mouseX != "undefined") {
                    b = h.mouseX - i.x, d = h.mouseY - i.y;
                    break
                }
                i.x += h.offsetLeft, i.y += h.offsetTop, h = h.offsetParent
            }
            h = e;
            while (h) h.mouseX = undefined, h.mouseY = undefined, h = h.offsetParent
        } else {
            var g = c.absolutePosition(f);
            b = (a.pageX || 0 * (a.clientX + $("html").get(0).scrollLeft)) - g.x, d = (a.pageY || 0 * (a.clientY + $("html").get(0).scrollTop)) - g.y
        }
        return {
            x: b - c.width / 2,
            y: d - c.width / 2
        }
    }, c.mousedown = function (a) {
        document.dragging || ($(document).bind("mousemove", c.mousemove).bind("mouseup", c.mouseup), document.dragging = !0);
        var b = c.widgetCoords(a);
        return c.circleDrag = Math.max(Math.abs(b.x), Math.abs(b.y)) * 2 > c.square, c.mousemove(a), !1
    }, c.mousemove = function (a) {
        var b = c.widgetCoords(a);
        if (c.circleDrag) {
            var d = Math.atan2(b.x, -b.y) / 6.28;
            d < 0 && (d += 1), c.setHSL([d, c.hsl[1], c.hsl[2]])
        } else {
            var e = Math.max(0, Math.min(1, -(b.x / c.square) + .5)),
                f = Math.max(0, Math.min(1, -(b.y / c.square) + .5));
            c.setHSL([c.hsl[0], e, f])
        }
        return !1
    }, c.mouseup = function () {
        $(document).unbind("mousemove", c.mousemove), $(document).unbind("mouseup", c.mouseup), document.dragging = !1
    }, c.updateDisplay = function () {
        var a = c.hsl[0] * 6.28;
        $(".h-marker", d).css({
            left: Math.round(Math.sin(a) * c.radius + c.width / 2) + "px",
            top: Math.round(-Math.cos(a) * c.radius + c.width / 2) + "px"
        }), $(".sl-marker", d).css({
            left: Math.round(c.square * (.5 - c.hsl[1]) + c.width / 2) + "px",
            top: Math.round(c.square * (.5 - c.hsl[2]) + c.width / 2) + "px"
        }), $(".color", d).css("backgroundColor", c.pack(c.HSLToRGB([c.hsl[0], 1, .5]))), typeof c.callback == "object" ? ($(c.callback).css({
            backgroundColor: c.color,
            color: c.hsl[2] > .5 ? "#000" : "#fff"
        }), $(c.callback).each(function () {
            this.value && this.value != c.color && (this.value = c.color)
        })) : typeof c.callback == "function" && c.callback.call(c, c.color)
    }, c.absolutePosition = function (a) {
        var b = {
            x: a.offsetLeft,
            y: a.offsetTop
        };
        if (a.offsetParent) {
            var d = c.absolutePosition(a.offsetParent);
            b.x += d.x, b.y += d.y
        }
        return b
    }, c.pack = function (a) {
        var b = Math.round(a[0] * 255),
            c = Math.round(a[1] * 255),
            d = Math.round(a[2] * 255);
        return "#" + (b < 16 ? "0" : "") + b.toString(16) + (c < 16 ? "0" : "") + c.toString(16) + (d < 16 ? "0" : "") + d.toString(16)
    }, c.unpack = function (a) {
        if (a.length == 7) return [parseInt("0x" + a.substring(1, 3)) / 255, parseInt("0x" + a.substring(3, 5)) / 255, parseInt("0x" + a.substring(5, 7)) / 255];
        if (a.length == 4) return [parseInt("0x" + a.substring(1, 2)) / 15, parseInt("0x" + a.substring(2, 3)) / 15, parseInt("0x" + a.substring(3, 4)) / 15]
    }, c.HSLToRGB = function (a) {
        var b, c, d, e, f, g = a[0],
            h = a[1],
            i = a[2];
        return c = i <= .5 ? i * (h + 1) : i + h - i * h, b = i * 2 - c, [this.hueToRGB(b, c, g + .33333), this.hueToRGB(b, c, g), this.hueToRGB(b, c, g - .33333)]
    }, c.hueToRGB = function (a, b, c) {
        return c = c < 0 ? c + 1 : c > 1 ? c - 1 : c, c * 6 < 1 ? a + (b - a) * c * 6 : c * 2 < 1 ? b : c * 3 < 2 ? a + (b - a) * (.66666 - c) * 6 : a
    }, c.RGBToHSL = function (a) {
        var b, c, d, e, f, g, h = a[0],
            i = a[1],
            j = a[2];
        return b = Math.min(h, Math.min(i, j)), c = Math.max(h, Math.max(i, j)), d = c - b, g = (b + c) / 2, f = 0, g > 0 && g < 1 && (f = d / (g < .5 ? 2 * g : 2 - 2 * g)), e = 0, d > 0 && (c == h && c != i && (e += (i - j) / d), c == i && c != j && (e += 2 + (j - h) / d), c == j && c != h && (e += 4 + (h - i) / d), e /= 6), [e, f, g]
    }, $("*", d).mousedown(c.mousedown), c.setColor("#000000"), b && c.linkTo(b)
}, function ($) {
    function clickHandler(a) {
        var b = this.form;
        b.clk = this;
        if (this.type == "image") if (a.offsetX != undefined) b.clk_x = a.offsetX, b.clk_y = a.offsetY;
        else if (typeof $.fn.offset == "function") {
            var c = $(this).offset();
            b.clk_x = a.pageX - c.left, b.clk_y = a.pageY - c.top
        } else b.clk_x = a.pageX - this.offsetLeft, b.clk_y = a.pageY - this.offsetTop;
        setTimeout(function () {
            b.clk = b.clk_x = b.clk_y = null
        }, 10)
    }
    function submitHandler() {
        var a = this.formPluginId,
            b = $.fn.ajaxForm.optionHash[a];
        return $(this).ajaxSubmit(b), !1
    }
    $.fn.ajaxSubmit = function (options) {
        function fileUpload() {
            function cb() {
                if (cbInvoked++) return;
                io.detachEvent ? io.detachEvent("onload", cb) : io.removeEventListener("load", cb, !1);
                var ok = !0;
                try {
                    if (timedOut) throw "timeout";
                    var data, doc;
                    doc = io.contentWindow ? io.contentWindow.document : io.contentDocument ? io.contentDocument : io.document, xhr.responseText = doc.body ? doc.body.innerHTML : null, xhr.responseXML = doc.XMLDocument ? doc.XMLDocument : doc;
                    if (opts.dataType == "json" || opts.dataType == "script") {
                        var ta = doc.getElementsByTagName("textarea")[0];
                        data = ta ? ta.value : xhr.responseText, opts.dataType == "json" ? eval("data = " + data) : $.globalEval(data)
                    } else opts.dataType == "xml" ? (data = xhr.responseXML, !data && xhr.responseText != null && (data = toXml(xhr.responseText))) : data = xhr.responseText
                } catch (e) {
                    ok = !1, $.handleError(opts, xhr, "error", e)
                }
                ok && (opts.success(data, "success"), g && $.event.trigger("ajaxSuccess", [xhr, opts])), g && $.event.trigger("ajaxComplete", [xhr, opts]), g && !--$.active && $.event.trigger("ajaxStop"), opts.complete && opts.complete(xhr, ok ? "success" : "error"), setTimeout(function () {
                    $io.remove(), xhr.responseXML = null
                }, 100)
            }
            function toXml(a, b) {
                return window.ActiveXObject ? (b = new ActiveXObject("Microsoft.XMLDOM"), b.async = "false", b.loadXML(a)) : b = (new DOMParser).parseFromString(a, "text/xml"), b && b.documentElement && b.documentElement.tagName != "parsererror" ? b : null
            }
            var form = $form[0],
                opts = $.extend({}, $.ajaxSettings, options),
                id = "jqFormIO" + $.fn.ajaxSubmit.counter++,
                $io = $('<iframe id="' + id + '" name="' + id + '" />'),
                io = $io[0],
                op8 = $.browser.opera && window.opera.version() < 9;
            if ($.browser.msie || op8) io.src = 'javascript:false;document.write("");';
            $io.css({
                position: "absolute",
                top: "-1000px",
                left: "-1000px"
            });
            var xhr = {
                responseText: null,
                responseXML: null,
                status: 0,
                statusText: "n/a",
                getAllResponseHeaders: function () {},
                getResponseHeader: function () {},
                setRequestHeader: function () {}
            },
                g = opts.global;
            g && !($.active++) && $.event.trigger("ajaxStart"), g && $.event.trigger("ajaxSend", [xhr, opts]);
            var cbInvoked = 0,
                timedOut = 0;
            setTimeout(function () {
                var a = form.encoding ? "encoding" : "enctype",
                    b = $form.attr("target"),
                    c = $form.attr("action");
                $form.attr({
                    target: id,
                    method: "POST",
                    action: opts.url
                }), form[a] = "multipart/form-data", opts.timeout && setTimeout(function () {
                    timedOut = !0, cb()
                }, opts.timeout), $io.appendTo("body"), io.attachEvent ? io.attachEvent("onload", cb) : io.addEventListener("load", cb, !1), form.submit(), $form.attr({
                    action: c,
                    target: b
                })
            }, 10)
        }
        typeof options == "function" && (options = {
            success: options
        }), options = $.extend({
            url: this.attr("action") || window.location.toString(),
            type: this.attr("method") || "GET"
        }, options || {});
        var veto = {};
        $.event.trigger("form.pre.serialize", [this, options, veto]);
        if (veto.veto) return this;
        var a = this.formToArray(options.semantic);
        if (options.data) for (var n in options.data) a.push({
            name: n,
            value: options.data[n]
        });
        if (options.beforeSubmit && options.beforeSubmit(a, this, options) === !1) return this;
        $.event.trigger("form.submit.validate", [a, this, options, veto]);
        if (veto.veto) return this;
        var q = $.param(a);
        options.type.toUpperCase() == "GET" ? (options.url += (options.url.indexOf("?") >= 0 ? "&" : "?") + q, options.data = null) : options.data = q;
        var $form = this,
            callbacks = [];
        options.resetForm && callbacks.push(function () {
            $form.resetForm()
        }), options.clearForm && callbacks.push(function () {
            $form.clearForm()
        });
        if (!options.dataType && options.target) {
            var oldSuccess = options.success ||
            function () {};
            callbacks.push(function (a) {
                this.evalScripts ? $(options.target).attr("innerHTML", a).evalScripts().each(oldSuccess, arguments) : $(options.target).html(a).each(oldSuccess, arguments)
            })
        } else options.success && callbacks.push(options.success);
        options.success = function (a, b) {
            for (var c = 0, d = callbacks.length; c < d; c++) callbacks[c](a, b, $form)
        };
        var files = $("input:file", this).fieldValue(),
            found = !1;
        for (var j = 0; j < files.length; j++) files[j] && (found = !0);
        return options.iframe || found ? $.browser.safari && options.closeKeepAlive ? $.get(options.closeKeepAlive, fileUpload) : fileUpload() : $.ajax(options), $.event.trigger("form.submit.notify", [this, options]), this
    }, $.fn.ajaxSubmit.counter = 0, $.fn.ajaxForm = function (a) {
        return this.ajaxFormUnbind().submit(submitHandler).each(function () {
            this.formPluginId = $.fn.ajaxForm.counter++, $.fn.ajaxForm.optionHash[this.formPluginId] = a, $(":submit,input:image", this).click(clickHandler)
        })
    }, $.fn.ajaxForm.counter = 1, $.fn.ajaxForm.optionHash = {}, $.fn.ajaxFormUnbind = function () {
        return this.unbind("submit", submitHandler), this.each(function () {
            $(":submit,input:image", this).unbind("click", clickHandler)
        })
    }, $.fn.formToArray = function (a) {
        var b = [];
        if (this.length == 0) return b;
        var c = this[0],
            d = a ? c.getElementsByTagName("*") : c.elements;
        if (!d) return b;
        for (var e = 0, f = d.length; e < f; e++) {
            var g = d[e],
                h = g.name;
            if (!h) continue;
            if (a && c.clk && g.type == "image") {
                !g.disabled && c.clk == g && b.push({
                    name: h + ".x",
                    value: c.clk_x
                }, {
                    name: h + ".y",
                    value: c.clk_y
                });
                continue
            }
            var i = $.fieldValue(g, !0);
            if (i && i.constructor == Array) for (var j = 0, k = i.length; j < k; j++) b.push({
                name: h,
                value: i[j]
            });
            else i !== null && typeof i != "undefined" && b.push({
                name: h,
                value: i
            })
        }
        if (!a && c.clk) {
            var l = c.getElementsByTagName("input");
            for (var e = 0, f = l.length; e < f; e++) {
                var m = l[e],
                    h = m.name;
                h && !m.disabled && m.type == "image" && c.clk == m && b.push({
                    name: h + ".x",
                    value: c.clk_x
                }, {
                    name: h + ".y",
                    value: c.clk_y
                })
            }
        }
        return b
    }, $.fn.formSerialize = function (a) {
        return $.param(this.formToArray(a))
    }, $.fn.fieldSerialize = function (a) {
        var b = [];
        return this.each(function () {
            var c = this.name;
            if (!c) return;
            var d = $.fieldValue(this, a);
            if (d && d.constructor == Array) for (var e = 0, f = d.length; e < f; e++) b.push({
                name: c,
                value: d[e]
            });
            else d !== null && typeof d != "undefined" && b.push({
                name: this.name,
                value: d
            })
        }), $.param(b)
    }, $.fn.fieldValue = function (a) {
        for (var b = [], c = 0, d = this.length; c < d; c++) {
            var e = this[c],
                f = $.fieldValue(e, a);
            if (f === null || typeof f == "undefined" || f.constructor == Array && !f.length) continue;
            f.constructor == Array ? $.merge(b, f) : b.push(f)
        }
        return b
    }, $.fieldValue = function (a, b) {
        var c = a.name,
            d = a.type,
            e = a.tagName.toLowerCase();
        typeof b == "undefined" && (b = !0);
        if (b && (!c || a.disabled || d == "reset" || d == "button" || (d == "checkbox" || d == "radio") && !a.checked || (d == "submit" || d == "image") && a.form && a.form.clk != a || e == "select" && a.selectedIndex == -1)) return null;
        if (e == "select") {
            var f = a.selectedIndex;
            if (f < 0) return null;
            var g = [],
                h = a.options,
                i = d == "select-one",
                j = i ? f + 1 : h.length;
            for (var k = i ? f : 0; k < j; k++) {
                var l = h[k];
                if (l.selected) {
                    var m = $.browser.msie && !l.attributes.value.specified ? l.text : l.value;
                    if (i) return m;
                    g.push(m)
                }
            }
            return g
        }
        return a.value
    }, $.fn.clearForm = function () {
        return this.each(function () {
            $("input,select,textarea", this).clearFields()
        })
    }, $.fn.clearFields = $.fn.clearInputs = function () {
        return this.each(function () {
            var a = this.type,
                b = this.tagName.toLowerCase();
            a == "text" || a == "password" || b == "textarea" ? this.value = "" : a == "checkbox" || a == "radio" ? this.checked = !1 : b == "select" && (this.selectedIndex = -1)
        })
    }, $.fn.resetForm = function () {
        return this.each(function () {
            (typeof this.reset == "function" || typeof this.reset == "object" && !this.reset.nodeType) && this.reset()
        })
    }, $.fn.enable = function (a) {
        return a == undefined && (a = !0), this.each(function () {
            this.disabled = !a
        })
    }, $.fn.select = function (a) {
        return a == undefined && (a = !0), this.each(function () {
            var b = this.type;
            if (b == "checkbox" || b == "radio") this.checked = a;
            else if (this.tagName.toLowerCase() == "option") {
                var c = $(this).parent("select");
                a && c[0] && c[0].type == "select-one" && c.find("option").select(!1), this.selected = a
            }
        })
    }
}(jQuery), function (a) {
    a.fn.gfmPreview = function (b) {
        b = b || {};
        var c = a("<div>").attr("class", "gfm-preview").text("Preview goes here"),
            d = this;
        d.after(c);
        var e = !1;
        d.keyup(function () {
            e = !0
        }), setInterval(function () {
            if (e) {
                e = !1;
                var b = d.val();
                a.post("/preview", {
                    text: b
                }, function (a) {
                    c.html(a)
                })
            }
        }, 2e3)
    }
}(jQuery), function (a) {
    a.fn.gfmPreview = function (b) {
        var c = a.extend({}, a.fn.gfmPreview.defaults, b);
        return this.each(function () {
            var b = !1,
                d = a(this),
                e = a("<div>").attr("class", "gfm-preview").text("Preview goes here"),
                f = c.outputContainer || e;
            c.outputContainer == null && d.after(e);
            var g = !1;
            d.keyup(function () {
                g = !0, b || (c.onInit.call(this), b = !0)
            });
            var h = setInterval(function () {
                if (g) {
                    g = !1;
                    var b = d.val();
                    a.post("/preview", {
                        text: b
                    }, function (a) {
                        f.html(a)
                    })
                }
            }, c.refresh)
        })
    }, a.fn.gfmPreview.defaults = {
        outputContainer: null,
        refresh: 2e3,
        onInit: function () {}
    }
}(jQuery), function (a) {
    a.fn.assigneeFilter = function (b) {
        function f(a) {
            c.find(".current").removeClass("current"), c.find(":checked").removeAttr("checked"), a.addClass("current"), a.find(":radio").attr("checked", "checked")
        }
        var c = this,
            d = c.find("li"),
            e = d.map(function () {
                return a(this).text().toLowerCase()
            });
        return c.find(".js-assignee-filter-submit").live("click", function (a) {
            b(a), a.preventDefault()
        }), c.find(".js-assignee-filter").keydown(function (a) {
            switch (a.which) {
            case 9:
            case 38:
            case 40:
                return !1;
            case 13:
                return b(a), !1
            }
        }).keyup(function (b) {
            c.find(".selected").removeClass("selected");
            var g = c.find(".current:visible"),
                h = null;
            switch (b.which) {
            case 9:
            case 16:
            case 17:
            case 18:
            case 91:
            case 93:
            case 13:
                return c.find(".current label").trigger("click"), !1;
            case 38:
            case 40:
                if (g.length == 0) return f(c.find("li:visible:first")), !1;
                return h = b.which == 38 ? g.prevAll(":visible:first") : g.nextAll(":visible:first"), h.length && f(h), !1
            }
            var i = a.trim(a(this).val().toLowerCase()),
                j = [];
            if (!i) return c.find(".current").removeClass("current"), d.show();
            d.hide(), e.each(function (a) {
                var b = this.score(i);
                b > 0 && j.push([b, a])
            }), a.each(j.sort(function (a, b) {
                return b[0] - a[0]
            }), function () {
                a(d[this[1]]).show()
            }), c.find(".current:visible").length == 0 && f(c.find("li:visible:first"))
        }), c
    }
}(jQuery), function (a) {
    a.fn.cardsSelect = function (b) {
        var c = a.extend({}, a.fn.cardsSelect.defaults, b);
        return this.each(function () {
            var b = a(this),
                c = b.next("dl.form").find("input[type=text]"),
                d = b.find(".card"),
                e = b.find("input[name='billing[type]']"),
                f = function (b) {
                    d.each(function () {
                        var c = a(this);
                        c.attr("data-name") == b ? c.removeClass("disabled") : c.addClass("disabled"), e.val(b)
                    })
                };
            c.bind("keyup blur", function () {
                var b = a(this).val();
                b.match(/^5[1-5]/) ? f("master") : b.match(/^4/) ? f("visa") : b.match(/^3(4|7)/) ? f("american_express") : b.match(/^6011/) ? f("discover") : b.match(/^(30[0-5]|36|38)/) ? f("diners_club") : b.match(/^(3|2131|1800)/) ? f("jcb") : (d.removeClass("disabled"), e.val(""))
            }).keyup()
        })
    }, a.fn.cardsSelect.defaults = {}
}(jQuery), $.fn.contextButton = function (a, b) {
    return $(this).delegate(a, "click", function (a) {
        var c = $(this),
            d = $.extend({
                contextPaneSelector: c.attr("data-context-pane"),
                anchorTo: "left",
                offsetFrom: $()
            }, b),
            e = $(d.contextPaneSelector),
            f = function () {
                $(document).unbind("keydown.context-button"), $("#context-overlay").remove(), e.removeClass("active"), setTimeout(function () {
                    e.hide()
                }, 200), c.removeClass("selected"), e.trigger("deactivated.contextPane")
            };
        if (e.is(":visible")) f();
        else {
            var g = c.offset(),
                h = d.offsetFrom.length ? d.offsetFrom.offset() : {
                    left: 0,
                    top: 0
                },
                i;
            d.anchorTo == "left" ? i = {
                left: g.left - h.left,
                top: g.top - h.top + c.outerHeight(!0) + 5
            } : d.anchorTo == "right" && (i = {
                left: g.left - (e.outerWidth(!0) + h.left - c.outerWidth(!0)),
                top: g.top - h.top + c.outerHeight(!0) + 5
            }), e.css(i), $(document).bind("keydown.context-button", function (a) {
                a.keyCode == 27 && c.click()
            }), $("body").append('<div id="context-overlay"></div>'), $("#context-overlay").click(f).css("position", "fixed").css("top", 0).css("left", 0).css("height", "100%").css("width", "100%"), e.show(), setTimeout(function () {
                e.addClass("active")
            }, 50), e.trigger("activated.contextPane"), c.addClass("selected"), c.trigger("show.context-button")
        }
        e.find("a.close").live("click", f), e.bind("close.context-button", f)
    })
}, $(document).contextButton(".js-context-button"), function (a) {
    function b(a) {
        var b = a.toString(10);
        return (new Array(2 - b.length + 1)).join("0") + b
    }
    a.toISO8601 = function (a) {
        return a.getUTCFullYear() + "-" + b(a.getUTCMonth() + 1) + "-" + b(a.getUTCDate()) + "T" + b(a.getUTCHours()) + ":" + b(a.getUTCMinutes()) + ":" + b(a.getUTCSeconds())
    }, a.parseISO8601 = function (a) {
        a = (a || "").replace(/-/, "/").replace(/-/, "/").replace(/T/, " ").replace(/Z/, " UTC").replace(/([\+-]\d\d)\:?(\d\d)/, " $1$2");
        var b = new Date(a);
        return isNaN(b) ? null : b
    };
    var c = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        d = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        e = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        f = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    a.strftime = function (a, g) {
        var h = a.getDay(),
            i = a.getMonth(),
            j = a.getHours(),
            k = a.getMinutes();
        return g.replace(/\%([aAbBcdHImMpSwyY])/g, function (g) {
            switch (g.substr(1, 1)) {
            case "a":
                return c[h];
            case "A":
                return d[h];
            case "b":
                return e[i];
            case "B":
                return f[i];
            case "c":
                return a.toString();
            case "d":
                return b(a.getDate());
            case "H":
                return b(j);
            case "I":
                return b((j + 12) % 12);
            case "m":
                return b(i + 1);
            case "M":
                return b(k);
            case "p":
                return j > 12 ? "PM" : "AM";
            case "S":
                return b(a.getSeconds());
            case "w":
                return h;
            case "y":
                return b(a.getFullYear() % 100);
            case "Y":
                return a.getFullYear().toString()
            }
        })
    }, a.distanceOfTimeInWords = function (b, c) {
        c || (c = new Date);
        var d = parseInt((c.getTime() - b.getTime()) / 1e3);
        if (d < 60) return "just now";
        if (d < 120) return "about a minute ago";
        if (d < 2700) return parseInt(d / 60).toString() + " minutes ago";
        if (d < 7200) return "about an hour ago";
        if (d < 86400) return "about " + parseInt(d / 3600).toString() + " hours ago";
        if (d < 172800) return "1 day ago";
        var e = parseInt(d / 86400).toString();
        return e > 5 ? a.strftime(b, "%B %d, %Y") : e + " days ago"
    }
}(jQuery), function (a, b) {
    function c(b) {
        return !a(b).parents().andSelf().filter(function () {
            return a.curCSS(this, "visibility") === "hidden" || a.expr.filters.hidden(this)
        }).length
    }
    a.ui = a.ui || {}, a.ui.version || (a.extend(a.ui, {
        version: "1.8.10",
        keyCode: {
            ALT: 18,
            BACKSPACE: 8,
            CAPS_LOCK: 20,
            COMMA: 188,
            COMMAND: 91,
            COMMAND_LEFT: 91,
            COMMAND_RIGHT: 93,
            CONTROL: 17,
            DELETE: 46,
            DOWN: 40,
            END: 35,
            ENTER: 13,
            ESCAPE: 27,
            HOME: 36,
            INSERT: 45,
            LEFT: 37,
            MENU: 93,
            NUMPAD_ADD: 107,
            NUMPAD_DECIMAL: 110,
            NUMPAD_DIVIDE: 111,
            NUMPAD_ENTER: 108,
            NUMPAD_MULTIPLY: 106,
            NUMPAD_SUBTRACT: 109,
            PAGE_DOWN: 34,
            PAGE_UP: 33,
            PERIOD: 190,
            RIGHT: 39,
            SHIFT: 16,
            SPACE: 32,
            TAB: 9,
            UP: 38,
            WINDOWS: 91
        }
    }), a.fn.extend({
        _focus: a.fn.focus,
        focus: function (b, c) {
            return typeof b == "number" ? this.each(function () {
                var d = this;
                setTimeout(function () {
                    a(d).focus(), c && c.call(d)
                }, b)
            }) : this._focus.apply(this, arguments)
        },
        scrollParent: function () {
            var b;
            return b = a.browser.msie && /(static|relative)/.test(this.css("position")) || /absolute/.test(this.css("position")) ? this.parents().filter(function () {
                return /(relative|absolute|fixed)/.test(a.curCSS(this, "position", 1)) && /(auto|scroll)/.test(a.curCSS(this, "overflow", 1) + a.curCSS(this, "overflow-y", 1) + a.curCSS(this, "overflow-x", 1))
            }).eq(0) : this.parents().filter(function () {
                return /(auto|scroll)/.test(a.curCSS(this, "overflow", 1) + a.curCSS(this, "overflow-y", 1) + a.curCSS(this, "overflow-x", 1))
            }).eq(0), /fixed/.test(this.css("position")) || !b.length ? a(document) : b
        },
        zIndex: function (c) {
            if (c !== b) return this.css("zIndex", c);
            if (this.length) {
                c = a(this[0]);
                for (var d; c.length && c[0] !== document;) {
                    d = c.css("position");
                    if (d === "absolute" || d === "relative" || d === "fixed") {
                        d = parseInt(c.css("zIndex"), 10);
                        if (!isNaN(d) && d !== 0) return d
                    }
                    c = c.parent()
                }
            }
            return 0
        },
        disableSelection: function () {
            return this.bind((a.support.selectstart ? "selectstart" : "mousedown") + ".ui-disableSelection", function (a) {
                a.preventDefault()
            })
        },
        enableSelection: function () {
            return this.unbind(".ui-disableSelection")
        }
    }), a.each(["Width", "Height"], function (c, d) {
        function e(b, c, d, e) {
            return a.each(f, function () {
                c -= parseFloat(a.curCSS(b, "padding" + this, !0)) || 0, d && (c -= parseFloat(a.curCSS(b, "border" + this + "Width", !0)) || 0), e && (c -= parseFloat(a.curCSS(b, "margin" + this, !0)) || 0)
            }), c
        }
        var f = d === "Width" ? ["Left", "Right"] : ["Top", "Bottom"],
            g = d.toLowerCase(),
            h = {
                innerWidth: a.fn.innerWidth,
                innerHeight: a.fn.innerHeight,
                outerWidth: a.fn.outerWidth,
                outerHeight: a.fn.outerHeight
            };
        a.fn["inner" + d] = function (c) {
            return c === b ? h["inner" + d].call(this) : this.each(function () {
                a(this).css(g, e(this, c) + "px")
            })
        }, a.fn["outer" + d] = function (b, c) {
            return typeof b != "number" ? h["outer" + d].call(this, b) : this.each(function () {
                a(this).css(g, e(this, b, !0, c) + "px")
            })
        }
    }), a.extend(a.expr[":"], {
        data: function (b, c, d) {
            return !!a.data(b, d[3])
        },
        focusable: function (b) {
            var d = b.nodeName.toLowerCase(),
                e = a.attr(b, "tabindex");
            return "area" === d ? (d = b.parentNode, e = d.name, !b.href || !e || d.nodeName.toLowerCase() !== "map" ? !1 : (b = a("img[usemap=#" + e + "]")[0], !! b && c(b))) : (/input|select|textarea|button|object/.test(d) ? !b.disabled : "a" == d ? b.href || !isNaN(e) : !isNaN(e)) && c(b)
        },
        tabbable: function (b) {
            var c = a.attr(b, "tabindex");
            return (isNaN(c) || c >= 0) && a(b).is(":focusable")
        }
    }), a(function () {
        var b = document.body,
            c = b.appendChild(c = document.createElement("div"));
        a.extend(c.style, {
            minHeight: "100px",
            height: "auto",
            padding: 0,
            borderWidth: 0
        }), a.support.minHeight = c.offsetHeight === 100, a.support.selectstart = "onselectstart" in c, b.removeChild(c).style.display = "none"
    }), a.extend(a.ui, {
        plugin: {
            add: function (b, c, d) {
                b = a.ui[b].prototype;
                for (var e in d) b.plugins[e] = b.plugins[e] || [], b.plugins[e].push([c, d[e]])
            },
            call: function (a, b, c) {
                if ((b = a.plugins[b]) && a.element[0].parentNode) for (var d = 0; d < b.length; d++) a.options[b[d][0]] && b[d][1].apply(a.element, c)
            }
        },
        contains: function (a, b) {
            return document.compareDocumentPosition ? a.compareDocumentPosition(b) & 16 : a !== b && a.contains(b)
        },
        hasScroll: function (b, c) {
            if (a(b).css("overflow") === "hidden") return !1;
            c = c && c === "left" ? "scrollLeft" : "scrollTop";
            var d = !1;
            return b[c] > 0 ? !0 : (b[c] = 1, d = b[c] > 0, b[c] = 0, d)
        },
        isOverAxis: function (a, b, c) {
            return a > b && a < b + c
        },
        isOver: function (b, c, d, e, f, g) {
            return a.ui.isOverAxis(b, d, f) && a.ui.isOverAxis(c, e, g)
        }
    }))
}(jQuery), function (a, b) {
    if (a.cleanData) {
        var c = a.cleanData;
        a.cleanData = function (b) {
            for (var d = 0, e;
            (e = b[d]) != null; d++) a(e).triggerHandler("remove");
            c(b)
        }
    } else {
        var d = a.fn.remove;
        a.fn.remove = function (b, c) {
            return this.each(function () {
                return c || (!b || a.filter(b, [this]).length) && a("*", this).add([this]).each(function () {
                    a(this).triggerHandler("remove")
                }), d.call(a(this), b, c)
            })
        }
    }
    a.widget = function (b, c, d) {
        var e = b.split(".")[0],
            f;
        b = b.split(".")[1], f = e + "-" + b, d || (d = c, c = a.Widget), a.expr[":"][f] = function (c) {
            return !!a.data(c, b)
        }, a[e] = a[e] || {}, a[e][b] = function (a, b) {
            arguments.length && this._createWidget(a, b)
        }, c = new c, c.options = a.extend(!0, {}, c.options), a[e][b].prototype = a.extend(!0, c, {
            namespace: e,
            widgetName: b,
            widgetEventPrefix: a[e][b].prototype.widgetEventPrefix || b,
            widgetBaseClass: f
        }, d), a.widget.bridge(b, a[e][b])
    }, a.widget.bridge = function (c, d) {
        a.fn[c] = function (e) {
            var f = typeof e == "string",
                g = Array.prototype.slice.call(arguments, 1),
                h = this;
            return e = !f && g.length ? a.extend.apply(null, [!0, e].concat(g)) : e, f && e.charAt(0) === "_" ? h : (f ? this.each(function () {
                var d = a.data(this, c),
                    f = d && a.isFunction(d[e]) ? d[e].apply(d, g) : d;
                if (f !== d && f !== b) return h = f, !1
            }) : this.each(function () {
                var b = a.data(this, c);
                b ? b.option(e || {})._init() : a.data(this, c, new d(e, this))
            }), h)
        }
    }, a.Widget = function (a, b) {
        arguments.length && this._createWidget(a, b)
    }, a.Widget.prototype = {
        widgetName: "widget",
        widgetEventPrefix: "",
        options: {
            disabled: !1
        },
        _createWidget: function (b, c) {
            a.data(c, this.widgetName, this), this.element = a(c), this.options = a.extend(!0, {}, this.options, this._getCreateOptions(), b);
            var d = this;
            this.element.bind("remove." + this.widgetName, function () {
                d.destroy()
            }), this._create(), this._trigger("create"), this._init()
        },
        _getCreateOptions: function () {
            return a.metadata && a.metadata.get(this.element[0])[this.widgetName]
        },
        _create: function () {},
        _init: function () {},
        destroy: function () {
            this.element.unbind("." + this.widgetName).removeData(this.widgetName), this.widget().unbind("." + this.widgetName).removeAttr("aria-disabled").removeClass(this.widgetBaseClass + "-disabled ui-state-disabled")
        },
        widget: function () {
            return this.element
        },
        option: function (c, d) {
            var e = c;
            if (arguments.length === 0) return a.extend({}, this.options);
            if (typeof c == "string") {
                if (d === b) return this.options[c];
                e = {}, e[c] = d
            }
            return this._setOptions(e), this
        },
        _setOptions: function (b) {
            var c = this;
            return a.each(b, function (a, b) {
                c._setOption(a, b)
            }), this
        },
        _setOption: function (a, b) {
            return this.options[a] = b, a === "disabled" && this.widget()[b ? "addClass" : "removeClass"](this.widgetBaseClass + "-disabled ui-state-disabled").attr("aria-disabled", b), this
        },
        enable: function () {
            return this._setOption("disabled", !1)
        },
        disable: function () {
            return this._setOption("disabled", !0)
        },
        _trigger: function (b, c, d) {
            var e = this.options[b];
            c = a.Event(c), c.type = (b === this.widgetEventPrefix ? b : this.widgetEventPrefix + b).toLowerCase(), d = d || {};
            if (c.originalEvent) {
                b = a.event.props.length;
                for (var f; b;) f = a.event.props[--b], c[f] = c.originalEvent[f]
            }
            return this.element.trigger(c, d), !(a.isFunction(e) && e.call(this.element[0], c, d) === !1 || c.isDefaultPrevented())
        }
    }
}(jQuery), function (a) {
    a.widget("ui.mouse", {
        options: {
            cancel: ":input,option",
            distance: 1,
            delay: 0
        },
        _mouseInit: function () {
            var b = this;
            this.element.bind("mousedown." + this.widgetName, function (a) {
                return b._mouseDown(a)
            }).bind("click." + this.widgetName, function (d) {
                if (!0 === a.data(d.target, b.widgetName + ".preventClickEvent")) return a.removeData(d.target, b.widgetName + ".preventClickEvent"), d.stopImmediatePropagation(), !1
            }), this.started = !1
        },
        _mouseDestroy: function () {
            this.element.unbind("." + this.widgetName)
        },
        _mouseDown: function (b) {
            b.originalEvent = b.originalEvent || {};
            if (!b.originalEvent.mouseHandled) {
                this._mouseStarted && this._mouseUp(b), this._mouseDownEvent = b;
                var d = this,
                    e = b.which == 1,
                    f = typeof this.options.cancel == "string" ? a(b.target).parents().add(b.target).filter(this.options.cancel).length : !1;
                if (!e || f || !this._mouseCapture(b)) return !0;
                this.mouseDelayMet = !this.options.delay, this.mouseDelayMet || (this._mouseDelayTimer = setTimeout(function () {
                    d.mouseDelayMet = !0
                }, this.options.delay));
                if (this._mouseDistanceMet(b) && this._mouseDelayMet(b)) {
                    this._mouseStarted = this._mouseStart(b) !== !1;
                    if (!this._mouseStarted) return b.preventDefault(), !0
                }
                return this._mouseMoveDelegate = function (a) {
                    return d._mouseMove(a)
                }, this._mouseUpDelegate = function (a) {
                    return d._mouseUp(a)
                }, a(document).bind("mousemove." + this.widgetName, this._mouseMoveDelegate).bind("mouseup." + this.widgetName, this._mouseUpDelegate), b.preventDefault(), b.originalEvent.mouseHandled = !0
            }
        },
        _mouseMove: function (b) {
            return !a.browser.msie || document.documentMode >= 9 || !! b.button ? this._mouseStarted ? (this._mouseDrag(b), b.preventDefault()) : (this._mouseDistanceMet(b) && this._mouseDelayMet(b) && ((this._mouseStarted = this._mouseStart(this._mouseDownEvent, b) !== !1) ? this._mouseDrag(b) : this._mouseUp(b)), !this._mouseStarted) : this._mouseUp(b)
        },
        _mouseUp: function (b) {
            return a(document).unbind("mousemove." + this.widgetName, this._mouseMoveDelegate).unbind("mouseup." + this.widgetName, this._mouseUpDelegate), this._mouseStarted && (this._mouseStarted = !1, b.target == this._mouseDownEvent.target && a.data(b.target, this.widgetName + ".preventClickEvent", !0), this._mouseStop(b)), !1
        },
        _mouseDistanceMet: function (a) {
            return Math.max(Math.abs(this._mouseDownEvent.pageX - a.pageX), Math.abs(this._mouseDownEvent.pageY - a.pageY)) >= this.options.distance
        },
        _mouseDelayMet: function () {
            return this.mouseDelayMet
        },
        _mouseStart: function () {},
        _mouseDrag: function () {},
        _mouseStop: function () {},
        _mouseCapture: function () {
            return !0
        }
    })
}(jQuery), function (a) {
    a.ui = a.ui || {};
    var b = /left|center|right/,
        c = /top|center|bottom/,
        d = a.fn.position,
        e = a.fn.offset;
    a.fn.position = function (e) {
        if (!e || !e.of) return d.apply(this, arguments);
        e = a.extend({}, e);
        var f = a(e.of),
            g = f[0],
            h = (e.collision || "flip").split(" "),
            i = e.offset ? e.offset.split(" ") : [0, 0],
            j, k, l;
        return g.nodeType === 9 ? (j = f.width(), k = f.height(), l = {
            top: 0,
            left: 0
        }) : g.setTimeout ? (j = f.width(), k = f.height(), l = {
            top: f.scrollTop(),
            left: f.scrollLeft()
        }) : g.preventDefault ? (e.at = "left top", j = k = 0, l = {
            top: e.of.pageY,
            left: e.of.pageX
        }) : (j = f.outerWidth(), k = f.outerHeight(), l = f.offset()), a.each(["my", "at"], function () {
            var a = (e[this] || "").split(" ");
            a.length === 1 && (a = b.test(a[0]) ? a.concat(["center"]) : c.test(a[0]) ? ["center"].concat(a) : ["center", "center"]), a[0] = b.test(a[0]) ? a[0] : "center", a[1] = c.test(a[1]) ? a[1] : "center", e[this] = a
        }), h.length === 1 && (h[1] = h[0]), i[0] = parseInt(i[0], 10) || 0, i.length === 1 && (i[1] = i[0]), i[1] = parseInt(i[1], 10) || 0, e.at[0] === "right" ? l.left += j : e.at[0] === "center" && (l.left += j / 2), e.at[1] === "bottom" ? l.top += k : e.at[1] === "center" && (l.top += k / 2), l.left += i[0], l.top += i[1], this.each(function () {
            var b = a(this),
                c = b.outerWidth(),
                d = b.outerHeight(),
                f = parseInt(a.curCSS(this, "marginLeft", !0)) || 0,
                g = parseInt(a.curCSS(this, "marginTop", !0)) || 0,
                m = c + f + (parseInt(a.curCSS(this, "marginRight", !0)) || 0),
                n = d + g + (parseInt(a.curCSS(this, "marginBottom", !0)) || 0),
                o = a.extend({}, l),
                p;
            e.my[0] === "right" ? o.left -= c : e.my[0] === "center" && (o.left -= c / 2), e.my[1] === "bottom" ? o.top -= d : e.my[1] === "center" && (o.top -= d / 2), o.left = Math.round(o.left), o.top = Math.round(o.top), p = {
                left: o.left - f,
                top: o.top - g
            }, a.each(["left", "top"], function (b, f) {
                a.ui.position[h[b]] && a.ui.position[h[b]][f](o, {
                    targetWidth: j,
                    targetHeight: k,
                    elemWidth: c,
                    elemHeight: d,
                    collisionPosition: p,
                    collisionWidth: m,
                    collisionHeight: n,
                    offset: i,
                    my: e.my,
                    at: e.at
                })
            }), a.fn.bgiframe && b.bgiframe(), b.offset(a.extend(o, {
                using: e.using
            }))
        })
    }, a.ui.position = {
        fit: {
            left: function (b, c) {
                var d = a(window);
                d = c.collisionPosition.left + c.collisionWidth - d.width() - d.scrollLeft(), b.left = d > 0 ? b.left - d : Math.max(b.left - c.collisionPosition.left, b.left)
            },
            top: function (b, c) {
                var d = a(window);
                d = c.collisionPosition.top + c.collisionHeight - d.height() - d.scrollTop(), b.top = d > 0 ? b.top - d : Math.max(b.top - c.collisionPosition.top, b.top)
            }
        },
        flip: {
            left: function (b, c) {
                if (c.at[0] !== "center") {
                    var d = a(window);
                    d = c.collisionPosition.left + c.collisionWidth - d.width() - d.scrollLeft();
                    var e = c.my[0] === "left" ? -c.elemWidth : c.my[0] === "right" ? c.elemWidth : 0,
                        f = c.at[0] === "left" ? c.targetWidth : -c.targetWidth,
                        g = -2 * c.offset[0];
                    b.left += c.collisionPosition.left < 0 ? e + f + g : d > 0 ? e + f + g : 0
                }
            },
            top: function (b, c) {
                if (c.at[1] !== "center") {
                    var d = a(window);
                    d = c.collisionPosition.top + c.collisionHeight - d.height() - d.scrollTop();
                    var e = c.my[1] === "top" ? -c.elemHeight : c.my[1] === "bottom" ? c.elemHeight : 0,
                        f = c.at[1] === "top" ? c.targetHeight : -c.targetHeight,
                        g = -2 * c.offset[1];
                    b.top += c.collisionPosition.top < 0 ? e + f + g : d > 0 ? e + f + g : 0
                }
            }
        }
    }, a.offset.setOffset || (a.offset.setOffset = function (b, c) {
        /static/.test(a.curCSS(b, "position")) && (b.style.position = "relative");
        var d = a(b),
            e = d.offset(),
            f = parseInt(a.curCSS(b, "top", !0), 10) || 0,
            g = parseInt(a.curCSS(b, "left", !0), 10) || 0;
        e = {
            top: c.top - e.top + f,
            left: c.left - e.left + g
        }, "using" in c ? c.using.call(b, e) : d.css(e)
    }, a.fn.offset = function (b) {
        var c = this[0];
        return !c || !c.ownerDocument ? null : b ? this.each(function () {
            a.offset.setOffset(this, b)
        }) : e.call(this)
    })
}(jQuery), function (a) {
    a.widget("ui.draggable", a.ui.mouse, {
        widgetEventPrefix: "drag",
        options: {
            addClasses: !0,
            appendTo: "parent",
            axis: !1,
            connectToSortable: !1,
            containment: !1,
            cursor: "auto",
            cursorAt: !1,
            grid: !1,
            handle: !1,
            helper: "original",
            iframeFix: !1,
            opacity: !1,
            refreshPositions: !1,
            revert: !1,
            revertDuration: 500,
            scope: "default",
            scroll: !0,
            scrollSensitivity: 20,
            scrollSpeed: 20,
            snap: !1,
            snapMode: "both",
            snapTolerance: 20,
            stack: !1,
            zIndex: !1
        },
        _create: function () {
            this.options.helper == "original" && !/^(?:r|a|f)/.test(this.element.css("position")) && (this.element[0].style.position = "relative"), this.options.addClasses && this.element.addClass("ui-draggable"), this.options.disabled && this.element.addClass("ui-draggable-disabled"), this._mouseInit()
        },
        destroy: function () {
            if (this.element.data("draggable")) return this.element.removeData("draggable").unbind(".draggable").removeClass("ui-draggable ui-draggable-dragging ui-draggable-disabled"), this._mouseDestroy(), this
        },
        _mouseCapture: function (b) {
            var c = this.options;
            return this.helper || c.disabled || a(b.target).is(".ui-resizable-handle") ? !1 : (this.handle = this._getHandle(b), this.handle ? !0 : !1)
        },
        _mouseStart: function (b) {
            var c = this.options;
            return this.helper = this._createHelper(b), this._cacheHelperProportions(), a.ui.ddmanager && (a.ui.ddmanager.current = this), this._cacheMargins(), this.cssPosition = this.helper.css("position"), this.scrollParent = this.helper.scrollParent(), this.offset = this.positionAbs = this.element.offset(), this.offset = {
                top: this.offset.top - this.margins.top,
                left: this.offset.left - this.margins.left
            }, a.extend(this.offset, {
                click: {
                    left: b.pageX - this.offset.left,
                    top: b.pageY - this.offset.top
                },
                parent: this._getParentOffset(),
                relative: this._getRelativeOffset()
            }), this.originalPosition = this.position = this._generatePosition(b), this.originalPageX = b.pageX, this.originalPageY = b.pageY, c.cursorAt && this._adjustOffsetFromHelper(c.cursorAt), c.containment && this._setContainment(), this._trigger("start", b) === !1 ? (this._clear(), !1) : (this._cacheHelperProportions(), a.ui.ddmanager && !c.dropBehaviour && a.ui.ddmanager.prepareOffsets(this, b), this.helper.addClass("ui-draggable-dragging"), this._mouseDrag(b, !0), !0)
        },
        _mouseDrag: function (b, c) {
            this.position = this._generatePosition(b), this.positionAbs = this._convertPositionTo("absolute");
            if (!c) {
                c = this._uiHash();
                if (this._trigger("drag", b, c) === !1) return this._mouseUp({}), !1;
                this.position = c.position
            }
            if (!this.options.axis || this.options.axis != "y") this.helper[0].style.left = this.position.left + "px";
            if (!this.options.axis || this.options.axis != "x") this.helper[0].style.top = this.position.top + "px";
            return a.ui.ddmanager && a.ui.ddmanager.drag(this, b), !1
        },
        _mouseStop: function (b) {
            var c = !1;
            a.ui.ddmanager && !this.options.dropBehaviour && (c = a.ui.ddmanager.drop(this, b)), this.dropped && (c = this.dropped, this.dropped = !1);
            if ((!this.element[0] || !this.element[0].parentNode) && this.options.helper == "original") return !1;
            if (this.options.revert == "invalid" && !c || this.options.revert == "valid" && c || this.options.revert === !0 || a.isFunction(this.options.revert) && this.options.revert.call(this.element, c)) {
                var e = this;
                a(this.helper).animate(this.originalPosition, parseInt(this.options.revertDuration, 10), function () {
                    e._trigger("stop", b) !== !1 && e._clear()
                })
            } else this._trigger("stop", b) !== !1 && this._clear();
            return !1
        },
        cancel: function () {
            return this.helper.is(".ui-draggable-dragging") ? this._mouseUp({}) : this._clear(), this
        },
        _getHandle: function (b) {
            var c = !this.options.handle || !a(this.options.handle, this.element).length ? !0 : !1;
            return a(this.options.handle, this.element).find("*").andSelf().each(function () {
                this == b.target && (c = !0)
            }), c
        },
        _createHelper: function (b) {
            var c = this.options;
            return b = a.isFunction(c.helper) ? a(c.helper.apply(this.element[0], [b])) : c.helper == "clone" ? this.element.clone() : this.element, b.parents("body").length || b.appendTo(c.appendTo == "parent" ? this.element[0].parentNode : c.appendTo), b[0] != this.element[0] && !/(fixed|absolute)/.test(b.css("position")) && b.css("position", "absolute"), b
        },
        _adjustOffsetFromHelper: function (b) {
            typeof b == "string" && (b = b.split(" ")), a.isArray(b) && (b = {
                left: +b[0],
                top: +b[1] || 0
            }), "left" in b && (this.offset.click.left = b.left + this.margins.left), "right" in b && (this.offset.click.left = this.helperProportions.width - b.right + this.margins.left), "top" in b && (this.offset.click.top = b.top + this.margins.top), "bottom" in b && (this.offset.click.top = this.helperProportions.height - b.bottom + this.margins.top)
        },
        _getParentOffset: function () {
            this.offsetParent = this.helper.offsetParent();
            var b = this.offsetParent.offset();
            this.cssPosition == "absolute" && this.scrollParent[0] != document && a.ui.contains(this.scrollParent[0], this.offsetParent[0]) && (b.left += this.scrollParent.scrollLeft(), b.top += this.scrollParent.scrollTop());
            if (this.offsetParent[0] == document.body || this.offsetParent[0].tagName && this.offsetParent[0].tagName.toLowerCase() == "html" && a.browser.msie) b = {
                top: 0,
                left: 0
            };
            return {
                top: b.top + (parseInt(this.offsetParent.css("borderTopWidth"), 10) || 0),
                left: b.left + (parseInt(this.offsetParent.css("borderLeftWidth"), 10) || 0)
            }
        },
        _getRelativeOffset: function () {
            if (this.cssPosition == "relative") {
                var a = this.element.position();
                return {
                    top: a.top - (parseInt(this.helper.css("top"), 10) || 0) + this.scrollParent.scrollTop(),
                    left: a.left - (parseInt(this.helper.css("left"), 10) || 0) + this.scrollParent.scrollLeft()
                }
            }
            return {
                top: 0,
                left: 0
            }
        },
        _cacheMargins: function () {
            this.margins = {
                left: parseInt(this.element.css("marginLeft"), 10) || 0,
                top: parseInt(this.element.css("marginTop"), 10) || 0
            }
        },
        _cacheHelperProportions: function () {
            this.helperProportions = {
                width: this.helper.outerWidth(),
                height: this.helper.outerHeight()
            }
        },
        _setContainment: function () {
            var b = this.options;
            b.containment == "parent" && (b.containment = this.helper[0].parentNode);
            if (b.containment == "document" || b.containment == "window") this.containment = [(b.containment == "document" ? 0 : a(window).scrollLeft()) - this.offset.relative.left - this.offset.parent.left, (b.containment == "document" ? 0 : a(window).scrollTop()) - this.offset.relative.top - this.offset.parent.top, (b.containment == "document" ? 0 : a(window).scrollLeft()) + a(b.containment == "document" ? document : window).width() - this.helperProportions.width - this.margins.left, (b.containment == "document" ? 0 : a(window).scrollTop()) + (a(b.containment == "document" ? document : window).height() || document.body.parentNode.scrollHeight) - this.helperProportions.height - this.margins.top];
            if (!/^(document|window|parent)$/.test(b.containment) && b.containment.constructor != Array) {
                var c = a(b.containment)[0];
                if (c) {
                    b = a(b.containment).offset();
                    var e = a(c).css("overflow") != "hidden";
                    this.containment = [b.left + (parseInt(a(c).css("borderLeftWidth"), 10) || 0) + (parseInt(a(c).css("paddingLeft"), 10) || 0) - this.margins.left, b.top + (parseInt(a(c).css("borderTopWidth"), 10) || 0) + (parseInt(a(c).css("paddingTop"), 10) || 0) - this.margins.top, b.left + (e ? Math.max(c.scrollWidth, c.offsetWidth) : c.offsetWidth) - (parseInt(a(c).css("borderLeftWidth"), 10) || 0) - (parseInt(a(c).css("paddingRight"), 10) || 0) - this.helperProportions.width - this.margins.left, b.top + (e ? Math.max(c.scrollHeight, c.offsetHeight) : c.offsetHeight) - (parseInt(a(c).css("borderTopWidth"), 10) || 0) - (parseInt(a(c).css("paddingBottom"), 10) || 0) - this.helperProportions.height - this.margins.top]
                }
            } else b.containment.constructor == Array && (this.containment = b.containment)
        },
        _convertPositionTo: function (b, c) {
            c || (c = this.position), b = b == "absolute" ? 1 : -1;
            var e = this.cssPosition != "absolute" || this.scrollParent[0] != document && !! a.ui.contains(this.scrollParent[0], this.offsetParent[0]) ? this.scrollParent : this.offsetParent,
                f = /(html|body)/i.test(e[0].tagName);
            return {
                top: c.top + this.offset.relative.top * b + this.offset.parent.top * b - (a.browser.safari && a.browser.version < 526 && this.cssPosition == "fixed" ? 0 : (this.cssPosition == "fixed" ? -this.scrollParent.scrollTop() : f ? 0 : e.scrollTop()) * b),
                left: c.left + this.offset.relative.left * b + this.offset.parent.left * b - (a.browser.safari && a.browser.version < 526 && this.cssPosition == "fixed" ? 0 : (this.cssPosition == "fixed" ? -this.scrollParent.scrollLeft() : f ? 0 : e.scrollLeft()) * b)
            }
        },
        _generatePosition: function (b) {
            var c = this.options,
                e = this.cssPosition != "absolute" || this.scrollParent[0] != document && !! a.ui.contains(this.scrollParent[0], this.offsetParent[0]) ? this.scrollParent : this.offsetParent,
                f = /(html|body)/i.test(e[0].tagName),
                g = b.pageX,
                h = b.pageY;
            return this.originalPosition && (this.containment && (b.pageX - this.offset.click.left < this.containment[0] && (g = this.containment[0] + this.offset.click.left), b.pageY - this.offset.click.top < this.containment[1] && (h = this.containment[1] + this.offset.click.top), b.pageX - this.offset.click.left > this.containment[2] && (g = this.containment[2] + this.offset.click.left), b.pageY - this.offset.click.top > this.containment[3] && (h = this.containment[3] + this.offset.click.top)), c.grid && (h = this.originalPageY + Math.round((h - this.originalPageY) / c.grid[1]) * c.grid[1], h = this.containment ? h - this.offset.click.top < this.containment[1] || h - this.offset.click.top > this.containment[3] ? h - this.offset.click.top < this.containment[1] ? h + c.grid[1] : h - c.grid[1] : h : h, g = this.originalPageX + Math.round((g - this.originalPageX) / c.grid[0]) * c.grid[0], g = this.containment ? g - this.offset.click.left < this.containment[0] || g - this.offset.click.left > this.containment[2] ? g - this.offset.click.left < this.containment[0] ? g + c.grid[0] : g - c.grid[0] : g : g)), {
                top: h - this.offset.click.top - this.offset.relative.top - this.offset.parent.top + (a.browser.safari && a.browser.version < 526 && this.cssPosition == "fixed" ? 0 : this.cssPosition == "fixed" ? -this.scrollParent.scrollTop() : f ? 0 : e.scrollTop()),
                left: g - this.offset.click.left - this.offset.relative.left - this.offset.parent.left + (a.browser.safari && a.browser.version < 526 && this.cssPosition == "fixed" ? 0 : this.cssPosition == "fixed" ? -this.scrollParent.scrollLeft() : f ? 0 : e.scrollLeft())
            }
        },
        _clear: function () {
            this.helper.removeClass("ui-draggable-dragging"), this.helper[0] != this.element[0] && !this.cancelHelperRemoval && this.helper.remove(), this.helper = null, this.cancelHelperRemoval = !1
        },
        _trigger: function (b, c, e) {
            return e = e || this._uiHash(), a.ui.plugin.call(this, b, [c, e]), b == "drag" && (this.positionAbs = this._convertPositionTo("absolute")), a.Widget.prototype._trigger.call(this, b, c, e)
        },
        plugins: {},
        _uiHash: function () {
            return {
                helper: this.helper,
                position: this.position,
                originalPosition: this.originalPosition,
                offset: this.positionAbs
            }
        }
    }), a.extend(a.ui.draggable, {
        version: "1.8.10"
    }), a.ui.plugin.add("draggable", "connectToSortable", {
        start: function (b, c) {
            var e = a(this).data("draggable"),
                f = e.options,
                g = a.extend({}, c, {
                    item: e.element
                });
            e.sortables = [], a(f.connectToSortable).each(function () {
                var c = a.data(this, "sortable");
                c && !c.options.disabled && (e.sortables.push({
                    instance: c,
                    shouldRevert: c.options.revert
                }), c._refreshItems(), c._trigger("activate", b, g))
            })
        },
        stop: function (b, c) {
            var e = a(this).data("draggable"),
                f = a.extend({}, c, {
                    item: e.element
                });
            a.each(e.sortables, function () {
                this.instance.isOver ? (this.instance.isOver = 0, e.cancelHelperRemoval = !0, this.instance.cancelHelperRemoval = !1, this.shouldRevert && (this.instance.options.revert = !0), this.instance._mouseStop(b), this.instance.options.helper = this.instance.options._helper, e.options.helper == "original" && this.instance.currentItem.css({
                    top: "auto",
                    left: "auto"
                })) : (this.instance.cancelHelperRemoval = !1, this.instance._trigger("deactivate", b, f))
            })
        },
        drag: function (b, c) {
            var e = a(this).data("draggable"),
                f = this;
            a.each(e.sortables, function () {
                this.instance.positionAbs = e.positionAbs, this.instance.helperProportions = e.helperProportions, this.instance.offset.click = e.offset.click, this.instance._intersectsWith(this.instance.containerCache) ? (this.instance.isOver || (this.instance.isOver = 1, this.instance.currentItem = a(f).clone().appendTo(this.instance.element).data("sortable-item", !0), this.instance.options._helper = this.instance.options.helper, this.instance.options.helper = function () {
                    return c.helper[0]
                }, b.target = this.instance.currentItem[0], this.instance._mouseCapture(b, !0), this.instance._mouseStart(b, !0, !0), this.instance.offset.click.top = e.offset.click.top, this.instance.offset.click.left = e.offset.click.left, this.instance.offset.parent.left -= e.offset.parent.left - this.instance.offset.parent.left, this.instance.offset.parent.top -= e.offset.parent.top - this.instance.offset.parent.top, e._trigger("toSortable", b), e.dropped = this.instance.element, e.currentItem = e.element, this.instance.fromOutside = e), this.instance.currentItem && this.instance._mouseDrag(b)) : this.instance.isOver && (this.instance.isOver = 0, this.instance.cancelHelperRemoval = !0, this.instance.options.revert = !1, this.instance._trigger("out", b, this.instance._uiHash(this.instance)), this.instance._mouseStop(b, !0), this.instance.options.helper = this.instance.options._helper, this.instance.currentItem.remove(), this.instance.placeholder && this.instance.placeholder.remove(), e._trigger("fromSortable", b), e.dropped = !1)
            })
        }
    }), a.ui.plugin.add("draggable", "cursor", {
        start: function () {
            var b = a("body"),
                c = a(this).data("draggable").options;
            b.css("cursor") && (c._cursor = b.css("cursor")), b.css("cursor", c.cursor)
        },
        stop: function () {
            var b = a(this).data("draggable").options;
            b._cursor && a("body").css("cursor", b._cursor)
        }
    }), a.ui.plugin.add("draggable", "iframeFix", {
        start: function () {
            var b = a(this).data("draggable").options;
            a(b.iframeFix === !0 ? "iframe" : b.iframeFix).each(function () {
                a('<div class="ui-draggable-iframeFix" style="background: #fff;"></div>').css({
                    width: this.offsetWidth + "px",
                    height: this.offsetHeight + "px",
                    position: "absolute",
                    opacity: "0.001",
                    zIndex: 1e3
                }).css(a(this).offset()).appendTo("body")
            })
        },
        stop: function () {
            a("div.ui-draggable-iframeFix").each(function () {
                this.parentNode.removeChild(this)
            })
        }
    }), a.ui.plugin.add("draggable", "opacity", {
        start: function (b, c) {
            b = a(c.helper), c = a(this).data("draggable").options, b.css("opacity") && (c._opacity = b.css("opacity")), b.css("opacity", c.opacity)
        },
        stop: function (b, c) {
            b = a(this).data("draggable").options, b._opacity && a(c.helper).css("opacity", b._opacity)
        }
    }), a.ui.plugin.add("draggable", "scroll", {
        start: function () {
            var b = a(this).data("draggable");
            b.scrollParent[0] != document && b.scrollParent[0].tagName != "HTML" && (b.overflowOffset = b.scrollParent.offset())
        },
        drag: function (b) {
            var c = a(this).data("draggable"),
                e = c.options,
                f = !1;
            if (c.scrollParent[0] != document && c.scrollParent[0].tagName != "HTML") {
                if (!e.axis || e.axis != "x") c.overflowOffset.top + c.scrollParent[0].offsetHeight - b.pageY < e.scrollSensitivity ? c.scrollParent[0].scrollTop = f = c.scrollParent[0].scrollTop + e.scrollSpeed : b.pageY - c.overflowOffset.top < e.scrollSensitivity && (c.scrollParent[0].scrollTop = f = c.scrollParent[0].scrollTop - e.scrollSpeed);
                if (!e.axis || e.axis != "y") c.overflowOffset.left + c.scrollParent[0].offsetWidth - b.pageX < e.scrollSensitivity ? c.scrollParent[0].scrollLeft = f = c.scrollParent[0].scrollLeft + e.scrollSpeed : b.pageX - c.overflowOffset.left < e.scrollSensitivity && (c.scrollParent[0].scrollLeft = f = c.scrollParent[0].scrollLeft - e.scrollSpeed)
            } else {
                if (!e.axis || e.axis != "x") b.pageY - a(document).scrollTop() < e.scrollSensitivity ? f = a(document).scrollTop(a(document).scrollTop() - e.scrollSpeed) : a(window).height() - (b.pageY - a(document).scrollTop()) < e.scrollSensitivity && (f = a(document).scrollTop(a(document).scrollTop() + e.scrollSpeed));
                if (!e.axis || e.axis != "y") b.pageX - a(document).scrollLeft() < e.scrollSensitivity ? f = a(document).scrollLeft(a(document).scrollLeft() - e.scrollSpeed) : a(window).width() - (b.pageX - a(document).scrollLeft()) < e.scrollSensitivity && (f = a(document).scrollLeft(a(document).scrollLeft() + e.scrollSpeed))
            }
            f !== !1 && a.ui.ddmanager && !e.dropBehaviour && a.ui.ddmanager.prepareOffsets(c, b)
        }
    }), a.ui.plugin.add("draggable", "snap", {
        start: function () {
            var b = a(this).data("draggable"),
                c = b.options;
            b.snapElements = [], a(c.snap.constructor != String ? c.snap.items || ":data(draggable)" : c.snap).each(function () {
                var c = a(this),
                    e = c.offset();
                this != b.element[0] && b.snapElements.push({
                    item: this,
                    width: c.outerWidth(),
                    height: c.outerHeight(),
                    top: e.top,
                    left: e.left
                })
            })
        },
        drag: function (b, c) {
            for (var e = a(this).data("draggable"), f = e.options, g = f.snapTolerance, h = c.offset.left, i = h + e.helperProportions.width, j = c.offset.top, k = j + e.helperProportions.height, l = e.snapElements.length - 1; l >= 0; l--) {
                var m = e.snapElements[l].left,
                    n = m + e.snapElements[l].width,
                    o = e.snapElements[l].top,
                    p = o + e.snapElements[l].height;
                if (m - g < h && h < n + g && o - g < j && j < p + g || m - g < h && h < n + g && o - g < k && k < p + g || m - g < i && i < n + g && o - g < j && j < p + g || m - g < i && i < n + g && o - g < k && k < p + g) {
                    if (f.snapMode != "inner") {
                        var q = Math.abs(o - k) <= g,
                            r = Math.abs(p - j) <= g,
                            s = Math.abs(m - i) <= g,
                            t = Math.abs(n - h) <= g;
                        q && (c.position.top = e._convertPositionTo("relative", {
                            top: o - e.helperProportions.height,
                            left: 0
                        }).top - e.margins.top), r && (c.position.top = e._convertPositionTo("relative", {
                            top: p,
                            left: 0
                        }).top - e.margins.top), s && (c.position.left = e._convertPositionTo("relative", {
                            top: 0,
                            left: m - e.helperProportions.width
                        }).left - e.margins.left), t && (c.position.left = e._convertPositionTo("relative", {
                            top: 0,
                            left: n
                        }).left - e.margins.left)
                    }
                    var u = q || r || s || t;
                    f.snapMode != "outer" && (q = Math.abs(o - j) <= g, r = Math.abs(p - k) <= g, s = Math.abs(m - h) <= g, t = Math.abs(n - i) <= g, q && (c.position.top = e._convertPositionTo("relative", {
                        top: o,
                        left: 0
                    }).top - e.margins.top), r && (c.position.top = e._convertPositionTo("relative", {
                        top: p - e.helperProportions.height,
                        left: 0
                    }).top - e.margins.top), s && (c.position.left = e._convertPositionTo("relative", {
                        top: 0,
                        left: m
                    }).left - e.margins.left), t && (c.position.left = e._convertPositionTo("relative", {
                        top: 0,
                        left: n - e.helperProportions.width
                    }).left - e.margins.left)), !e.snapElements[l].snapping && (q || r || s || t || u) && e.options.snap.snap && e.options.snap.snap.call(e.element, b, a.extend(e._uiHash(), {
                        snapItem: e.snapElements[l].item
                    })), e.snapElements[l].snapping = q || r || s || t || u
                } else e.snapElements[l].snapping && e.options.snap.release && e.options.snap.release.call(e.element, b, a.extend(e._uiHash(), {
                    snapItem: e.snapElements[l].item
                })), e.snapElements[l].snapping = !1
            }
        }
    }), a.ui.plugin.add("draggable", "stack", {
        start: function () {
            var b = a(this).data("draggable").options;
            b = a.makeArray(a(b.stack)).sort(function (b, c) {
                return (parseInt(a(b).css("zIndex"), 10) || 0) - (parseInt(a(c).css("zIndex"), 10) || 0)
            });
            if (b.length) {
                var c = parseInt(b[0].style.zIndex) || 0;
                a(b).each(function (a) {
                    this.style.zIndex = c + a
                }), this[0].style.zIndex = c + b.length
            }
        }
    }), a.ui.plugin.add("draggable", "zIndex", {
        start: function (b, c) {
            b = a(c.helper), c = a(this).data("draggable").options, b.css("zIndex") && (c._zIndex = b.css("zIndex")), b.css("zIndex", c.zIndex)
        },
        stop: function (b, c) {
            b = a(this).data("draggable").options, b._zIndex && a(c.helper).css("zIndex", b._zIndex)
        }
    })
}(jQuery), function (a) {
    a.widget("ui.droppable", {
        widgetEventPrefix: "drop",
        options: {
            accept: "*",
            activeClass: !1,
            addClasses: !0,
            greedy: !1,
            hoverClass: !1,
            scope: "default",
            tolerance: "intersect"
        },
        _create: function () {
            var b = this.options,
                c = b.accept;
            this.isover = 0, this.isout = 1, this.accept = a.isFunction(c) ? c : function (a) {
                return a.is(c)
            }, this.proportions = {
                width: this.element[0].offsetWidth,
                height: this.element[0].offsetHeight
            }, a.ui.ddmanager.droppables[b.scope] = a.ui.ddmanager.droppables[b.scope] || [], a.ui.ddmanager.droppables[b.scope].push(this), b.addClasses && this.element.addClass("ui-droppable")
        },
        destroy: function () {
            for (var b = a.ui.ddmanager.droppables[this.options.scope], c = 0; c < b.length; c++) b[c] == this && b.splice(c, 1);
            return this.element.removeClass("ui-droppable ui-droppable-disabled").removeData("droppable").unbind(".droppable"), this
        },
        _setOption: function (b, c) {
            b == "accept" && (this.accept = a.isFunction(c) ? c : function (a) {
                return a.is(c)
            }), a.Widget.prototype._setOption.apply(this, arguments)
        },
        _activate: function (b) {
            var c = a.ui.ddmanager.current;
            this.options.activeClass && this.element.addClass(this.options.activeClass), c && this._trigger("activate", b, this.ui(c))
        },
        _deactivate: function (b) {
            var c = a.ui.ddmanager.current;
            this.options.activeClass && this.element.removeClass(this.options.activeClass), c && this._trigger("deactivate", b, this.ui(c))
        },
        _over: function (b) {
            var c = a.ui.ddmanager.current; !! c && (c.currentItem || c.element)[0] != this.element[0] && this.accept.call(this.element[0], c.currentItem || c.element) && (this.options.hoverClass && this.element.addClass(this.options.hoverClass), this._trigger("over", b, this.ui(c)))
        },
        _out: function (b) {
            var c = a.ui.ddmanager.current; !! c && (c.currentItem || c.element)[0] != this.element[0] && this.accept.call(this.element[0], c.currentItem || c.element) && (this.options.hoverClass && this.element.removeClass(this.options.hoverClass), this._trigger("out", b, this.ui(c)))
        },
        _drop: function (b, c) {
            var e = c || a.ui.ddmanager.current;
            if (!e || (e.currentItem || e.element)[0] == this.element[0]) return !1;
            var f = !1;
            return this.element.find(":data(droppable)").not(".ui-draggable-dragging").each(function () {
                var b = a.data(this, "droppable");
                if (b.options.greedy && !b.options.disabled && b.options.scope == e.options.scope && b.accept.call(b.element[0], e.currentItem || e.element) && a.ui.intersect(e, a.extend(b, {
                    offset: b.element.offset()
                }), b.options.tolerance)) return f = !0, !1
            }), f ? !1 : this.accept.call(this.element[0], e.currentItem || e.element) ? (this.options.activeClass && this.element.removeClass(this.options.activeClass), this.options.hoverClass && this.element.removeClass(this.options.hoverClass), this._trigger("drop", b, this.ui(e)), this.element) : !1
        },
        ui: function (a) {
            return {
                draggable: a.currentItem || a.element,
                helper: a.helper,
                position: a.position,
                offset: a.positionAbs
            }
        }
    }), a.extend(a.ui.droppable, {
        version: "1.8.10"
    }), a.ui.intersect = function (b, c, e) {
        if (!c.offset) return !1;
        var f = (b.positionAbs || b.position.absolute).left,
            g = f + b.helperProportions.width,
            h = (b.positionAbs || b.position.absolute).top,
            i = h + b.helperProportions.height,
            j = c.offset.left,
            k = j + c.proportions.width,
            l = c.offset.top,
            m = l + c.proportions.height;
        switch (e) {
        case "fit":
            return j <= f && g <= k && l <= h && i <= m;
        case "intersect":
            return j < f + b.helperProportions.width / 2 && g - b.helperProportions.width / 2 < k && l < h + b.helperProportions.height / 2 && i - b.helperProportions.height / 2 < m;
        case "pointer":
            return a.ui.isOver((b.positionAbs || b.position.absolute).top + (b.clickOffset || b.offset.click).top, (b.positionAbs || b.position.absolute).left + (b.clickOffset || b.offset.click).left, l, j, c.proportions.height, c.proportions.width);
        case "touch":
            return (h >= l && h <= m || i >= l && i <= m || h < l && i > m) && (f >= j && f <= k || g >= j && g <= k || f < j && g > k);
        default:
            return !1
        }
    }, a.ui.ddmanager = {
        current: null,
        droppables: {
            "default": []
        },
        prepareOffsets: function (b, c) {
            var e = a.ui.ddmanager.droppables[b.options.scope] || [],
                f = c ? c.type : null,
                g = (b.currentItem || b.element).find(":data(droppable)").andSelf(),
                h = 0;
            b: for (; h < e.length; h++) if (!(e[h].options.disabled || b && !e[h].accept.call(e[h].element[0], b.currentItem || b.element))) {
                for (var i = 0; i < g.length; i++) if (g[i] == e[h].element[0]) {
                    e[h].proportions.height = 0;
                    continue b
                }
                e[h].visible = e[h].element.css("display") != "none", e[h].visible && (e[h].offset = e[h].element.offset(), e[h].proportions = {
                    width: e[h].element[0].offsetWidth,
                    height: e[h].element[0].offsetHeight
                }, f == "mousedown" && e[h]._activate.call(e[h], c))
            }
        },
        drop: function (b, c) {
            var e = !1;
            return a.each(a.ui.ddmanager.droppables[b.options.scope] || [], function () {
                this.options && (!this.options.disabled && this.visible && a.ui.intersect(b, this, this.options.tolerance) && (e = e || this._drop.call(this, c)), !this.options.disabled && this.visible && this.accept.call(this.element[0], b.currentItem || b.element) && (this.isout = 1, this.isover = 0, this._deactivate.call(this, c)))
            }), e
        },
        drag: function (b, c) {
            b.options.refreshPositions && a.ui.ddmanager.prepareOffsets(b, c), a.each(a.ui.ddmanager.droppables[b.options.scope] || [], function () {
                if (!(this.options.disabled || this.greedyChild || !this.visible)) {
                    var e = a.ui.intersect(b, this, this.options.tolerance);
                    if (e = !e && this.isover == 1 ? "isout" : e && this.isover == 0 ? "isover" : null) {
                        var f;
                        if (this.options.greedy) {
                            var g = this.element.parents(":data(droppable):eq(0)");
                            g.length && (f = a.data(g[0], "droppable"), f.greedyChild = e == "isover" ? 1 : 0)
                        }
                        f && e == "isover" && (f.isover = 0, f.isout = 1, f._out.call(f, c)), this[e] = 1, this[e == "isout" ? "isover" : "isout"] = 0, this[e == "isover" ? "_over" : "_out"].call(this, c), f && e == "isout" && (f.isout = 0, f.isover = 1, f._over.call(f, c))
                    }
                }
            })
        }
    }
}(jQuery), function (a) {
    a.fn.editableComment = function () {
        a(this).delegate(".comment .edit-button", "click", function (b) {
            var c = a(this).closest(".comment");
            return c.addClass("editing"), c.find(".js-autosize").trigger("resize.dynSiz"), !1
        }), a(this).delegate(".comment .delete-button", "click", function (b) {
            var c = a(this).closest(".comment"),
                d = a(this).closest(".js-comment-container");
            return d.length || (d = c), confirm("Are you sure you want to delete this?") && (c.addClass("loading"), c.find("button").attr("disabled", !0), c.find(".minibutton").addClass("disabled"), a.ajax({
                type: "DELETE",
                url: c.find(".form-content form").attr("action"),
                context: d,
                complete: function () {
                    c.removeClass("loading"), c.find("button").removeAttr("disabled"), c.find(".minibutton").removeClass("disabled")
                },
                success: function () {
                    c.removeClass("error"), d.fadeOut(function () {
                        c.removeClass("editing"), d.trigger("pageUpdate")
                    })
                },
                error: function () {
                    c.addClass("error")
                }
            })), !1
        }), a(this).delegate(".comment .cancel", "click", function () {
            return a(this).closest(".comment").removeClass("editing"), !1
        }), a(this).delegate(".comment .form-content form", "submit", function () {
            var b = a(this).closest(".comment"),
                c = a(this).closest(".js-comment-container");
            return c.length || (c = b), b.addClass("loading"), b.find("button").attr("disabled", !0), b.find(".minibutton").addClass("disabled"), a.ajax({
                type: "PUT",
                url: b.find(".form-content form").attr("action"),
                dataType: "json",
                data: a(this).serialize(),
                context: c,
                complete: function () {
                    b.removeClass("loading"), b.find("button").removeAttr("disabled"), b.find(".minibutton").removeClass("disabled")
                },
                success: function (a) {
                    b.removeClass("error"), a.title && b.find(".content-title").html(a.title), b.find(".formatted-content .content-body").html(a.body), b.removeClass("editing"), c.trigger("pageUpdate")
                },
                error: function () {
                    b.addClass("error")
                }
            }), !1
        })
    }
}(jQuery), function (a) {
    a.fn.enticeToAction = function (b) {
        var c = a.extend({}, a.fn.enticeToAction.defaults, b);
        return this.each(function () {
            var b = a(this);
            b.addClass("entice"), b.attr("title", c.title);
            switch (c.direction) {
            case "downwards":
                var d = "n";
            case "upwards":
                var d = "s";
            case "rightwards":
                var d = "w";
            case "leftwards":
                var d = "e"
            }
            b.tipsy({
                gravity: d
            }), this.onclick = function () {
                return !1
            }
        })
    }, a.fn.enticeToAction.defaults = {
        title: "You must be logged in to use this feature",
        direction: "downwards"
    }
}(jQuery), function (a) {
    a.fn.errorify = function (b, c) {
        var d = a.extend({}, a.fn.errorify.defaults, c);
        return this.each(function () {
            var c = a(this);
            c.addClass("error"), c.find("p.note").hide(), c.find("dd.error").remove();
            var d = a("<dd>").addClass("error").text(b);
            c.append(d)
        })
    }, a.fn.errorify.defaults = {}, a.fn.unErrorify = function (b) {
        var c = a.extend({}, a.fn.unErrorify.defaults, b);
        return this.each(function () {
            var b = a(this);
            b.removeClass("error"), b.find("p.note").show(), b.find("dd.error").remove()
        })
    }, a.fn.unErrorify.defaults = {}
}(jQuery), $(document).ready(function () {
    $(document.body).trigger("pageUpdate")
}), $(document).bind("end.pjax", function (a) {
    $(a.target).trigger("pageUpdate")
}), $.fn.pageUpdate = function (a) {
    $(this).bind("pageUpdate", function (b) {
        a.apply(b.target, arguments)
    })
}, function (a) {
    a.fn.previewableCommentForm = function (b) {
        var c = a.extend({}, a.fn.previewableCommentForm.defaults, b);
        return this.each(function () {
            var b = a(this);
            if (b.hasClass("previewable-comment-form-attached")) return;
            b.addClass("previewable-comment-form-attached");
            var d = b.find("textarea"),
                e = b.find(".content-body"),
                f = b.prev(".comment-form-error"),
                g = b.find(".form-actions button"),
                h = d.val(),
                i = b.attr("data-repository"),
                j = !1,
                k = null,
                l = a.merge(b.find(".preview-dirty"), d);
            l.blur(function () {
                h != d.val() && (j = !0, h = d.val()), m()
            });
            var m = function () {
                    if (!j) return;
                    if (a.trim(h) == "") {
                        e.html("<p>Nothing to preview</p>");
                        return
                    }
                    e.html("<p>Loading preview&hellip;</p>"), k && k.abort();
                    var b = a.extend({
                        text: h,
                        repository: i
                    }, c.previewOptions);
                    k = a.post(c.previewUrl, b, function (a) {
                        e.html(a), c.onSuccess.call(e)
                    })
                };
            a.trim(h) == "" && e.html("<p>Nothing to preview</p>"), f.length > 0 && b.closest("form").submit(function () {
                f.hide();
                if (a.trim(d.val()) == "") return f.show(), !1;
                g.attr("disabled", "disabled")
            })
        })
    }, a.fn.previewableCommentForm.defaults = {
        previewUrl: "/preview",
        previewOptions: {},
        onSuccess: function () {}
    }
}(jQuery), function (a) {
    a.fn.redirector = function (b) {
        var c = a.extend({}, a.fn.redirector.defaults, b);
        if (this.length == 0) return;
        a.smartPoller(c.time, function (b) {
            a.getJSON(c.url, function (a) {
                a ? b() : window.location = c.to
            })
        })
    }, a.fn.redirector.defaults = {
        time: 100,
        url: null,
        to: "/"
    }
}(jQuery), function (a) {
    a.fn.repoList = function (b) {
        var c = a.extend({}, a.fn.repoList.defaults, b);
        return this.each(function () {
            var b = a(this),
                d = b.find(".repo_list"),
                e = b.find(".show-more"),
                f = b.find(".filter_input").val(""),
                g = f.val(),
                h = e.length == 0 ? !0 : !1,
                i = null,
                j = !1;
            e.click(function () {
                if (j) return !1;
                var b = e.spin();
                return j = !0, a(c.selector).load(c.ajaxUrl, function () {
                    h = !0, b.parents(".repos").find(".filter_selected").click(), b.stopSpin()
                }), b.hide(), !1
            });
            var k = function () {
                    var a = d.children("li");
                    i ? (a.hide(), d.find("li." + i).show()) : a.show(), f.val() != "" && a.filter(":not(:Contains('" + f.val() + "'))").hide()
                };
            b.find(".repo_filter").click(function () {
                var c = a(this);
                return b.find(".repo_filterer a").removeClass("filter_selected"), c.addClass("filter_selected"), i = c.attr("rel"), h ? k() : e.click(), !1
            });
            var l = "placeholder" in document.createElement("input"),
                m = function () {
                    l || (f.val() == "" ? f.addClass("placeholder") : f.removeClass("placeholder"))
                };
            f.bind("keyup blur click", function () {
                if (this.value == g) return;
                g = this.value, h ? k() : e.click(), m()
            }), m()
        })
    }, a.fn.repoList.defaults = {
        selector: "#repo_listing",
        ajaxUrl: "/dashboard/ajax_your_repos"
    }
}(jQuery), $.fn.selectableList = function (a, b) {
    return $(this).each(function () {
        var c = $(this),
            d = $.extend({
                toggleClassName: "selected",
                wrapperSelector: "a",
                mutuallyExclusive: !1,
                itemParentSelector: "li",
                enableShiftSelect: !1,
                ignoreLinks: !1
            }, b);
        return c.delegate(a + " " + d.itemParentSelector + " " + d.wrapperSelector, "click", function (b) {
            if (b.which > 1 || b.metaKey || d.ignoreLinks && $(b.target).closest("a").length) return !0;
            var e = $(this),
                f = e.find(":checkbox, :radio"),
                g = c.find(a + " ." + d.toggleClassName),
                h = c.find(a + " *[data-last]");
            !e.is(":checkbox, :radio") && b.target != f[0] && (f.attr("checked") && !f.is(":radio") ? f.attr("checked", !1) : f.attr("checked", !0)), d.mutuallyExclusive && g.removeClass(d.toggleClassName), e.toggleClass(d.toggleClassName), f.change();
            if (d.enableShiftSelect && b.shiftKey && g.length > 0 && h.length > 0) {
                var i = h.offset().top,
                    j = e.offset().top,
                    k = "#" + e.attr("id"),
                    l = $,
                    m = $,
                    n = $;
                i > j ? l = h.prevUntil(k) : i < j && (l = h.nextUntil(k)), m = l.find(":checkbox"), n = l.find(":checked"), n.length == m.length ? (l.removeClass(d.toggleClassName), m.attr("checked", !1)) : (l.addClass(d.toggleClassName), m.attr("checked", !0))
            }
            h.removeAttr("data-last"), e.attr("data-last", !0)
        }), c.delegate(a + " li :checkbox," + a + " li :radio", "change", function (b) {
            var e = $(this),
                f = e.closest(d.wrapperSelector);
            d.mutuallyExclusive && c.find(a + " ." + d.toggleClassName).removeClass(d.toggleClassName), $(this).attr("checked") ? f.addClass(d.toggleClassName) : f.removeClass(d.toggleClassName)
        }), c.find(a)
    })
}, $.fn.sortableHeader = function (a, b) {
    return $(this).each(function () {
        var c = $(this),
            d = $.extend({
                itemSelector: "li",
                ascendingClass: "asc",
                descendingClass: "desc"
            }, b);
        c.delegate(a + " " + d.itemSelector, "click", function (a) {
            a.preventDefault();
            var b = $(this);
            b.hasClass(d.ascendingClass) ? (b.removeClass(d.ascendingClass), b.addClass(d.descendingClass)) : b.hasClass(d.descendingClass) ? (b.removeClass(d.descendingClass), b.addClass(d.ascendingClass)) : (b.parent().find("." + d.ascendingClass + ", ." + d.descendingClass).removeClass(d.ascendingClass + " " + d.descendingClass), b.addClass(d.descendingClass))
        })
    })
}, function (a) {
    a.fn.hardTabs = function (b) {
        var c = a.extend({}, a.fn.hardTabs.defaults, b);
        a(this).hasClass("js-large-data-tabs") && (c.optimizeLargeContents = !0);
        var d = function (b) {
                return c.optimizeLargeContents ? b[0] == null ? a() : (b.is(":visible") && !b[0].style.width && b.css({
                    width: b.width() + "px"
                }), b.css({
                    position: "absolute",
                    left: "-9999px"
                })) : b.hide()
            },
            e = function (b) {
                return c.optimizeLargeContents ? b[0] == null ? a() : (b.is(":visible") || b.show(), b.css({
                    position: "",
                    left: ""
                })) : b.show()
            };
        return this.each(function () {
            var b = a(this),
                c = a(),
                f = a();
            b.find("a.selected").length == 0 && a(b.find("a")[0]).addClass("selected"), b.find("a").each(function () {
                var g = a(this),
                    h = a.fn.hardTabs.findLastPathSegment(g.attr("href")),
                    i = g.attr("data-container-id") ? g.attr("data-container-id") : h,
                    j = a("#" + i);
                d(j);
                var k = function (h) {
                        return h.which == 2 || h.metaKey ? !0 : (j = a("#" + i), j.length == 0 ? !0 : (d(f), c.removeClass("selected"), f = e(j), c = g.addClass("selected"), "replaceState" in window.history && h != "stop-url-change" && window.history.replaceState(null, document.title, g.attr("href")), b.trigger("tabChanged", {
                            link: g
                        }), !1))
                    };
                g.click(k), a('.js-secondary-hard-link[href="' + g.attr("href") + '"]').click(k), g.hasClass("selected") && k("stop-url-change")
            })
        })
    }, a.fn.hardTabs.defaults = {
        optimizeLargeContents: !1
    }, a.fn.hardTabs.findLastPathSegment = function (a) {
        a == null && (a = document.location.pathname), a = a.replace(/\?.+|#.+/, "");
        var b = a.match(/[^\/]+\/?$/);
        return b.length == 0 && alert("Invalid tab link!"), b[0].replace("/", "")
    }
}(jQuery), function () {
    var a;
    Modernizr.hashchange || (a = window.location.hash, setInterval(function () {
        if (window.location.hash !== a) return a = window.location.hash, $(window).trigger("hashchange")
    }, 50))
}.call(this), function (a) {
    function d(a) {
        var d, e, f;
        return a.type === "keypress" ? d = String.fromCharCode(a.which) : d = b[a.which], f = "", a.ctrlKey && d !== "ctrl" && (f += "ctrl+"), a.altKey && d !== "alt" && (f += "alt+"), a.metaKey && !a.ctrlKey && d !== "meta" && (f += "meta+"), a.shiftKey ? a.type === "keypress" ? "" + f + d : (e = c[a.which]) ? "" + f + e : d === "shift" ? "" + f + "shift" : d ? "" + f + "shift+" + d : null : d ? "" + f + d : null
    }
    var b = {
        8: "backspace",
        9: "tab",
        13: "enter",
        16: "shift",
        17: "ctrl",
        18: "alt",
        19: "pause",
        20: "capslock",
        27: "esc",
        32: "space",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        45: "insert",
        46: "del",
        48: "0",
        49: "1",
        50: "2",
        51: "3",
        52: "4",
        53: "5",
        54: "6",
        55: "7",
        56: "8",
        57: "9",
        65: "a",
        66: "b",
        67: "c",
        68: "d",
        69: "e",
        70: "f",
        71: "g",
        72: "h",
        73: "i",
        74: "j",
        75: "k",
        76: "l",
        77: "m",
        78: "n",
        79: "o",
        80: "p",
        81: "q",
        82: "r",
        83: "s",
        84: "t",
        85: "u",
        86: "v",
        87: "w",
        88: "x",
        89: "y",
        90: "z",
        91: "meta",
        93: "meta",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        112: "f1",
        113: "f2",
        114: "f3",
        115: "f4",
        116: "f5",
        117: "f6",
        118: "f7",
        119: "f8",
        120: "f9",
        121: "f10",
        122: "f11",
        123: "f12",
        144: "numlock",
        145: "scroll",
        186: ";",
        187: "=",
        188: ",",
        189: "-",
        190: ".",
        191: "/",
        192: "`",
        219: "[",
        220: "\\",
        221: "]",
        222: "'"
    },
        c = {
            48: ")",
            49: "!",
            50: "@",
            51: "#",
            52: "$",
            53: "%",
            54: "^",
            55: "&",
            56: "*",
            57: "(",
            65: "A",
            66: "B",
            67: "C",
            68: "D",
            69: "E",
            70: "F",
            71: "G",
            72: "H",
            73: "I",
            74: "J",
            75: "K",
            76: "L",
            77: "M",
            78: "N",
            79: "O",
            80: "P",
            81: "Q",
            82: "R",
            83: "S",
            84: "T",
            85: "U",
            86: "V",
            87: "W",
            88: "X",
            89: "Y",
            90: "Z",
            186: ":",
            187: "+",
            188: "<",
            189: "_",
            190: ">",
            191: "?",
            192: "~",
            219: "{",
            220: "|",
            221: "}",
            222: '"'
        };
    a.browser.mozilla && (c[0] = "?"), a.each(["keydown", "keyup", "keypress"], function () {
        a.event.special[this] = {
            add: function (b) {
                var c = b.handler,
                    e = b.data;
                typeof b.data == "string" ? b.handler = function (b) {
                    b.key || (b.key = d(b));
                    if (this !== b.target && a(b.target).is(":input")) return;
                    if (b.key === e) return c.apply(this, arguments)
                } : b.handler = function (a) {
                    return a.key || (a.key = d(a)), c.apply(this, arguments)
                }
            }
        }
    }), globalMappings = {}, a(document).bind("keydown.hotkey", function (b) {
        if (a(b.target).is(":input")) return;
        var c = globalMappings[b.key];
        if (c) return c.apply(this, arguments)
    }), a.hotkeys = function (a) {
        for (key in a) globalMappings[key] = a[key];
        return this
    }, a.hotkey = function (a, b) {
        return globalMappings[a] = b, this
    }
}(jQuery), function ($) {
    $.fn.editable = function (a, b) {
        var c = {
            target: a,
            name: "value",
            id: "id",
            type: "text",
            width: "auto",
            height: "auto",
            event: "click",
            onblur: "cancel",
            loadtype: "GET",
            loadtext: "Loading...",
            placeholder: "Click to edit",
            submittype: "post",
            loaddata: {},
            submitdata: {}
        };
        b && $.extend(c, b);
        var d = $.editable.types[c.type].plugin ||
        function () {}, e = $.editable.types[c.type].submit ||
        function () {}, f = $.editable.types[c.type].buttons || $.editable.types.defaults.buttons, g = $.editable.types[c.type].content || $.editable.types.defaults.content, h = $.editable.types[c.type].element || $.editable.types.defaults.element, i = c.callback ||
        function () {};
        return $.isFunction($(this)[c.event]) || ($.fn[c.event] = function (a) {
            return a ? this.bind(c.event, a) : this.trigger(c.event)
        }), $(this).attr("title", c.tooltip), c.autowidth = "auto" == c.width, c.autoheight = "auto" == c.height, this.each(function () {
            $.trim($(this).html()) || $(this).html(c.placeholder), $(this)[c.event](function (a) {
                function o() {
                    $(b).html(b.revert), b.editing = !1, $.trim($(b).html()) || $(b).html(c.placeholder)
                }
                var b = this;
                if (b.editing) return;
                $(b).css("visibility", "hidden"), c.width != "none" && (c.width = c.autowidth ? $(b).width() : c.width), c.height != "none" && (c.height = c.autoheight ? $(b).height() : c.height), $(this).css("visibility", ""), $(this).html().toLowerCase().replace(/;/, "") == c.placeholder.toLowerCase().replace(/;/, "") && $(this).html(""), b.editing = !0, b.revert = $(b).html(), $(b).html("");
                var j = $("<form/>");
                c.cssclass && ("inherit" == c.cssclass ? j.attr("class", $(b).attr("class")) : j.attr("class", c.cssclass)), c.style && ("inherit" == c.style ? (j.attr("style", $(b).attr("style")), j.css("display", $(b).css("display"))) : j.attr("style", c.style));
                var k = h.apply(j, [c, b]),
                    l;
                if (c.loadurl) {
                    var m = setTimeout(function () {
                        k.disabled = !0, g.apply(j, [c.loadtext, c, b])
                    }, 100),
                        n = {};
                    n[c.id] = b.id, $.isFunction(c.loaddata) ? $.extend(n, c.loaddata.apply(b, [b.revert, c])) : $.extend(n, c.loaddata), $.ajax({
                        type: c.loadtype,
                        url: c.loadurl,
                        data: n,
                        async: !1,
                        success: function (a) {
                            window.clearTimeout(m), l = a, k.disabled = !1
                        }
                    })
                } else c.data ? (l = c.data, $.isFunction(c.data) && (l = c.data.apply(b, [b.revert, c]))) : l = b.revert;
                g.apply(j, [l, c, b]), k.attr("name", c.name), f.apply(j, [c, b]), d.apply(j, [c, b]), $(b).append(j), $(":input:visible:enabled:first", j).focus(), c.select && k.select(), k.keydown(function (a) {
                    a.keyCode == 27 && (k.blur(), a.preventDefault(), o())
                });
                var m;
                "cancel" == c.onblur ? k.blur(function (a) {
                    m = setTimeout(o, 500)
                }) : "submit" == c.onblur ? k.blur(function (a) {
                    j.submit()
                }) : $.isFunction(c.onblur) ? k.blur(function (a) {
                    c.onblur.apply(b, [k.val(), c])
                }) : k.blur(function (a) {}), j.submit(function (a) {
                    m && clearTimeout(m), a.preventDefault(), e.apply(j, [c, b]);
                    if ($.isFunction(c.target)) {
                        var d = c.target.apply(b, [k.val(), c]);
                        $(b).html(d), b.editing = !1, i.apply(b, [b.innerHTML, c]), $.trim($(b).html()) || $(b).html(c.placeholder)
                    } else {
                        var f = {};
                        f[c.name] = k.val(), f[c.id] = b.id, $.isFunction(c.submitdata) ? $.extend(f, c.submitdata.apply(b, [b.revert, c])) : $.extend(f, c.submitdata), $(b).html(c.indicator), $.ajax({
                            type: c.submittype,
                            url: c.target,
                            data: f,
                            success: function (a) {
                                $(b).html(a), b.editing = !1, i.apply(b, [b.innerHTML, c]), $.trim($(b).html()) || $(b).html(c.placeholder)
                            }
                        })
                    }
                    return !1
                }), $(b).bind("reset", o)
            })
        })
    }, $.editable = {
        types: {
            defaults: {
                element: function (a, b) {
                    var c = $('<input type="hidden">');
                    return $(this).append(c), c
                },
                content: function (a, b, c) {
                    $(":input:first", this).val(a)
                },
                buttons: function (a, b) {
                    if (a.submit) {
                        var c = $('<input type="submit">');
                        c.val(a.submit), $(this).append(c)
                    }
                    if (a.cancel) {
                        var d = $('<input type="button">');
                        d.val(a.cancel), $(this).append(d), $(d).click(function () {
                            $(b).html(b.revert), b.editing = !1
                        })
                    }
                }
            },
            text: {
                element: function (a, b) {
                    var c = $("<input>");
                    return a.width != "none" && c.width(a.width), a.height != "none" && c.height(a.height), c.attr("autocomplete", "off"), $(this).append(c), c
                }
            },
            textarea: {
                element: function (a, b) {
                    var c = $("<textarea>");
                    return a.rows ? c.attr("rows", a.rows) : c.height(a.height), a.cols ? c.attr("cols", a.cols) : c.width(a.width), $(this).append(c), c
                }
            },
            select: {
                element: function (a, b) {
                    var c = $("<select>");
                    return $(this).append(c), c
                },
                content: function (string, settings, original) {
                    if (String == string.constructor) {
                        eval("var json = " + string);
                        for (var key in json) {
                            if (!json.hasOwnProperty(key)) continue;
                            if ("selected" == key) continue;
                            var option = $("<option>").val(key).append(json[key]);
                            $("select", this).append(option)
                        }
                    }
                    $("select", this).children().each(function () {
                        $(this).val() == json["selected"] && $(this).attr("selected", "selected")
                    })
                }
            }
        },
        addInputType: function (a, b) {
            $.editable.types[a] = b
        }
    }
}(jQuery), function (a) {
    a(".js-oneclick").live("click", function (b) {
        b.preventDefault();
        var c = a(this),
            d = c.attr("data-afterclick") || "Loadingâ€¦";
        return c.attr("disabled") ? !0 : (c.attr("disabled", "disabled"), setTimeout(function () {
            c.find("span").length > 0 ? c.find("span").text(d) : c.text(d)
        }, 50), a(this).parents("form").submit(), !0)
    })
}(jQuery), function (a) {
    a.fn.pjax = function (b, c) {
        c ? c.container = b : c = a.isPlainObject(b) ? b : {
            container: b
        };
        if (typeof c.container != "string") throw "pjax container must be a string selector!";
        return this.live("click", function (b) {
            if (b.which > 1 || b.metaKey) return !0;
            var d = {
                url: this.href,
                container: a(this).attr("data-pjax"),
                clickedElement: a(this)
            };
            a.pjax(a.extend({}, d, c)), b.preventDefault()
        })
    }, a.pjax = function (b) {
        var c = a(b.container),
            d = b.success || a.noop;
        delete b.success;
        if (typeof b.container != "string") throw "pjax container must be a string selector!";
        var e = {
            timeout: 650,
            push: !0,
            replace: !1,
            data: {
                _pjax: !0
            },
            type: "GET",
            dataType: "html",
            beforeSend: function (a) {
                c.trigger("start.pjax"), a.setRequestHeader("X-PJAX", "true")
            },
            error: function () {
                window.location = b.url
            },
            complete: function () {
                c.trigger("end.pjax")
            },
            success: function (e) {
                if (!a.trim(e) || /<html/i.test(e)) return window.location = b.url;
                c.html(e);
                var f = document.title,
                    g = a.trim(c.find("title").remove().text());
                g && (document.title = g);
                var h = {
                    pjax: b.container,
                    timeout: b.timeout
                },
                    i = a.param(b.data);
                i != "_pjax=true" && (h.url = b.url + (/\?/.test(b.url) ? "&" : "?") + i), b.replace ? window.history.replaceState(h, document.title, b.url) : b.push && (a.pjax.active || (window.history.replaceState(a.extend({}, h, {
                    url: null
                }), f), a.pjax.active = !0), window.history.pushState(h, document.title, b.url)), (b.replace || b.push) && window._gaq && _gaq.push(["_trackPageview"]);
                var j = window.location.hash.toString();
                j !== "" && (window.location.hash = "", window.location.hash = j), d.apply(this, arguments)
            }
        };
        b = a.extend(!0, {}, e, b), a.isFunction(b.url) && (b.url = b.url());
        var f = a.pjax.xhr;
        return f && f.readyState < 4 && (f.onreadystatechange = a.noop, f.abort()), a.pjax.xhr = a.ajax(b), a(document).trigger("pjax", a.pjax.xhr, b), a.pjax.xhr
    };
    var b = "state" in window.history,
        c = location.href;
    a(window).bind("popstate", function (d) {
        var e = !b && location.href == c;
        b = !0;
        if (e) return;
        var f = d.state;
        if (f && f.pjax) {
            var g = f.pjax;
            a(g + "").length ? a.pjax({
                url: f.url || location.href,
                container: g,
                push: !1,
                timeout: f.timeout
            }) : window.location = location.href
        }
    }), a.inArray("state", a.event.props) < 0 && a.event.props.push("state"), a.support.pjax = window.history && window.history.pushState, a.support.pjax || (a.pjax = function (b) {
        window.location = a.isFunction(b.url) ? b.url() : b.url
    }, a.fn.pjax = function () {
        return this
    })
}(jQuery), function (a) {
    function b(a, b) {
        var c = a.find("a");
        if (c.length > 1) {
            var d = c.filter(".selected"),
                e = c.get().indexOf(d.get(0));
            return e += b, e >= c.length ? e = 0 : e < 0 && (e = c.length - 1), d.removeClass("selected"), c.eq(e).addClass("selected"), !0
        }
    }
    a.fn.quicksearch = function (c) {
        var d = a.extend({
            url: null,
            delay: 150,
            spinner: null,
            insertSpinner: null,
            loading: a(".quicksearch-loading")
        }, c);
        d.insertSpinner && !d.spinner && (d.spinner = a('<img src="' + GitHub.Ajax.spinner + '" alt="" class="spinner" />'));
        var e = function (a) {
                return d.results.html(a).show()
            };
        return d.results.delegate("a", "mouseover", function (b) {
            var c = a(this);
            c.hasClass("selected") || (d.results.find("a.selected").removeClass("selected"), c.addClass("selected"))
        }), this.each(function () {
            function f() {
                d.insertSpinner && (d.spinner.parent().length || d.insertSpinner.call(c, d.spinner), d.spinner.show()), c.trigger("quicksearch.loading"), d.loading && e(d.loading.html())
            }
            function g() {
                d.insertSpinner && d.spinner.hide(), c.trigger("quicksearch.loaded")
            }
            var c = a(this);
            c.autocompleteField({
                url: d.url || c.attr("data-url"),
                dataType: d.dataType,
                delay: d.delay,
                useCache: !0,
                minLength: 2
            }).bind("keyup", function (a) {
                a.which != 13 && c.val().length >= 2 && d.results.is(":empty") && f()
            }).bind("autocomplete.beforesend", function (a, b) {
                f()
            }).bind("autocomplete.finish", function (a, b) {
                e(b || {}), g()
            }).bind("autocomplete.clear", function (a) {
                d.results.html("").hide(), g()
            }).bind("focus", function (a) {
                c.val() && c.trigger("keyup")
            }).bind("blur", function (a) {
                setTimeout(function () {
                    c.trigger("autocomplete.clear")
                }, 150)
            }).bind("keydown", "up", function () {
                if (b(d.results, -1)) return !1
            }).bind("keydown", "down", function () {
                if (b(d.results, 1)) return !1
            }).bind("keydown", "enter", function () {
                var b, c = d.results.find("a.selected");
                if (c.length) return a(this).blur(), c.hasClass("initial") ? c.closest("form").submit() : window.location = c.attr("href"), !1;
                a(this).trigger("autocomplete.clear")
            }).bind("keydown", "esc", function () {
                return a(this).blur(), !1
            })
        })
    }
}(jQuery), function () {
    var a;
    a = function (a) {
        return function (b, c) {
            var d;
            return c.dataType === void 0 && b.setRequestHeader("Accept", "*/*;q=0.5, " + c.accepts.script), d = $.Event("ajaxBeforeSend"), a.trigger(d, b, c), d.result
        }
    }, $(document).delegate("a[data-confirm]", "click", function (a) {
        var b, c;
        b = $(this);
        if (c = b.attr("data-confirm")) if (!confirm(c)) return a.stopImmediatePropagation(), !1
    }), $(document).delegate("a[data-method]", "click", function (a) {
        var b, c, d, e, f;
        d = $(this);
        if (d.is("a[data-remote]")) return;
        return e = document.createElement("form"), $(e).attr({
            method: "post",
            action: d.attr("href"),
            style: "display:none;"
        }), f = document.createElement("input"), $(f).attr({
            type: "hidden",
            name: "_method",
            value: d.attr("data-method")
        }), e.appendChild(f), c = $('meta[name="csrf-token"]').attr("content"), b = $('meta[name="csrf-param"]').attr("content"), c != null && b != null && (f = document.createElement("input"), $(f).attr({
            type: "hidden",
            name: b,
            value: c
        }), e.appendChild(f)), document.body.appendChild(e), e.submit(), !1
    }), $(document).delegate("a[data-remote]", "click", function (b) {
        var c, d, e, f, g;
        d = $(this), e = {}, e.context = this, e.beforeSend = a(d);
        if (f = d.data("method")) e.type = f;
        if (g = d.attr("href")) e.url = g;
        if (c = d.data("type")) e.dataType = c;
        return $.ajax(e), !1
    }), $(document).delegate("form[data-remote]", "submit", function (b) {
        var c, d, e, f, g, h;
        e = $(this), f = {}, f.context = this, f.beforeSend = a(e);
        if (g = e.attr("method")) f.type = g;
        if (h = e.attr("action")) f.url = h;
        if (c = e.serializeArray()) f.data = c;
        if (d = e.data("type")) f.dataType = d;
        return $.ajax(f), !1
    })
}.call(this), function (a) {
    a.put = function (a, b, c, d) {
        var e = null;
        return jQuery.isFunction(b) && (c = b, b = {}), jQuery.isPlainObject(c) && (e = c.error, c = c.success), jQuery.ajax({
            type: "PUT",
            url: a,
            data: b,
            success: c,
            error: e,
            dataType: d
        })
    }, a.del = function (a, b, c, d) {
        var e = null;
        return jQuery.isFunction(b) && (c = b, b = {}), jQuery.isPlainObject(c) && (e = c.error, c = c.success), jQuery.ajax({
            type: "DELETE",
            url: a,
            data: b,
            success: c,
            error: e,
            dataType: d
        })
    }
}(jQuery), function (a) {
    a.smartPoller = function (b, c) {
        a.isFunction(b) && (c = b, b = 1e3), function d() {
            setTimeout(function () {
                c.call(this, d)
            }, b), b *= 1.1
        }()
    }
}(jQuery), jQuery.fn.tabs = function () {
    var a = function (a) {
            return /#([a-z][\w.:-]*)$/i.exec(a)[1]
        },
        b = window.location.hash.substr(1);
    return this.each(function () {
        var c = null,
            d = null;
        $(this).find("li a").each(function () {
            var b = $("#" + a(this.href));
            if (b == []) return;
            b.hide(), $(this).click(function () {
                var a = $(this),
                    e = function () {
                        d && d.hide(), c && c.removeClass("selected"), c = a.addClass("selected"), d = b.show().trigger("tabChanged", {
                            link: c
                        })
                    };
                return a.attr("ajax") ? (a.addClass("loading"), $.ajax({
                    url: a.attr("ajax"),
                    success: function (c) {
                        b.html(c), a.removeClass("loading"), a[0].removeAttribute("ajax"), e()
                    },
                    failure: function (a) {
                        alert("An error occured, please reload the page")
                    }
                })) : e(), !1
            }), $(this).hasClass("selected") && $(this).click()
        }), $(this).find("li a[href='#" + b + "']").click(), d == null && $($(this).find("li a")[0]).click()
    })
}, function (a) {
    var b = function () {
            var a = typeof document.selection != "undefined" && typeof document.selection.createRange != "undefined";
            return {
                getSelectionRange: function (b) {
                    var c, d, e, f, g, h;
                    b.focus();
                    if (typeof b.selectionStart != "undefined") c = b.selectionStart, d = b.selectionEnd;
                    else {
                        if (!a) throw "Unable to get selection range.";
                        e = document.selection.createRange(), f = e.text.length;
                        if (e.parentElement() !== b) throw "Unable to get selection range.";
                        b.type === "textarea" ? (g = e.duplicate(), g.moveToElementText(b), g.setEndPoint("EndToEnd", e), c = g.text.length - f) : (h = b.createTextRange(), h.setEndPoint("EndToStart", e), c = h.text.length), d = c + f
                    }
                    return {
                        start: c,
                        end: d
                    }
                },
                getSelectionStart: function (a) {
                    return this.getSelectionRange(a).start
                },
                getSelectionEnd: function (a) {
                    return this.getSelectionRange(a).end
                },
                setSelectionRange: function (b, c, d) {
                    var e, f;
                    b.focus(), typeof d == "undefined" && (d = c);
                    if (typeof b.selectionStart != "undefined") b.setSelectionRange(c, d);
                    else if (a) e = b.value, f = b.createTextRange(), d -= c + e.slice(c + 1, d).split("\n").length - 1, c -= e.slice(0, c).split("\n").length - 1, f.move("character", c), f.moveEnd("character", d), f.select();
                    else throw "Unable to set selection range."
                },
                getSelectedText: function (a) {
                    var b = this.getSelectionRange(a);
                    return a.value.substring(b.start, b.end)
                },
                insertText: function (a, b, c, d, e) {
                    d = d || c;
                    var f = b.length,
                        g = c + f,
                        h = a.value.substring(0, c),
                        i = a.value.substr(d);
                    a.value = h + b + i, e === !0 ? this.setSelectionRange(a, c, g) : this.setSelectionRange(a, g)
                },
                replaceSelectedText: function (a, b, c) {
                    var d = this.getSelectionRange(a);
                    this.insertText(a, b, d.start, d.end, c)
                },
                wrapSelectedText: function (a, b, c, d) {
                    var e = b + this.getSelectedText(a) + c;
                    this.replaceSelectedText(a, e, d)
                }
            }
        }();
    window.Selection = b, a.fn.extend({
        getSelectionRange: function () {
            return b.getSelectionRange(this[0])
        },
        getSelectionStart: function () {
            return b.getSelectionStart(this[0])
        },
        getSelectionEnd: function () {
            return b.getSelectionEnd(this[0])
        },
        getSelectedText: function () {
            return b.getSelectedText(this[0])
        },
        setSelectionRange: function (a, c) {
            return this.each(function () {
                b.setSelectionRange(this, a, c)
            })
        },
        insertText: function (a, c, d, e) {
            return this.each(function () {
                b.insertText(this, a, c, d, e)
            })
        },
        replaceSelectedText: function (a, c) {
            return this.each(function () {
                b.replaceSelectedText(this, a, c)
            })
        },
        wrapSelectedText: function (a, c, d) {
            return this.each(function () {
                b.wrapSelectedText(this, a, c, d)
            })
        }
    })
}(jQuery), function (a) {
    a.fn.tipsy = function (b) {
        b = a.extend({
            fade: !1,
            gravity: "n",
            title: "title",
            fallback: ""
        }, b || {});
        var c = null;
        a(this).hover(function () {
            a.data(this, "cancel.tipsy", !0);
            var c = a.data(this, "active.tipsy");
            c || (c = a('<div class="tipsy"><div class="tipsy-inner"/></div>'), c.css({
                position: "absolute",
                zIndex: 1e5
            }), a.data(this, "active.tipsy", c)), (a(this).attr("title") || !a(this).attr("original-title")) && a(this).attr("original-title", a(this).attr("title") || "").removeAttr("title");
            var d;
            typeof b.title == "string" ? d = a(this).attr(b.title == "title" ? "original-title" : b.title) : typeof b.title == "function" && (d = b.title.call(this)), c.find(".tipsy-inner").html(d || b.fallback);
            var e = a.extend({}, a(this).offset(), {
                width: this.offsetWidth,
                height: this.offsetHeight
            });
            c.get(0).className = "tipsy", c.remove().css({
                top: 0,
                left: 0,
                visibility: "hidden",
                display: "block"
            }).appendTo(document.body);
            var f = c[0].offsetWidth,
                g = c[0].offsetHeight,
                h = typeof b.gravity == "function" ? b.gravity.call(this) : b.gravity;
            switch (h.charAt(0)) {
            case "n":
                c.css({
                    top: e.top + e.height,
                    left: e.left + e.width / 2 - f / 2
                }).addClass("tipsy-north");
                break;
            case "s":
                c.css({
                    top: e.top - g,
                    left: e.left + e.width / 2 - f / 2
                }).addClass("tipsy-south");
                break;
            case "e":
                c.css({
                    top: e.top + e.height / 2 - g / 2,
                    left: e.left - f
                }).addClass("tipsy-east");
                break;
            case "w":
                c.css({
                    top: e.top + e.height / 2 - g / 2,
                    left: e.left + e.width
                }).addClass("tipsy-west")
            }
            b.fade ? c.css({
                opacity: 0,
                display: "block",
                visibility: "visible"
            }).animate({
                opacity: .8
            }) : c.css({
                visibility: "visible"
            })
        }, function () {
            a.data(this, "cancel.tipsy", !1);
            var c = this;
            setTimeout(function () {
                if (a.data(this, "cancel.tipsy")) return;
                var d = a.data(c, "active.tipsy");
                d && (b.fade ? d.stop().fadeOut(function () {
                    a(this).remove()
                }) : d.remove())
            }, 100)
        }), a(this).bind("tipsy.reload", function () {
            a(this).attr("title") && a(this).attr("original-title", a(this).attr("title") || "").removeAttr("title");
            var c;
            typeof b.title == "string" ? c = a(this).attr(b.title == "title" ? "original-title" : b.title) : typeof b.title == "function" && (c = b.title.call(this));
            var d = a.data(this, "active.tipsy");
            d.find(".tipsy-inner").text(c || b.fallback);
            var e = a.extend({}, a(this).offset(), {
                width: this.offsetWidth,
                height: this.offsetHeight
            }),
                f = d[0].offsetWidth,
                g = d[0].offsetHeight,
                h = typeof b.gravity == "function" ? b.gravity.call(this) : b.gravity;
            switch (h.charAt(0)) {
            case "n":
                d.css({
                    top: e.top + e.height,
                    left: e.left + e.width / 2 - f / 2
                });
                break;
            case "s":
                d.css({
                    top: e.top - g,
                    left: e.left + e.width / 2 - f / 2
                });
                break;
            case "e":
                d.css({
                    top: e.top + e.height / 2 - g / 2,
                    left: e.left - f
                });
                break;
            case "w":
                d.css({
                    top: e.top + e.height / 2 - g / 2,
                    left: e.left + e.width
                })
            }
        })
    }, a.fn.tipsy.autoNS = function () {
        return a(this).offset().top > a(document).scrollTop() + a(window).height() / 2 ? "s" : "n"
    }
}(jQuery), function (a) {
    function e(a) {
        return "tagName" in a ? a : a.parentNode
    }
    try {
        window.document.createEvent("TouchEvent")
    } catch (b) {
        return !1
    }
    var c = {},
        d;
    a(document).ready(function () {
        a(document.body).bind("touchstart", function (a) {
            var b = Date.now(),
                f = b - (c.last || b);
            c.target = e(a.originalEvent.touches[0].target), d && clearTimeout(d), c.x1 = a.originalEvent.touches[0].pageX, f > 0 && f <= 250 && (c.isDoubleTap = !0), c.last = b
        }).bind("touchmove", function (a) {
            c.x2 = a.originalEvent.touches[0].pageX
        }).bind("touchend", function (b) {
            c.isDoubleTap ? (a(c.target).trigger("doubleTap"), c = {}) : c.x2 > 0 ? (Math.abs(c.x1 - c.x2) > 30 && a(c.target).trigger("swipe") && a(c.target).trigger("swipe" + (c.x1 - c.x2 > 0 ? "Left" : "Right")), c.x1 = c.x2 = c.last = 0) : "last" in c && (d = setTimeout(function () {
                d = null, a(c.target).trigger("tap"), c = {}
            }, 250))
        }).bind("touchcancel", function () {
            c = {}
        })
    }), ["swipe", "swipeLeft", "swipeRight", "doubleTap", "tap"].forEach(function (b) {
        a.fn[b] = function (a) {
            return this.bind(b, a)
        }
    })
}(jQuery), jQuery.fn.truncate = function (a, b) {
    function e(a) {
        d && a.style.removeAttribute("filter")
    }
    b = jQuery.extend({
        chars: /\s/,
        trail: ["...", ""]
    }, b);
    var c = {},
        d = $.browser.msie;
    return this.each(function () {
        var d = jQuery(this),
            f = d.html().replace(/\r\n/gim, ""),
            g = f,
            h = /<\/?[^<>]*\/?>/gim,
            i, j = {},
            k = $("*").index(this);
        while ((i = h.exec(g)) != null) j[i.index] = i[0];
        g = jQuery.trim(g.split(h).join(""));
        if (g.length > a) {
            var l;
            while (a < g.length) {
                l = g.charAt(a);
                if (l.match(b.chars)) {
                    g = g.substring(0, a);
                    break
                }
                a--
            }
            if (f.search(h) != -1) {
                var m = 0;
                for (eachEl in j) g = [g.substring(0, eachEl), j[eachEl], g.substring(eachEl, g.length)].join(""), eachEl < g.length && (m = g.length);
                d.html([g.substring(0, m), g.substring(m, g.length).replace(/<(\w+)[^>]*>.*<\/\1>/gim, "").replace(/<(br|hr|img|input)[^<>]*\/?>/gim, "")].join(""))
            } else d.html(g);
            c[k] = f, d.html(["<div class='truncate_less'>", d.html(), b.trail[0], "</div>"].join("")).find(".truncate_show", this).click(function () {
                return d.find(".truncate_more").length == 0 && d.append(["<div class='truncate_more' style='display: none;'>", c[k], b.trail[1], "</div>"].join("")).find(".truncate_hide").click(function () {
                    return d.find(".truncate_more").css("background", "#fff").fadeOut("normal", function () {
                        d.find(".truncate_less").css("background", "#fff").fadeIn("normal", function () {
                            e(this), $(this).css("background", "none")
                        }), e(this)
                    }), !1
                }), d.find(".truncate_less").fadeOut("normal", function () {
                    d.find(".truncate_more").fadeIn("normal", function () {
                        e(this)
                    }), e(this)
                }), jQuery(".truncate_show", d).click(function () {
                    return d.find(".truncate_less").css("background", "#fff").fadeOut("normal", function () {
                        d.find(".truncate_more").css("background", "#fff").fadeIn("normal", function () {
                            e(this), $(this).css("background", "none")
                        }), e(this)
                    }), !1
                }), !1
            })
        }
    })
}, function (a) {
    function m() {
        return window.DeviceMotionEvent != undefined
    }
    function n(b) {
        if ((new Date).getTime() < d + c) return;
        if (m()) {
            var e = b.accelerationIncludingGravity,
                f = e.x,
                g = e.y;
            l.xArray.length >= 5 && l.xArray.shift(), l.yArray.length >= 5 && l.yArray.shift(), l.xArray.push(f), l.yArray.push(g), l.xMotion = Math.round((getMax(l.xArray) - getMin(l.xArray)) * 1e3) / 1e3, l.yMotion = Math.round((getMax(l.yArray) - getMin(l.yArray)) * 1e3) / 1e3, (l.xMotion > 1.5 || l.yMotion > 1.5) && i != 10 && (i = 10), l.xMotion > j || l.yMotion > j ? k++ : k = 0, k >= 5 ? (h = !0, a(document).unbind("mousemove.plax"), a(window).bind("devicemotion", o(b))) : (h = !1, a(window).unbind("devicemotion"), a(document).bind("mousemove.plax", function (a) {
                o(a)
            }))
        }
    }
    function o(a) {
        if ((new Date).getTime() < d + c) return;
        d = (new Date).getTime();
        var b = a.pageX,
            j = a.pageY;
        if (h == 1) {
            var k = window.orientation ? (window.orientation + 180) % 360 / 90 : 2,
                l = a.accelerationIncludingGravity,
                m = k % 2 == 0 ? -l.x : l.y,
                n = k % 2 == 0 ? l.y : l.x;
            b = k >= 2 ? m : -m, j = k >= 2 ? n : -n, b = (b + i) / 2, j = (j + i) / 2, b < 0 ? b = 0 : b > i && (b = i), j < 0 ? j = 0 : j > i && (j = i)
        }
        var o = b / (h == 1 ? i : f),
            p = j / (h == 1 ? i : g),
            q, k;
        for (k = e.length; k--;) q = e[k], q.invert != 1 ? q.obj.css("left", q.startX + q.xRange * o).css("top", q.startY + q.yRange * p) : q.obj.css("left", q.startX - q.xRange * o).css("top", q.startY - q.yRange * p)
    }
    var b = 25,
        c = 1 / b * 1e3,
        d = (new Date).getTime(),
        e = [],
        f = a(window).width(),
        g = a(window).height(),
        h = !1,
        i = 1,
        j = .05,
        k = 0,
        l = {
            xArray: [0, 0, 0, 0, 0],
            yArray: [0, 0, 0, 0, 0],
            xMotion: 0,
            yMotion: 0
        };
    a(window).resize(function () {
        f = a(window).width(), g = a(window).height()
    }), a.fn.plaxify = function (b) {
        return this.each(function () {
            var c = {
                xRange: 0,
                yRange: 0,
                invert: !1
            };
            for (var d in b) c[d] == 0 && (c[d] = b[d]);
            c.obj = a(this), c.startX = this.offsetLeft, c.startY = this.offsetTop, c.invert == 0 ? (c.startX -= Math.floor(c.xRange / 2), c.startY -= Math.floor(c.yRange / 2)) : (c.startX += Math.floor(c.xRange / 2), c.startY += Math.floor(c.yRange / 2)), e.push(c)
        })
    }, getMin = function (a) {
        return Math.min.apply({}, a)
    }, getMax = function (a) {
        return Math.max.apply({}, a)
    }, a.plax = {
        enable: function () {
            a(document).bind("mousemove.plax", function (a) {
                o(a)
            }), m() && (window.ondevicemotion = function (a) {
                n(a)
            })
        },
        disable: function () {
            a(document).unbind("mousemove.plax"), window.ondevicemotion = undefined
        }
    }, typeof ender != "undefined" && a.ender(a.fn, !0)
}(function () {
    return typeof jQuery != "undefined" ? jQuery : ender
}()), String.prototype.score = function (a, b) {
    var c = 0,
        d = a.length,
        e = this,
        f = e.length,
        g, h, i = 1,
        j;
    if (e == a) return 1;
    for (var k = 0, l, m, n, o, p, q; k < d; ++k) {
        n = a[k], o = e.indexOf(n.toLowerCase()), p = e.indexOf(n.toUpperCase()), q = Math.min(o, p), m = q > -1 ? q : Math.max(o, p);
        if (m === -1) {
            if (b) {
                i += 1 - b;
                break
            }
            return 0
        }
        l = .1, e[m] === n && (l += .1), m === 0 && (l += .6, k === 0 && (g = 1)), e.charAt(m - 1) === " " && (l += .8), e = e.substring(m + 1, f), c += l
    }
    return h = c / d, j = (h * (d / f) + h) / 2, j /= i, g && j + .15 < 1 && (j += .15), j
}, window.GitHub = {};
if (typeof console == "undefined" || typeof console.log == "undefined") window.console = {
    log: function () {}
};
window.GitHub.debug = !1, window.debug = function () {}, navigator.userAgent.match("Propane") || top != window && (top.location.replace(document.location), alert("For security reasons, framing is not allowed.")), GitHub.gravatar = function (a, b) {
    b = b || 35;
    var c = location.protocol == "https:" ? "https://secure.gravatar.com" : "http://gravatar.com",
        d = location.protocol == "https:" ? "https" : "http";
    return '<img src="' + c + "/avatar/" + a + "?s=140&d=" + d + '%3A%2F%2Fgithub.com%2Fimages%2Fgravatars%2Fgravatar-140.png" width="' + b + '" height="' + b + '" />'
}, String.prototype.capitalize = function () {
    return this.replace(/\w+/g, function (a) {
        return a.charAt(0).toUpperCase() + a.substr(1).toLowerCase()
    })
}, jQuery.expr[":"].Contains = function (a, b, c) {
    return (a.textContent || a.innerText || "").toLowerCase().indexOf(c[3].toLowerCase()) >= 0
}, $.fn.scrollTo = function (a, b) {
    var c, d;
    typeof a == "number" || !a ? (b = a, c = this, d = "html,body") : (c = a, d = this);
    var e = $(c).offset().top - 30;
    return $(d).animate({
        scrollTop: e
    }, b || 1e3), this
}, $.fn.spin = function () {
    return this.after('<img src="' + GitHub.Ajax.spinner + '" id="spinner"/>')
}, $.fn.stopSpin = function () {
    return $("#spinner").remove(), this
}, $.fn.contextLoader = function (a) {
    var b = '<div class="context-loader">Sending Request&hellip;</div>';
    return this.after($(b).css("top", a))
}, GitHub.Ajax = {
    spinner: "https://a248.e.akamai.net/assets.github.com/images/modules/ajax/indicator.gif",
    error: "https://a248.e.akamai.net/assets.github.com/images/modules/ajax/error.png"
}, $(function () {
    function c() {
        $("#facebox .shortcuts:visible").length ? $.facebox.close() : ($(document).one("reveal.facebox", function () {
            $(".js-see-all-keyboard-shortcuts").click(function () {
                return $(this).remove(), $("#facebox :hidden").show(), !1
            })
        }), $.facebox({
            div: "#keyboard_shortcuts_pane"
        }, "shortcuts"))
    }
    function d() {
        $("#facebox .cheatsheet:visible").length ? $.facebox.close() : $.facebox({
            div: "#markdown-help"
        }, "cheatsheet")
    }
    var a = new Image;
    a.src = GitHub.Ajax.spinner, $(".previewable-comment-form").previewableCommentForm(), $(".cards_select").cardsSelect(), $(document).bind("reveal.facebox", function () {
        $(".cards_select").cardsSelect()
    }), $(".js-entice").each(function () {
        $(this).enticeToAction({
            title: $(this).attr("data-entice")
        })
    }), $("textarea.js-autosize").autoResize({
        animateDuration: 300,
        extraSpace: 10
    }), $(".flash .close").click(function () {
        $(this).closest(".flash").fadeOut(300)
    }), $(".tooltipped").each(function () {
        var a = $(this),
            b = a.hasClass("downwards") ? "n" : "s";
        b = a.hasClass("rightwards") ? "w" : b, b = a.hasClass("leftwards") ? "e" : b, a.tipsy({
            gravity: b
        })
    }), $(".toggle_link").click(function () {
        return $($(this).attr("href")).toggle(), !1
    }), $(".hide_alert").live("click", function () {
        return $("#site_alert").slideUp(), $.cookie("hide_alert_vote", "t", {
            expires: 7,
            path: "/"
        }), !1
    }), $(".hide_div").click(function () {
        return $(this).parents("div:first").fadeOut(), !1
    });
    var b = $("#login_field");
    b.val() ? b.length && $("#password").focus() : b.focus(), $("#versions_select").change(function () {
        location.href = this.value
    }), $(document).pageUpdate(function () {
        $(this).find("a[rel*=facebox]").facebox()
    }), $(this).find("a[rel*=facebox]").facebox(), $(document).bind("loading.facebox", function () {
        $(".clippy").hide()
    }), $(document).bind("reveal.facebox", function () {
        $("#facebox .clippy").show()
    }), $(document).bind("close.facebox", function () {
        $(".clippy").show()
    }), $(".pjax a").pjax(".site:first"), $(".js-date-input").date_input(), $.fn.truncate && $(".truncate").bind("truncate", function () {
        $(this).truncate(50, {
            chars: /.*/
        })
    }).trigger("truncate"), $.hotkeys({
        s: function () {
            return e.focus(), !1
        },
        "?": function () {
            c()
        },
        m: function () {
            d()
        }
    }), $(".gfm-help").click(function (a) {
        a.preventDefault(), d()
    });
    var e = $(".topsearch input[name=q]");
    $.ajaxSetup({
        beforeSend: function (a, b) {
            b.dataType === undefined && a.setRequestHeader("Accept", "*/*;q=0.5, " + b.accepts.script)
        }
    }), $("button, .minibutton").live("mousedown", function () {
        $(this).addClass("mousedown")
    }).live("mouseup mouseleave", function () {
        $(this).removeClass("mousedown")
    }), $("ul.inline-tabs").tabs(), $(".js-hard-tabs").hardTabs(), BaconPlayer.sm2 = "/javascripts/soundmanager/sm2.js", $("button.classy, a.button.classy").mousedown(function () {
        $(this).addClass("mousedown")
    }).bind("mouseup mouseleave", function () {
        $(this).removeClass("mousedown")
    }), $(document).editableComment()
}), $(document).pageUpdate(function () {
    $(this).find(".js-placeholder-field label.placeholder").fancyplace()
}), $.extend($.facebox.settings, {
    loadingImage: "https://a248.e.akamai.net/assets.github.com/images/modules/facebox/loading.gif",
    closeImage: "https://a248.e.akamai.net/assets.github.com/images/modules/facebox/closelabel.png"
}), function () {
    var a, b, c, d, e;
    (e = window._gaq) != null ? e : window._gaq = [], _gaq.push(["_setAccount", "UA-3769691-2"]), _gaq.push(["_setDomainName", "none"]), _gaq.push(["_trackPageview"]), _gaq.push(["_trackPageLoadTime"]), document.title === "404 - GitHub" && (d = document.location.pathname + document.location.search, a = document.referrer, _gaq.push(["_trackPageview", "/404.html?page=" + d + "&from=" + a])), b = document.createElement("script"), b.type = "text/javascript", b.async = !0, c = document.location.protocol === "https:" ? "https://ssl" : "http://www", b.src = "" + c + ".google-analytics.com/ga.js", document.getElementsByTagName("head")[0].appendChild(b)
}.call(this), GitHub.Autocomplete = function () {}, GitHub.Autocomplete.gravatars = {}, GitHub.Autocomplete.visibilities = {}, GitHub.Autocomplete.acceptable = function (a) {
    a.result(function (a, b) {
        var c = $(this);
        setTimeout(function () {
            c.val() && (c.addClass("ac-accept"), c.data("accept-val", c.val()))
        }, 30)
    }), a.keypress(function (a) {
        $(this).data("accept-val") != $(this).val() && $(this).removeClass("ac-accept")
    }), a.keydown(function (a) {
        $(this).data("accept-val") != $(this).val() && $(this).removeClass("ac-accept")
    }), a.keyup(function (a) {
        $(this).data("accept-val") != $(this).val() && $(this).removeClass("ac-accept")
    }), a.parents("form:first").submit(function () {
        $(this).removeClass("ac-accept")
    })
}, GitHub.Autocomplete.prototype = {
    usersURL: "/autocomplete/users",
    reposURL: "/autocomplete/repos",
    myReposURL: "/autocomplete/repos/mine",
    branchesURL: "/autocomplete/branches",
    settings: {},
    repos: function (a) {
        a = $(a);
        if (!$.fn.autocomplete || a.length == 0) return a;
        var b = a.autocomplete(this.reposURL, $.extend({
            delay: 10,
            width: 210,
            minChars: 2,
            selectFirst: !1,
            formatItem: function (a) {
                a = a[0].split(" ");
                var b = a[0],
                    c = a[1];
                return GitHub.Autocomplete.visibilities[b] = c, b
            },
            formatResult: function (a) {
                return a[0].split(" ")[0]
            },
            autoResult: !0
        }, this.settings));
        return GitHub.Autocomplete.acceptable(b), b
    },
    myRepos: function (a) {
        return a = $(a), !$.fn.autocomplete || a.length == 0 ? a : $(document.body).hasClass("logged_in") ? a.autocomplete(this.myReposURL, $.extend({
            delay: 10,
            width: 210,
            selectFirst: !1,
            formatItem: function (a) {
                a = a[0].split(" ");
                var b = a[0],
                    c = a[1];
                return GitHub.Autocomplete.visibilities[b] = c, b
            },
            formatResult: function (a) {
                return a[0].split(" ")[0]
            }
        }, this.settings)).result(function (a, b, c) {
            return window.location = "/" + b[0].split(" ")[0], !1
        }).keydown(function (b) {
            if (!/\//.test(a.val()) && b.keyCode == 9) {
                var c = $(".ac_results li:first").text();
                if (c) return a.val(c), window.location = "/" + c, !1
            }
        }).end() : a
    },
    users: function (a) {
        a = $(a);
        if (!$.fn.autocomplete || a.length == 0) return a;
        var b = a.autocomplete(this.usersURL, $.extend({
            delay: 10,
            minChars: 1,
            formatItem: function (a) {
                a = a[0].split(" ");
                var b = a[0],
                    c = GitHub.gravatar(a[1], 20);
                return GitHub.Autocomplete.gravatars[b] = c, c + " " + b
            },
            formatResult: function (a) {
                return a[0].split(" ")[0]
            },
            autoResult: !0
        }, this.settings));
        return GitHub.Autocomplete.acceptable(b), b
    },
    branches: function (a, b) {
        a = $(a);
        if (!$.fn.autocomplete || a.length == 0) return a;
        b || (b = {}), b = $.extend({
            matchCase: !0,
            minChars: 0,
            matchContains: !0,
            selectFirst: !0,
            autoResult: !0
        }, b);
        var c = a.autocomplete(this.branchesURL, $.extend(this.settings, b));
        return GitHub.Autocomplete.acceptable(c), c
    }
}, $.userAutocomplete = function () {
    $(".autocompleter, .user-autocompleter").userAutocomplete()
}, $.fn.userAutocomplete = function () {
    return (new GitHub.Autocomplete).users(this)
}, $.repoAutocomplete = function () {}, $.fn.repoAutocomplete = function () {
    return (new GitHub.Autocomplete).repos(this)
}, $.myReposAutocomplete = function () {
    $(".my_repos_autocompleter").myReposAutocomplete()
}, $.fn.myReposAutocomplete = function () {
    return (new GitHub.Autocomplete).myRepos(this)
}, $.fn.branchesAutocomplete = function (a) {
    return (new GitHub.Autocomplete).branches(this, a)
}, $(function () {
    $.userAutocomplete(), $.myReposAutocomplete()
}), GitHub.Blob || (GitHub.Blob = {}), GitHub.Blob.highlightLines = function (a) {
    var b, c;
    $(".line").css("background-color", "transparent"), a ? (b = $(this).attr("rel"), a.shiftKey && (b = window.location.hash.replace(/-\d+/, "") + "-" + b.replace(/\D/g, "")), window.location.hash = b) : b = window.location.hash;
    if (c = b.match(/#?(?:L|-)(\d+)/g)) {
        c = $.map(c, function (a) {
            return parseInt(a.replace(/\D/g, ""))
        });
        if (c.length == 1) return $("#LC" + c[0]).css("background-color", "#ffc");
        for (var d = c[0]; d <= c[1]; d++) $("#LC" + d).css("background-color", "#ffc");
        $("#LC" + c[0]).scrollTo(1)
    }
    return !1
}, GitHub.Blob.scrollToHilightedLine = function () {
    var a, b = window.location.hash;
    if (a = b.match(/^#?(?:L|-)(\d+)$/g)) a = $.map(a, function (a) {
        return parseInt(a.replace(/\D/g, ""))
    }), $("#L" + a[0]).scrollTo(1)
}, GitHub.Blob.show = function () {
    $(".file-edit-link").hide(), $(".frame-center .file-edit-link").show(), $.hotkeys({
        e: function () {
            var a = $(".file-edit-link:visible");
            a.hasClass("js-edit-link-disabled") || (window.location = a.attr("href"))
        },
        l: function () {
            return $(document).one("reveal.facebox", function () {
                var a = $("#facebox").find(":text");
                a.focus(), $("#facebox form").submit(function () {
                    return window.location = "#L" + parseInt(a.val()), GitHub.Blob.highlightLines(), a.blur(), $(document).trigger("close.facebox"), !1
                })
            }), $.facebox({
                div: "#jump-to-line"
            }), !1
        }
    });
    var a = $(".repo-tree").attr("data-ref");
    if (!$(document.body).hasClass("logged_in") || !a) {
        $(".file-edit-link").enticeToAction({
            title: "You must be logged in and on a branch to make or propose changes",
            direction: "leftwards"
        }), $(".file-edit-link").addClass("js-edit-link-disabled");
        return
    }
    if ($(document.body).hasClass("logged_in") && a) {
        var b = $(".file-edit-link:visible"),
            c = b[0];
        if (c && !$(".btn-pull-request")[0]) {
            var d = $(".file-edit-link > span");
            d.text("Fork and edit this file"), b.attr("title", "Clicking this button will automatically fork this project so you can edit the file"), b.tipsy({
                gravity: "e"
            })
        }
    }
}, $(function () {
    $(".page-blob").length > 0 && (GitHub.Blob.scrollToHilightedLine(), GitHub.Blob.highlightLines(), GitHub.Blob.show()), $(".line_numbers span[rel]").live("mousedown", GitHub.Blob.highlightLines), $(".file-edit-link").live("click", function () {
        return $(this).hasClass("entice") ? !1 : !0
    }), $(".file").delegate(".linkable-line-number", "click", function (a) {
        return document.location.hash = this.id, !1
    })
}), $(function () {
    $(".js-blob-edit-form").show(), $(".js-blob-edit-progress").hide(), window.editor = new GitHub.CodeEditor(".file-editor-textarea", {
        indentModeControl: "#indent-mode",
        indentWidthControl: "#indent-width",
        wrapModeControl: "#wrap-mode"
    });
    if ("sharejs" in window) var a = new GitHub.Thunderhorse(editor);
    $(".js-blob-edit-actions .code").click(function () {
        return $(this).is(".selected") ? !1 : ($(".js-blob-edit-actions a").toggleClass("selected"), $(".js-commit-create").show(), $(".js-commit-preview").empty(), !1)
    }), $(".js-blob-edit-actions .preview").click(function () {
        return $(this).is(".selected") ? !1 : ($(".js-blob-edit-form").contextLoader(36), $(".js-blob-edit-actions a").toggleClass("selected"), $.ajax({
            url: location.pathname.replace("/edit/", "/preview/"),
            type: "POST",
            data: {
                code: CodeEditor.code()
            },
            success: function (a) {
                var b = $(a).find(".data.highlight");
                b.length || (b = $(a).filter("#readme")), b.length || (b = '<h3 class="no-preview">No changes</h3>'), $(".js-commit-preview").append(b)
            },
            error: function () {
                $(".js-commit-preview").append('<h3 class="no-preview">Error loading preview.</h3>')
            },
            complete: function () {
                $(".context-loader").remove(), $(".js-commit-create").hide()
            }
        }), !1)
    });
    if ($("#utc_offset").length) {
        var b = (new Date).getTimezoneOffset() * 60;
        $("#utc_offset").val(-b)
    }
}), $(function () {
    var a = 2,
        b = 7,
        c = 30,
        d = 1e4;
    $(".diverge-widget").each(function () {
        var d = $(this),
            e = new Date(d.attr("last-updated")),
            f = (new Date - e) / 1e3 / 3600 / 24;
        f <= a ? d.addClass("hot") : f <= b ? d.addClass("fresh") : f <= c ? d.addClass("stale") : d.addClass("old")
    })
}), $(function () {
    $.hotkeys({
        y: function () {
            var a = $("link[rel='permalink']").attr("href"),
                b = $("title");
            a && (a += location.hash, Modernizr.history ? window.history.pushState({}, b, a) : window.location.href = a)
        }
    })
}), GitHub.CodeEditor = function (a, b) {
    this.options = b = b || {};
    if (!window.ace) return;
    if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) return;
    if ($.browser.msie || $.browser.opera) return;
    this.textarea = $(a);
    if (this.textarea.length == 0) return;
    this.frame = {
        width: "100%",
        height: this.textarea.height()
    };
    var c = this.textarea.text(),
        d = this.textarea.attr("data-language");
    this.filename = this.textarea.attr("data-filename"), this.ace = this.createEditor(c), this.setTheme("twilight"), this.ace.setShowPrintMargin(!1), this.setMode(b.mode || d), this.setUseSoftTabs(b.useSoftTabs || this.usesSoftTabs(c)), this.setTabSize(b.tabSize || this.useSoftTabs ? this.guessTabSize(c) : 8), b.useWrapMode && this.setUseWrapMode(b.useWrapMode), this.setupKeyBindings(), this.setupFormBindings(), this.setupControlBindings(), this.setupHacks();
    var e = this.ace;
    window.onbeforeunload = function () {
        if (e.getSession().getUndoManager().hasUndo()) return "Are you sure you want to leave? Your changes will be lost."
    }, this.useSoftTabs ? console.log("indent: %d", this.tabSize) : console.log("indent: \\t"), window.CodeEditor = this
}, GitHub.CodeEditor.prototype = {
    modeMap: {
        "c++": "c_cpp",
        c: "c_cpp",
        coffeescript: "coffee",
        "objective-c": "c_cpp",
        "html+erb": "html",
        "c#": "csharp"
    },
    frame: {
        width: 0,
        height: 0
    },
    code: function () {
        return this.ace.getSession().getValue()
    },
    setCode: function (a) {
        return this.ace.getSession().setValue(a)
    },
    createEditor: function (a) {
        return this.div = this.swapTextareaWithEditorDiv(a), ace.edit(this.div[0])
    },
    guessTabSize: function (a) {
        var b = /^( +)[^*]/im.exec(a || this.code());
        return b ? b[1].length : 2
    },
    modeNameForLanguage: function (a) {
        return a ? (a = a.toLowerCase(), this.modeMap[a] || a) : "text"
    },
    modeForLanguage: function (a) {
        if (!a) return;
        var b = this.modeNameForLanguage(a);
        console.log("mode: %s", b);
        try {
            return require("ace/mode/" + b).Mode
        } catch (c) {
            return null
        }
    },
    swapTextareaWithEditorDiv: function (a) {
        return this.textarea.hide(), $('<div id="ace-editor">').css("height", this.frame.height).css("width", this.frame.width).text(a).insertAfter(this.textarea)
    },
    setMode: function (a) {
        var b = this.modeForLanguage(a);
        b && this.ace.getSession().setMode(new b)
    },
    setupFormBindings: function () {
        var a = this;
        a.textarea.parents("form").bind("submit", function () {
            window.onbeforeunload = $.noop, a.textarea.text(a.code())
        })
    },
    setupControlBindings: function () {
        var a = this.options,
            b = this;
        $(a.indentModeControl).change(function () {
            b.setUseSoftTabs(this.value == "spaces")
        }).val(b.useSoftTabs ? "spaces" : "tabs"), $(a.indentWidthControl).change(function () {
            b.setTabSize(parseInt(this.value))
        }).val(b.tabSize), $(a.wrapModeControl).change(function () {
            b.setUseWrapMode(this.value == "on")
        })
    },
    setupHacks: function () {
        $(".ace_gutter").css("height", this.frame.height)
    },
    setupKeyBindings: function () {
        var a = this,
            b = require("pilot/canon");
        b.removeCommand("gotoline"), b.addCommand({
            name: "togglecomment",
            bindKey: {
                win: "Ctrl-/",
                mac: "Command-/",
                sender: "editor"
            },
            exec: function (a) {
                a.editor.toggleCommentLines()
            }
        })
    },
    setUseSoftTabs: function (a) {
        this.useSoftTabs = a, this.ace.getSession().setUseSoftTabs(a)
    },
    setTabSize: function (a) {
        this.tabSize = a, this.ace.getSession().setTabSize(a)
    },
    setUseWrapMode: function (a) {
        this.ace.getSession().setUseWrapMode(a)
    },
    setTheme: function (a) {
        var b = this.div[0].className.split(" ");
        for (var c in b) / ace - /.test(b[c])&&this.div.removeClass(b[c]);this.div.addClass("ace-"+a)},usesSoftTabs:function(a){return!/ ^ \t / m.test(a || this.code())
    }
}, Comment = {
    enhanceEmailToggles: function () {
        $(".email-hidden-toggle").each(function () {
            var a = $(this),
                b = a.find("a"),
                c = a.next(".email-hidden-reply");
            b.click(function () {
                return c.is(":visible") ? (c.hide(), b.html("Show quoted text")) : (c.show(), b.html("Hide quoted text")), !1
            })
        })
    }
}, $(Comment.enhanceEmailToggles), $(function () {
    if (!$(".js-new-comment-form")[0]) return;
    $(document).delegate(".js-add-a-comment", "click", function () {
        var a = $(this).attr("href");
        $(a).find("*[tabindex=1]").focus()
    }), $(document).delegate(".js-new-comment-form .action-bar a", "ajaxSend", function () {
        $(this).addClass("disabled")
    }), $(document).delegate(".js-new-comment-form", "ajaxBeforeSend", function (a) {
        if ($(a.target).is("form") && $.trim($(this).find('textarea[name="comment[body]"]').val()) == "") return !1
    }), $(document).delegate(".js-new-comment-form", "ajaxSend", function (a) {
        $(a.target).is("form") && $(this).find(".form-actions button").attr("disabled", "true")
    }), $(document).delegate(".js-new-comment-form", "ajaxComplete", function (a) {
        $(this).find(".form-actions button").attr("disabled", !1)
    }), $(document).delegate(".js-new-comment-form", "ajaxSuccess", function (a, b, c, d) {
        d.discussionStats && $(".discussion-stats").html(d.discussionStats), d.discussion && $(".discussion-timeline > .new-comments").append(d.discussion), d.formActionBar && $(".js-new-comment-form .action-bar").html(d.formActionBar), d.formActions && $(".js-new-comment-form .form-actions").html(d.formActions), $("#discussion_bucket, #show_issue").trigger("pageUpdate"), $(a.target).is("form") && ($(this).find("textarea").val("").blur(), $(this).find("a[action=write]").click())
    }), $(document).delegate(".js-new-comment-form", "ajaxError", function () {
        $(this).find(".comment-form-error").show().html("There was an error posting your comment")
    })
}), GitHub.G_vmlCanvasManager, GitHub.Commit = {
    dumpEmptyClass: function () {
        $(this).removeClass("empty")
    },
    addEmptyClass: function () {
        !$(this).data("clicked") && $(this).text() == "0" && $(this).addClass("empty")
    },
    highlightLine: function () {
        $(this).parent().css("background", "#ffc")
    },
    unhighlightLine: function () {
        $(this).data("clicked") || $(this).parent().css("background", "")
    },
    jumpToHashFile: function () {
        if (!window.location.hash) return;
        var a, b, c = window.location.hash.substr(1);
        if (/^diff-\d+$/.test(c)) return;
        if (c.match(/^r\d+$/) && (b = $("#files #" + c)).length > 0) {
            console.log("jumping to review comment", b), $(b).addClass("selected"), $("html,body").animate({
                scrollTop: b.offset().top - 200
            }, 1);
            return
        }(a = c.match(/(.+)-P(\d+)$/) || c.match(/(.+)/)) && (b = GitHub.Commit.files[a[1]]) && (a[2] ? (b = $(b).closest(".file").find('tr[data-position="' + a[2] + '"] pre'), b.length > 0 && (b.scrollTo(1), setTimeout(function () {
            GitHub.Commit.highlightLine.call(b)
        }, 50))) : $(b).closest(".file").scrollTo(1))
    }
}, $(function () {
    function c(a) {
        a.find(".inline-comment-form").show().find("textarea").focus(), a.find(".show-inline-comment-form a").hide()
    }
    var a = {};
    $("#files.diff-view > .file > .meta").each(function () {
        a[$(this).attr("data-path")] = this
    }), GitHub.Commit.files = a;
    var b = function (a) {
            a.find("ul.inline-tabs").tabs(), a.find(".show-inline-comment-form a").click(function () {
                return a.find(".inline-comment-form").show().find("textarea").focus(), $(this).hide(), !1
            }), a.delegate(".close-form", "click", function () {
                return a.find(".inline-comment-form").hide(), a.find(".commit-comment", ".review-comment").length > 0 ? a.find(".show-inline-comment-form a").show() : (console.log(a), a.remove()), !1
            }), $(a).bind("pageUpdate", function () {
                $(this).find(".comment-holder").children(":visible")[0] || $(this).remove()
            });
            var b = a.find(".previewable-comment-form").previewableCommentForm().closest("form");
            b.submit(function () {
                return b.find(".ajaxindicator").show(), b.find("button").attr("disabled", "disabled"), b.ajaxSubmit({
                    complete: function () {
                        b.find(".ajaxindicator").hide(), b.find("button").attr("disabled", !1)
                    },
                    success: function (a) {
                        var c = b.closest(".clipper"),
                            d = c.find(".comment-holder");
                        d.length == 0 && (d = c.prepend($('<div class="inset comment-holder"></div>')).find(".comment-holder")), a = $(a), d.append(a), a.trigger("pageUpdate"), b.find("textarea").val(""), c.find(".inline-comment-form").hide(), c.find(".show-inline-comment-form a").show();
                        var e = c.closest(".inline-comments").find(".comment-count .counter");
                        e.text(parseInt(e.text().replace(",", "")) + 1), $(c.closest(".file-box, .file")).trigger("commentChange", a)
                    },
                    error: function () {
                        b.find(".comment-form-error").show().html("There was an error posting your comment")
                    }
                }), !1
            })
        };
    $(".inline-review-comment tr.inline-comments").each(function () {
        b($(this))
    }), $("#diff-comment-data > table").each(function () {
        var c = $(this).attr("data-path"),
            d = $(this).attr("data-position"),
            e = $(a[c]).closest(".file"),
            f = e.find('.data table tr[data-position="' + d + '"]');
        f.after($(this).find("tr").detach()), b(f.next("tr.inline-comments")), e.find(".show-inline-comments-toggle").closest("li").show()
    }), $("#diff-comment-data > div").each(function () {
        var b = $(this).attr("data-path");
        $(a[b]).closest(".file").find(".file-comments-place-holder").replaceWith($(this).detach())
    }), $(window).bind("hashchange", GitHub.Commit.jumpToHashFile), setTimeout(GitHub.Commit.jumpToHashFile, 50), $('.inline-comment-form div[id^="write_bucket_"]').live("tabChanged", function () {
        var a = $(this);
        setTimeout(function () {
            a.find("textarea").focus()
        }, 13)
    });
    var d = !1;
    $(".add-bubble").live("click", function () {
        if (d) return;
        var a = $(this).closest("tr"),
            e = a.next("tr.inline-comments");
        if (e.length > 0) {
            c(e);
            return
        }
        $(".error").remove(), d = !0, $.ajax({
            url: $(this).attr("remote"),
            complete: function () {
                d = !1
            },
            success: function (d) {
                a.after(d), e = a.next("tr.inline-comments"), b(e), c(e)
            },
            error: function () {
                a.after('<tr class="error"><td colspan=3><p><img src="' + GitHub.Ajax.error + '"> Something went wrong! Please try again.</p></td></tr>')
            }
        })
    }), $("#files .show-inline-comments-toggle").change(function () {
        this.checked ? $(this).closest(".file").find("tr.inline-comments").show() : $(this).closest(".file").find("tr.inline-comments").hide()
    }).change(), $("#inline_comments_toggle input").change(function () {
        this.checked ? $("#comments").removeClass("only-commit-comments") : $("#comments").addClass("only-commit-comments")
    }).change(), $(".js-show-suppressed-diff").click(function () {
        return $(this).parent().next().show(), $(this).parent().hide(), !1
    }), $(".js-commit-link, .js-tree-link, .js-parent-link").each(function () {
        var a = $(this).attr("href");
        $.hotkey($(this).attr("data-key"), function () {
            window.location = a
        })
    })
}), $(function () {
    if ($("#files .image").length) {
        var a = $("#files .file:has(.onion-skin)"),
            b = [];
        $.each(a, function (c, d) {
            function C() {
                z++, F();
                if (z >= y) {
                    var a = e.find(".progress");
                    a.is(":visible") ? a.fadeOut(250, function () {
                        E()
                    }) : (a.hide(), E())
                }
            }
            function D(a) {
                var b = v.find(".active"),
                    c = v.find(".active").first().index(),
                    d = w.eq(c),
                    f = v.children().eq(a);
                if (f.hasClass("active") == 0 && f.hasClass("disabled") == 0) {
                    b.removeClass("active"), f.addClass("active");
                    if (f.is(":visible")) {
                        var g = f.position(),
                            h = f.outerWidth(),
                            i = String(g.left + h / 2) + "px 0px";
                        v.css("background-image", "url(/images/modules/commit/menu_arrow.gif)"), v.css("background-position", i)
                    }
                    z >= 2 && (animHeight = parseInt(w.eq(a).css("height")) + 127, e.animate({
                        height: animHeight
                    }, 250, "easeOutQuart"), d.animate({
                        opacity: "hide"
                    }, 250, "easeOutQuart", function () {
                        w.eq(a).fadeIn(250)
                    }))
                }
            }
            function E() {
                var a = 858,
                    d = Math.max(A.width, B.width),
                    j = Math.max(A.height, B.height),
                    k = 0;
                A.marginHoriz = Math.floor((d - A.width) / 2), A.marginVert = Math.floor((j - A.height) / 2), B.marginHoriz = Math.floor((d - B.width) / 2), B.marginVert = Math.floor((j - B.height) / 2), $.each($.getUrlVars(), function (a, c) {
                    c == e.attr("id") && (diffNum = parseInt(c.replace(/\D*/g, "")), x = $.getUrlVar(c)[0], k = $.getUrlVar(c)[1] / 100, b[diffNum].view = $.getUrlVar(c)[0], b[diffNum].pct = $.getUrlVar(c)[1], b[diffNum].changed = !0)
                });
                var w = 1;
                d > (a - 30) / 2 && (w = (a - 30) / 2 / d), l.attr({
                    width: A.width * w,
                    height: A.height * w
                }), m.attr({
                    width: B.width * w,
                    height: B.height * w
                }), f.find(".deleted-frame").css({
                    margin: A.marginVert * w + "px " + A.marginHoriz * w + "px",
                    width: A.width * w + 2,
                    height: A.height * w + 2
                }), f.find(".added-frame").css({
                    margin: B.marginVert * w + "px " + B.marginHoriz * w + "px",
                    width: B.width * w + 2,
                    height: B.height * w + 2
                }), f.find(".aWMeta").eq(0).text(B.width + "px"), f.find(".aHMeta").eq(0).text(B.height + "px"), f.find(".dWMeta").eq(0).text(A.width + "px"), f.find(".dHMeta").eq(0).text(A.height + "px"), B.width != A.width && (f.find(".aWMeta").eq(0).addClass("a-green"), f.find(".dWMeta").eq(0).addClass("d-red")), B.height != A.height && (f.find(".aHMeta").eq(0).addClass("a-green"), f.find(".dHMeta").eq(0).addClass("d-red"));
                var y = 1,
                    z;
                d > a - 12 && (y = (a - 12) / d), z = 0, z = d * y + 3, n.attr({
                    width: A.width * y,
                    height: A.height * y
                }), o.attr({
                    width: B.width * y,
                    height: B.height * y
                }), g.find(".deleted-frame").css({
                    margin: A.marginVert * y + "px " + A.marginHoriz * y + "px",
                    width: A.width * y + 2,
                    height: A.height * y + 2
                }), g.find(".added-frame").css({
                    margin: B.marginVert * y + "px " + B.marginHoriz * y + "px",
                    width: B.width * y + 2,
                    height: B.height * y + 2
                }), g.find(".swipe-shell").css({
                    width: d * y + 3 + "px",
                    height: j * y + 4 + "px"
                }), g.find(".swipe-frame").css({
                    width: d * y + 18 + "px",
                    height: j * y + 30 + "px"
                }), g.find(".swipe-bar").css("left", k * z + "px"), e.find(".swipe .swipe-shell").css("width", z - z * k), g.find(".swipe-bar").draggable({
                    axis: "x",
                    containment: "parent",
                    drag: function (a, d) {
                        var f = Math.round(d.position.left / (parseInt(e.find(".swipe-frame").css("width")) - 15) * 1e4) / 1e4;
                        e.find(".swipe .swipe-shell").css("width", z - z * f), b[c].pct = f * 100, b[c].changed = !0
                    },
                    stop: function (a, b) {
                        G()
                    }
                });
                var C = 1;
                d > a - 12 && (C = (a - 12) / d), p.attr({
                    width: A.width * C,
                    height: A.height * C
                }), q.attr({
                    width: B.width * C,
                    height: B.height * C
                }), h.find(".deleted-frame").css({
                    margin: A.marginVert * C + "px " + A.marginHoriz * C + "px",
                    width: A.width * C + 2,
                    height: A.height * C + 2
                }), h.find(".added-frame").css({
                    margin: B.marginVert * C + "px " + B.marginHoriz * C + "px",
                    width: B.width * C + 2,
                    height: B.height * C + 2
                }), h.find(".onion-skin-frame").css({
                    width: d * C + 4 + "px",
                    height: j * C + 30 + "px"
                }), e.find(".dragger").css("left", 262 - k * 262 + "px"), e.find(".onion-skin .added-frame").css("opacity", k), e.find(".onion-skin .added-frame img").css("opacity", k), e.find(".dragger").draggable({
                    axis: "x",
                    containment: "parent",
                    drag: function (a, d) {
                        var f = Math.round(d.position.left / 262 * 100) / 100;
                        e.find(".onion-skin .added-frame").css("opacity", f), e.find(".onion-skin .added-frame img").css("opacity", f), b[c].pct = f * 100, b[c].changed = !0
                    },
                    stop: function (a, b) {
                        G()
                    }
                });
                var E = 1;
                d > a - 4 && (E = (a - 4) / d), Modernizr.canvas && (r.attr({
                    width: d * E,
                    height: j * E
                }), s.attr({
                    width: d * E,
                    height: j * E
                }), i.find(".added-frame").css({
                    width: d * E + 2,
                    height: j * E + 2
                }), i.find(".deleted-frame").css({
                    width: d * E + 2,
                    height: j * E + 2
                }), t.drawImage(A, A.marginHoriz * E, A.marginVert * E, A.width * E, A.height * E), u.drawImage(B, B.marginHoriz * E, B.marginVert * E, B.width * E, B.height * E), u.blendOnto(t, "difference")), f.css("height", j * w + 30), g.css("height", j * y + 30), h.css("height", j * y + 30), i.css("height", j * y + 30), v.children().removeClass("disabled"), D(x)
            }
            function F() {
                var a = z / y * 100 + "%";
                e.find(".progress-bar").animate({
                    width: a
                }, 250, "easeOutQuart")
            }
            function G() {
                var a = "?";
                $.each(b, function (b, c) {
                    c["changed"] == 1 && (b != 0 && (a += "&"), a += "diff-" + b + "=" + c.view + "-" + Math.round(c.pct))
                }), Modernizr.history && window.history.replaceState({}, "", a)
            }
            var e = a.eq(c),
                f = e.find(".two-up").eq(0),
                g = e.find(".swipe").eq(0),
                h = e.find(".onion-skin").eq(0),
                i = e.find(".difference").eq(0),
                j = e.find(".deleted"),
                k = e.find(".added"),
                l = j.eq(0),
                m = k.eq(0),
                n = j.eq(1),
                o = k.eq(1),
                p = j.eq(2),
                q = k.eq(2),
                r = e.find("canvas.deleted").eq(0),
                s = e.find("canvas.added").eq(0),
                t, u, v = e.find("ul.menu"),
                w = e.find(".view"),
                x = 0,
                y = e.find(".asset").length,
                z = 0,
                A = new Image,
                B = new Image;
            b.push({
                name: e.attr("id"),
                view: 0,
                pct: 0,
                changed: !1
            }), Modernizr.canvas ? (t = r[0].getContext("2d"), u = s[0].getContext("2d")) : v.children().eq(3).addClass("hidden"), e.find(".two-up").hide(), e.find(".two-up p").removeClass("hidden"), e.find(".progress").removeClass("hidden"), e.find(".view-modes").removeClass("hidden"), A.src = e.find(".deleted").first().attr("src"), B.src = e.find(".added").first().attr("src"), l.attr("src", A.src).load(function () {
                C()
            }), m.attr("src", B.src).load(function () {
                C()
            }), n.attr("src", A.src).load(function () {
                C()
            }), o.attr("src", B.src).load(function () {
                C()
            }), p.attr("src", A.src).load(function () {
                C()
            }), q.attr("src", B.src).load(function () {
                C()
            }), v.children("li").click(function () {
                D($(this).index()), b[c].view = $(this).index(), b[c].changed = !0, G()
            }), $.extend({
                getUrlVars: function () {
                    var a = [],
                        b, c = window.location.href.slice(window.location.href.indexOf("?") + 1).split("&");
                    for (var d = 0; d < c.length; d++) b = c[d].split("="), b[1] && (b[1] = b[1].split("-")), a.push(b[0]), a[b[0]] = b[1];
                    return a
                },
                getUrlVar: function (a) {
                    return $.getUrlVars()[a]
                }
            })
        })
    }
}), GitHub.Commits = {
    elements: [],
    current: null,
    selected: function () {
        return $(this.elements).eq(this.current)
    },
    select: function (a) {
        return this.current = a, $(".selected").removeClass("selected"), this.elements.eq(a).addClass("selected")
    },
    next: function () {
        if (this.current !== null) {
            if (this.elements.length - 1 == this.current) return;
            var a = this.select(++this.current);
            a.offset().top - $(window).scrollTop() + 50 > $(window).height() && a.scrollTo(200)
        } else this.select(0)
    },
    prev: function () {
        if (!this.current) return this.elements.eq(0).removeClass("selected"), this.current = null;
        var a = this.select(--this.current);
        a.offset().top - $(window).scrollTop() < 0 && a.scrollTo(200)
    },
    link: function (a) {
        if (GitHub.Commits.current === null) return !1;
        window.location = GitHub.Commits.selected().find("[data-key=" + a + "]").attr("href")
    }
}, $(function () {
    GitHub.Commits.elements = $(".commit"), $(".page-commits").length && $.hotkeys({
        c: function () {
            GitHub.Commits.link("c")
        },
        enter: function () {
            GitHub.Commits.link("c")
        },
        o: function () {
            GitHub.Commits.link("c")
        },
        t: function () {
            GitHub.Commits.link("t")
        },
        j: function () {
            GitHub.Commits.next()
        },
        k: function () {
            GitHub.Commits.prev()
        }
    })
}), $(function () {
    $(".commit .js-more a").click(function () {
        return $(this).parents(".message").find(".short, .full").toggle(), !1
    })
}), $(function () {
    $("#imma_student").click(function () {
        return $("#student_contact").slideToggle(), !1
    }), $("#imma_teacher").click(function () {
        return $("#teacher_contact").slideToggle(), !1
    }), $("#imma_school_admin").click(function () {
        return $("#school_admin_contact").slideToggle(), !1
    })
}), $(function () {
    $("#your_repos").repoList({
        selector: "#repo_listing",
        ajaxUrl: "/dashboard/ajax_your_repos"
    }), $("#watched_repos").repoList({
        selector: "#watched_repo_listing",
        ajaxUrl: "/dashboard/ajax_watched_repos"
    }), $("#org_your_repos").length > 0 && $("#org_your_repos").repoList({
        selector: "#repo_listing",
        ajaxUrl: location.pathname + "/ajax_your_repos"
    }), $(".reveal_commits, .hide_commits").live("click", function () {
        var a = $(this).parents(".details");
        return a.find(".reveal, .hide_commits, .commits").toggle(), !1
    }), $(".octofication .hide a").click(function () {
        return $.post(this.href, null, function () {
            $(".octofication").fadeOut()
        }), !1
    }), $(".dashboard-notice .dismiss").click(function () {
        var a = $(this).closest(".dashboard-notice");
        return $.del(this.href, null, function () {
            a.fadeOut()
        }), !1
    }), $(".js-dismiss-bootcamp").click(function () {
        var a = $(this).closest(".bootcamp");
        return $.post(this.href, null, function () {
            a.fadeOut()
        }), !1
    })
}), Date._isoRegexp = /(\d{4,})(?:-(\d{1,2})(?:-(\d{1,2})(?:[T ](\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d+))?)?(?:(Z)|([+-])(\d{1,2})(?::(\d{1,2}))?)?)?)?)?/, Date.parseISO8601 = function (a) {
    a += "";
    if (typeof a != "string" || a.length === 0) return null;
    var b = a.match(Date._isoRegexp);
    if (typeof b == "undefined" || b === null) return null;
    var c, d, e, f, g, h, i;
    c = parseInt(b[1], 10);
    if (typeof b[2] == "undefined" || b[2] === "") return new Date(c);
    d = parseInt(b[2], 10) - 1, e = parseInt(b[3], 10);
    if (typeof b[4] == "undefined" || b[4] === "") return new Date(c, d, e);
    f = parseInt(b[4], 10), g = parseInt(b[5], 10), h = typeof b[6] != "undefined" && b[6] !== "" ? parseInt(b[6], 10) : 0, typeof b[7] != "undefined" && b[7] !== "" ? i = Math.round(1e3 * parseFloat("0." + b[7])) : i = 0;
    if (typeof b[8] != "undefined" && b[8] !== "" || typeof b[9] != "undefined" && b[9] !== "") {
        var j;
        return typeof b[9] != "undefined" && b[9] !== "" ? (j = parseInt(b[10], 10) * 36e5, typeof b[11] != "undefined" && b[11] !== "" && (j += parseInt(b[11], 10) * 6e4), b[9] == "-" && (j = -j)) : j = 0, new Date(Date.UTC(c, d, e, f, g, h, i) - j)
    }
    return new Date(c, d, e, f, g, h, i)
}, $(function () {
    if ($(".repohead").length == 0) return;
    var a = $("#repo_details"),
        b = GitHub.hasAdminAccess,
        c = GitHub.watchingRepo,
        d = GitHub.hasForked,
        e = $("#repository_description"),
        f = $("#repository_homepage"),
        g = $("#repo_details_loader");
    if ($(".js-edit-details").length) {
        var h = $(".repo-desc-homepage"),
            i = $(".edit-repo-desc-homepage"),
            j = i.find(".error");
        $(".repo-desc-homepage").delegate(".js-edit-details", "click", function (a) {
            a.preventDefault(), h.hide(), i.show(), i.find(".description-field").focus()
        }), i.find(".cancel a").click(function (a) {
            a.preventDefault(), h.show(), i.hide()
        }), $("#js-update-repo-meta-form").submit(function (a) {
            a.preventDefault();
            var b = $(this);
            j.hide(), g.show(), i.css({
                opacity: .5
            }), $.ajax({
                url: b.attr("action"),
                type: "put",
                data: b.serialize(),
                success: function (a) {
                    i.hide(), h.html(a).show(), g.hide(), i.css({
                        opacity: 1
                    })
                },
                error: function () {
                    j.show(), g.hide(), i.css({
                        opacity: 1
                    })
                }
            })
        })
    }
    b && ($(".editable-only").show(), $(".for-owner").show()), $("#repo_details").length && $(".pagehead ul.tabs").addClass("with-details-box"), $(document.body).hasClass("logged_in") || ($(".watch-button").enticeToAction(), $(".fork-button").enticeToAction())
}), $(function () {
    $(".url-box").each(function () {
        var a = $(this),
            b = a.find("ul.clone-urls a"),
            c = a.find(".url-field"),
            d = a.find(".url-description strong"),
            e = a.find(".clippy-text");
        b.click(function () {
            var b = $(this);
            return c.val(b.attr("href")), e.text(b.attr("href")), d.text(b.attr("data-permissions")), a.find("ul.clone-urls li.selected").removeClass("selected"), b.parent("li").addClass("selected"), !1
        }), $(b[0]).click(), c.mouseup(function () {
            this.select()
        })
    })
}), function () {
    var a = function (a, b) {
            return function () {
                return a.apply(b, arguments)
            }
        };
    GitHub.DetailsBehavior = function () {
        function b() {
            this.onToggle = a(this.onToggle, this), this.onClick = a(this.onClick, this), $(document).delegate(".js-details-container .js-details-target", "click", this.onClick), $(document).delegate(".js-details-container", "toggle.details", this.onToggle)
        }
        return b.prototype.onClick = function (a) {
            return $(a.target).trigger("toggle.details")
        }, b.prototype.onToggle = function (a) {
            return this.toggle(a.currentTarget)
        }, b.prototype.toggle = function (a) {
            return $(a).toggleClass("open")
        }, b
    }(), new GitHub.DetailsBehavior
}.call(this), GitHub.Uploader = {
    hasFlash: !1,
    hasFileAPI: !1,
    fallbackEnabled: !0,
    fallbackFileSaved: !1,
    uploadForm: null,
    defaultRow: null,
    files: {},
    init: function () {
        this.uploadForm = $("#upload_form"), this.defaultRow = this.uploadForm.find("tr.default"), this.uploadForm.submit(GitHub.Uploader.uploadFormSubmitted), GitHub.Uploader.Flash.init(), GitHub.Uploader.File.init()
    },
    disableFallback: function () {
        if (!this.fallbackEnabled) return;
        this.defaultRow.addClass("fallback-disabled"), this.defaultRow.find("input[type=text]").attr("disabled", "disabled"), this.defaultRow.find("button").attr("disabled", "disabled"), this.fallbackEnabled = !1
    },
    uploadFormSubmitted: function () {
        var a = GitHub.Uploader;
        if (a.fallbackEnabled) {
            if (a.fallbackFileSaved) return !0;
            var b = a.uploadForm.find(".html-file-field").val();
            b = b.replace("C:\\fakepath\\", "");
            if (b == "") return !1;
            var c = "application/octet-stream";
            typeof FileList != "undefined" && (c = a.uploadForm.find("input[type=file]")[0].files[0].type);
            var d = new GitHub.UploadFile({
                name: b,
                size: 1,
                type: c,
                row: a.defaultRow
            });
            return a.saveFile(d), !1
        }
        return !1
    },
    addFileRow: function (a) {
        var b = this.uploadForm.find("tr.template"),
            c = b.clone().css("display", "").addClass("filechosen").removeClass("template");
        a.row = c, this.files[a.id] = a, a.row.find(".js-waiting").hide(), a.row.find(".js-filename").text(a.name.substr(0, 12)).attr("title", a.escapedName).tipsy(), a.row.find(".js-filesize").text(Math.round(a.size / 1048576 * 10) / 10 + "MB"), a.row.find(".js-start-upload").click(function () {
            return a.row.hasClass("error") ? !1 : (GitHub.Uploader.saveFile(a), !1)
        }), this.defaultRow.before(c)
    },
    showUploadStarted: function (a) {
        a.row.find(".js-label").text("Uploadingâ€¦0%")
    },
    showProgress: function (a, b) {
        a.row.find(".description label").text("Upload in progressâ€¦ " + b + "%")
    },
    showSuccess: function (a) {
        a.row.addClass("succeeded"), a.row.find(".js-label").text("Upload complete!"), a.row.find("button").remove(), $.get(document.location.href, function (a) {
            $(".nodownloads").fadeOut(), $("#uploaded_downloads").hide().html(a).fadeIn()
        })
    },
    saveFile: function (a) {
        a.row.addClass("uploading"), a.row.find(".js-label").text("Preparing upload"), a.row.find(".js-description").attr("disabled", "disabled"), a.row.find("button").attr("disabled", "disabled").find("span").text("Uploadingâ€¦"), this.uploadForm.find(".js-not-waiting").hide(), this.uploadForm.find(".js-waiting").show();
        var b = this.uploadForm.attr("prepare_action");
        $.ajax({
            type: "POST",
            url: b,
            data: {
                file_size: a.size,
                file_name: a.name,
                content_type: a.type,
                description: a.row.find(".js-description").val(),
                redirect: this.fallbackEnabled
            },
            datatype: "json",
            success: function (b) {
                GitHub.Uploader.fileSaveSucceeded(a, b)
            },
            error: function (b, c, d) {
                b.status == 422 ? GitHub.Uploader.fileSaveFailed(a, b.responseText) : GitHub.Uploader.fileSaveFailed(a)
            },
            complete: function (a, b) {
                GitHub.Uploader.uploadForm.find(".js-not-waiting").show(), GitHub.Uploader.uploadForm.find(".js-waiting").hide()
            }
        })
    },
    fileSaveSucceeded: function (a, b) {
        a.params.key = b.path, a.params.acl = b.acl, a.params.Filename = a.name, a.params.policy = b.policy, a.params.AWSAccessKeyId = b.accesskeyid, a.params.signature = b.signature, a.params["Content-Type"] = b.mime_type, a.uploader == "flash" && (a.params.success_action_status = "201", GitHub.Uploader.Flash.upload(a)), this.fallbackEnabled && (a.params.redirect = b.redirect, this.fallbackFileSaved = !0, $("#s3_redirect").val(a.params.redirect), $("#s3_key").val(a.params.key), $("#s3_acl").val(a.params.acl), $("#s3_filename").val(a.params.Filename), $("#s3_policy").val(a.params.policy), $("#s3_accesskeyid").val(a.params.AWSAccessKeyId), $("#s3_signature").val(a.params.signature), $("#s3_mime_type").val(a.params["Content-Type"]), this.uploadForm.submit())
    },
    fileSaveFailed: function (a, b) {
        b == null && (b = "Something went wrong that shouldn't have. Please try again or contact support if the problem persists."), a.row.addClass("error"), a.row.find(".js-label").text(b), a.row.find("button").attr("disabled", "").addClass("danger").find("span").text("Remove"), a.row.find("button").click(function (b) {
            return a.row.remove(), !1
        })
    }
}, GitHub.UploadFile = function (a) {
    this.id = a.id, this.name = a.name, this.escapedName = $("<div>").text(a.name).html(), this.row = a.row, this.size = a.size, this.type = a.type, this.uploader = a.uploader, this.params = {}
}, GitHub.Uploader.Flash = {
    swfupload: null,
    init: function () {
        if (typeof SWFUpload == "undefined") return !1;
        this.swfupload = new SWFUpload({
            upload_url: GitHub.Uploader.uploadForm.attr("action"),
            file_post_name: "file",
            flash_url: "/flash/swfupload.swf",
            button_cursor: SWFUpload.CURSOR.HAND,
            button_window_mode: SWFUpload.WINDOW_MODE.TRANSPARENT,
            button_placeholder_id: "flash_choose_file_btn",
            swfupload_loaded_handler: this.flashLoaded,
            file_queued_handler: this.fileQueued,
            upload_start_handler: this.uploadStarted,
            upload_progress_handler: this.uploadProgress,
            upload_error_handler: this.uploadFailure,
            upload_success_handler: this.uploadSuccess
        })
    },
    upload: function (a) {
        this.swfupload.setPostParams(a.params), this.swfupload.startUpload(a.id)
    },
    flashLoaded: function () {
        GitHub.Uploader.hasFlash = !0, GitHub.Uploader.disableFallback(), GitHub.Uploader.uploadForm.addClass("swfupload-ready")
    },
    fileQueued: function (a) {
        var b = new GitHub.UploadFile({
            id: a.id,
            name: a.name,
            size: a.size,
            type: a.type,
            uploader: "flash"
        });
        GitHub.Uploader.addFileRow(b)
    },
    uploadStarted: function (a) {
        var b = GitHub.Uploader.files[a.id];
        GitHub.Uploader.showUploadStarted(b)
    },
    uploadProgress: function (a, b, c) {
        var d = GitHub.Uploader.files[a.id],
            e = Math.round(b / c * 100);
        GitHub.Uploader.showProgress(d, e)
    },
    uploadSuccess: function (a, b, c) {
        var d = GitHub.Uploader.files[a.id];
        GitHub.Uploader.showSuccess(d)
    },
    uploadFailure: function (a, b, c) {
        var d = GitHub.Uploader.files[a.id];
        GitHub.Uploader.fileSaveFailed(d, null)
    }
}, GitHub.Uploader.File = {
    init: function () {
        if (typeof DataTransfer == "undefined") return !1;
        if (!("files" in DataTransfer.prototype)) return !1;
        if (!Modernizr.draganddrop) return !1;
        GitHub.Uploader.hasFileAPI = !0
    }
}, $(function () {
    GitHub.Uploader.init(), $(".page-downloads .manage-button").live("click", function () {
        return $("#manual_downloads").toggleClass("managing"), !1
    })
}), $(function () {
    $(".pagehead .nspr .btn-pull-request").click(function () {
        return GitHub.metric("Hit Pull Request Button", {
            "Pull Request Type": "New School",
            Action: GitHub.currentAction,
            "Ref Type": GitHub.revType
        }), !0
    }), $(".test_hook").click(function () {
        var a = $(this),
            b = a.prev(".test_hook_message");
        b.text("Sending payload...");
        var c = a.attr("href");
        return $.post(c, {
            name: a.attr("rel") || ""
        }, function () {
            b.text("Payload deployed")
        }), !1
    }), $(".add_postreceive_url").click(function () {
        var a = $(this).prev("dl.form").clone();
        return console.log(a), a.find("input").val(""), $(this).before(a), !1
    }), $(".remove_postreceive_url").live("click", function () {
        return $(this).closest(".fields").find("dl.form").length < 2 ? (alert("You cannot remove the last post-receive URL"), !1) : ($(this).closest("dl.form").remove(), !1)
    }), $(".unlock_branch").click(function () {
        var a = location.pathname.split("/"),
            b = "/" + a[1] + "/" + a[2] + "/unlock_branch/" + a[4],
            c = $(this).parents(".notification");
        $(this).spin().remove();
        var d = this;
        return $.post(b, function () {
            c.hide()
        }), !1
    });
    if ($("#edit_repo").length > 0) {
        var a = $("#change_default_branch"),
            b = a.find("select"),
            c = b.val();
        b.change(function () {
            a.removeClass("success").removeClass("error").addClass("loading"), $.put(a.closest("form").attr("action"), {
                field: "repository_master_branch",
                value: b.val()
            }, {
                success: function () {
                    a.removeClass("loading").addClass("success"), c = b.val()
                },
                error: function () {
                    b.val(c), a.removeClass("loading").addClass("error")
                }
            })
        }), $(".addon.feature").each(function () {
            var a = $(this);
            a.find(":checkbox").change(function () {
                var b = this;
                a.removeClass("success").removeClass("error").addClass("loading"), $.put(a.closest("form").attr("action"), {
                    field: b.name,
                    value: b.checked ? 1 : 0
                }, {
                    success: function () {
                        a.removeClass("loading").addClass("success")
                    },
                    error: function () {
                        b.checked = !b.checked, a.removeClass("loading").addClass("error")
                    }
                })
            })
        }), $("#pages_toggle :checkbox").change(function () {
            $.facebox({
                div: "#pages_box"
            }), this.checked = !this.checked
        }), $("#autoresponse_toggle :checkbox").change(function () {
            if (!this.checked) {
                var a = $(this).closest(".addon");
                a.removeClass("success").removeClass("error").addClass("loading"), $.put(window.location.pathname.replace("edit", "update_pull_request_auto_response"), {
                    success: function () {
                        a.removeClass("loading").addClass("success"), a.find(".editlink").remove()
                    }
                });
                return
            }
            $.facebox({
                div: "#auto_response_editor"
            }), this.checked = !this.checked
        });
        var d = function () {
                debug("Setting data.completed to %s", $(this).val()), $(this).data("completed", $(this).val())
            };
        $("#push_pull_collabs input.ac-add-user-input").userAutocomplete().result(d), $("#push_pull_collabs form").submit(function () {
            var a = $(this).find(":text"),
                b = a.val();
            debug("Trying to add %s...", b);
            if (!b || !a.data("completed")) return !1;
            var c = function (a) {
                    a != null ? $("#push_pull_collabs .error").text(a).show() : $("#push_pull_collabs .error").hide()
                };
            return c(), $.ajax({
                url: this.action,
                data: {
                    member: b
                },
                type: "POST",
                dataType: "json",
                success: function (b) {
                    a.val("").removeClass("ac-accept"), b.error ? c(b.error) : $("#push_pull_collabs ul.usernames").append(b.html)
                },
                error: function () {
                    c("An unidentfied error occurred, try again?")
                }
            }), !1
        }), $("#push_pull_collabs .remove-user").live("click", function () {
            return $.del(this.href), $(this).closest("li").remove(), !1
        }), $("#teams form").submit(function () {
            var a = $(this).find("select"),
                b = a.val(),
                c = function (a) {
                    a != null ? $("#push_pull_collabs .error").text(a).show() : $("#push_pull_collabs .error").hide()
                };
            return b == "" ? (c("You must select a team"), !1) : (c(), $.ajax({
                url: this.action,
                data: {
                    team: b
                },
                type: "POST",
                dataType: "json",
                success: function (b) {
                    a.val(""), b.error ? c(b.error) : $("#teams ul.teams").append(b.html)
                },
                error: function () {
                    c("An unidentfied error occurred, try again?")
                }
            }), !1)
        }), $("#teams .remove-team").live("click", function () {
            return $.del(this.href), $(this).closest("li").remove(), !1
        }), $(".repohead").is(".vis-public") ? $(".private-only").hide() : $(".public-only").hide(), $("#custom_tabs .remove-tab").live("click", function () {
            return $.del(this.href), $(this).closest("li").remove(), !1
        });
        var e = $("#toggle_visibility");
        e.find("input[type=radio]").change(function (a) {
            if ($(this).attr("value") == "public") return a.preventDefault(), $("input[value=private]").attr("checked", "checked"), $.facebox({
                div: "#gopublic_confirm"
            }), $("#facebox .gopublic_button").click(function () {
                var a = $("#toggle_visibility input[value=public]");
                a.attr("checked", "checked"), f(a), $.facebox.close()
            }), $("#facebox .footer").hide(), !1;
            if ($(this).attr("value") == "private") {
                if (!confirm("Are you POSITIVE you want to make this public repository private?  All public watchers will be removed.")) return $("input[value=public]").attr("checked", "checked"), !1;
                f($(this))
            }
        });
        var f = function (a) {
                var b = $("#toggle_visibility");
                b.removeClass("success").removeClass("error").addClass("loading"), $.ajax({
                    type: "POST",
                    url: b.closest("form").attr("action"),
                    success: function () {
                        $(".repohead").is(".vis-public") ? ($(".repohead").removeClass("vis-public").addClass("vis-private"), $(".private-only").show(), $(".public-only").hide()) : ($(".repohead").removeClass("vis-private").addClass("vis-public"), $(".private-only").hide(), $(".public-only").show()), b.removeClass("loading").addClass("success")
                    },
                    error: function () {
                        a.checked = !1, b.removeClass("loading").addClass("error")
                    }
                })
            };
        $("#copy_permissions ul li a").click(function () {
            return $(this).parents("form").submit(), !1
        }), $("#delete_repo").click(function () {
            var a = "Are you sure you want to delete this repository?  There is no going back.";
            return confirm(a)
        }), $("#reveal_delete_repo_info").click(function () {
            return $(this).toggle(), $("#delete_repo_info").toggle(), !1
        }), $(document).bind("reveal.facebox", function () {
            $("#facebox .renaming_to_field").val($("#rename_field").val()), $("#facebox .transfer_to_field").val($("#transfer_field").val())
        })
    }
}), function () {
    $(function () {
        var a;
        a = $(".js-enterprise-notice-dismiss");
        if (!a[0]) return;
        return a.click(function () {
            return $.ajax({
                type: "POST",
                url: a.attr("href"),
                dataType: "json",
                success: function (b) {
                    return a.closest("div").fadeOut()
                },
                error: function (a) {
                    return alert("Failed to dismiss license expiration notice. Sorry!")
                }
            }), !1
        })
    })
}.call(this), $(function () {
    if (!$.support.pjax) return;
    $(".trending-repositories .times a").live("click", function (a) {
        $(".trending-repositories .ranked-repositories").fadeTo(200, .5), $(".trending-repositories .trending-heading").contextLoader(28), a.preventDefault()
    }).pjax(".trending-repositories", {
        data: {
            trending: !0
        },
        timeout: null,
        error: function (a, b) {
            $(".trending-repositories .context-loader").remove(), $(".trending-repositories .ranked-repositories").fadeTo(0, 1), $(".trending-repositories ol").empty().append("<li>Something went wrong: " + b + "</li>")
        }
    })
}), $(function () {
    var a = $(".community .bigcount"),
        b = function () {
            var b = a.width() + parseInt(a.css("padding-left")) + parseInt(a.css("padding-right"));
            a.css("margin-left", "-" + b / 2 + "px"), a.fadeIn()
        };
    a.length > 0 && setTimeout(b, 500);
    var c = $(".js-slidy-highlight");
    if (c.length > 0) {
        var d = c.find("li.highlight"),
            e = d.width() / 2;
        e += -1;
        var f = function (a) {
                var b = a.closest("li"),
                    c = b.position(),
                    d = c.left + b.width() / 2 - e;
                return d += parseInt(b.css("margin-left")), d
            };
        c.bind("tabChanged", function (a, b) {
            var c = f(b.link);
            d.animate({
                left: c
            }, 300)
        });
        var g = f(c.find(".selected"));
        d.css({
            left: g
        })
    }
}), GitHub.FileEditForkPoller = function (a, b) {
    var c = $(b || document).find(".check-for-fork");
    if (c.length == 0) return;
    var d = $(b || document).find("#submit-file");
    d.attr("disabled", "disabled"), c.show();
    var e = c.data("check-url");
    $.smartPoller(a || 2e3, function (a) {
        $.ajax({
            url: e,
            error: function (b, d, e) {
                b.status == 404 ? a() : c.html('<img src="/images/modules/ajax/error.png"> Something went wrong. Please fork the project, then edit this file.')
            },
            success: function (a, b, e) {
                c.hide(), d.removeAttr("disabled")
            }
        })
    })
}, $(function () {
    GitHub.FileEditForkPoller()
}), $(function () {
    function b() {
        var a = $("#forkqueue .untested").length,
            c = $("#head-sha").text();
        if (a > 0) {
            var d = $("#forkqueue .untested:first"),
                e = d.attr("name");
            $(".icons", d).html('<img src="/images/modules/ajax/indicator.gif" alt="Processing" />'), $.get("forkqueue/applies/" + c + "/" + e, function (a) {
                d.removeClass("untested"), a == "NOPE" ? (d.addClass("unclean"), $(".icons", d).html("")) : a == "YUP" ? (d.addClass("clean"), $(".icons", d).html("")) : $(".icons", d).html("err"), b()
            })
        }
    }
    function d() {
        var a = $("table#queue tr.not-applied").length,
            b = $("#head-sha").text();
        if (a > 0) {
            var c = $("#total-commits").text();
            $("#current-commit").text(c - a + 1);
            var e = $("table#queue tr.not-applied:first"),
                f = e.attr("name");
            $(".date", e).html("applying"), $(".icons", e).html('<img src="/images/modules/ajax/indicator.gif" alt="Processing" />'), $.post("patch/" + b + "/" + f, function (a) {
                e.removeClass("not-applied"), a == "NOPE" ? (e.addClass("unclean_failure"), $(".date", e).html("failed"), $(".icons", e).html('<img src="/images/icons/exclamation.png" alt="Failed" />')) : ($("#head-sha").text(a), e.addClass("clean"), $(".date", e).html("applied"), $(".apply-status", e).attr("value", "1"), $(".icons", e).html('<img src="/images/modules/dashboard/news/commit.png" alt="Applied" />')), d()
            })
        } else $("#new-head-sha").attr("value", b), $("#finalize").show()
    }
    var a = $("#forkqueue #head-sha").text();
    $("#forkqueue .untested:first").each(function () {
        b()
    }), $(".action-choice").change(function (a) {
        var b = $(this).attr("value");
        if (b == "ignore") {
            var c = $(this).parents("form"),
                d = c.find("tr:not(:first)"),
                e = c.find("input:checked");
            e.each(function (a, b) {
                var c = $(b).attr("ref");
                $(b).parents("tr").children(".icons").html("ignoring..."), $.post("forkqueue/ignore/" + c, {})
            });
            var f = d.length == e.length ? c : e.parents("tr");
            f.fadeOut("normal", function () {
                $(this).remove()
            })
        } else if (b == "apply") {
            var c = $(this).parents("form");
            c.submit()
        }
        $(this).children(".default").attr("selected", 1)
    });
    var c = [];
    $("#forkqueue input[type=checkbox]").click(function (a) {
        var b = $(this).attr("class").match(/^r-(\d+)-(\d+)$/),
            d = parseInt(b[1]),
            e = parseInt(b[2]);
        if (a.shiftKey && c.length > 0) {
            var f = c[c.length - 1],
                g = f.match(/^r-(\d+)-(\d+)$/),
                h = parseInt(g[1]),
                i = parseInt(g[2]);
            if (d == h) {
                var j = $(this).attr("checked") == 1,
                    k = [e, i].sort(),
                    l = k[0],
                    m = k[1];
                for (var n = l; n < m; n++) j == 1 ? $("#forkqueue input.r-" + d + "-" + n).attr("checked", "true") : $("#forkqueue input.r-" + d + "-" + n).removeAttr("checked")
            }
        }
        c.push($(this).attr("class"))
    }), $("#forkqueue a.select_all").click(function () {
        $(this).removeClass("select_all");
        var a = $(this).attr("class");
        return $(this).addClass("select_all"), $("#forkqueue tr." + a + " input[type=checkbox]").attr("checked", "true"), c = [], !1
    }), $("#forkqueue a.select_none").click(function () {
        $(this).removeClass("select_none");
        var a = $(this).attr("class");
        return $(this).addClass("select_none"), $("#forkqueue tr." + a + " input[type=checkbox]").removeAttr("checked"), c = [], !1
    }), $("table#queue tr.not-applied:first").each(function () {
        d()
    }), $("#change-branch").click(function () {
        return $("#int-info").hide(), $("#int-change").show(), !1
    }), $("#change-branch-nevermind").click(function () {
        return $("#int-change").hide(), $("#int-info").show(), !1
    }), $(".js-fq-new-version").each(function () {
        var a = $("#fq-repo").text();
        console.log("repo:", a);
        var b = $(this).hasClass("reload");
        $.smartPoller(function (c) {
            $.getJSON("/cache/network_current/" + a, function (a) {
                a && a.current ? (b && window.location.reload(!0), $(".js-fq-polling").hide(), $(".js-fq-new-version").show()) : c()
            })
        })
    })
}), $(function () {
    if ($(".business .logos").length > 0) {
        var a = [
            ["Shopify", "shopify.png", "http://shopify.com/"],
            ["CustomInk", "customink.png", "http://customink.com/"],
            ["Pivotal Labs", "pivotallabs.png", "http://pivotallabs.com/"],
            ["FiveRuns", "fiveruns.png", "http://fiveruns.com/"],
            ["PeepCode", "peepcode.png", "http://peepcode.com/"],
            ["Frogmetrics", "frogmetrics.png", "http://frogmetrics.com/"],
            ["Upstream", "upstream.png", "http://upstream-berlin.com/"],
            ["Terralien", "terralien.png", "http://terralien.com/"],
            ["Planet Argon", "planetargon.png", "http://planetargon.com/"],
            ["Tightrope Media Systems", "tightropemediasystems.png", "http://trms.com/"],
            ["Rubaidh", "rubaidh.png", "http://rubaidh.com/"],
            ["Iterative Design", "iterativedesigns.png", "http://iterativedesigns.com/"],
            ["GiraffeSoft", "giraffesoft.png", "http://giraffesoft.com/"],
            ["Evil Martians", "evilmartians.png", "http://evilmartians.com/"],
            ["Crimson Jet", "crimsonjet.png", "http://crimsonjet.com/"],
            ["Alonetone", "alonetone.png", "http://alonetone.com/"],
            ["EntryWay", "entryway.png", "http://entryway.net/"],
            ["Fingertips", "fingertips.png", "http://fngtps.com/"],
            ["Run Code Run", "runcoderun.png", "http://runcoderun.com/"],
            ["Be a Magpie", "beamagpie.png", "http://be-a-magpie.com/"],
            ["Rocket Rentals", "rocketrentals.png", "http://rocket-rentals.de/"],
            ["Connected Flow", "connectedflow.png", "http://connectedflow.com/"],
            ["Dwellicious", "dwellicious.png", "http://dwellicious.com/"],
            ["Assay Depot", "assaydepot.png", "http://www.assaydepot.com/"],
            ["Centro", "centro.png", "http://www.centro.net/"],
            ["Debuggable Ltd.", "debuggable.png", "http://debuggable.com/"],
            ["Blogage.de", "blogage.png", "http://blogage.de/"],
            ["ThoughtBot", "thoughtbot.png", "http://www.thoughtbot.com/"],
            ["Viget Labs", "vigetlabs.png", "http://www.viget.com/"],
            ["RateMyArea", "ratemyarea.png", "http://www.ratemyarea.com/"],
            ["Abloom", "abloom.png", "http://abloom.at/"],
            ["LinkingPaths", "linkingpaths.png", "http://www.linkingpaths.com/"],
            ["MIKAMAI", "mikamai.png", "http://mikamai.com/"],
            ["BEKK", "bekk.png", "http://www.bekk.no/"],
            ["Reductive Labs", "reductivelabs.png", "http://www.reductivelabs.com/"],
            ["Sexbyfood", "sexbyfood.png", "http://www.sexbyfood.com/"],
            ["Factorial, LLC", "yfactorial.png", "http://yfactorial.com/"],
            ["SnapMyLife", "snapmylife.png", "http://www.snapmylife.com/"],
            ["Scrumy", "scrumy.png", "http://scrumy.com/"],
            ["TinyMassive", "tinymassive.png", "http://www.tinymassive.com/"],
            ["SOCIALTEXT", "socialtext.png", "http://www.socialtext.com/"],
            ["All-Seeing Interactive", "allseeinginteractive.png", "http://allseeing-i.com/"],
            ["Howcast", "howcast.png", "http://www.howcast.com/"],
            ["Relevance Inc", "relevance.png", "http://thinkrelevance.com/"],
            ["Nitobi Software Inc", "nitobi.png", "http://www.nitobi.com/"],
            ["99designs", "99designs.png", "http://99designs.com/"],
            ["EdgeCase, LLC", "edgecase.png", "http://edgecase.com"],
            ["Plinky", "plinky.png", "http://www.plinky.com/"],
            ["One Design Company", "onedesigncompany.png", "http://onedesigncompany.com/"],
            ["CollectiveIdea", "collectiveidea.png", "http://collectiveidea.com/"],
            ["Stateful Labs", "statefullabs.png", "http://stateful.net/"],
            ["High Groove Studios", "highgroove.png", "http://highgroove.com/"],
            ["Exceptional", "exceptional.png", "http://www.getexceptional.com/"],
            ["DealBase", "dealbase.png", "http://www.dealbase.com/"],
            ["Silver Needle", "silverneedle.png", "http://silverneedlesoft.com/"],
            ["No Kahuna", "nokahuna.png", "http://nokahuna.com/"],
            ["Double Encore", "doubleencore.png", "http://www.doubleencore.com/"],
            ["Yahoo", "yahoo.gif", "http://yahoo.com/"],
            ["EMI Group Limited", "emi.png", "http://emi.com/"],
            ["TechCrunch", "techcrunch.png", "http://techcrunch.com/"],
            ["WePlay", "weplay.png", "http://weplay.com/"]
        ],
            b = function () {
                var b = $(".business .logos table");
                $.each(a, function (a, c) {
                    b.append('<tr><td><a href="' + c[2] + '" rel="nofollow"><img src="http://assets' + a % 4 + ".github.com/images/modules/home/customers/" + c[1] + '" alt="' + c[0] + '" /></a></td></tr>')
                });
                var c = parseInt($(".business .slide").css("top")),
                    d = $(".business .logos td").length - 4,
                    e = 0,
                    f = function () {
                        e += 1;
                        var a = parseInt($(".business .slide").css("top"));
                        Math.abs(a + d * 75) < 25 ? ($(".business .slide").css("top", 0), e = 0) : $(".business .slide").animate({
                            top: "-" + e * 75 + "px"
                        }, 1500)
                    };
                setInterval(f, 3e3)
            };
        setTimeout(b, 1e3)
    }
}), $(function () {
    var a = {
        success: function () {
            $.smartPoller(3e3, function (a) {
                $.getJSON($("#new_import").attr("action") + "/grab_authors", {}, function (b) {
                    if (b == 0) return a();
                    b.length == 0 ? ($("#new_import input[type=submit]").attr("disabled", "").val("Import SVN Authors").show(), alert("No authors were returned, please try a different URL")) : ($.each(b, function (a, b) {
                        var c = $('<tr><td><input type="text" readonly="readonly" value="' + b + '" name="svn_authors[]" /></td><td><input type="text" class="git_author" name="git_authors[]"/></td></tr>');
                        c.appendTo("#authors-list")
                    }), $("#import-submit").show()), $("#wait").slideUp(), $("#import_repo").show(), $("#author_entry").slideDown()
                })
            })
        },
        beforeSubmit: function (a, b) {
            var c = $("#svn_url").val();
            if (!c.match(/^https?:\/\//) && !c.match(/^svn:\/\//)) return alert("Please enter a valid subversion url"), !1;
            b.find("input[type=submit]").hide(), $("#authors").slideDown()
        }
    };
    $("#new_import").ajaxForm(a), $("#import-submit").click(function () {
        $(this).attr("disabled", "disabled");
        var a = !1,
            b = $("#authors-list input.git_author[value=]").size(),
            c = $("#authors-list input.git_author").size() - b;
        b > 0 && c > 0 && (alert("You must either fill in all author names or none."), a = !0), $("#authors-list input.git_author").each(function () {
            var b = $(this).val();
            !a && b != "" && !/^[^<]+<[^>]+>$/.test(b) && (alert("'" + b + "' is not a valid git author.  Authors must match the format 'User Name <user@domain>'"), a = !0)
        });
        if (a) return $("#import-submit").attr("disabled", ""), !1;
        $("form#new_repository").submit()
    })
}), $(function () {
    $(".cancel-compose").click(function () {
        return window.location = "/inbox", !1
    }), $("#inbox .del a").click(function () {
        var a = $(this),
            b = a.parents(".item"),
            c = b.attr("data-type") == "message" ? "inbox" : "notification",
            d = ".js-" + c + "-count";
        return a.find("img").attr("src", GitHub.Ajax.spinner), $.ajax({
            type: "DELETE",
            url: a.attr("rel"),
            error: function () {
                a.find("img").attr("src", GitHub.Ajax.error)
            },
            success: function () {
                if (b.is(".unread")) {
                    var a = parseInt($(d + ":first").text());
                    a > 0 && $(d).text(a -= 1), a == 0 && $(d).each(function () {
                        var a = $(this);
                        a.is(".new") ? a.removeClass("new") : a.parent().is(".new") && a.parent().removeClass("new")
                    })
                }
                b.remove()
            }
        }), !1
    }), $("#reveal_deleted").click(function () {
        return $(this).parent().hide(), $(".hidden_message").show(), !1
    })
}), $(function () {
    Modernizr.canvas && $("#impact_graph").length > 0 && GitHub.ImpactGraph.drawImpactGraph()
}), GitHub.ImpactGraph = {
    colors: null,
    data: null,
    chunkVerticalSpace: 2,
    initColors: function (a) {
        seedColors = [
            [222, 0, 0],
            [255, 141, 0],
            [255, 227, 0],
            [38, 198, 0],
            [0, 224, 226],
            [0, 33, 226],
            [218, 0, 226]
        ], this.colors = new Array;
        var b = 0;
        for (var c in a) {
            var d = seedColors[b % 7];
            b > 6 && (d = [this.randColorValue(d[0]), this.randColorValue(d[1]), this.randColorValue(d[2])]), this.colors.push(d), b += 1
        }
    },
    drawImpactGraph: function () {
        var a = {},
            b = $("#impact_graph").attr("rel"),
            c = this;
        $.smartPoller(function (d) {
            $.getJSON("/" + b + "/graphs/impact_data", function (b) {
                if (b && b.authors) {
                    c.initColors(b.authors);
                    var e = c.createCanvas(b);
                    b = c.padChunks(b), c.data = b, $.each(b.buckets, function (b, d) {
                        c.drawBucket(a, d, b)
                    }), c.drawAll(e, b, a), c.authorHint()
                } else d()
            })
        })
    },
    createCanvas: function (a) {
        var b = a.buckets.length * 50 * 2 - 50,
            c = 0,
            d, e;
        for (d = 0; d < a.buckets.length; d++) {
            var f = a.buckets[d],
                g = 0;
            for (e = 0; e < f.i.length; e++) {
                var h = f.i[e];
                g += this.normalizeImpact(h[1]) + this.chunkVerticalSpace
            }
            g > c && (c = g)
        }
        $("#impact_graph div").remove();
        var i = $("#impact_graph");
        i.height(c + 50).css("border", "1px solid #aaa"), $("#caption").show(), i.append('<canvas width="' + b + '" height="' + (c + 30) + '"></canvas>');
        var j = $("#impact_graph canvas")[0];
        return j.getContext("2d")
    },
    padChunks: function (a) {
        for (var b in a.authors) {
            var c = this.findFirst(b, a),
                d = this.findLast(b, a);
            for (var e = c + 1; e < d; e++) this.bucketHasAuthor(a.buckets[e], b) || a.buckets[e].i.push([b, 0])
        }
        return a
    },
    bucketHasAuthor: function (a, b) {
        for (var c = 0; c < a.i.length; c++) if (a.i[c][0] == parseInt(b)) return !0;
        return !1
    },
    findFirst: function (a, b) {
        for (var c = 0; c < b.buckets.length; c++) if (this.bucketHasAuthor(b.buckets[c], a)) return c
    },
    findLast: function (a, b) {
        for (var c = b.buckets.length - 1; c >= 0; c--) if (this.bucketHasAuthor(b.buckets[c], a)) return c
    },
    colorFor: function (a) {
        var b = this.colors[a];
        return "rgb(" + b[0] + "," + b[1] + "," + b[2] + ")"
    },
    randColorValue: function (a) {
        var b = Math.round(Math.random() * 100) - 50,
            c = a + b;
        return c > 255 && (c = 255), c < 0 && (c = 0), c
    },
    drawBucket: function (a, b, c) {
        var d = 0,
            e = this;
        $.each(b.i, function (b, f) {
            var g = f[0],
                h = e.normalizeImpact(f[1]);
            a[g] || (a[g] = new Array), a[g].push([c * 100, d, 50, h, f[1]]), d = d + h + e.chunkVerticalSpace
        })
    },
    normalizeImpact: function (a) {
        return a <= 9 ? a + 1 : a <= 5e3 ? Math.round(10 + a / 50) : Math.round(100 + Math.log(a) * 10)
    },
    drawAll: function (a, b, c) {
        this.drawStreams(a, c, null), this.drawDates(b)
    },
    drawStreams: function (a, b, c) {
        a.clearRect(0, 0, 1e4, 500), $(".activator").remove();
        for (var d in b) d != c && this.drawStream(d, b, a, !0);
        c != null && this.drawStream(c, b, a, !1)
    },
    drawStream: function (a, b, c, d) {
        c.fillStyle = this.colorFor(a), chunks = b[a];
        for (var e = 0; e < chunks.length; e++) {
            var f = chunks[e];
            c.fillRect(f[0], f[1], f[2], f[3]), d && this.placeActivator(a, b, c, f[0], f[1], f[2], f[3], f[4]), e != 0 && (c.beginPath(), c.moveTo(previousChunk[0] + 50, previousChunk[1]), c.bezierCurveTo(previousChunk[0] + 75, previousChunk[1], f[0] - 25, f[1], f[0], f[1]), c.lineTo(f[0], f[1] + f[3]), c.bezierCurveTo(f[0] - 25, f[1] + f[3], previousChunk[0] + 75, previousChunk[1] + previousChunk[3], previousChunk[0] + 50, previousChunk[1] + previousChunk[3]), c.fill()), previousChunk = f
        }
    },
    drawStats: function (a, b) {
        chunks = b[a];
        for (var c = 0; c < chunks.length; c++) {
            var d = chunks[c],
                e = d[4];
            e > 10 && this.drawStat(e, d[0], d[1] + d[3] / 2)
        }
    },
    drawStat: function (a, b, c) {
        var d = "";
        d += "position: absolute;", d += "left: " + b + "px;", d += "top: " + c + "px;", d += "width: 50px;", d += "text-align: center;", d += "color: #fff;", d += "font-size: 9px;", d += "z-index: 0;", $("#impact_graph").append('<p class="stat" style="' + d + '">' + a + "</p>")
    },
    drawDate: function (a, b, c) {
        c += 3;
        var d = "";
        d += "position: absolute;", d += "left: " + b + "px;", d += "top: " + c + "px;", d += "width: 50px;", d += "text-align: center;", d += "color: #888;", d += "font-size: 9px;", $("#impact_graph").append('<p style="' + d + '">' + a + "</p>")
    },
    placeActivator: function (a, b, c, d, e, f, g, h) {
        e += 5;
        var i = "";
        i += "position: absolute;", i += "left: " + d + "px;", i += "top: " + e + "px;", i += "width: " + f + "px;", i += "height: " + g + "px;", i += "z-index: 100;", i += "cursor: pointer;";
        var j = "a" + d + "-" + e;
        $("#impact_graph").append('<div class="activator" id="' + j + '" style="' + i + '">&nbsp;</div>');
        var k = this;
        $("#" + j).mouseover(function (b) {
            $(b.target).css("background-color", "black").css("opacity", "0.08"), k.drawAuthor(a)
        }).mouseout(function (a) {
            $(a.target).css("background-color", "transparent"), k.clearAuthor(), k.authorHint()
        }).mousedown(function () {
            $(".stat").remove(), k.clearAuthor(), k.drawStreams(c, b, a), k.drawStats(a, b), k.drawSelectedAuthor(a), k.authorHint()
        })
    },
    drawDates: function (a) {
        var b = this;
        $.each(a.buckets, function (a, c) {
            var d = 0;
            $.each(c.i, function (a, c) {
                d += b.normalizeImpact(c[1]) + 1
            });
            var e = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
                f = new Date;
            f.setTime(c.d * 1e3);
            var g = "" + f.getDate() + " " + e[f.getMonth()] + " " + f.getFullYear();
            b.drawDate(g, a * 100, d + 7)
        })
    },
    authorText: function (a, b, c) {
        var d = null;
        c < 25 ? d = "selected_author_text" : d = "author_text";
        var e = "";
        e += "position: absolute;", e += "left: " + b + "px;", e += "top: " + c + "px;", e += "width: 920px;", e += "color: #444;", e += "font-size: 18px;", $("#impact_legend").append('<p id="' + d + '" style="' + e + '">' + a + "</p>")
    },
    authorHint: function () {
        this.authorText('<span style="color: #aaa;">mouse over the graph for more details</span>', 0, 30)
    },
    drawAuthor: function (a) {
        this.clearAuthor();
        var b = $("#impact_legend canvas")[0].getContext("2d");
        b.fillStyle = this.colorFor(a), b.strokeStyle = "#888888", b.fillRect(0, 30, 20, 20), b.strokeRect(.5, 30.5, 19, 19);
        var c = this.data.authors[a].n;
        this.authorText(c + ' <span style="color: #aaa;">(click for more info)</span>', 25, 30)
    },
    drawSelectedAuthor: function (a) {
        this.clearSelectedAuthor();
        var b = $("#impact_legend canvas")[0].getContext("2d");
        b.fillStyle = this.colorFor(a), b.strokeStyle = "#000000", b.fillRect(0, 0, 20, 20), b.strokeRect(.5, .5, 19, 19);
        var c = this.data.authors[a],
            d = c.n,
            e = c.c,
            f = c.a,
            g = c.d;
        this.authorText(d + " (" + e + " commits, " + f + " additions, " + g + " deletions)", 25, 0)
    },
    clearAuthor: function () {
        var a = $("#impact_legend canvas")[0].getContext("2d");
        a.clearRect(0, 30, 920, 20), $("#author_text").remove()
    },
    clearSelectedAuthor: function () {
        var a = $("#impact_legend canvas")[0].getContext("2d");
        a.clearRect(0, 0, 920, 20), $("#selected_author_text").remove()
    }
}, GitHub.BaseBrowser = {
    pagingLimit: 99,
    showingClosed: !1,
    showingOpen: !0,
    showingRead: !0,
    activeSort: ["created", "desc"],
    currentPage: 1,
    initialized: !1,
    errored: !1,
    lastUrl: null,
    lastPage: 1,
    listings: $(),
    openListings: $(),
    closedListings: $(),
    unreadListings: $(),
    filteredListings: $(),
    activeIssue: $(),
    listingsElement: null,
    noneShownElement: null,
    errorElement: null,
    loaderElement: null,
    titleElement: null,
    footerElement: null,
    sortElements: null,
    pagingElement: null,
    init: function (a) {
        var b = this;
        this.wrapper = $(a);
        if (this.initialized) return alert("Only one IssueBrowser per page can exist");
        if (this.wrapper.length == 0) return !1;
        this.listingsElement = this.wrapper.find(".listings"), this.noneShownElement = this.wrapper.find(".none"), this.errorElement = this.wrapper.find(".error"), this.loaderElement = this.wrapper.find(".context-loader"), this.titleElement = this.wrapper.find("h2"), this.footerElement = this.wrapper.find(".footerbar-text"), this.pagingElement = this.wrapper.find(".paging"), $.hotkeys({
            j: function () {
                b.cursorDown()
            },
            k: function () {
                b.cursorUp()
            },
            o: function () {
                b.showIssue()
            },
            enter: function () {
                b.showIssue()
            }
        });
        var c = this.wrapper.find("ul.filters li");
        c.each(function () {
            var a = $(this);
            switch (a.attr("data-filter")) {
            case "open":
                b.showingOpen && a.addClass("selected"), a.click(function () {
                    a.toggleClass("selected"), b.showOpen(a.hasClass("selected"))
                });
                break;
            case "closed":
                b.showingClosed && a.addClass("selected"), a.click(function () {
                    a.toggleClass("selected"), b.showClosed(a.hasClass("selected"))
                });
                break;
            case "read":
                b.showingRead && a.addClass("selected"), a.click(function () {
                    a.toggleClass("selected"), b.showRead(a.hasClass("selected"))
                })
            }
        }), this.sortElements = this.wrapper.find("ul.sorts li");
        var d = null;
        this.sortElements.each(function () {
            var a = $(this);
            a.attr("data-sort") == b.activeSort[0] && (d = a.addClass(b.activeSort[1])), a.click(function () {
                var a = $(this);
                d && d.attr("data-sort") != a.attr("data-sort") && d.removeClass("asc").removeClass("desc"), a.hasClass("desc") ? (b.sortBy(a.attr("data-sort"), "asc"), a.removeClass("desc").addClass("asc")) : (b.sortBy(a.attr("data-sort"), "desc"), a.removeClass("asc").addClass("desc")), d = a
            })
        }), this.pagingElement.find(".button-pager").click(function () {
            return b.showMore(), !1
        }), this.setupMouseActions(), this.initNavigation(), this.initialized = !0;
        var e = this.listingsElement.find(".preloaded-content");
        e.length > 0 && (this.selectedLink = $(this.wrapper.find('a[href="' + e.attr("data-url") + '"]').get(0)), this.selectedLink.addClass("selected"), this.lastUrl = this.selectedLink.attr("href"), this.render(this.listingsElement.innerHTML))
    },
    setupMouseActions: function () {
        var a = this;
        this.listingsElement.delegate(".listing", "mouseover", function (b) {
            a.activeIssue.removeClass("active"), a.activeIssue = $(this).addClass("active")
        })
    },
    initNavigation: function () {
        var a = this;
        this.selectedLink = null, this.wrapper.find("ul.bignav a, ul.smallnav a").click(function (b) {
            var c = $(this);
            return b.which == 2 || b.metaKey ? !0 : (Modernizr.history && !c.hasClass("js-stateless") && window.history.replaceState(null, document.title, c.attr("href")), a.selectedLink && c.attr("href") == a.selectedLink.attr("href") && !a.errored ? !1 : (a.remoteUpdate(c.attr("href")), a.selectedLink && a.selectedLink.removeClass("selected"), a.selectedLink = $(this).addClass("selected"), !1))
        });
        var b = this.wrapper.find(".filterbox input"),
            c = this.wrapper.find("ul.smallnav"),
            d = c.find("li"),
            e = function () {
                d.show(), b.val() != "" && d.filter(":not(:Contains('" + b.val() + "'))").hide()
            },
            f = b.val();
        b.bind("keyup blur click", function () {
            if (this.value == f) return;
            f = this.value, e()
        })
    },
    getPulls: function (a, b) {
        var c = this;
        b == undefined && (b = {}), a != this.lastUrl && (this.currentPage = 1), this.startLoading(), $.ajax({
            url: a,
            data: b,
            success: function (d) {
                c.errored = !1, c.cancelLoading(), c.errorElement.hide(), c.lastPage == b["page"] || b["page"] == 1 || b["page"] == undefined ? c.render(d) : c.render(d, !0), c.lastUrl = a, b.page && (c.lastPage = b.page)
            },
            error: function () {
                c.errored = !0, c.showError()
            }
        })
    },
    startLoading: function () {
        this.listingsElement.fadeTo(200, .5), this.noneShownElement.is(":visible") && this.noneShownElement.fadeTo(200, .5), this.loaderElement.show()
    },
    cancelLoading: function () {
        this.listingsElement.fadeTo(200, 1), this.noneShownElement.is(":visible") && this.noneShownElement.fadeTo(200, 1), this.loaderElement.hide()
    },
    showError: function () {
        this.cancelLoading(), this.listings && this.listings.hide(), this.noneShownElement.hide(), this.errorElement.show()
    },
    render: function (a, b) {
        b == undefined && (b = !1), b ? this.listingsElement.append(a) : this.listingsElement.html(a), this.listings = this.listingsElement.find(".listing"), this.listings.trigger("pageUpdate"), this.currentPage == 1 && this.listings.length >= this.pagingLimit && (this.pagingElement.show(), $(this.listings[this.listings.length - 1]).remove(), this.listings = this.listingsElement.find(".listing"));
        if (b) {
            this.pagingElement.hide();
            var c = $("<div>").append(a).find(".listing");
            c > this.pagingLimit && (this.pagingElement.show(), $(this.listings[this.listings.length - 1]).remove(), this.listings = this.listingsElement.find(".listing"))
        }
        this.closedListings = this.listings.filter("[data-state=closed]"), this.openListings = this.listings.filter("[data-state=open]"), this.readListings = this.listings.filter("[data-read=1]"), this.setCounts(this.openListings.length, this.closedListings.length), this.update()
    },
    plural: function (a) {
        return a == 1 ? "request" : "requests"
    },
    setCounts: function (a, b) {
        var c = a + " open " + this.plural(a),
            d = a + " open " + this.plural(a) + " and " + b + " closed " + this.plural(b);
        this.titleElement.text(c), this.footerElement.text(d)
    },
    showOpen: function (a) {
        this.currentPage = 1, a ? this.showingOpen = !0 : this.showingOpen = !1, this.remoteUpdate()
    },
    showRead: function (a) {
        a ? this.showingRead = !0 : this.showingRead = !1, this.update()
    },
    showClosed: function (a) {
        this.currentPage = 1, a ? this.showingClosed = !0 : this.showingClosed = !1, this.remoteUpdate()
    },
    showMore: function () {
        return this.currentPage++, this.remoteUpdate(), !0
    },
    sortBy: function (a, b) {
        return this.activeSort = [a, b], this.currentPage = 1, this.remoteUpdate()
    },
    cursorToDefault: function () {
        this.activeIssue.removeClass("active"), this.activeIssue = $(this.listings.filter(":visible").get(0)).addClass("active"), this.adjustViewForCursor()
    },
    cursorUp: function () {
        var a = this.activeIssue.prev(".listing");
        while (!a.is(":visible") && a.length != 0) a = a.prev(".listing");
        if (a.length == 0) return;
        this.activeIssue.removeClass("active"), this.activeIssue = a.addClass("active"), this.adjustViewForCursor()
    },
    cursorDown: function () {
        var a = this.activeIssue.next(".listing");
        while (!a.is(":visible") && a.length != 0) a = a.next(".listing");
        if (a.length == 0) return;
        this.activeIssue.removeClass("active"), this.activeIssue = a.addClass("active"), this.adjustViewForCursor()
    },
    adjustViewForCursor: function () {
        var a = this.activeIssue;
        if (!a.offset()) return;
        a.offset().top - $(window).scrollTop() + 20 > $(window).height() ? a.scrollTo(10) : a.offset().top - $(window).scrollTop() < 0 && $("html,body").animate({
            scrollTop: a.offset().top - $(window).height()
        }, 200)
    },
    showIssue: function () {
        document.location = this.activeIssue.find("h3 a").attr("href")
    },
    update: function () {
        if (this.listings == null) return;
        this.listings.show(), this.showingClosed || this.closedListings.hide(), this.showingOpen || this.openListings.hide(), this.showingRead || this.readListings.hide(), this.filteredListings.hide();
        var a = this.listings.filter(":visible").length;
        a == 0 ? this.noneShownElement.show() : this.noneShownElement.hide(), this.cursorToDefault()
    },
    remoteUpdate: function (a) {
        a || (a = this.lastUrl);
        var b = {
            sort: this.activeSort[0],
            direction: this.activeSort[1],
            page: this.currentPage,
            exclude: ["none"]
        };
        if (!this.showingClosed || !this.showingOpen) this.showingOpen || b.exclude.push("open"), this.showingClosed || b.exclude.push("closed"), b.exclude = b.exclude.join(",");
        this.getPulls(a, b)
    }
}, GitHub.PullRequestBrowser = {}, jQuery.extend(!0, GitHub.PullRequestBrowser, GitHub.BaseBrowser), $(function () {
    $("#js-issue-list").length > 0 && GitHub.PullRequestBrowser.init("#js-issue-list")
}), $(function () {
    var a = $("#issues_next");
    if (a.length == 0) return;
    var b = function (a, b) {
            $.pjax({
                container: a,
                timeout: null,
                url: b
            })
        };
    $(".js-editable-labels-container .js-manage-labels").live("click", function () {
        var a = $(this),
            b = a.closest(".js-editable-labels-container"),
            c = b.find(".js-editable-labels-show"),
            d = b.find(".js-editable-labels-edit");
        return c.is(":visible") ? (c.hide(), d.show(), a.addClass("selected"), $(document).bind("keydown.manage-labels", function (b) {
            b.keyCode == 27 && a.click()
        })) : (d.hide(), c.show(), a.removeClass("selected"), $(document).unbind("keydown.manage-labels")), !1
    }), $(".js-custom-color-field a").live("click", function () {
        var a = $(this).closest(".js-custom-color-field");
        return a.find(".field").show(), !1
    }), $(".js-custom-color-field input[type=text]").live("keyup", function () {
        var a = $(this).closest(".js-custom-color-field"),
            b = $(this).val();
        b.length == 6 && (a.find(".field").find("input[type=radio]").val(b).attr("checked", "checked"), a.find("a").html("Custom color: <strong>#" + b + "</strong>"))
    }), $(".js-new-label-form .js-label-field").live("focus", function () {
        $(this).closest(".js-new-label-form").find(".js-color-chooser-fade-in").fadeIn(300)
    });
    var c = function () {
            var a = (new RegExp("page=([^&#]+)")).exec(window.location.search);
            return a ? parseInt(a[1]) : 1
        },
        d = a.find("#issues_list");
    if (d.length > 0) {
        var e = d.attr("data-params");
        e && !location.search && Modernizr.history && window.history.replaceState(null, document.title, location.pathname + "?" + e), d.pageUpdate(function () {
            var a = d.find(".js-filterable-milestones").milestoneSelector();
            a.unbind(".milestoneSelector"), a.bind("beforeAssignment.milestoneSelector", function () {
                var a = [];
                d.find(".issues :checked").each(function (b, c) {
                    a.push($(c).val())
                }), $(this).attr("data-issue-numbers", a.join(","))
            }), a.bind("afterAssignment.milestoneSelector", function () {
                b(d.selector, f({
                    preservePage: !0
                }))
            })
        }), d.trigger("pageUpdate"), d.bind("start.pjax", function (a) {
            d.find(".context-loader").show(), d.find(".issues").fadeTo(200, .5)
        }).bind("end.pjax", function (a) {
            d.find(".issues").fadeTo(200, 1), d.find(".context-loader").hide()
        });
        var f = function (a) {
                a || (a = {});
                var b = {
                    labels: [],
                    sort: "",
                    direction: "",
                    state: "",
                    page: a.preservePage ? c() : 1
                },
                    e = d.find(".milestone-context").attr("data-selected-milestone");
                e != "" && e != null && (b.milestone = e), d.find(".sidebar ul.labels").find(".selected").each(function (a, c) {
                    b.labels.push($(c).attr("data-label"))
                }), b.labels = b.labels.join(","), b.labels == "" && delete b.labels;
                var f = d.find(".main .filterbar ul.sorts").find(".asc, .desc");
                b.sort = f.attr("data-sort"), b.direction = f.attr("class"), b.state = d.find(".main .filterbar ul.filters").find(".selected").attr("data-filter");
                var g = d.find("ul.bignav").find(".selected").attr("href");
                return g + "?" + $.param(b)
            },
            g = [".sidebar ul.bignav a", ".sidebar ul.labels a", ".main .filterbar ul.filters li", ".main .filterbar ul.sorts li", ".milestone-context .pane-selector .milestone"];
        d.find(g.join(",")).pjax(d.selector, {
            timeout: null,
            url: f
        }), d.delegate(".pagination a, #clear-active-filters", "click", function (a) {
            a.preventDefault(), b(d.selector, $(this).attr("href"))
        }), d.selectableList(".sidebar ul.bignav", {
            mutuallyExclusive: !0
        }), d.selectableList(".sidebar ul.labels"), d.selectableList(".main .filterbar ul.filters", {
            wrapperSelector: "",
            mutuallyExclusive: !0
        }), d.selectableList(".js-selectable-issues", {
            wrapperSelector: "",
            itemParentSelector: ".issue",
            enableShiftSelect: !0,
            ignoreLinks: !0
        }), d.sortableHeader(".main .filterbar ul.sorts"), d.contextButton(".sidebar .milestone .js-milestone-context", {
            contextPaneSelector: ".milestone-context"
        }), d.delegate(".milestone-context .pane-selector .milestone", "click", function (a) {
            var b = $(this);
            b.closest(".milestone-context").attr("data-selected-milestone", b.attr("data-milestone")), b.closest(".milestone-context").trigger("close")
        }), d.delegate(".issues table", "click", function (a) {
            var b = $(a.target);
            if (a.which > 1 || a.metaKey || b.closest("a").length) return !0;
            var c = $(this),
                e = c.find(".issue.selected"),
                f = d.find(".issues .actions .buttons");
            e.length > 0 ? (f.addClass("activated"), f.removeClass("deactivated")) : (f.removeClass("activated"), f.addClass("deactivated")), c.find(".issue.active").removeClass("active"), b.closest(".issue").addClass("active")
        }), d.find(":checked").removeAttr("checked");
        var h = "active",
            i = function (a) {
                var c = {
                    issues: []
                };
                d.find(".issues :checked").each(function (a, b) {
                    c.issues.push($(b).val())
                }), $.ajax({
                    url: a || d.find(".issues .btn-close").attr("data-url"),
                    method: "put",
                    data: $.param(c),
                    success: function (a, c, e) {
                        b(d.selector, f({
                            preservePage: !0
                        }))
                    }
                })
            },
            j = function () {
                var a = d.find(".issues ." + h),
                    b = d.find(".issues .issue:first"),
                    c = d.find(".issues .issue:last");
                a.length > 0 ? a[0] == c[0] ? (a.removeClass(h), b.addClass(h)) : a.removeClass(h).next().addClass(h) : d.find(".issues .issue:first").addClass("active")
            },
            k = function () {
                var a = d.find(".issues ." + h),
                    b = d.find(".issues .issue:first"),
                    c = d.find(".issues .issue:last");
                a.length > 0 ? a[0] == b[0] ? (a.removeClass(h), c.addClass(h)) : a.removeClass(h).prev().addClass(h) : d.find(".issues .issue:last").addClass(h)
            },
            l = function () {
                var a = d.find(".issues ." + h);
                a.length > 0 && (window.location = a.find(".info h3 a").attr("href"))
            },
            m = function () {
                var a = d.find(".issues ." + h);
                a.length > 0 && a.click()
            },
            n = function () {
                window.location = a.find(".btn-new-issue").attr("href")
            },
            o = function (a) {
                a.preventDefault(), $("#new_label_form .namefield").focus()
            };
        $.hotkeys({
            e: i,
            j: j,
            k: k,
            o: l,
            enter: l,
            x: m,
            c: n,
            l: o
        });
        var p = "#issues_list .label-context";
        d.delegate(".label-context button.update-labels", "click", function (a) {
            var c = $(this),
                e = {
                    labels: [],
                    issues: []
                };
            d.find(".label-context ul.labels :checked").each(function (a, b) {
                e.labels.push($(b).val())
            }), d.find(".issues :checked").each(function (a, b) {
                e.issues.push($(b).val())
            }), $(this).closest(".label-context").trigger("close"), $.ajax({
                url: d.find(".label-context ul.labels").attr("data-url"),
                method: "put",
                data: e,
                complete: function (a, c) {
                    b(d.selector, f({
                        preservePage: !0
                    }))
                }
            })
        }), d.selectableList(".label-context ul.labels"), d.delegate(".issues .btn-close, .issues .btn-reopen", "click", function (a) {
            i($(this).attr("data-url"))
        }), d.delegate(".issues .btn-label", "click", function (b) {
            var c = d.find(".issues :checked").closest(".issue").find(".label");
            a.find(p + " .label a.selected").removeClass("selected"), a.find(p + " :checked").attr("checked", !1), c.each(function (b, c) {
                var d = $(c).attr("data-name");
                a.find(p + " .label[data-name='" + d + "'] a").addClass("selected"), a.find(p + " .label[data-name='" + d + "'] :checkbox").attr("checked", !0)
            })
        }), d.contextButton(".issues .btn-label", {
            contextPaneSelector: p
        }), d.contextButton(".issues .btn-assignee", {
            contextPaneSelector: ".assignee-assignment-context"
        }), d.contextButton(".issues .btn-milestone", {
            contextPaneSelector: ".milestone-assignment-context"
        });
        var q = function (a) {
                var c = $(a.target).closest(".assignee-assignment-context").find(":checked"),
                    e = {
                        issues: [],
                        assignee: c.val()
                    };
                d.find(".issues :checked").each(function (a, b) {
                    e.issues.push($(b).val())
                }), $.ajax({
                    url: c.attr("data-url"),
                    method: "put",
                    data: $.param(e),
                    success: function (a, c, e) {
                        b(d.selector, f({
                            preservePage: !0
                        }))
                    }
                })
            };
        d.delegate(".issues .btn-assignee", "click", function (a) {
            var b = $(".assignee-assignment-context");
            b.data("applied") != 1 && (b.data("applied", !0), b.assigneeFilter(q))
        }), d.delegate(".assignee-assignment-context :radio", "change", q), d.selectableList("ul.color-chooser", {
            wrapperSelector: "li.color",
            mutuallyExclusive: !0
        }), d.delegate("ul.color-chooser li.color", "click", function (a) {
            var b = $(this).find("input[type=radio]").val(),
                c = $("#custom_label_text");
            c.text(c.attr("data-orig"))
        }), d.delegate(g.join(","), "click", function (a) {
            Modernizr.history || (a.preventDefault(), window.location = f())
        })
    }
    var r = a.find("#milestone_list");
    if (r.length > 0) {
        r.bind("start.pjax", function (a) {
            r.find(".context-loader").show(), r.find(".milestones").fadeTo(200, .5)
        }).bind("end.pjax", function (a) {
            r.find(".milestones").fadeTo(200, 1), r.find(".context-loader").hide()
        });
        var g = [".sidebar ul.bignav a", ".main .filterbar ul.filters li", ".main .filterbar ul.sorts li"];
        r.delegate(g.join(","), "click", function (a) {
            if (a.which == 1 && !a.metaKey) {
                a.preventDefault();
                var c = $(this).attr("href") || $(this).attr("data-href");
                b(r.selector, c)
            }
        }), r.selectableList(".sidebar ul.bignav", {
            mutuallyExclusive: !0
        }), r.selectableList(".main .filterbar ul.filters", {
            wrapperSelector: "",
            mutuallyExclusive: !0
        }), r.sortableHeader(".main .filterbar ul.sorts")
    }
}), function (a) {
    a.fn.milestoneSelector = function (b) {
        var c = a.extend({}, a.fn.milestoneSelector.defaults, b);
        return this.each(function () {
            var b = a(this),
                d = b.closest(".context-pane"),
                e = b.find(".selector-item"),
                f = b.find(".milestone-item"),
                g = f.filter(".open-milestone"),
                h = f.filter(".closed-milestone"),
                i = e.filter(".for-selected"),
                j = b.find(".new-milestone-item"),
                k = b.find(".no-results"),
                l = b.find(".milestone-filter"),
                m = a(".js-milestone-infobar-item-wrapper");
            if (b.find("form").length == 0) {
                c.newMode = !0;
                var n = a("input[name='issue[milestone_id]']"),
                    o = a("input[name='new_milestone_title']")
            }
            var p = "open",
                q = null;
            b.find(".tabs a").click(function () {
                return b.find(".tabs a.selected").removeClass("selected"), a(this).addClass("selected"), p = a(this).attr("data-filter"), v(), !1
            }), l.keydown(function (a) {
                switch (a.which) {
                case 38:
                case 40:
                case 13:
                    return !1
                }
            }), l.keyup(function (b) {
                var c = e.filter(".current:visible");
                switch (b.which) {
                case 38:
                    return r(c.prevAll(".selector-item:visible:first")), !1;
                case 40:
                    return c.length ? r(c.nextAll(".selector-item:visible:first")) : r(a(e.filter(":visible:first"))), !1;
                case 13:
                    return s(c), !1
                }
                q = a(this).val(), v()
            }), e.click(function () {
                s(this)
            }), d.bind("deactivated.contextPane", function () {
                z(), l.val(""), l.trigger("keyup")
            });
            var r = function (a) {
                    if (a.length == 0) return;
                    e.filter(".current").removeClass("current"), a.addClass("current")
                },
                s = function (e) {
                    e = a(e);
                    if (e.length == 0) return;
                    if (e.hasClass("new-milestone-item")) return t(e);
                    var g = e.find("input[type=radio]");
                    if (g[0].checked) return;
                    g[0].checked = !0, b.trigger("beforeAssignment.milestoneSelector"), c.newMode ? (n.val(g[0].value), f.removeClass("selected"), e.addClass("selected"), d.trigger("close"), b.trigger("afterAssignment.milestoneSelector")) : u({
                        url: g[0].form.action,
                        params: {
                            milestone: g[0].value,
                            issues: b.attr("data-issue-numbers").split(",")
                        }
                    })
                },
                t = function (a) {
                    b.trigger("beforeAssignment.milestoneSelector"), c.newMode ? (n.val("new"), o.val(l.val()), f.removeClass("selected"), a.addClass("selected"), d.trigger("close"), b.trigger("afterAssignment.milestoneSelector")) : u({
                        url: a.closest("form").attr("action"),
                        params: {
                            new_milestone: l.val(),
                            issues: b.attr("data-issue-numbers").split(",")
                        }
                    })
                },
                u = function (c) {
                    w(), a.ajax({
                        type: "PUT",
                        url: c.url,
                        data: c.params,
                        success: function (a) {
                            x(), m.html(a.infobar_body).trigger("pageUpdate"), d.trigger("close"), b.html(a.context_pane_body).milestoneSelector().trigger("pageUpdate"), b.trigger("afterAssignment.milestoneSelector")
                        },
                        error: function () {
                            x(), y()
                        }
                    })
                },
                v = function () {
                    var b = null;
                    p == "open" ? (i.show(), h.hide(), b = g) : (i.hide(), g.hide(), b = h), q != "" && q != null ? (b.each(function () {
                        var b = a(this),
                            c = b.find(".milestone-title").text().toLowerCase();
                        c.score(q) > 0 ? b.show() : b.hasClass("selected") || b.hide()
                    }), j.find(".milestone-title").text(q), j.show(), k.hide(), i.hide()) : (b.each(function () {
                        a(this).show()
                    }), b.length == 0 ? k.show() : k.hide(), j.hide())
                };
            v();
            var w = function () {
                    d.find(".body").append('<div class="loader">Loadingâ€¦</div>')
                },
                x = function () {
                    d.find(".body .loader").remove()
                },
                y = function (a) {
                    a == null && (a = "Sorry, an error occured"), d.find(".body").append('<div class="error-message">' + a + "</div>")
                },
                z = function () {
                    d.find(".body .error-message").remove()
                }
        })
    }, a.fn.milestoneSelector.defaults = {}
}(jQuery), $(function () {
    var a = $("#issues_next #js-new-issue-form");
    if (a.length == 0) return;
    a.selectableList("ul.labels");
    var b = function (b) {
            var c = a.find("input.title");
            c.val().length > 0 ? (c.addClass("valid"), $(".js-title-missing-error").hide()) : (c.removeClass("valid"), $(".js-title-missing-error").show())
        };
    a.bind("submit", function (a) {
        b();
        if ($(".js-title-missing-error").is(":visible")) return !1
    }), a.find("input.title").keyup(b).change(b), a.contextButton(".js-milestone-context-button", {
        contextPaneSelector: ".js-milestone-context",
        anchorTo: "right"
    });
    var c = a.find(".infobar .milestone .text"),
        d = a.find(".js-filterable-milestones").milestoneSelector();
    d.bind("afterAssignment.milestoneSelector", function () {
        var a = d.find(".selected");
        a.hasClass("clear") ? c.html("No milestone") : a.hasClass("new-milestone-item") ? c.html("Milestone: <strong>" + a.find("p").text()) : c.html("Milestone: <strong>" + a.find("h4").text())
    }), a.contextButton(".js-assignee-context-button", {
        contextPaneSelector: ".js-assignee-context",
        anchorTo: "left"
    }).bind("show.context-button", function () {
        setTimeout(function () {
            $(".context-pane:visible :text").focus()
        }, 200)
    });
    var e = a.find(".js-assignee-context"),
        f = a.find(".infobar .assignee .text");
    e.assigneeFilter(function () {
        e.find(".current").click()
    }), e.find(".selector-item").click(function () {
        var a = $(this).find("input[type=radio]");
        a.val() == "" ? f.html("No one is assigned") : f.html("Assignee: <strong>" + $(this).find("h4").html())
    }), a.find(".js-pane-radio-selector").each(function () {
        var a = $(this),
            b = a.closest(".context-pane");
        a.find("label").click(function () {
            var c = $(this);
            a.find(".selected").removeClass("selected"), c.addClass("selected"), b.trigger("close")
        })
    })
}), $(function () {
    var a = $("#issues_next #issues_search");
    if (a.length == 0) return;
    var b = $("#js-issues-quicksearch").val();
    a.find("input[type=radio], select").change(function (a) {
        var c = $(this).closest("form");
        c.find("#search_q").val(b), c.submit()
    })
}), $(function () {
    var a = $("#issues_next #show_issue");
    if (a.length == 0) return;
    var b = function (a) {
            window.location = $("#to_isssues_list").attr("href")
        },
        c = function () {
            $("#issues_next .btn-close-issue").click()
        },
        d = function () {
            window.location = $("#issues_next .btn-new-issue").attr("href")
        };
    $.hotkeys({
        u: b,
        e: c,
        c: d
    }), a.contextButton(".js-assignee-context", {
        contextPaneSelector: ".assignee-context"
    }).bind("show.context-button", function () {
        setTimeout(function () {
            $(".context-pane:visible :text").focus()
        }, 200)
    }), a.find(".assignee-context").assigneeFilter(function () {
        a.find(".assignee-context form").submit()
    }), a.contextButton(".js-milestone-context", {
        contextPaneSelector: ".milestone-context",
        anchorTo: "right"
    }), a.find(".js-filterable-milestones").milestoneSelector(), a.contextButton(".js-label-context", {
        contextPaneSelector: ".label-context",
        anchorTo: "right"
    }), a.selectableList(".js-selectable-labels");
    var e = a.find(".js-filterable-labels li"),
        f = a.find(".js-label-filter");
    f.keyup(function () {
        var a = $(this).val();
        a != "" && a != null ? e.each(function () {
            var b = $(this),
                c = b.text().toLowerCase();
            c.score(a) > 0 ? b.show() : b.hide()
        }) : e.each(function () {
            $(this).show()
        })
    });
    var g = a.find(".js-autosubmitting-labels");
    g.find("input[type=checkbox]").change(function () {
        $.post(g.attr("action"), g.serialize(), function (a) {
            $(".discussion-stats .labels").html(a.labels)
        }, "json")
    });
    var h = $(".js-pane-selector-autosubmit");
    h.delegate("input[type=radio]", "change", function () {
        var a = $(this);
        a.closest("form").submit()
    })
}), function () {
    var a = function (a, b) {
            return function () {
                return a.apply(b, arguments)
            }
        };
    $(function () {
        var b, c, d, e, f, g, h, i;
        f = $("#issues-dashboard");
        if (f.length > 0) return i = f.attr("data-url"), i && !location.search && Modernizr.history && window.history.replaceState(null, document.title, i), c = $("#issues-dashboard .list"), g = ["" + c.selector + " .nav.big a", "" + c.selector + " .nav.small a", "#clear-active-filters", "" + c.selector + " .filterbar .filters a", "" + c.selector + " .filterbar .sorts a"].join(", "), $(g).pjax(c.selector, {
            timeout: null
        }), c.bind("start.pjax", a(function () {
            return $(this).find(".context-loader").show(), $(this).find(".listings").fadeTo(200, .5)
        }, this)).bind("end.pjax", a(function () {
            return $(this).find(".listings").fadeTo(200, 1), $(this).find(".context-loader").hide()
        }, this)), b = "active", d = function () {
            var a, c, d;
            return a = f.find(".listings ." + b), c = f.find(".listings .listing:first"), d = f.find(".listings .listing:last"), a.length > 0 ? a[0] === d[0] ? (a.removeClass(b), c.addClass(b)) : a.removeClass(b).next().addClass(b) : f.find(".listings .listing:first").addClass(b)
        }, e = function () {
            var a, c, d;
            return a = f.find(".listings ." + b), c = f.find(".listings .listing:first"), d = f.find(".listings .listing:last"), a.length > 0 ? a[0] === c[0] ? (a.removeClass(b), d.addClass(b)) : a.removeClass(b).prev().addClass(b) : f.find(".listings .listing:last").addClass(b)
        }, h = function () {
            var a;
            a = f.find(".listings ." + b);
            if (a.length > 0) return window.location = a.find(".info h3 a").attr("href")
        }, $.hotkeys({
            j: d,
            k: e,
            o: h,
            enter: h
        })
    })
}.call(this);
var location_with_hash = location.pathname + location.hash,
    matches = location_with_hash.match(/#issue\/(\d+)(\/comment\/(\d+))?/);
if (matches) {
    var issue_number = matches[1],
        comment_id = matches[3];
    issue_number && (comment_id ? window.location = location_with_hash.replace(/\/?#issue\/\d+\/comment\/\d+/, "/" + issue_number + "#issuecomment-" + comment_id) : window.location = location_with_hash.replace(/\/?#issue\/\d+/, "/" + issue_number))
}
jQuery(function (a) {
    var b = a("#issues_next");
    if (b.length == 0) return;
    var c = function (b) {
            b.preventDefault(), a("#js-issues-quicksearch").focus()
        };
    a.hotkeys({
        "/": c
    });
    var d = a("#js-issues-quicksearch");
    if (d.length > 0) {
        var e = b.find(".btn-new-issue"),
            f = d.offset();
        b.find(".search .autocomplete-results").css({
            left: d.position().left,
            top: d.outerHeight(!0) + 5,
            width: e.offset().left - f.left + e.outerWidth(!0)
        }), d.quicksearch({
            results: b.find(".search .autocomplete-results"),
            insertSpinner: function (a) {
                d.closest("form").prepend(a)
            }
        }).bind("focus", function (b) {
            a(this).closest(".fieldwrap").addClass("focused")
        }).bind("blur", function (b) {
            a(this).closest(".fieldwrap").removeClass("focused")
        }).css({
            outline: "none"
        })
    }
}), $(function () {
    var a = $(".github-jobs-promotion");
    if (a.get(0) == null) return;
    a.css({
        visibility: "hidden"
    }), window.jobsWidgetCallback = function (b) {
        var c = Math.floor(Math.random() * b.jobs.length),
            d = b.jobs[c];
        a.find(".job-link").attr("href", d.url), a.find(".job-company").text(d.company), a.find(".job-position").text(d.position), a.find(".job-location").text(d.location), a.css({
            visibility: "visible"
        })
    }, $.getScript(a.attr("url"))
}), $(function () {
    $("#add_key_action").click(function () {
        return $(this).toggle(), $("#new_key_form_wrap").toggle().find(":text").focus(), !1
    }), $(".edit_key_action").live("click", function () {
        var a = $(this).attr("href");
        return $.facebox(function () {
            $.get(a, function (a) {
                $.facebox(a), $("#facebox .footer").hide()
            })
        }), !1
    }), $("#cancel_add_key").click(function () {
        return $("#add_key_action").toggle(), $("#new_key_form_wrap").toggle().find("textarea").val(""), $("#new_key").find(":text").val(""), $("#new_key .error_box").remove(), !1
    }), $(".cancel_edit_key").live("click", function () {
        return $.facebox.close(), $("#new_key .error_box").remove(), !1
    }), $(".delete_key").live("click", function () {
        if (confirm("Are you sure you want to delete this key?")) {
            $.ajax({
                type: "POST",
                data: {
                    _method: "delete"
                },
                url: $(this).attr("href")
            });
            var a = $(this).parents("ul");
            $(this).parent().remove()
        }
        return !1
    }), $("body").delegate("form.key_editing", "submit", function (a) {
        var b = this;
        return $(b).find(".error_box").remove(), $(b).find(":submit").attr("disabled", !0).spin(), $(b).ajaxSubmit(function (a) {
            a.substring(0, 3) == "<li" ? ($(b).attr("id").substring(0, 4) == "edit" ? ($("#" + $(b).attr("id").substring(5)).replaceWith(a), $.facebox.close()) : ($("ul.public_keys").append(a), $("#add_key_action").toggle(), $("#new_key_form_wrap").toggle()), $(b).find("textarea").val(""), $(b).find(":text").val("")) : $(b).append(a), $(b).find(":submit").attr("disabled", !1).stopSpin()
        }), !1
    })
}), function () {
    var a = function (a, b) {
            return function () {
                return a.apply(b, arguments)
            }
        },
        b = Array.prototype.indexOf ||
    function (a) {
        for (var b = 0, c = this.length; b < c; b++) if (this[b] === a) return b;
        return -1
    };
    GitHub.MenuBehavior = function () {
        function c() {
            this.onDeactivate = a(this.onDeactivate, this), this.onActivate = a(this.onActivate, this), this.onClose = a(this.onClose, this), this.onContainerClick = a(this.onContainerClick, this), this.onKeyDown = a(this.onKeyDown, this), this.onClick = a(this.onClick, this), $(document).bind("click", this.onClick), $(document).bind("keydown", this.onKeyDown), $(document).delegate(".js-menu-container", "click", this.onContainerClick), $(document).delegate(".js-menu-container .js-menu-close", "click", this.onClose), $(document).delegate(".js-menu-container", "menu:activate", this.onActivate), $(document).delegate(".js-menu-container", "menu:deactivate", this.onDeactivate)
        }
        return c.prototype.onClick = function (a) {
            if (!this.activeContainer) return;
            if (!$(a.target).closest(this.activeContainer)[0]) return $(this.activeContainer).trigger("menu:deactivate")
        }, c.prototype.onKeyDown = function (a) {
            var c;
            if (!this.activeContainer) return;
            if (a.keyCode === 27) return (c = this.activeContainer, b.call($(document.activeElement).parents(), c) >= 0) && document.activeElement.blur(), $(this.activeContainer).trigger("menu:deactivate")
        }, c.prototype.onContainerClick = function (a) {
            var b, c, d;
            b = a.currentTarget;
            if (d = $(a.target).closest(".js-menu-target")[0]) return b === this.activeContainer ? $(b).trigger("menu:deactivate") : $(b).trigger("menu:activate");
            if (!(c = $(a.target).closest(".js-menu-content")[0])) return $(b).trigger("menu:deactivate")
        }, c.prototype.onClose = function (a) {
            return $(a.target).closest(".js-menu-container").trigger("menu:deactivate")
        }, c.prototype.onActivate = function (a) {
            return this.activate(a.currentTarget)
        }, c.prototype.onDeactivate = function (a) {
            return this.deactivate(a.currentTarget)
        }, c.prototype.activate = function (a) {
            return this.activeContainer && this.deactivate(this.activeContainer), $(document.body).addClass("menu-active"), this.activeContainer = a, $(a).addClass("active"), $(a).trigger("menu:activated")
        }, c.prototype.deactivate = function (a) {
            return $(document.body).removeClass("menu-active"), this.activeContainer = null, $(a).removeClass("active"), $(a).trigger("menu:deactivated")
        }, c
    }(), new GitHub.MenuBehavior
}.call(this), GitHub = GitHub || {}, GitHub.metric = function (a, b) {
    if (!window.mpq) return GitHub.metric = $.noop;
    b ? mpq.push([b.type || "track", a, b]) : mpq.push(["track", a])
}, GitHub.trackClick = function (a, b, c) {
    if (!window.mpq) return GitHub.trackClick = $.noop;
    $(a).click(function () {
        return c = $.isFunction(c) ? c.call(this) : c, GitHub.metric(b, c), !0
    })
}, $(function () {
    var a = GitHub.trackClick;
    a("#entice-signup-button", "Entice banner clicked"), a("#coupon-redeem-link", "Clicked Dec 2010 Sale Notice"), a(".watch-button", "Watched Repo", {
        repo: GitHub.nameWithRepo
    }), a(".unwatch-button", "Unwatched Repo", {
        repo: GitHub.nameWithRepo
    }), a(".btn-follow", "Followed User", function () {
        return {
            user: $(this).attr("data-user")
        }
    }), a(".btn-unfollow", "Unfollowed User", function () {
        return {
            user: $(this).attr("data-user")
        }
    })
}), DateInput.prototype.resetDate = function () {
    $(".date_selector .selected").removeClass("selected"), this.changeInput("")
}, $(function () {
    $("input.js-date-input").each(function () {
        var a = new DateInput(this);
        a.hide = $.noop, a.show(), $(this).hide(), $(".date_selector").addClass("no_shadow")
    }), $("label.js-date-input a").click(function (a) {
        var b = $("input.js-date-input").data("datePicker");
        b.resetDate()
    })
});
var Network = defineNetwork(window.jQuery);
Modernizr.canvas && $(document).pageUpdate(function () {
    $("#ng")[0] && new Network("#ng", 920, 600)
}), function () {
    $(document).pageUpdate(function () {
        return $(this).find(".js-obfuscate-email").each(function () {
            var a, b, c, d;
            if (d = $(this).attr("data-email")) return a = decodeURIComponent(d), c = $(this).text().replace(/{email}/, a), b = $(this).attr("href").replace(/{email}/, a), $(this).text(c), $(this).attr("href", b)
        })
    })
}.call(this), $(function () {
    var a = $("#organization-transforming");
    a.redirector({
        url: a.data("url"),
        to: "/login"
    }), $("#members_bucket .remove-user").click(function () {
        var a, b = $(this),
            c = b.parents("li:first").find(".login").text(),
            d = "Are you POSITIVE you want to remove " + c + " from " + "your organization?";
        return confirm(d) ? (b.spin().remove(), a = $("#spinner").addClass("remove"), $.del(b.attr("href"), function () {
            a.parent().remove()
        }), !1) : !1
    })
}), $(function () {
    if (!$("body").hasClass("page-account")) return !1;
    var a = $("#add_email_action a"),
        b = $("#cancel_add_email"),
        c = $("#add_email_form_wrap"),
        d = $(".add-emails-form .error_box");
    a.click(function () {
        return $(this).toggle(), c.fadeIn(200).find(":text").focus(), !1
    }), b.click(function () {
        return a.toggle(), c.hide().find(":text").val(""), d.hide(), !1
    }), $(".delete_email").live("click", function () {
        return $("ul.user_emails li.email").length == 1 ? ($.facebox("You must always have at least one email address.  If you want to delete this address, add a new one first."), !1) : ($.post($(this).attr("href"), {
            email: $(this).prev().text()
        }), $(this).parent().remove(), !1)
    }), $(".delete_connection").live("click", function () {
        return $.post($(this).attr("href"), {
            _method: "delete"
        }), $(this).parent().remove(), !1
    }), $("ul.user_emails li.email").length > 0 && $("#add_email_form").submit(function () {
        $("#add_email_form :submit").attr("disabled", !0).spin();
        var a = this;
        return $(this).ajaxSubmit(function (b) {
            b ? $("ul.user_emails").append(b) : d.show(), $("#add_email_form :submit").attr("disabled", !1).stopSpin(), $(a).find(":text").val("").focus()
        }), !1
    }), $(".user_toggle").click(function () {
        var a = {};
        a[this.name] = this.checked ? "1" : "0", a._method = "put", $.post("/account", a), $("#notify_save").show(), setTimeout("$('#notify_save').fadeOut()", 1e3)
    }), $("dl.form.autosave").autosaveField(), $("button.dummy").click(function () {
        return $(this).prev(".success").show().fadeOut(5e3), !1
    }), $(".js-preview-job-profile").click(function () {
        return $.get("/preview", {
            text: $("#user_profile_bio").val()
        }, function (a) {
            $.facebox(a, "job-profile-preview")
        }), !1
    }), $(".js-leave-collaborated-repo", $("#facebox")[0]).live("click", function (a) {
        var b = $(this).parents("form").attr("data-repo"),
            c = $('ul.repositories li[data-repo="' + b + '"]'),
            d = $(this).parents("div.full-button");
        return d.addClass("no-bg"), d.html('<img src="/images/modules/ajax/indicator.gif">'), $.ajax({
            url: "/account/leave_repo/" + b,
            type: "POST",
            success: function () {
                $.facebox.close(), c.fadeOut()
            },
            error: function () {
                d.html('<img src="/images/modules/ajax/error.png">')
            }
        }), a.preventDefault(), !1
    }), $("body").delegate(".change-gravatar-email form", "submit", function () {
        var a = $(this),
            b = a.find("button").attr("disabled", !0),
            c = a.find(".spinner").html('<img src="/images/modules/ajax/indicator.gif"/>');
        return $.ajax({
            url: a.attr("action"),
            type: "PUT",
            data: {
                email: a.find("input").val()
            },
            success: function (b) {
                c.html('<img src="/images/modules/ajax/success.png"/>'), a.find(".error").text("");
                var d = $(".change-gravatar-email .gravatar img").attr("src");
                $(".change-gravatar-email .gravatar img").attr("src", d.replace(/[a-f0-9]{32}/, b)), $(document).unbind("close.facebox").bind("close.facebox", function () {
                    window.location = window.location
                })
            },
            error: function (b) {
                c.html('<img src="/images/modules/ajax/error.png"/>'), a.find(".error").text(b.responseText)
            },
            complete: function () {
                b.attr("disabled", !1)
            }
        }), !1
    })
}), $(function () {
    if ($(".page-billing, .page-account").length == 0) return !1;
    $(".js-coupon-click-onload").click(), $(".js-add-cc").click(function () {
        return $(document).one("reveal.facebox", function () {
            $("#facebox .js-thanks, #facebox .rule:first").hide()
        }), $.facebox({
            div: this.href
        }), !1
    }), $(".js-close-facebox").live("click", function () {
        $(document).trigger("close.facebox")
    }), $(".js-edit-org-select-billing").click(function () {
        return $("a[href=#billing_bucket]").click(), !1
    });
    var a = $("table.upgrades");
    if (a.length == 0) return !1;
    a.find(".choose_plan").click(function () {
        var a = $(this).closest("tr").attr("data-name");
        $(".js-new-plan-name-val").val(a), $(".js-new-plan-name").text(a), a == "free" ? $(".js-new-plan-card-on-file").hide() : $(".js-new-plan-card-on-file").show()
    }), $("body").delegate(".js-coupon-form", "submit", function () {
        return $(this).find("button").attr("disabled", !0).after(' <img src="/images/modules/ajax/indicator.gif">'), $.ajax({
            url: this.action,
            type: this.method,
            data: {
                code: $(this).find(":text").val()
            },
            error: function (a) {
                $("#facebox .content").html(a.responseText)
            },
            success: function (a) {
                $("#facebox .content").html(a), $(document).unbind("close.facebox").bind("close.facebox", function () {
                    var a = window.location.pathname;
                    window.location = /organizations/.test(a) ? a : "/account/billing"
                })
            }
        }), !1
    }), $(".selected .choose_plan").click(), $(".js-show-credit-card-form")[0] && ($.facebox({
        div: "#credit_card_form"
    }), $(document).unbind("close.facebox").bind("close.facebox", function () {
        window.location = "/account/billing"
    }))
}), $(function () {
    if (!$("body").hasClass("page-compare")) return !1;
    var a = function (a) {
            return a.charAt(0).toUpperCase() + a.slice(1)
        },
        b = $("#compare").data("base"),
        c = $("#compare").data("head"),
        d = null;
    $(".compare-range .commit-ref.to").click(function () {
        return d = "end", $.facebox({
            div: "#compare_chooser"
        }), !1
    }), $(".compare-range .commit-ref.from").click(function () {
        return d = "start", $.facebox({
            div: "#compare_chooser"
        }), !1
    });
    var e = function () {
            var e = $("#facebox .ref-autocompleter"),
                f = $("#facebox button.choose-end"),
                g = $("#facebox button.refresh");
            e.val(d == "start" ? b : c), $("#facebox .mode-upper").text(a(d)), $("#facebox .mode-lower").text(d), d == "start" ? f.show() : f.hide()
        },
        f = function () {
            var a = $("#facebox .ref-autocompleter");
            if (a.length == 0) return;
            var f = $("#facebox .commit-preview-holder"),
                g = $("#facebox button.refresh"),
                h = $(".compare-range").attr("url-base");
            e(), g.click(function () {
                return d == "start" ? b = a.val() : c = a.val(), $(document).trigger("close.facebox"), document.location = h + b + "..." + c, !1
            }), a.click(function () {
                return this.focus(), this.select(), !1
            });
            var i = !1,
                j = null,
                k = function () {
                    i && j.abort(), i = !0, j = $.get(f.attr("url_base") + a.val(), null, function (a) {
                        a.length > 0 && (f.html(a), f.find("a").attr("target", "_blank"), f.trigger("pageUpdate")), i = !1
                    })
                };
            k();
            var l = a.val(),
                m = null,
                n = function () {
                    if (l != a.val() || m == a.val()) {
                        l = a.val();
                        return
                    }
                    k(), m = a.val()
                };
            a.keyup(function () {
                l = this.value, setTimeout(n, 1e3)
            }), a.click()
        };
    $(document).bind("reveal.facebox", f), b == c && $(".compare-range .commit-ref.from").click();
    var g = window.location.hash.substr(1);
    (/^diff-/.test(g) || /^L\d+/.test(g)) && $("li a[href='#files_bucket']").click()
}), function () {
    $(function () {
        var a;
        if ($(".js-leaving-form")[0]) return a = function () {
            var a;
            return a = new WufooForm, a.initialize({
                userName: "github",
                formHash: "q7x4a9",
                autoResize: !0,
                height: "504",
                ssl: !0
            }), $(".js-leaving-form").html(a.generateFrameMarkup())
        }, function () {
            var b, c;
            return b = document.location.protocol === "https:" ? "https://secure." : "http://", c = document.createElement("script"), c.type = "text/javascript", c.src = "" + b + "wufoo.com/scripts/embed/form.js", c.onload = a, $("head")[0].appendChild(c)
        }()
    })
}.call(this), $(function () {
    function c() {
        var a = b.find("input.title");
        a.val().length > 0 ? (a.addClass("valid"), b.find(".js-title-missing-error").hide()) : (a.removeClass("valid"), b.find(".js-title-missing-error").show())
    }
    if (!$("body").hasClass("page-newpullrequest")) return !1;
    $(".pull-form a[action=preview]").click(function () {
        var a = $(".pull-form .content-body"),
            b = $(".pull-form").attr("data-preview-url"),
            c = $(this).closest("form");
        a.html("<p>Loading preview ...</p>"), $.post(b, c.serialize(), function (b) {
            a.html(b)
        })
    });
    var a = $(".btn-change");
    a.data("expand-text", a.text()), a.data("collapse-text", a.attr("data-collapse-text")), a.data("state", "collapsed"), $(".editor-expander").click(function () {
        return a.data("state") == "collapsed" ? (a.find("span").text(a.data("collapse-text")), a.data("state", "expanded"), $(".range-editor").slideDown("fast"), $(".pull-form-main .form-actions button").hide(), $(".pull-tabs, .tab-content").css({
            opacity: .45
        })) : (a.find("span").text(a.data("expand-text")), a.data("state", "collapsed"), $(".range-editor").slideUp("fast"), $(".pull-form-main .form-actions button").show(), $(".pull-tabs, .tab-content").css({
            opacity: 1
        })), !1
    });
    var b = $(".new-pull-request form");
    b.submit(function () {
        if (!b.attr("data-update")) {
            c();
            if ($(".js-title-missing-error").is(":visible")) return !1;
            GitHub.metric("Sent Pull Request", {
                "Pull Request Type": "New School",
                Action: GitHub.currentAction,
                "Ref Type": GitHub.revType
            })
        }
    }), $("button#update_commit_range").click(function () {
        b.attr("data-update", "yes"), b.attr("action", $(this).data("url")), b.submit()
    }), $(".range-editor").find("input, select").keypress(function (a) {
        a.keyCode == 13 && a.preventDefault()
    }), $(".js-refchooser").each(function () {
        $(this).refChooser({
            change: function () {
                $(this).attr("data-ref-valid", !1), $("button#update_commit_range").attr("disabled", !0)
            },
            found: function () {
                $(this).attr("data-ref-valid", !0), $(".js-refchooser[data-ref-valid=false]").length == 0 && $("button#update_commit_range").removeAttr("disabled")
            }
        });
        var a = $(this).find(".js-ref"),
            b = $(this).find("select"),
            c = a.branchesAutocomplete({
                extraParams: {
                    repository: b.val()
                }
            });
        b.change(function () {
            c.flushCache(), c.setOptions({
                extraParams: {
                    repository: $(this).val()
                }
            }), c.click()
        }), a.focus(function () {
            window.setTimeout(function () {
                a.selection(0, a.val().length)
            }, 1)
        })
    })
}), function (a) {
    a.fn.refChooser = function (b) {
        var c = a.extend({}, a.fn.refChooser.defaults, b);
        return this.each(function () {
            var b = this,
                d = a(this),
                e = d.find(".js-source"),
                f = d.find(".js-ref"),
                g = d.find(".js-commit-preview"),
                h = d.attr("data-preview-url-base"),
                i = {
                    repo: d.attr("data-error-repo")
                },
                j = !1,
                k = null,
                l = function () {
                    if (e.val() == "") {
                        g.html('<p class="error">' + i.repo + "</p>"), c.missing.call(d);
                        return
                    }
                    var l = h + e.val().split("/")[0] + ":" + f.val();
                    j && k.abort(), j = !0, k = a.get(l, null, function (a) {
                        a.length > 0 && (g.html(a), g.trigger("pageUpdate"), g.find(".error").length == 0 ? c.found.call(b) : c.missing.call(b)), j = !1
                    })
                },
                m = f.val(),
                n = function () {
                    if (this.value == m) return;
                    c.change.call(b), m = this.value, l()
                };
            f.keyup(n), f.bind("result", n);
            var o = e.val();
            e.change(function () {
                if (this.value == o) return;
                c.change.call(b), o = this.value, l()
            })
        })
    }, a.fn.refChooser.defaults = {
        found: function () {},
        change: function () {},
        missing: function () {}
    }
}(jQuery), $(function () {
    if (!$("body").hasClass("page-notifications")) return !1;
    $("table.notifications input[type=checkbox]").change(function () {
        $.post("/account/toggle_notification", {
            _method: "put",
            enable: this.checked ? "true" : "false",
            notification_action: this.value
        })
    }), $("button.dummy").click(function () {
        return $(this).prev(".success").show().fadeOut(5e3), !1
    }), $(".user_toggle").click(function () {
        var a = this.checked,
            b = {};
        b[this.name] = this.checked ? "1" : "0", b._method = "put", $.post("/account", b, function () {
            a ? $("#notifications_global_wrapper").removeClass("ignored") : $("#notifications_global_wrapper").addClass("ignored")
        })
    })
}), $(function () {
    if (!$("body").hasClass("page-profile")) return !1;
    var a = $("ul.repositories>li"),
        b = $(".repo-filter input").val(""),
        c = b.val(),
        d = null,
        e = function () {
            a.show(), b.val() != "" && a.filter(":not(:Contains('" + b.val() + "'))").hide()
        };
    b.bind("keyup blur click", function () {
        if (this.value == c) return;
        c = this.value, e()
    }), $("ul.repositories>li.simple").each(function () {
        var a = $(this),
            b = a.find("p.description").html();
        $.trim(b) != "" && a.find("h3").attr("title", b).tipsy({
            gravity: "w"
        })
    });
    var f = $("ul#placeholder-members li").remove();
    f.length > 0 && $("ul.org-members").prepend(f)
}), $(function () {
    if (!$("body").hasClass("page-pullrequest")) return !1;
    $(".file, .file-box").live("commentChange", function (a) {
        $(a.target).closest("#discussion_bucket").length > 0 ? $("#files_bucket").remove() : $("#discussion_bucket").remove()
    }), $("#reply-to-pr").click(function () {
        $("#comment_body").focus()
    }), $("#pull_closed_warning a").click(function () {
        return $("#pull_closed_warning").hide(), $("#pull_comment_form").show(), !1
    });
    var a = $(".js-toggle-merging");
    if (a.length > 0) {
        var b = $(".js-shown-merging"),
            c = $(".js-shown-notmerging");
        a.click(function () {
            return b.is(":visible") ? (b.hide(), c.show()) : (b.show(), c.hide()), !1
        })
    }
    var d = $("#js-mergeable-unknown");
    d.length > 0 && d.is(":visible") && $.smartPoller(function (a) {
        $.ajax({
            url: d.data("status-url"),
            dataType: "json",
            success: function (b) {
                b === !0 ? (d.hide(), $("#js-mergeable-clean").show()) : b === !1 ? (d.hide(), $("#js-mergeable-dirty").show()) : a()
            },
            error: function () {
                d.hide(), $("#js-mergeable-error").show()
            }
        })
    })
}), $(function () {
    $(".ajax_paginate a").live("click", function () {
        var a = $(this).parent(".ajax_paginate");
        return a.hasClass("loading") ? !1 : (a.addClass("loading"), $.ajax({
            url: $(this).attr("href"),
            complete: function () {
                a.removeClass("loading")
            },
            success: function (b) {
                a.replaceWith(b), a.parent().trigger("pageUpdate")
            }
        }), !1)
    })
}), function () {
    var a = function (a, b) {
            return function () {
                return a.apply(b, arguments)
            }
        };
    if (!Modernizr.canvas) return;
    GitHub.ParticipationGraph = function () {
        function b(b) {
            this.el = b, this.onSuccess = a(this.onSuccess, this), this.canvas = this.el.getContext("2d"), this.refresh()
        }
        return b.prototype.barWidth = 7, b.prototype.barMaxHeight = 20, b.prototype.getUrl = function () {
            return $(this.el).data("source")
        }, b.prototype.setData = function (a) {
            var b, c;
            this.data = a;
            if (((b = this.data) != null ? b.all : void 0) == null || ((c = this.data) != null ? c.owner : void 0) == null) this.data = null;
            this.scale = this.getScale(this.data)
        }, b.prototype.getScale = function (a) {
            var b, c, d, e, f;
            if (a == null) return;
            b = a.all[0], f = a.all;
            for (d = 0, e = f.length; d < e; d++) c = f[d], c > b && (b = c);
            return b >= this.barMaxHeight ? (this.barMaxHeight - .1) / b : 1
        }, b.prototype.refresh = function () {
            $.ajax({
                url: this.getUrl(),
                dataType: "json",
                success: this.onSuccess
            })
        }, b.prototype.onSuccess = function (a) {
            this.setData(a), this.draw()
        }, b.prototype.draw = function () {
            if (this.data == null) return;
            this.drawCommits(this.data.all, "#cacaca"), this.drawCommits(this.data.owner, "#336699")
        }, b.prototype.drawCommits = function (a, b) {
            var c, d, e, f, g, h, i, j, k;
            d = this.el.getContext("2d"), f = 0;
            for (j = 0, k = a.length; j < k; j++) c = a[j], g = this.barWidth, e = c * this.scale, h = f * (this.barWidth + 1), i = this.barMaxHeight - e, this.canvas.fillStyle = b, this.canvas.fillRect(h, i, g, e), f++
        }, b
    }(), $(document).pageUpdate(function () {
        return $(this).find(".participation-graph").each(function () {
            if ($(this).is(":hidden")) return $(this).removeClass("disabled"), new GitHub.ParticipationGraph($(this).find("canvas")[0])
        })
    })
}.call(this), $(function () {
    var a = $("table.upgrades");
    if (a.length == 0) return !1;
    var b = a.find("tr.current"),
        c = $("#plan"),
        d = $("#credit_card_fields"),
        e = function (b) {
            newPlan = b, a.find("tr.selected").removeClass("selected"), b.addClass("selected"), a.addClass("selected"), c.val(newPlan.attr("data-name")), newPlan.attr("data-cost") == 0 ? d.hide() : d.show()
        };
    a.find(".choose_plan").click(function () {
        return e($(this).closest("tr")), !1
    }), $(".selected .choose_plan").click()
}), function () {
    $(function () {
        var a, b, c, d;
        b = $(".js-plaxify");
        if (b.length > 0) {
            for (c = 0, d = b.length; c < d; c++) a = b[c], $(a).plaxify({
                xRange: $(a).data("xrange") || 0,
                yRange: $(a).data("yrange") || 0,
                invert: $(a).data("invert") || !1
            });
            return $.plax.enable()
        }
    })
}.call(this), function () {
    function a(a) {
        $(a || document).find("time.js-relative-date").each(function () {
            var a = $.parseISO8601($(this).attr("datetime"));
            a && $(this).text($.distanceOfTimeInWords(a))
        })
    }
    $(document).pageUpdate(function () {
        a(this)
    }), $(function () {
        setInterval(a, 6e4)
    })
}(), $(function () {
    $(".plan").dblclick(function () {
        var a = $(this).find("a.classy");
        a.length > 0 && (document.location = a.attr("href"))
    }), $("#signup_form").submit(function () {
        $("#signup_button").attr("disabled", !0).find("span").text("Creating your GitHub account...")
    }), $("dl.form.autocheck").each(function () {
        var a = $(this);
        a.find("input").blur(function () {
            var b = $(this);
            if (!$.trim(b.val())) return;
            if (!b.attr("check-url")) return;
            b.css("background-image", 'url("/images/modules/ajax/indicator.gif")'), $.ajax({
                type: "POST",
                url: b.attr("check-url"),
                data: {
                    value: b.val()
                },
                success: function () {
                    b.next().is(".note") && b.next().find("strong").text(b.val()), a.unErrorify(), b.css("background-image", 'url("/images/modules/ajax/success.png")')
                },
                error: function (c) {
                    a.errorify(c.responseText), b.css("background-image", 'url("/images/modules/ajax/error.png")')
                }
            })
        })
    })
}), function () {
    $(function () {
        var a, b;
        if (b = $(".js-current-repository").attr("href")) return a = {
            path: "/",
            expires: 1
        }, $.cookie("spy_repo", b.substr(1), a), $.cookie("spy_repo_at", new Date, a)
    })
}.call(this), function () {
    var a, b = function (a, b) {
            return function () {
                return a.apply(b, arguments)
            }
        };
    GitHub.Stats = function () {
        function a(a) {
            this.namespace = a, this.stats = [], this.flushTimer = null
        }
        return a.prototype.increment = function (a, b) {
            return b == null && (b = 1), this.namespace && (a = "" + this.namespace + "." + a), this.stats.push({
                metric: a,
                type: "increment",
                count: b
            }), this.queueFlush()
        }, a.prototype.timing = function (a, b) {
            if (b < 0) return;
            return this.namespace && (a = "" + this.namespace + "." + a), this.stats.push({
                metric: a,
                type: "timing",
                ms: b
            }), this.queueFlush()
        }, a.prototype.queueFlush = function () {
            return this.flushTimer && clearTimeout(this.flushTimer), this.flushTimer = setTimeout(b(function () {
                return this.flush()
            }, this), 2e3)
        }, a.prototype.flush = function () {
            var a, b;
            a = $(document.body);
            if (this.stats.length && a.hasClass("env-production") && !a.hasClass("enterprise")) return b = this.stats, this.stats = [], $.ajax({
                url: "/_stats",
                type: "POST",
                data: JSON.stringify(b),
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            })
        }, a
    }(), a = GitHub.stats = new GitHub.Stats("github.browser"), typeof window != "undefined" && window !== null && (window.$stats = a);
    if (typeof $ == "undefined" || $ === null) return;
    window.performance || $(window).bind("unload", function () {
        window.name = JSON.stringify((new Date).getTime())
    }), $(function () {
        var b, c;
        if (window.performance) return b = window.performance.timing, b.navigationStart && a.timing("performance.navigation", (new Date).getTime() - b.navigationStart), b.secureConnectionStart && b.connectStart && a.timing("performance.ssl", b.secureConnectionStart - b.connectStart), b.domainLookupStart !== b.domainLookupEnd && a.timing("performance.dns", b.domainLookupEnd - b.domainLookupStart), b.requestStart && b.responseStart && b.responseEnd && (a.timing("performance.request", b.responseStart - b.requestStart), a.timing("performance.response", b.responseEnd - b.responseStart)), $(window).bind("load", function () {
            b.domContentLoadedEventEnd && b.domLoading && a.timing("performance.DOMContentLoaded", b.domContentLoadedEventEnd - b.domLoading), b.domComplete && b.domLoading && a.timing("performance.load", b.domComplete - b.domLoading);
            if (b.domInteractive && b.domLoading) return a.timing("performance.interactive", b.domInteractive - b.domLoading)
        });
        if (window.name && window.name.match(/^\d+$/)) {
            try {
                c = JSON.parse(window.name), a.timing("pageload", (new Date).getTime() - c)
            } catch (d) {}
            return window.name = ""
        }
    })
}.call(this), function () {
    $(function () {
        var a;
        if ($(".js-styleguide-ace")[0]) return a = new GitHub.CodeEditor(".js-styleguide-ace"), $(".js-styleguide-themes").change(function () {
            return a.setTheme($(this).find(":selected").val())
        })
    })
}.call(this), $(function () {
    var a = $(".js-subscription");
    if (a.length == 0) return;
    var b = $(".js-subscription-off"),
        c = $(".js-subscription-on"),
        d = $(".js-subscription-settings"),
        e = "ignored";
    a.live("click", function () {
        var a = $(this),
            f = d.attr("data-method") || "POST";
        return $.ajax({
            type: f,
            url: a.attr("href"),
            dataType: "json",
            success: function (a) {
                a.subscribed ? (c.show(), b.hide(), d.removeClass(e)) : (b.show(), c.hide(), d.addClass(e))
            }
        }), !1
    })
}), GitHub.Team = function (a) {
    this.url = window.location.pathname, this.orgUrl = this.url.split(/\/(teams|invite)/)[0], a && (this.url = this.orgUrl + "/teams/" + a)
}, GitHub.Team.prototype = {
    name: function () {
        return $("#team-name").val()
    },
    newRecord: function () {
        return !/\/invite/.test(location.pathname) && !/\d/.test(location.pathname)
    },
    addMember: function (a) {
        return /\//.test(a) ? this.addRepo(a) : this.addUser(a)
    },
    repos: function () {
        return $.makeArray($(".repositories li:visible a span").map(function () {
            return $(this).text()
        }))
    },
    addRepo: function (a) {
        debug("Adding repo %s", a);
        if (!a || $.inArray(a, this.repos()) > -1) return !1;
        this.addRepoAjax(a);
        var b = $(".repositories").find("li:first").clone(),
            c = b.find("input[type=hidden]");
        return b.find("a").attr("href", "/" + a).text(a), b.find(".remove-repository").attr("data-repo", a), GitHub.Autocomplete.visibilities[a] == "private" && b.addClass("private"), c.length > 0 && c.val(a).attr("disabled", !1), $(".repositories").append(b.show()), !0
    },
    addRepoAjax: function (a) {
        if (this.newRecord()) return;
        debug("Ajaxily adding %s", a), $.post(this.url + "/repo/" + a)
    },
    removeRepo: function (a) {
        debug("Removing %s", a);
        if (!a || $.inArray(a, this.repos()) == -1) return !1;
        var b = $(".repositories li:visible a").filter(function () {
            return $(this).find("span").text() == a
        }),
            c = function () {
                b.parents("li:first").remove()
            },
            d = function () {
                b.parent().find(".remove-repository").show().removeClass("remove").html('<img class="dingus" src="/images/modules/ajax/error.png">').end().find(".spinner").hide()
            };
        return this.newRecord() ? c() : (b.parent().find(".remove-repository").after('<img class="dingus spinner" src="/images/modules/ajax/indicator.gif"/>').hide(), this.removeRepoAjax(a, c, d)), !0
    },
    removeRepoAjax: function (a, b, c) {
        if (this.newRecord()) return;
        debug("Ajaxily removing %s", a), $.del(this.url + "/repo/" + a, {}, {
            success: b,
            error: c
        })
    },
    users: function () {
        return $.makeArray($(".usernames li:visible").map(function () {
            return $(this).find("a:first").text()
        }))
    },
    addUser: function (a) {
        debug("Adding %s", a);
        if (!a || $.inArray(a, this.users()) > -1) return !1;
        this.addUserAjax(a);
        var b = $(".usernames").find("li:first").clone(),
            c = GitHub.Autocomplete.gravatars[a],
            d = b.find("input[type=hidden]");
        return c && b.find("img").replaceWith(c), b.find("a").attr("href", "/" + a).text(a), d.length > 0 && d.val(a).attr("disabled", !1), $(".usernames").append(b.show()), !0
    },
    removeUser: function (a) {
        debug("Removing %s", a);
        if (!a || $.inArray(a, this.users()) == -1) return !1;
        var b = $(".usernames li:visible a:contains(" + a + ")"),
            c = function () {
                b.parents("li:first").remove()
            };
        return this.newRecord() ? c() : (b.parent().find(".remove-user").spin().remove(), $("#spinner").addClass("remove"), this.removeUserAjax(a, c)), !0
    },
    addUserAjax: function (a) {
        if (this.newRecord()) return;
        debug("Ajaxily adding %s", a), $.post(this.url + "/member/" + a)
    },
    removeUserAjax: function (a, b) {
        if (this.newRecord()) return;
        debug("Ajaxily removing %s", a), $.del(this.url + "/member/" + a, b)
    }
}, $(function () {
    if (!$(".js-team")[0]) return;
    var a = new GitHub.Team($(".js-team").data("team")),
        b = function () {
            debug("Setting data.completed to %s", $(this).val()), $(this).data("completed", $(this).val())
        },
        c = new GitHub.Autocomplete;
    c.settings.selectFirst = !0, c.reposURL = a.orgUrl + "/autocomplete/repos", c.repos($(".add-repository-form input")).result(b), $(".remove-repository").live("click", function () {
        return a.removeRepo($(this).attr("data-repo")), !1
    }), $(".add-username-form input").userAutocomplete().result(b), $(".remove-user").live("click", function () {
        return a.removeUser($(this).prev().text()), !1
    }), $(".add-username-form button, .add-repository-form button").click(function () {
        var b = $(this).parent(),
            c = b.find(":text"),
            d = c.val();
        return debug("Trying to add %s...", d), !d || !c.data("completed") ? !1 : (c.val("").removeClass("ac-accept"), a.addMember(d), !1)
    }), $(".add-username-form :text, .add-repository-form :text").keydown(function (a) {
        if (a.key == "enter") return $(this).next("button").click(), !1;
        a.key != "tab" && (debug("Clearing data.completed (was %s)", $(this).data("completed") || "null"), $(this).data("completed", null))
    })
}), $(function () {
    $(".remove-team").click(function () {
        if (!confirm("Are you POSITIVE you want to remove this team?")) return !1;
        var a = $(this).parents("li.team");
        return $.del(this.href, function () {
            a.remove()
        }), $(this).spin().remove(), !1
    })
}), GitHub.Thunderhorse = function (a) {
    if (!window.ace || !window.sharejs) return;
    location.hash || (location.hash = GitHub.Thunderhorse.generateSessionID());
    var b = {
        host: "thunderhorse.herokuapp.com",
        secure: !0
    },
        c = location.pathname + location.hash;
    sharejs.open(c, "text", b, function (b, c) {
        b.created && b.submitOp({
            i: a.code(),
            p: 0
        }), b.attach_ace(a.ace), a.ace.focus(), a.ace.renderer.scrollToRow(0), a.ace.moveCursorTo(0, 0), GitHub.Thunderhorse.showHorse()
    })
}, GitHub.Thunderhorse.generateSessionID = function () {
    return Math.ceil(Math.random() * Math.pow(36, 5)).toString(36)
}, GitHub.Thunderhorse.showHorse = function () {
    $("body").append('<img class="thunder-horse" src="https://img.skitch.com/20110810-njy5tnyabug5fn5j6sdcs9urk.png">'), $(".thunder-horse").css({
        position: "fixed",
        bottom: 10,
        left: 10
    })
}, $(function () {
    var a = $.cookie("tracker"),
        b = null;
    a == null && (b = document.referrer ? document.referrer : "direct");
    var c = getParams();
    c.utm_campaign && $.trim(c.utm_campaign) != "" && (b = c.utm_campaign), c.referral_code && $.trim(c.referral_code) != "" && (b = c.referral_code), b != null && $.cookie("tracker", b, {
        expires: 7,
        path: "/"
    })
}), function (a) {
    a.fn.commitishSelector = function (b) {
        var c = a.extend({}, a.fn.commitishSelector.defaults, b);
        return this.each(function () {
            var b = a(this),
                c = b.closest(".js-menu-container"),
                d = b.closest(".context-pane"),
                e = b.find(".selector-item"),
                f = b.find(".branch-commitish"),
                g = b.find(".tag-commitish"),
                h = b.find(".no-results"),
                i = b.find(".commitish-filter"),
                j = "branches",
                k = null;
            b.find(".tabs a").click(function () {
                return b.find(".tabs a.selected").removeClass("selected"), a(this).addClass("selected"), j = a(this).attr("data-filter"), n(), !1
            }), i.keydown(function (a) {
                switch (a.which) {
                case 38:
                case 40:
                case 13:
                    return !1
                }
            }), i.keyup(function (b) {
                var c = e.filter(".current:visible");
                switch (b.which) {
                case 38:
                    return l(c.prevAll(".selector-item:visible:first")), !1;
                case 40:
                    return c.length ? l(c.nextAll(".selector-item:visible:first")) : l(a(e.filter(":visible:first"))), !1;
                case 13:
                    var d = c;
                    if (d.length == 0) {
                        var f = e.filter(":visible");
                        f.length == 1 && (d = a(f[0]))
                    }
                    return m(d), !1
                }
                k = a(this).val(), n()
            }), c.bind("menu:deactivate", function () {
                r(), i.val(""), i.trigger("keyup")
            }), c.bind("menu:activated", function () {
                setTimeout(function () {
                    i.focus()
                }, 100)
            });
            var l = function (a) {
                    if (a.length == 0) return;
                    e.filter(".current").removeClass("current"), a.addClass("current")
                },
                m = function (a) {
                    if (a.length == 0) return;
                    document.location = a.find("a").attr("href")
                },
                n = function () {
                    var b = null;
                    j == "branches" ? (g.hide(), b = f) : (f.hide(), b = g);
                    if (k != "" && k != null) {
                        var c = !0;
                        b.each(function () {
                            var b = a(this),
                                d = b.find("h4").text().toLowerCase();
                            d.score(k) > 0 ? (b.show(), c = !1) : b.hasClass("selected") || b.hide()
                        }), c ? h.show() : h.hide()
                    } else b.each(function () {
                        a(this).show()
                    }), b.length == 0 ? h.show() : h.hide()
                };
            n();
            var o = function () {
                    d.find(".body").append('<div class="loader">Loadingâ€¦</div>')
                },
                p = function () {
                    d.find(".body .loader").remove()
                },
                q = function (a) {
                    a == null && (a = "Sorry, an error occured"), d.find(".body").append('<div class="error-message">' + a + "</div>")
                },
                r = function () {
                    d.find(".body .error-message").remove()
                }
        })
    }, a.fn.commitishSelector.defaults = {}
}(jQuery), $(document).pageUpdate(function () {
    var a = $(".repo-tree");
    if (!a[0]) return;
    var b = a.attr("data-master-branch"),
        c = a.attr("data-ref");
    if (!c) return;
    $(this).find("a.js-rewrite-sha").each(function () {
        var a = $(this).attr("href"),
            d = a.replace(/[0-9a-f]{40}/, c),
            e = new RegExp("/tree/" + b + "$");
        d = d.replace(e, ""), d != a && $(this).attr("href", d)
    })
}), GitHub.CachedCommitDataPoller = function (a, b) {
    var c = $(b || document).find(".js-loading-commit-data");
    if (c.length == 0) return;
    var d = $("#slider .frame-center"),
        e = d.data("path").replace(/\/$/, "");
    $.smartPoller(a || 2e3, function (a) {
        $.ajax({
            url: d.data("cached-commit-url"),
            dataType: "json",
            error: function (b) {
                b.status == 201 ? a() : c.html('<img src="/images/modules/ajax/error.png"> Something went wrong.')
            },
            success: function (a, c, e) {
                debug("success: %s", this.url);
                var f = d.data("cached-commit-url").replace(/\/cache\/.+/, "/commit/");
                for (var g in a) {
                    if ($("#" + g).length == 0) continue;
                    var h = $("#" + g).parents("tr:first");
                    h.find(".age").html('<time class="js-relative-date" datetime="' + $.toISO8601(new Date(a[g].date)) + '">' + a[g].date + "</time>");
                    var i;
                    a[g].login ? i = '<a href="/' + a[g].login + '">' + a[g].login + "</a>" : i = a[g].author, h.find(".message").html('<a href="' + f + a[g].commit + '" class="message">' + a[g].message + "</a>" + " [" + i + "]")
                }
                $(b || document.body).trigger("pageUpdate")
            }
        })
    })
}, $(document).pageUpdate(function () {
    $("#slider .frame-center #readme").length > 0 ? $("#read_more").show() : $("#read_more").hide()
}), $(function () {
    $(".subnav-bar").delegate(".js-commitish-button", "click", function (a) {
        a.preventDefault()
    }), $.hotkey("w", function () {
        $(".js-commitish-button").click()
    }), $(".js-filterable-commitishes").commitishSelector(), $(".pagehead .subnav-bar")[0] && $(".pagehead .subnav-bar a[data-name]").live("mousedown", function () {
        if (GitHub.actionName != "show") return;
        var a = $(this).attr("data-name");
        console.log("REF", a);
        var b = "/" + GitHub.nameWithOwner + "/" + GitHub.controllerName + "/" + a;
        GitHub.currentPath != "" && (b += "/" + GitHub.currentPath), b != $(this).attr("href") && $(this).attr("href", b)
    }), GitHub.CachedCommitDataPoller(), $("#colorpicker")[0] && $("#colorpicker").farbtastic("#color")
}), GitHub.TreeFinder = function () {
    if ($("#slider").length == 0) return;
    var a = this;
    $.hotkeys({
        t: function () {
            return a.show(), !1
        }
    })
}, GitHub.TreeFinder.prototype = {
    fileList: null,
    recentFiles: [],
    currentFinder: null,
    currentInput: null,
    show: function () {
        if (this.currentFinder) return;
        var a = this,
            b;
        a.currentFinder = $(".tree-finder").clone().show(), a.currentInput = a.currentFinder.find("input"), slider.slideForwardToLoading(), b = a.currentFinder.find(".breadcrumb").detach().addClass("js-tree-finder-breadcrumb"), $("#slider .breadcrumb:visible").hide().after(b), $("#slider").bind("slid", function () {
            $("#slider .frame-center").is(":not(.tree-finder)") && a.hide()
        }), a.attachBehaviors()
    },
    hide: function () {
        if (!this.currentFinder) return;
        var a = this;
        a.currentInput.blur(), a.currentFinder.remove(), $(".js-tree-finder-breadcrumb").remove(), a.currentFinder = a.currentInput = null, $("#slider").unbind("slid")
    },
    attachBehaviors: function () {
        var a = this,
            b = !0,
            c = null,
            d = null;
        a.loadFileList(), $(".js-dismiss-tree-list-help").live("click", function () {
            return $.post(this.getAttribute("href")), $(this).closest(".octotip").fadeOut(function () {
                $(".tree-finder .octotip").remove()
            }), a.currentInput.focus(), !1
        }), $("tbody.js-results-list tr", a.currentFinder).live("mouseover", function (c) {
            if (!b) return;
            a.currentFinder && a.currentFinder.find("tr.current").removeClass("current"), $(this).addClass("current")
        }), a.currentFinder.find(".js-results-list").delegate("a", "click", function () {
            var b = $(this).text(),
                c = $.inArray(b, a.recentFiles);
            c > -1 && a.recentFiles.splice(c, 1), a.recentFiles.unshift(b), a.currentInput.blur(), $(document).unbind("keydown.treeFinder");
            if (slider.enabled) return !0;
            document.location = $(this).attr("href")
        }), $("tr td.icon", a.currentFinder).live("click", function () {
            $(this).parents("tr:first").find("td a").click()
        }), $(document).bind("keydown.treeFinder", function (a) {
            if (a.keyCode == 27) return !slider.sliding && $("#slider .frame-center").is(".tree-finder") && (slider.slideBackTo(location.pathname), $(document).unbind("keydown.treeFinder")), !1
        }), a.currentInput.focus().keyup(function () {
            c && clearTimeout(c), c = setTimeout(function () {
                c = null, b = !0
            }, 250)
        }).keydown(function (c) {
            function g(a) {
                if (e.length == 0) return !1;
                f = a == "up" ? e.prev("tr") : e.next("tr");
                if (f.length) {
                    b = !1, e.removeClass("current"), f.addClass("current");
                    var c = 100,
                        d = $(window),
                        g = d.height(),
                        h = f.offset().top - c,
                        i = f.offset().top + f.outerHeight() + c;
                    h < d.scrollTop() ? d.scrollTop() > c && d.scrollTop(h) : i > d.scrollTop() + g && d.scrollTop(i - g)
                }
                return !1
            }
            var e = a.currentFinder.find("tr.current"),
                f = null;
            switch (c.which) {
            case 9:
            case 16:
            case 17:
            case 18:
            case 91:
            case 93:
                return !1;
            case 78:
                if (c.ctrlKey) return g("down");
                return;
            case 80:
                if (c.ctrlKey) return g("up");
                return;
            case 38:
                return g("up");
            case 40:
                return g("down");
            case 13:
                if (e.length == 0) return !1;
                return e.find("a").click(), !1
            }
            d && clearTimeout(d), d = setTimeout(function () {
                d = null, a.updateResults()
            }, 100)
        })
    },
    loadFileList: function () {
        var a = this,
            b = function () {
                a.loadedFileList()
            };
        a.fileList ? b() : $.ajax({
            url: $("#slider .frame-center").data("tree-list-url"),
            error: function (c) {
                a.currentFinder && (a.fileList = [], a.currentFinder.find(".js-no-results th").text("Something went wrong"), b())
            },
            success: function (c, d, e) {
                c ? a.fileList = $.trim(c).split("\n") : a.fileList = [], b()
            }
        })
    },
    loadedFileList: function () {
        var a = this;
        if (!a.currentFinder) return;
        $("#slider .frame-center").replaceWith(a.currentFinder), a.updateResults()
    },
    updateResults: function () {
        var a = this;
        if (a.currentFinder && a.fileList) {
            var b = a.currentInput.val(),
                c = [],
                d = a.currentFinder.find(".js-results-list"),
                e = "",
                f = 0;
            b ? c = a.findMatchingFiles(b) : a.recentFiles.length ? (c = a.recentFiles.slice(1, 6), c.length < 20 && (c = c.concat(a.fileList.slice(0, 20 - c.length)))) : c = a.fileList;
            if (c.length <= 0) d[0].innerHTML = "", a.currentFinder.find(".js-no-results").show(), a.currentFinder.find(".js-header").hide();
            else {
                a.currentFinder.find(".js-no-results").hide(), a.currentFinder.find(".js-header").show(), c = c.slice(0, 50);
                var g, h = this.regexpForQuery(b),
                    i = function (a, b) {
                        return b % 2 == 1 ? "<b>" + a + "</b>" : a
                    };
                for (f = 0; f < c.length; f++) {
                    g = (c[f].match(h) || []).slice(1).map(i).join("");
                    var j = $("#slider .frame-center").data("blob-url-prefix") + "/" + c[f];
                    e += '<tr><td class="icon"><img src="/images/icons/txt.png"></td><td><a class="js-slide-to js-rewrite-sha" href="' + j + '">' + g + "</a></td></tr>"
                }
                d[0].innerHTML = e, d.find("tr:first").addClass("current"), $(d).trigger("pageUpdate")
            }
        }
    },
    findMatchingFiles: function (a) {
        if (!a) return [];
        var b = this,
            c = [],
            d = 0,
            e, f, g, h;
        a = a.toLowerCase(), e = this.regexpForQuery(a);
        for (d = 0; d < b.fileList.length; d++) {
            f = b.fileList[d], g = f.toLowerCase();
            if (f.match(/^vendor\/(cache|rails|gems)/)) continue;
            if (f.match(/(dot_git|\.git\/)/)) continue;
            if (f.match(/MathJax/)) continue;
            g.match(e) && (h = g.score(a), h > 0 && (a.match("/") || (g.match("/") ? h += g.replace(/^.*\//, "").score(a) : h *= 2), c.push([h, f])))
        }
        return $.map(c.sort(function (a, b) {
            return b[0] - a[0]
        }), function (a) {
            return a[1]
        })
    },
    regexpForQuery: function (a) {
        var b = "+.*?[]{}()^$|\\".replace(/(.)/g, "\\$1"),
            c = new RegExp("\\(([" + b + "])\\)", "g");
        return new RegExp("(.*)" + a.toLowerCase().replace(/(.)/g, "($1)(.*?)").replace(c, "(\\$1)") + "$", "i")
    }
}, $(function () {
    window.treeFinder = new GitHub.TreeFinder
}), GitHub.TreeSlider = function () {
    if (!Modernizr.history) return;
    if ($("#slider").length == 0) return;
    if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) return;
    var a = this;
    a.enabled = !0, $("#slider a.js-slide-to, .breadcrumb a").live("click", function (b) {
        return a.clickHandler(b)
    }), $(window).bind("popstate", function (b) {
        a.popStateHandler(b.originalEvent)
    })
}, GitHub.TreeSlider.prototype = {
    enabled: !1,
    sliding: !1,
    slideSpeed: 400,
    frameForPath: function (a) {
        return $('.frame[data-path="' + a + '"]')
    },
    frameForURL: function (a) {
        return this.frameForPath(this.pathFromURL(a))
    },
    pathFromURL: function (a) {
        if (!a) return;
        var b = $(" .repo-tree").attr("data-ref"),
            c = new RegExp("/(tree|blob)/" + (b || "[^/]+") + "/"),
            d = a.split(c)[2] || "/";
        return d.slice(d.length - 1, d.length) != "/" && (d += "/"), unescape(d)
    },
    scrollToBreadcrumb: function () {
        this.visibleInBrowser(".breadcrumb:visible") || $(".breadcrumb:visible").scrollTo(50)
    },
    visibleInBrowser: function (a) {
        var b = $(window).scrollTop(),
            c = b + $(window).height(),
            d = $(a).offset().top,
            e = d + $(a).height();
        return e >= b && d <= c
    },
    clickHandler: function (a) {
        if (a.which == 2 || a.metaKey || a.ctrlKey) return !0;
        if (this.sliding) return !1;
        var b = a.target.href,
            c = this.pathFromURL(b);
        return window.history.pushState({
            path: c
        }, "", b), typeof _gaq != "undefined" && _gaq.push(["_trackPageview"]), this.slideTo(b), !1
    },
    popStateHandler: function (a) {
        this.slideTo(location.pathname)
    },
    doneSliding: function () {
        $("#slider").trigger("pageUpdate");
        if (!this.sliding) return;
        this.sliding = !1, $("#slider .frame-center").nextAll(".frame").hide(), $("#slider .frame-center").prevAll(".frame").css("visibility", "hidden");
        var a = $(".frame-loading:visible");
        a.length ? a.removeClass("frame-loading") : $("#slider").trigger("slid")
    },
    slideTo: function (a) {
        var b = this.pathFromURL(a),
            c = this.frameForPath(b),
            d = $("#slider .frame-center").attr("data-path") || "";
        c.is(".frame-center") || (d == "/" || b.split("/").length > d.split("/").length ? this.slideForwardTo(a) : this.slideBackTo(a))
    },
    slideForwardTo: function (a) {
        debug("Sliding forward to %s", a);
        var b = this.frameForURL(a);
        if (b.length) this.slideForwardToFrame(b);
        else {
            var c = this.slideForwardToLoading();
            this.loadFrame(a, function (a) {
                c.replaceWith($(a).find(".frame-center"))
            })
        }
    },
    slideForwardToFrame: function (a) {
        if (this.sliding) return;
        this.sliding = !0;
        var b = this;
        $("#slider .frame-center").after(a.css("marginLeft", 0)).addClass("frame").removeClass("frame-center").animate({
            marginLeft: "-1200px"
        }, this.slideSpeed, function () {
            b.doneSliding()
        }), this.makeCenterFrame(a), this.setFrameTitle(a), this.setFrameCanonicalURL(a)
    },
    slideForwardToLoading: function () {
        var a = $(".frame-loading").clone();
        return a.find("img").hide(), setTimeout(function () {
            a.find("img").show()
        }, 500), $(".frames").append(a), this.slideForwardToFrame(a), a
    },
    slideBackTo: function (a) {
        debug("Sliding back to %s", a);
        var b = this.frameForURL(a);
        if (b.length) this.slideBackToFrame(b);
        else {
            var c = this.slideBackToLoading(),
                d = this.pathFromURL(a);
            this.loadFrame(a, function (a) {
                var b = $(a).find(".frame-center");
                c.replaceWith(b)
            })
        }
    },
    slideBackToFrame: function (a) {
        if (this.sliding) return;
        this.sliding = !0, $("#slider .frame-center").before(a.css("marginLeft", "-1200px")).addClass("frame").removeClass("frame-center");
        var b = this;
        a.animate({
            marginLeft: "0"
        }, this.slideSpeed, function () {
            b.doneSliding()
        }), this.makeCenterFrame(a), this.setFrameTitle(a), this.setFrameCanonicalURL(a)
    },
    slideBackToLoading: function () {
        var a = $(".frame-loading").clone();
        return a.find("img").hide(), setTimeout(function () {
            a.find("img").show()
        }, 350), $(".frames").prepend(a.show()), slider.slideBackToFrame(a), a
    },
    makeCenterFrame: function (a) {
        a.css("visibility", "visible").show().addClass("frame-center"), this.scrollToBreadcrumb();
        var b = $('.breadcrumb[data-path="' + a.attr("data-path") + '"]');
        b.length > 0 && ($(".breadcrumb:visible").hide(), b.show());
        var c = $('.announce[data-path="' + a.attr("data-path") + '"]');
        $(".announce").fadeOut(), c.length > 0 && c.fadeIn();
        var d = $(".js-ufo[data-path=" + a.attr("data-path") + "]");
        $(".js-ufo").fadeOut(), d.length > 0 && d.fadeIn()
    },
    setFrameTitle: function (a) {
        var b = a.attr("data-title");
        b && (document.title = b)
    },
    setFrameCanonicalURL: function (a) {
        var b = a.attr("data-permalink-url");
        b && $("link[rel=permalink]").attr("href", b)
    },
    loadFrame: function (a, b) {
        debug("Loading " + a + "?slide=1");
        var c = this;
        $.ajax({
            url: a + "?slide=1",
            cache: !1,
            success: function (d) {
                b.call(this, d), $("#slider").trigger("slid"), $("#slider .breadcrumb").hide().last().after($(d).find(".breadcrumb")), $("#slider .breadcrumb").trigger("pageUpdate");
                var e = c.frameForURL(a);
                e.trigger("pageUpdate"), GitHub.CachedCommitDataPoller(50, e), GitHub.Blob.show(), c.setFrameTitle(e), c.setFrameCanonicalURL(e)
            },
            error: function () {
                $("#slider .frame-center").html("<h3>Something went wrong.</h3>")
            },
            complete: function () {
                c.sliding = !1
            }
        })
    }
}, $(function () {
    window.slider = new GitHub.TreeSlider
}), $.fn.ufo = function () {
    if (this.length) {
        var a = this.find("canvas").get(0),
            b = JSON.parse(this.find("div").text());
        GitHub.UFO.drawFont(a, b)
    }
    return this
}, GitHub.UFO = {
    drawFont: function (a, b) {
        var c = a.getContext("2d");
        for (var d = 0; d < b.length; d++) {
            c.save();
            var e = d % 9 * 100,
                f = Math.floor(d / 9) * 100;
            c.translate(e + 10, f + 80), c.scale(.1, -0.1);
            var g = new GitHub.UFO.Glif(c, b[d]);
            g.draw(), c.restore()
        }
    }
}, GitHub.UFO.Glif = function (a, b) {
    this.ctx = a, this.contours = b
}, GitHub.UFO.Glif.prototype = {
    draw: function () {
        this.ctx.beginPath();
        for (var a = 0; a < this.contours.length; a++) this.drawContour(this.contours[a]);
        this.ctx.fillStyle = "black", this.ctx.fill()
    },
    drawContour: function (a) {
        for (var b = 0; b < a.length; b++) b == 0 ? this.moveVertex(a[b]) : this.drawVertex(a[b]);
        this.drawVertex(a[0])
    },
    moveVertex: function (a) {
        this.ctx.moveTo(a[0], a[1])
    },
    drawVertex: function (a) {
        a.length == 2 ? this.ctx.lineTo(a[0], a[1]) : a.length == 4 ? this.ctx.quadraticCurveTo(a[2], a[3], a[0], a[1]) : a.length == 6 && this.ctx.bezierCurveTo(a[2], a[3], a[4], a[5], a[0], a[1])
    }
}, $(document).ready(function () {
    $(".glif_diff").each(function (el) {
        var sha = $(this).attr("rel"),
            ctx = this.getContext("2d"),
            data = eval("glif_" + sha),
            glif = new GitHub.UFO.Glif(ctx, data);
        ctx.translate(0, 240), ctx.scale(.333, -0.333), glif.draw()
    })
}), Modernizr.canvas && $(document).pageUpdate(function () {
    $(this).find(".js-ufo").ufo()
}), $(function () {
    $("a.follow").click(function () {
        return $.post(this.href, {}), $(this).parent().find(".follow").toggle(), !1
    }), $(".js-repo-filter").repoList(), $("#inline_visible_repos").click(function () {
        var a = $(this).spin(),
            b = window.location + "/ajax_public_repos";
        return $(".projects").load(b, function () {
            a.stopSpin(), $(".repositories").trigger("pageUpdate")
        }), a.hide(), !1
    }), $("#edit_user .info .rename").click(function () {
        return $("#edit_user .username").toggle(), $("#user_rename").toggle(), !1
    }), $("#user_rename > input[type=submit]").click(function () {
        if (!confirm(GitHub.rename_confirmation())) return !1
    }), $("#facebox .rename-warning button").live("click", function () {
        return $("#facebox .rename-warning, #facebox .rename-form").toggle(), !1
    }), $("#reveal_cancel_info").click(function () {
        return $(this).toggle(), $("#cancel_info").toggle(), !1
    }), $("#cancel_plan").submit(function () {
        var a = "Are you POSITIVE you want to delete this account? There is absolutely NO going back. All repositories, comments, wiki pages - everything will be gone. Please consider downgrading the account's plan.";
        return confirm(a)
    }), window.location.href.match(/account\/upgrade$/) && $("#change_plan_toggle").click()
}), $(function () {
    function c() {
        var a = $("#current-version").val();
        a && $.get("_current", function (d) {
            a == d ? setTimeout(c, 5e3) : b || ($("#gollum-error-message").text("Someone has edited the wiki since you started. Please reload this page and re-apply your changes."), $("#gollum-error-message").show(), $("#gollum-editor-submit").attr("disabled", "disabled"), $("#gollum-editor-submit").attr("value", "Cannot Save, Someone Else Has Edited"))
        })
    }
    var a = $("#wiki-upgrading");
    a[0] && a.redirector({
        url: a.attr("data-url"),
        to: a.attr("data-to")
    }), $("#see-more-elsewhere").click(function () {
        return $(".seen-elsewhere").show(), $(this).remove(), !1
    });
    var b = !1;
    $("#gollum-editor-body").each(c), $("#gollum-editor-submit").click(function () {
        b = !0
    });
    var d = [];
    $("form#history input[type=submit]").attr("disabled", !0), $("form#history input[type=checkbox]").change(function () {
        var a = $(this).val(),
            b = $.inArray(a, d);
        if (b > -1) d.splice(b, 1);
        else {
            d.push(a);
            if (d.length > 2) {
                var c = d.shift();
                $("input[value=" + c + "]").attr("checked", !1)
            }
        }
        $("form#history tr.commit").removeClass("selected"), $("form#history input[type=submit]").attr("disabled", !0);
        if (d.length == 2) {
            $("form#history input[type=submit]").attr("disabled", !1);
            var e = !1;
            $("form#history tr.commit").each(function () {
                e && $(this).addClass("selected"), $(this).find("input:checked").length > 0 && (e = !e), e && $(this).addClass("selected")
            })
        }
    })
})
