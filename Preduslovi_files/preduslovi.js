var Graph = function() {

    var sel_node= null,
        mousedown= null,
        node_size= null,
        level_width= null,
        current_department = null,

        nodes= null,
        links= null,
        linkGroup= null,
        nodeGroup= null;
        
    // swithches department; restarts graph, zoom; reinitializes nodes
    function init()
    {
        var width  = document.documentElement.clientWidth-15;
        var height = (document.documentElement.clientHeight-40);
        sel_node = null;
        mousedown = false;
        node_size = 35;
        level_width = 150;
        current_department = 'RI';
        nodes = [];
        links = [];
        

        $("#allClasses").click(switchDept);
        $("#myClasses").click(switchDept);
        $("#AR").click(switchDept);
        $("#EEMS").click(switchDept);
        $("#ESKE").click(switchDept);
        $("#RI").click(switchDept);
        $("#TK").click(switchDept);
        $("#BMI").click(switchDept);
        
        var zoom = d3.behavior.zoom();
        var vis = d3.select("#graph")
            .append("svg")
            .attr('width', "100%")
            .attr('height', "100%")
            .attr("viewBox", "0 0 " + width + " " + height)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("pointer-events", "all")
            .call(zoom.scaleExtent([0.1, 5]).on("zoom", function(){zoomed(svg);}))
            .on("wheel.zoom", null);

        d3.select("#zoombtnin").on("click", function (){//zoom-in button callback
            zoomfactor = zoom.scale()+0.1;
            zoom.scale(zoomfactor).event(d3.select("#graph"));
        });

        d3.select("#zoombtnout").on("click", function (){//zoom-out button callback
            zoomfactor = zoom.scale()-0.1;

            zoom.scale(zoomfactor).event(d3.select("#graph"));
        });  

        var svg = vis.append('svg:g');

        drag = d3.behavior.drag()

        .origin(function(d) { return d; })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

        $.getJSON("Preduslovi_files/depts.json", function(result)//loading department data
        {
            initNodes(result, current_department);
        });

        // init D3 force layout
        init.forceLayout = d3.layout.force()
            .links(links)
            .nodes(nodes)
            .size([width, height])
            .charge(-1000)
            .linkDistance(200)
            .linkStrength(0.1)
            .on('tick', tick);
       
        // arrow markers 
        svg.append('svg:defs').append('svg:marker')
            .attr('id', 'nonselected_arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 6)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#999');
        
        svg.append('svg:defs').append('svg:marker')
            .attr('id', 'selected_arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 6)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)

            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#2D3742');

        // link and node groups

        linkGroup = svg.append('svg:g').selectAll('path');
        nodeGroup = svg.append('svg:g').selectAll('g');


        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
        {

            zoom.scale(0.3).event(d3.select("#graph"));
            svg.attr("transform", "translate(" + d3.event.translate + ")"+ " scale(" + d3.event.scale + ")");
        }

        //adjust graph in case of page resize
        $(window).resize(function()
        {

            width  = document.documentElement.clientWidth-15;
            height = (document.documentElement.clientHeight-40);
            restart();
        });
    }
    
    // update one step of force layout animation
    function tick()
    {
        nodeGroup.attr('transform', function(node)//repositions nodes on every tick of animation
        {
	
            if(node.y < level_width*node.level - 15) node.y += 2;
        	if(node.y > level_width*node.level + 15) node.y -= 2;
            var q = d3.geom.quadtree(nodes);
            q.visit(collide(node));
            return 'translate(' + node.x + ',' + node.y + ')';
        });
        linkGroup.attr('d', function(link)//recalculates and sets link sources and targets on every tick of animation
        {
            var dX = link.target.x - link.source.x,
                dY = link.target.y - link.source.y,
                dist = Math.sqrt(dX * dX + dY * dY),
                normX = dX / dist,
                normY = dY / dist,
                targPadding = link.right ? (node_size+5): node_size,
                srcPadding = link.left ? (node_size+5): node_size,
                targetX = link.target.x - (targPadding * normX),
                targY = link.target.y - (targPadding * normY),
                srcX = link.source.x + (srcPadding * normX),
                srcY = link.source.y + (srcPadding * normY);
            return 'M' + srcX + ',' + srcY + 'L' + targetX + ',' + targY;
        });
    }

    //updating visuals
    function update()
    {
        linkGroup = linkGroup.data(links);
        //update existing links
        //arrow colors
        linkGroup.style('stroke',function(link){return colorizeLinks(link, sel_node)})
            .style('marker-end', function(link) {return link.target.reflexive ? 'url(#selected_arrow)':'url(#nonselected_arrow)';});
       //nodegroup
        nodeGroup = nodeGroup.data(nodes, function(node) { return node.id; });
        //update nodes visuals(edge and color)
        nodeGroup.selectAll('circle')
            .style('fill', function(node) { return colorizeNodes(node); })
            .classed('reflexive', function(node) { return node.reflexive; });
    }

    function restart()
    {
        linkGroup = linkGroup.data(links);
       
        // add new links
        linkGroup.enter().append('svg:path')
            .attr('class', 'link')
            .style('stroke', '#999')
            .style('stroke-width', function() {return '0.3rem';})
            .style('marker-end', function(d) { return 'url(#nonselected_arrow)'; });
        
      // remove old links
        linkGroup.exit().remove();
       //nodegroup
        nodeGroup = nodeGroup.data(nodes, function(node) { return node.id; });
        
      
        
        // add new nodes
        var g = nodeGroup.enter().append('svg:g');
        g.append('svg:circle')
            .attr('class', 'node')
            .attr('r', node_size)
            .style('fill', function(node) { return colorizeNodes(node); })
            .style('stroke', function(node) { return d3.rgb(colorizeNodes(node)).darker().toString(); })
            .on('mouseover', function(node)//highlights node and prerequisite nodes;shows class details
            {
                node.fixed = true;
                if(mousedown) return;
                if(!fade.faded)
                    highlight(node);
                showClassDetails(node, true);
                update();
             })
            .on('mouseout', function(node)//removes hightlight; hides class details
            {
                node.fixed = false;
                if(mousedown) {return};
                nodes.forEach(function(node){node.reflexive = false;});
                sel_node = null;
                fade(null, false);
                showClassDetails(node, false);
                update();
            })
            .on('mouseup', function()
            {
                mousedown = false;
            })
            .on('mousedown', function(node)
            {
                mousedown = true;
                //showClassDetails(node, true);
                nodeGroup.call(drag);//start dragging node
         
            })
            .on('contextmenu', function() {d3.event.preventDefault();})
            .call(function(node){
                      if(current_department == "myClasses")
                      {
                          node.style('opacity', function(node){return !node.passed ? 0.3 : 1});
                          node.style('stroke-dasharray', function(node){ return (node.obligatory) ? "0 0": "5 3";});
                      }
                  });
            
        //display short class name (ID) on nodes
        g.append('svg:title').text(function(node){return node.name});
        g.append('svg:text')
            .attr('class', 'id')
            .attr('x', 0)
            .attr('y', 6)
            .text(function(node) {return node.id;});
        nodeGroup.exit().remove();
        
        //setting graph and elements dimensions
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
        {
            $("#legendContainer").width("93vw");
            $("#legendContainer").css('background-color', '#fff')
            $("#graph").width("90vw");
            $("#graph").height("100vh");
        }
        d3.selectAll('#legend').classed('legendlist', true);
        
        //create legend
        createLegend();
        
        // start graph
        update();
        init.forceLayout.start();
        
    }

    //initializing nodes and links
    function initNodes(deptContainer, deptName)
    {
         if(typeof this.depts == 'undefined') this.depts = deptContainer;
         
         var width  = document.documentElement.clientWidth-15;
         var height = (document.documentElement.clientHeight-40);
         //checks department from deptName, sets webpage title department name
         dept = this.depts.departments.find(function(el){return el.dept == deptName});
         document.getElementById("classNameTitle").innerHTML = dept ? dept.name : "MOJI PREDMETI";
         var studentClassesInfo = null;
         //recovers obligatory and optional classes for a given student
         $.getJSON("Preduslovi_files/student.json", function(result)
         {
             studentClassesInfo = result;
         });
         //recovers all obligatory classes for given department
         $.getJSON("Preduslovi_files/preduslovi.json", function(result)
         {
             if(current_department == "myClasses" && studentClassesInfo != null){
                 for(i = 0; i < studentClassesInfo.classes.length; i++)//initializes node[] array from json file
                 {
                     var _class = result.classes.find(function(el){return el.id == studentClassesInfo.classes[i].id});
                     pass = (studentClassesInfo.classes[i].mark >= 6 && studentClassesInfo.classes[i].mark <= 10)? true: false;
                     if(_class) nodes.push({id: _class.id, dept: _class.department, level: _class.level, name: _class.fullName, passed: pass,
                                           mark: studentClassesInfo.classes[i].mark, obligatory: studentClassesInfo.classes[i].obligatory, 
                                           sources: _class.prerequisites, reflexive: false, faded: true, x: width/2+10*i, y: height/2});
                 }
             }
             else if(current_department != "myClasses"){
                 for(i = 0; i < dept.obligatory.length; i++)//initializes node[] array from json file
                 {
                     var _class = result.classes.find(function(el){return el.id == dept.obligatory[i]});
                     if(_class) nodes.push({id: _class.id, dept: _class.department, level: _class.level, name: _class.fullName, sources: _class.prerequisites, reflexive: false, faded: false, x: width/2+10*i, y: height/2});
                 }
             }

           //initializes links to all nodes, creates links[] array
             for(i = 0; i < nodes.length; ++i)
             {
                 for(j = 0; j < nodes[i].sources.length; j++)
                 {
                     var src = findSource(nodes[i].sources[j], nodes);
                     if(src < 0)break;
                     if(!links.includes({source: nodes[src], target: nodes[i], left: false, right: true}))
                         links.push({source: nodes[src], target: nodes[i], left: false, right: true});
                 }
             }
             restart();
         });
    }

    function switchDept()
    {
        current_department = this.id;
        nodes.length = 0;
         links.length = 0;
        if(this.id == "allClasses") current_department = "RI";
        restart();
        initNodes(null, current_department);
        return false;
    }

    //zooming behavior implementation
    function zoomed(svg)
    {
        svg.attr("transform", "translate(" + d3.event.translate + ")"+ " scale(" + d3.event.scale + ")");
    }

    //dragging behavior implementation
    function dragstarted(node)//turning off force for dragged node to prevent unpredictable behavior while being dragged
    {   
        node.fixed = true;
        d3.event.sourceEvent.stopPropagation();
        update();
    }

    function dragged(node)//updating position of dragged node and fading all the nodes and links except for prerequisites
    {

        node.fixed = true;
        node.px += d3.event.dx;
        node.py += d3.event.dy;
        node.x += d3.event.dx;
        node.y += d3.event.dy; 
        fade(sel_node, true);
        restart();

    }

    function dragended(node)//returning everything to normal on drag end
    {
        node.fixed = false;
        highlight(null);
        fade(null, false);
        sel_node = null;
        mousedown = false;
        restart();
    }

    //create list with all obligatory classes for given department
    function createLegend()
    {
       d3.select('#legend').selectAll('ul').remove();
       var legend = d3.select('#legend').append("g")
        .append('ul')
        .attr('class', 'legend')
        .selectAll('ul');
       legend.data(nodes)
        .enter().append('li')
        .attr('id', function(node){return "li" + node.id})

        .style('background', 'inherit')
        .text(function(node) { return node.id + ' - '+ node.name; })
        .on('mouseover', function(node)
        {    
            if(mousedown) return;
            d3.select(this)
                .transition().duration(100)
                .style('color', "#fff")
                .style('background', '#2D3742');
            node.reflexive = true;
            nodeGroup.selectAll('circle')
                .classed('reflexive', function(e) { return e.reflexive;})
                .classed('selected', function(e) {return e.reflexive;});
        })
        .on('mouseout', function(node)
        {
            if(mousedown) return;
            d3.select(this)
                .transition().duration(300)//Set transition
                .style('background', 'inherit')
                .style('color', "#000")
            node.reflexive = false;
            nodeGroup.selectAll('circle')
                .classed('reflexive', function(e) {return e.reflexive;})
                .classed('selected', function(e) {return e.reflexive;});
         })
         .append('svg')
            .attr('width', '12')
            .attr('height', '20')
            .style('float', 'right')
            .style('background-color', function() { return 'inherit'; })
         .append('circle')
            .attr("r", '5')
            .attr('cx', '5')
            .attr('cy', '15')
            .style('fill', function(node) {return colorizeNodes(node)});
    }

    function showClassDetails(node, showDetails)
    {
        d3.select("#classDetailsDiv").selectAll("*").remove();
        var classDetailsDiv = d3.select('#classDetailsDiv');

        classDetailsDiv.append('div')
            .append('text')
                .style('font-weight', 'bold')
                .style('font-size', '1rem')
                .text(node.id);
        classDetailsDiv.append('text')
                .style('font-weight', 'bold')
                .style('font-size', '1rem')
                .text(node.name);
        var sources = sourcesInfo(node);
        if(sources.length > 0)
        {
            classDetailsDiv.append('br');
            classDetailsDiv.append('text')
                .style('font-size', '1rem')
                .text('Potrebni preduslovi:');
        }
        for(i = 0; i < sources.length; i++)
        {
            classDetailsDiv.append('br');
            classDetailsDiv.append('text')
                    .style('font-size', '1rem')
                    .text(function(){return String.fromCharCode(8226) + sources[i].id + " - " + sources[i].name; ;});
          
        }
        if(showDetails && $("#detailsCheckBox").is(":checked"))
        {
            $("#classDetailsDiv").removeClass("closed")
        }
        else $("#classDetailsDiv").addClass("closed");
    }

    function sourcesInfo(node)
    {
        var result =[];
        for(i = 0; i < node.sources.length; ++i)
        {
            var src = findSource(node.sources[i], nodes);
            result.push({id:nodes[src].id, name:nodes[src].name});
        }
        return result;
    }

    function findSource(nodeId, arr)//finds index of a node in arr[] array based on nodeId
    {
        for(k = 0; k < arr.length; ++k)
        {
            if(arr[k].id == nodeId)
                return k;
        }
        return -1;
    }

    //detects nodes collision and corrects position of nodes
    function collide(node)
    {
        var r = 70,
        nx1 = node.x - r,
        nx2 = node.x + r,
        ny1 = node.y - r,
        ny2 = node.y + r;
        return function(quad, x1, y1, x2, y2)
        {
            if (quad.point && (quad.point !== node))
            {
              var x = node.x - quad.point.x,
                  y = node.y - quad.point.y,
                  l = Math.sqrt(x * x + y * y),
                  r = 70;
              if (l < r)
              {
                  l = (l - r) / l * .5;
                  node.x -= x *= l;
                  node.y -= y *= l;
                  quad.point.x += x;
                  quad.point.y += y;
              }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        };
    }

    //highlight node edge on mousedown
    function highlight(node)//highlights selected node and all prerequisites
    {
        nodes.forEach(function(node){node.reflexive = false;});
        if(node == null) return;
        node.reflexive = true;
        function sources(node){
            node.sources.forEach(function(e){
                var n = nodes.find(function(el){return e == el.id;}); n.reflexive = true;
                    sources(n);
                });   
        }
        sources(node);
    }

    function fade(node, isFaded)//fades all the nodes and links except selected nodes and prerequisites; if boolean is false undoes fade
    {
        if(typeof this.faded == 'undefined') this.faded = false;
        if(isFaded == true && sel_node == node)
        {
            nodeGroup.style('opacity', function(node){return node.reflexive ? 1 : 0.3});
            linkGroup.style('opacity', function(link){return (link.target.reflexive) ? 1  : 0.3});
        }
        else{
            nodeGroup.style('opacity', function(){return 1});
            linkGroup.style('opacity', function(){return 1});
        }
        this.faded = isFaded;
    };

    //change link color based on selected node
    function colorizeLinks(link, node)
    {
        if (link.target.reflexive) return '#2D3742';
        else return '#999';
    }

    //change node color based on departments
    function colorizeNodes(node)
    {
        switch(node.dept)
        {
            case "AR":
                return (node === sel_node) ? d3.rgb("royalblue").brighter().toString() : 'royalblue';
            case "EEMS":
                return (node === sel_node) ? d3.rgb("salmon").brighter().toString() : 'salmon';
            case "ESKE":
                return (node === sel_node) ? d3.rgb("teal").brighter().toString() : 'teal';
            case "RI":
                return (node === sel_node) ? d3.rgb("darkseagreen").brighter().toString() : 'darkseagreen';
            case "TK":
                return (node === sel_node) ? d3.rgb("thistle").brighter().toString() : 'thistle';
            case "BMI":
                return (node === sel_node) ? d3.rgb("khaki").brighter().toString() : 'khaki';
            case "PMF":
                return (node === sel_node) ? d3.rgb("gray").brighter().toString() : 'gray';
            default:
                return 'darkseagreen';
        }
    }

    return {
        init:init,
        switchDept: switchDept,
        restart: restart
    }
}();

window.onload = function(){
    Graph.init();
};
