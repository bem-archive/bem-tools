var force, path, circle, text, nodes, links;

function processSnapshot(url) {
    var w = $(window).width() - $('.b-snapshots').width(),
        h = $(window).height(),
        r = 6;

    d3.json(url, function(json) {
        var fill = d3.scale.category20(),
            children = {}, parents = {};

        nodes = json.nodes;
        links = json.links;

        links.forEach(function(l) {
            var deps = children[l.source] = (children[l.source] || []);
            deps.push(nodes[l.target]);
            nodes[l.source].children = deps.length;

            deps = parents[l.target] = (parents[l.target] || []);
            deps.push(nodes[l.source]);
            nodes[l.target].parents = deps.length;
        });

        var linkedByIndex = {};
        json.links.forEach(function(d) {
            linkedByIndex[d.source + ',' + d.target] = 1;
        });

        var isConnected = function(a, b) {
            var ia = nodes.indexOf(a),
                ib = nodes.indexOf(b);

            return linkedByIndex[ia + ',' + ib] || linkedByIndex[ib + ',' + ia] || ia == ib;
        }

                nodes[0].x = w / 2;
                nodes[0].y = 100;
                nodes[0].fixed = true;

        force = d3.layout.force()
            .size([w, h])
            .on('tick', tick)
            .gravity(.05)
            .distance(function(l, i) {
                var t = l.target;
                if (t.children > 2 && t.expanded) return 300;

                return 100;
            })
            .charge(function(d, i) {
              if (d.size > 0) return -5000;
              else return -1000;
            })
            .friction(0.3);

        var svg = d3.select('#archpanel').insert('svg:svg')
            .attr('width', w)
            .attr('height', '98%')
            .attr('pointer-events', 'all')
            .append('svg:g')
            .call(d3.behavior.zoom().on('zoom', function() {
                var trans = d3.event.translate;
                var scale = d3.event.scale;

                svg.attr('transform',
                    'translate(' + trans + ')'
                        + ' scale(' + scale + ')');
        })).append('svg:g');

        var pg = svg.append('svg:g');
        var cg = svg.append('svg:g');

        pg.append('svg:defs').selectAll('marker')
            .data(['normal', 'faded'])
            .enter().append('svg:marker')
            .attr('id', String)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 15)
            .attr('refY', -1.5)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

        var f = filterNodes();
        expandNode(f.nodes[0], true);

        force
            .nodes(f.nodes)
            .links(f.links);

        update();

        function filterNodes() {
            return {
                nodes: [findRoot()],
                links: []
            }
        }

        function findRoot() {
            for(var i = 0; i < nodes.length; i++) {
                if (!nodes[i].parents) return nodes[i];
            }
            return nodes[0];
        }

        function update() {

            path = pg.selectAll('path.link.normal')
                .data(f.links, function(d) {
                    return d.source.name + "-" + d.target.name;
                });

            path.enter()
                .insert('svg:path')
                .attr('class', function(d) {
                    return 'link normal';
                })
                .attr('marker-end', function(d) {
                    return 'url(#' + 'normal' + ')';
                });

            path.exit().remove();

            circle = cg.selectAll('g.node')
                .data(f.nodes, function(d) {
                    return d.name;
                });

            circle
                .exit()
                .remove();

            var newNode = circle
                .enter()
                .append('g')
                .attr('class', 'node')
                .call(force.drag);

            newNode.append('svg:circle')
                .style('fill', color)
                .on('click', click)
                .on('mouseover', fade(.1)).on('mouseout', fade(1));

            newNode.append('text')
                .attr('dx', 12)
                .attr("dy", ".35em")
                .text(function(d) { return d.name });


            cg.selectAll('g.node circle')
                .attr('r', function(d) {
                    if (d.expanded || !d.children) return r;
                    return r * 1.5;
                });

            force.start();
        }

        function fade(opacity) {
            return function(d) {
                circle.style('stroke-opacity', function(o) {
                    var thisOpacity = isConnected(d, o)? 1 : opacity;
                    this.setAttribute('fill-opacity', thisOpacity);
                    return thisOpacity;
                });

                path.style('stroke-opacity', function(o) {
                    return o.source === d || o.target === d? 1 : opacity;
                })
                .attr('marker-end', function(o) {
                    var style = opacity === 1? 'normal' : 'faded';
                    return 'url(#' + (o.source === d || o.target === d? 'normal' : style) + ')';
                });
            };
        }


        function color(d) {
            return fill(d.type);
        }


        function expandNode(node, create) {
            var index = nodes.indexOf(node);

            if (children[index]) {
                for(var i = 0; i < children[index].length; i++) {
                    var child = children[index][i];
                    if (create && !~f.nodes.indexOf(child)) f.nodes.push(child);

                    if (~f.nodes.indexOf(child))
                        f.links.push({
                            source: f.nodes.indexOf(node),
                            target: f.nodes.indexOf(child)
                        });

                    // uncomment to establish the links of the expanded node children with existing nodes
                    //if (create) expandNode(child);
                }

                node.expanded = create;
            }
        }

        function removeNode(node) {
            var index = nodes.indexOf(node);

            if (children[index]) {
                for(var i = 0; i < children[index].length; i++) {
                    var child = children[index][i];
                    if (~f.nodes.indexOf(child)) {
                        removeNode(child);
                    }
                }
            }

            var findex = f.nodes.indexOf(node);

            for(var i = f.links.length-1; i >= 0; i--) {
                var link = f.links[i];

                if (link.source === findex || link.target === node) {
                    f.links.splice(i, 1);
                }

                else {
                    if (link.source.index > findex) link.source.index--;
                    if (link.target.index > findex) link.target.index--;
                }
            }

            f.nodes.splice(findex, 1);
            node.expanded = false;
        }

        function collapseNode(node) {
            var index = nodes.indexOf(node);

            if (children[index]) {
                for(var i = 0; i < children[index].length; i++) {
                    var child = children[index][i];
                    if (~f.nodes.indexOf(child)) {
                        removeNode(child);
                    }
                }

                node.expanded = false;
            }
        }

        function click(d) {
            if (d.expanded) collapseNode(d)
            else expandNode(d, true);

            update();
        }

        function tick(e) {
            path.attr('d', function(d) {
                var dx = (d.target.x - d.source.x),
                    dy = (d.target.y - d.source.y),
                    dr = Math.sqrt(dx * dx + dy * dy);
                return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
            });

            circle.attr("transform", function(d) { return 'translate(' + d.x + ','+ d.y + ')'; });
        }
    });
}


$(function() {
    var refresh = function() {
        $.getJSON('snapshots', function(data) {
            $('.b-snapshots__list').empty();

            var items = [];
            data.sort();

            $.each(data, function(key, val) {

                items.push('<li class="b-snapshot"><a class="b-snapshot__a" href="snapshots/' + val + '">' +
                    val.replace(/^\d+\_/, '').replace(/\.json$/, '')
                    + '</a></li>');
            });

            $('<ul/>', {
                class: 'b-list',
                html: items.join('')
            }).appendTo('.b-snapshots__list');

            $('.b-snapshot__a').click(function(item) {
                $('#archpanel').empty();
                processSnapshot(item.target.href);
                return false;
            });
        })
    };

    $('#btnFix').click(function() {
        circle && circle.attr('fixed', function(d) {
            d.fixed = true;
        });
        force.linkStrength(0);
    });

    $('#btnUnfix').click(function() {
        circle && circle.attr('fixed', function(d) {
            if (d !== nodes[0]) d.fixed = false;
        });
    });

    $('#refreshSnapshots').click(refresh);

    refresh();
});
