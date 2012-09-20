
var force, path, circle, text, nodes;

function processSnapshot(url) {
    var w = $(window).width() - $('.b-snapshots').width(),
        h = $(window).height(),
        r = 6;

    d3.json(url, function(json) {
        var fill = d3.scale.category20(),
            links = json.links,
            linkedNodes = {};

        nodes = json.nodes;

        links.forEach(function(l) {
            var deps = linkedNodes[l.source] = (linkedNodes[l.source] || []);
            deps.push(nodes[l.target]);
        });

        var linkedByIndex = {};
        json.links.forEach(function(d) {
            linkedByIndex[d.source + ',' + d.target] = 1;
        });

        var isConnected = function (a, b) {
            return linkedByIndex[a.index + ',' + b.index] || linkedByIndex[b.index + ',' + a.index] || a.index == b.index;
        }

        nodes[0].x = w / 2;
        nodes[0].y = 100;
        nodes[0].fixed = true;

        force = d3.layout.force()
            .size([w, h])
            .gravity(0)
            .charge(-60)
            .on('tick', tick)
            .linkDistance(function(link, index) {
                var cindex = linkedNodes[link.source.index].indexOf(json.nodes[link.target.index]) + 1;
                return cindex * 100;
            });

        var svg = d3.select('#archpanel').insert('svg:svg')
            .attr('width', w)
            .attr('height', '98%')
            .attr('pointer-events', 'all')
            .append('svg:g')
            .call(d3.behavior.zoom().on('zoom', function() {
                trans = d3.event.translate;
                scale = d3.event.scale;

                svg.attr('transform',
                'translate(' + trans + ')'
                    + ' scale(' + scale + ')');
            }))
            .append('svg:g');


        svg.append('svg:defs').selectAll('marker')
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

        update();

        function update() {
            force
                .nodes(nodes)
                .links(links)
                .start();

            path = svg.selectAll('path.link.normal')
                .data(links, function(d) {
                    return d.target.index;
                });

            path.enter()
                .append('svg:path')
                .attr('class', function(d) {
                    return 'link normal';
                })
                .attr('marker-end', function(d) {
                    return 'url(#' + 'normal' + ')';
                });

            circle = svg.selectAll('circle')
                .data(nodes, function(d) {
                    return d.name;
                })
                .style('fill', color);

            circle.enter()
                .append('svg:circle')
                .attr('r', r)
                .style('fill', color)
                .on('click', click)
                .call(force.drag)
                .on('mouseover', fade(.1)).on('mouseout', fade(1));


            text = svg.append('svg:g').selectAll('g')
                .data(force.nodes())
                .enter().append('svg:g');

            // A copy of the text with a thick white stroke for legibility.
            /*
            text.append('svg:text')
                .attr('x', 8)
                .attr('y', '.31em')
                .attr('class', 'shadow')
                .text(function(d) {
                    return d.name;
                });
            */

            text.append('svg:text')
                .attr('x', 8)
                .attr('y', '.31em')
                .text(function(d) {
                    return d.name;
                });
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

        function click(d) {
            d.fixed = !d.fixed;
        }

        function tick(e) {
            var kx = .4 * e.alpha, ky = 1.4 * e.alpha;

            force.links().forEach(function(d, i) {
                d.target.x += (d.source.x - d.target.x) * kx;
                d.target.y += (d.source.y + 80 - d.target.y) * ky;
            });

            path.attr('d', function(d) {
                var dx = (d.target.x - d.source.x),
                    dy = (d.target.y - d.source.y),
                    dr = Math.sqrt(dx * dx + dy * dy);
                return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
            });

            circle.attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });

            text.attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
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
