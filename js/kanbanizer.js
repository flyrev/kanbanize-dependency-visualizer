const mainContainer = ".js-board";

function waitForKeyElements(
  selectorTxt,    /* Required: The jQuery selector string that
                        specifies the desired element(s).
                    */
  actionFunction, /* Required: The code to run when elements are
                        found. It is passed a jNode to the matched
                        element.
                    */
  bWaitOnce,      /* Optional: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
  iframeSelector  /* Optional: If set, identifies the iframe to
                        search.
                    */
) {
  var targetNodes, btargetsFound;

  if (typeof iframeSelector == "undefined")
    targetNodes = $(selectorTxt);
  else
    targetNodes = $(iframeSelector).contents()
      .find(selectorTxt);

  if (targetNodes && targetNodes.length > 0) {
    btargetsFound = true;
    /*--- Found target node(s).  Go through each and act if they
        are new.
    */
    targetNodes.each(function () {
      var jThis = $(this);
      var alreadyFound = jThis.data('alreadyFound') || false;

      if (!alreadyFound) {
        //--- Call the payload function.
        var cancelFound = actionFunction(jThis);
        if (cancelFound)
          btargetsFound = false;
        else
          jThis.data('alreadyFound', true);
      }
    });
  }
  else {
    btargetsFound = false;
  }

  //--- Get the timer-control variable for this selector.
  var controlObj = waitForKeyElements.controlObj || {};
  var controlKey = selectorTxt.replace(/[^\w]/g, "_");
  var timeControl = controlObj[controlKey];

  //--- Now set or clear the timer as appropriate.
  if (btargetsFound && bWaitOnce && timeControl) {
    //--- The only condition where we need to clear the timer.
    clearInterval(timeControl);
    delete controlObj[controlKey]
  }
  else {
    //--- Set a timer, if needed.
    if (!timeControl) {
      timeControl = setInterval(function () {
        waitForKeyElements(selectorTxt,
          actionFunction,
          bWaitOnce,
          iframeSelector
        );
      },
        300
      );
      controlObj[controlKey] = timeControl;
    }
  }
  waitForKeyElements.controlObj = controlObj;
}

(function () {
  'use strict';
  waitForKeyElements(mainContainer, function (node) {

    (() => {
      function getVisibleLinks(container) {
        const selection = d3.select(container).selectAll('.js-card-link,.eve-initiative-link,.js-initiative-link,.eve-card-link').filter(function () { return this.offsetHeight != 0; });
        console.log("Visible links: " + selection);
        return selection;
      }

      function buildDefs() {
        let svg = d3.select(document.body).append('svg').attr('id', 'kanbanizer-defs');

        const types = ['successor', 'parent', 'predecessor', 'child'];
        let defs = svg.append('defs');

        // the "pointers" (arrows) at each side
        defs.selectAll('marker.arrow-end').data(types).enter().append('marker')
          .attr('class', 'arrow-end')
          .attr('class', function (d) { return 'arrow-end arrow-end-' + d; })
          .attr('id', function (d) { return 'arrow-end-' + d; })
          .attr('viewBox', '0 0 40 20')
          .attr('markerWidth', 20).attr('markerHeight', 100)
          .attr('refY', 10).attr('refX', 36)
          .attr('orient', 'auto')
          .style("fill", "yellow")
          .style("stroke", "black")
          .style("stroke-width", "2px")
          .append('path').attr('d', 'M0,0 L40,10 L0,20');

        defs.selectAll('marker.arrow-start').data(types).enter().append('marker')
          .attr('class', 'arrow-start')
          .attr('class', function (d) { return 'arrow-start arrow-start-' + d; })
          .attr('id', function (d) { return 'arrow-start-' + d; })
          .attr('viewBox', '0 0 20 60')
          .attr('markerWidth', 10).attr('markerHeight', 10)
          .attr('refY', 30).attr('refX', 0)
          .attr('orient', 'auto')
          .append('path')
          //.attr('d','M0,0 L0,0 L0,0')
          .attr('d', 'M0,0 L20,30 L0,60');

        /*
                        defs.selectAll('marker.arrow-start').data(types).enter().append('marker')
                            .attr('class', 'arrow-start')
                            .attr('class', function(d) { return 'arrow-start arrow-start-' + d; })
                            .attr('id', function(d) { return 'arrow-start-' + d; })
                            .attr('viewBox', '0 0 20 60')
                            .attr('markerWidth', 60).attr('markerHeight', 20)
                            .attr('refY', 30).attr('refX', 0)
                            .attr('orient', 'auto')
                            .append('path')
                            //.attr('d','M0,0 L0,0 L0,0')
                            .attr('d','M0,0 L20,30 L0,60');
                            */
      }

      function setupCanvas(container) {
        let svg = d3.select(container).select('.kanbanizer-canvas');

        if (!svg.node()) {
          svg = d3.select(container).append('svg').attr('class', 'kanbanizer-canvas');
          svg.append('g');
        }

        svg.attr('width', function () { return this.parentNode.offsetWidth; })
          .attr('height', function () { return this.parentNode.offsetHeight; });

        return svg;
      }

      function validateInitialData(data) {
        return data.type &&
          data.cards.indexOf(null) === -1 &&
          data.cards[0].offsetHeight &&
          data.cards[1].offsetHeight
      }

      function initLinkDataFor(node) {
        const id = '#task_' + node.getAttribute('data-card-id');
        if (!document.querySelector('#task_' + node.getAttribute('data-card-id'))) {
          console.info("Could not find " + id);
          return null
        }

        console.log("Using " + id);

        /*
        let data = {
            cards: [
                document.getElementById('task_' + node.getAttribute('data-card-id')),
                node.closest('.js-task'), // .task
                document.querySelector('#task_' + node.getAttribute('data-card-id')).querySelectorAll(".js-card-title, .js-initiative-title")[0],
                node.closest('[data-card-id="' + node.getAttribute('data-card-id') + '"]'),
            ]
        }
        */

        // Use the titles
        /*
        let data = {
            cards: [
                document.getElementById('task_' + node.getAttribute('data-card-id')),
                node.closest('.js-task').querySelectorAll(".js-card-title, .js-initiative-title")[0], // .task
                document.querySelector('#task_' + node.getAttribute('data-card-id')).querySelectorAll(".js-card-title, .js-initiative-title")[0],
                //node.closest('[data-card-id="' + node.getAttribute('data-card-id') + '"]'),
            ]
        }
        */

        // Align!
        let data = {
          cards: [
            document.getElementById('task_' + node.getAttribute('data-card-id')),
            node.closest('.js-task').querySelectorAll(".js-card-title, .js-initiative-title")[0], // .task
            document.querySelector('#task_' + node.getAttribute('data-card-id')).querySelectorAll(".js-card-title, .js-initiative-title")[0],
            //node.closest('[data-card-id="' + node.getAttribute('data-card-id') + '"]'),
          ]
        }

        var drawBothWays = false;
        var drawParents = false;

        if (drawParents && node.getAttribute('data-link-type') == "parent") {
          console.log("Found a parent");
          data.type = "parent";
        } else if (node.getAttribute('data-link-type') == "successor") {
          console.log("Found a successor");
          data.type = "successor";
        } else if (drawParents && drawBothWays && node.querySelector('.is-parent')) { // .svg-icon-parent
          console.log("Found a parent");
          data.type = 'parent';
        } else if (drawBothWays && node.querySelector('.is-successor')) { // .svg-icon-successor
          console.log("Found a successor");
          data.type = 'successor';
        } else {
          return null
        }

        return validateInitialData(data) ? data : null
      }

      function getLinkPoints(container, data) {
        const getSourceRect = data.cards[2] && data.cards[2].getBoundingClientRect();
        const getRectAgain = data.cards[3] && data.cards[3].getBoundingClientRect();

        const sourceRect = getSourceRect || data.cards[0].getBoundingClientRect();
        const targetRect = getRectAgain || data.cards[1].getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        let vOffset = data.type == 'parent' ? -30 : 30;

        let startPoint = {
          x: sourceRect.x - containerRect.x + sourceRect.width / 2,
          y: sourceRect.y - containerRect.y + sourceRect.height / 2// + vOffset
        }

        vOffset = data.type == 'parent' ? 5 : -5;

        const leaveTheArrowOutOfTheCard = 2;

        let endPoint = {
          x: targetRect.x - containerRect.x + targetRect.width / 2,
          y: targetRect.y - containerRect.y + targetRect.height / 2// + vOffset
        }

        let midPoint1 = {
          x: startPoint.x,
          y: startPoint.y
        };

        let midPoint2 = {
          x: endPoint.x,
          y: endPoint.y
        };

        const midOffset = 10;

        if (startPoint.x > endPoint.x || startPoint.x + 200 > containerRect.width) {
          // link goes through left side
          startPoint.x -= sourceRect.width / 2;
          midPoint1.x = startPoint.x - midOffset;
        } else {
          // link goes through right side
          startPoint.x += sourceRect.width / 2;
          midPoint1.x = startPoint.x + midOffset;
        }

        if (startPoint.x > endPoint.x) {
          // link comes from right side
          endPoint.x += targetRect.width / 2 + leaveTheArrowOutOfTheCard
          midPoint2.x = endPoint.x + midOffset;
        } else {
          // link comes from left side
          endPoint.x -= targetRect.width / 2 + leaveTheArrowOutOfTheCard
          midPoint2.x = endPoint.x - midOffset;
        }

        //return [startPoint, midPoint1, midPoint2, endPoint].reverse()
        return [startPoint, midPoint1, midPoint2, endPoint].reverse()
      }

      function buildLinksData(container) {
        return getVisibleLinks(container).nodes().map(function (node) {
          let data = initLinkDataFor(node);

          if (!data) {
            console.info("No data");
            return;
          }

          data.points = getLinkPoints(container, data);

          return data;
        }).filter(function (d) { return d });
      }

      function handleResize(entries) {
        console.log("Resizing");
        if (entries) {
          const rect = entries[0].contentRect;
          const savedRect = entries[0].target.savedRect;

          if (savedRect.width == rect.width && savedRect.height == rect.height) {
            return
          } else {
            entries[0].target.savedRect = rect;
          }
        }
        else {
          console.log("No entries");
        }

        if (resizeTimeout) clearTimeout(resizeTimeout);

        document.querySelectorAll('.kanbanizer-canvas').forEach(function (canvas) {
          canvas.classList.add('resizing');
        });

        resizeTimeout = setTimeout(function () {
          renderLinks();

          document.querySelectorAll('.kanbanizer-canvas').forEach(function (canvas) {
            canvas.classList.remove('resizing');
          });
        }, 300);
      }

      function handleScroll(entries) {
        document.querySelectorAll('.kanbanizer-canvas').forEach(function (canvas) {
          canvas.classList.add('resizing');
        });

        renderLinks(false);

        document.querySelectorAll('.kanbanizer-canvas').forEach(function (canvas) {
          canvas.classList.remove('resizing');
        });
      }

      function renderLinks(animate) {
        containers.forEach(function (container) {
          let svg = setupCanvas(container);
          let data = buildLinksData(container);

          let paths = svg.select('g').selectAll('path').data(data)
          paths.exit().remove();

          updatePaths(paths.enter().append('path'))
            .attr('d', function (d) { return relationLine(d.points) });

          if (animate) {
            updatePaths(paths)
              .transition().attr('d', function (d) { return relationLine(d.points) })
          } else {
            updatePaths(paths)
              .attr('d', function (d) { return relationLine(d.points) })
          }
        });
      }

      function updatePaths(paths) {
        return paths.attr('marker-end', function (d) { return 'url(#arrow-end-' + d.type + ')' })
          .attr('marker-start', function (d) { return 'url(#arrow-start-' + d.type + ')' })
          .attr('class', function (d) { return 'link-' + d.type; })
          .attr('stroke-dasharray', function (d) { return d.type == 'successor' ? '4' : '1 0' })
          .style("fill", "transparent")
          .style("stroke", "black")
          .style("stroke-width", "1px")
      }

      //var CONTAINER_SELECTOR = '.board_view'; //'#board_container .js-board'; // .kb-board
      //var CONTAINER_SELECTOR = '.js-board-holder'; // .kb-board
      var CONTAINER_SELECTOR = '.js-board'; // .kb-board
      const containers = document.querySelectorAll(CONTAINER_SELECTOR);
      console.log("Containers:")
      console.log(containers);

      if (containers.length > 0) {
        var relationLine = d3.line()
          .x(function (d) { return d.x }).y(function (d) { return d.y })
          .curve(d3.curveCatmullRom.alpha(1));

        Kanbanize.Pubsub.subscribe("visibilityChange", (v) => { if (!v) renderLinks(true) });
        Kanbanize.Pubsub.subscribe("boardFilter.applyFilter", () => renderLinks(true));
        Kanbanize.Pubsub.subscribe("boardFilter.removeFilter", () => renderLinks(true));
        Kanbanize.Pubsub.subscribe("observerCardDrawFinish", () => renderLinks(true));
        Kanbanize.Pubsub.subscribe("websockets", () => renderLinks(true));

        var resizeTimeout;
        var scrollTimeout;

        containers.forEach(setupCanvas);
        handleResize();

        if (!document.getElementById('kanbanizer-defs')) {
          buildDefs();
        }

        d3.selectAll('.js-board-cell').each(function () { // .kb-cards-cell
          this.savedRect = this.getBoundingClientRect();

          new ResizeObserver(handleResize).observe(this);
        })
      }

/*
      d3.selectAll('table').each(function() {
      //document.getElementById("board_container").onscroll = function (event) {
        handleScroll();
        return true;
      }
*/
      document.addEventListener('mousemove', function (event) {
        if (event.buttons == 1) {
          handleScroll();
        }
      });

      document.addEventListener('mouseup', function (event) {
        setTimeout(function () {
          handleScroll();
        }, 1);
      });
    })();

  });

})();
