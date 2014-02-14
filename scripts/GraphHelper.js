//requires ASTHelper

var GraphHelper =
{
    createGraphNodes: function(statements, labelMapping)
    {
        var graphNodes = [];

        if(statements == null || statements.length == 0) { return graphNodes; }

        for(var i = 0; i < statements.length; i++)
        {
            var statement = statements[i];

            if(!ASTHelper.isStatement(statement)) { continue; }

            graphNodes.push(this._createStatementNode(statement, labelMapping));
        }

        return graphNodes;
    },

    layoutGraph: function(graphNodes, graphContainer, labelMapping, flow)
    {
        this.layoutNodes(graphNodes, graphContainer, labelMapping);
        this.layoutEdges(graphNodes, graphContainer, labelMapping, flow);
    },

    layoutNodes: function(graphNodes, graphContainer, labelMapping)
    {
        var width = parseInt(window.getComputedStyle(graphContainer).width);

        var currentX = width/2;
        var deltaX = 20;

        var currentY = 20;
        var deltaY = 40;

        var largestYSoFar = 0;

        for(var i = 0; i < graphNodes.length; i++, currentY += deltaY)
        {
            var graphNode = graphNodes[i];

            var elementX = currentX;
            var elementY = currentY;

            var sourceCodeTextNode = graphNode.children[0];
            var superScriptTextNode = graphNode.children[1];

            var sourceCodeNodeWidth = parseInt(window.getComputedStyle(sourceCodeTextNode).width);
            var sourceCodeNodeHeight = parseInt(window.getComputedStyle(sourceCodeTextNode).height);

            var label = graphNode.getAttribute("label");
            var statement = labelMapping[label].statement;

            var parentBlockStatements = ASTHelper.getParentBlockStatements(statement);
            var parentStatement = parentBlockStatements[0];
            var parentGraphNode = parentStatement != null && parentStatement.label != null
                && labelMapping[parentStatement.label] != null
                ? labelMapping[parentStatement.label].graphNode
                : null;

            var parentNodeWidth = 0, parentNodeX = 0, parentNodeY = 0;

            if(parentGraphNode != null)
            {
                parentNodeWidth = parseInt(window.getComputedStyle(parentGraphNode).width);
                parentNodeX = parseInt(parentGraphNode.getAttribute("x"));
                parentNodeY = parseInt(parentGraphNode.getAttribute("y"));

                var parentMidX = parentNodeX + parentNodeWidth/2;

                if(ASTHelper.isInIfConsequent(statement, parentStatement))
                {
                    elementX = parentMidX + parentNodeWidth;
                }
                else if(ASTHelper.isInIfAlternate(statement, parentStatement))
                {
                    elementX = parentMidX - parentNodeWidth;

                    currentY = parentNodeY + (ASTHelper.getPreviousStatements(statement).length + 1) * deltaY;
                    elementY = currentY;
                }
                else if(ASTHelper.isWhileStatement(parentStatement))
                {
                    elementX = parentMidX + parentNodeWidth;
                }
            }

            var previousStatement = ASTHelper.getPreviousStatement(statement);

            if(ASTHelper.isIfStatement(previousStatement))
            {
                currentY = largestYSoFar + deltaY;
                elementY = currentY;
            }

            sourceCodeTextNode.setAttribute("x", elementX - sourceCodeNodeWidth/2);
            sourceCodeTextNode.setAttribute("y", elementY);

            superScriptTextNode.setAttribute("x", elementX + sourceCodeNodeWidth/2);
            superScriptTextNode.setAttribute("y", elementY - deltaY/6);

            if(currentY > largestYSoFar)
            {
                largestYSoFar = currentY;
            }
        }
    },

    layoutEdges: function(graphNodes, graphContainer, labelMapping, flow)
    {
        for(var i = 0; i < flow.length; i++)
        {
            var flowItem = flow[i];

            var firstStatement = flowItem.first;
            var secondStatement = flowItem.second;

            var firstNode = labelMapping[firstStatement.label].graphNode;
            var secondNode = labelMapping[secondStatement.label].graphNode;

            var firstNodeHeight = parseInt(window.getComputedStyle(firstNode).height)
            var secondNodeHeight = parseInt(window.getComputedStyle(secondNode).height);

            var arrow = this.createArrowElement();

            if(ASTHelper.areConsequtiveStatements(firstStatement, secondStatement))
            {
                var arrowOriginPoint = this._getNodeLowerMidPoint(firstNode);
                arrowOriginPoint.y -= 0.7*firstNodeHeight;

                var arrowDestinationPoint = { x: arrowOriginPoint.x, y: parseInt(secondNode.getAttribute("y") - 1.1*secondNodeHeight)};

                arrow.setAttribute("points", this._serializeToSvgPoints([arrowOriginPoint, arrowDestinationPoint]));
            }
            else if(ASTHelper.isAncestorOf(firstStatement, secondStatement))
            {
                var arrowOriginPoint = this._getNodeLowerMidPoint(firstNode);
                arrowOriginPoint.y -= 0.7*firstNodeHeight;

                var arrowDestinationPoint = this._getNodeUpperMidPoint(secondNode);
                arrowDestinationPoint.y -= secondNodeHeight;

                var arrowMidPoint1 = { x: arrowOriginPoint.x, y: (arrowOriginPoint.y + arrowDestinationPoint.y)/2};
                var arrowMidPoint2 = { x: arrowDestinationPoint.x, y: (arrowOriginPoint.y + arrowDestinationPoint.y)/2};

                arrow.setAttribute("points", this._serializeToSvgPoints([arrowOriginPoint, arrowMidPoint1, arrowMidPoint2, arrowDestinationPoint]));
            }
            else if(ASTHelper.isAncestorOf(secondStatement, firstStatement))
            {
                var arrowOriginPoint = this._getNodeRightMidPoint(firstNode);
                arrowOriginPoint.y -= 0.7*firstNodeHeight;

                var arrowMidPoint1 = { x: arrowOriginPoint.x + 10, y: arrowOriginPoint.y}
                var arrowDestinationPoint = this._getNodeRightMidPoint(secondNode);
                arrowDestinationPoint.y -= 0.7*secondNodeHeight;
                arrowDestinationPoint.x += 10;

                var arrowMidPoint2 = { x: arrowMidPoint1.x, y: arrowDestinationPoint.y };

                arrow.setAttribute("points", this._serializeToSvgPoints([arrowOriginPoint, arrowMidPoint1, arrowMidPoint2, arrowDestinationPoint]));
            }
            else
            {
                //from if bodies to the following node;
                var arrowOriginPoint = this._getNodeLowerMidPoint(firstNode);
                arrowOriginPoint.y -= 0.7*firstNodeHeight;

                var arrowDestinationPoint = this._getNodeUpperMidPoint(secondNode);
                arrowDestinationPoint.y -= secondNodeHeight;

                var arrowMidPoint1 = {
                    x: arrowOriginPoint.x,
                    y: (arrowOriginPoint.y + arrowDestinationPoint.y)/2
                };

                var arrowMidPoint2 = {

                    x: arrowDestinationPoint.x,
                    y: (arrowOriginPoint.y + arrowDestinationPoint.y)/2
                };

                arrow.setAttribute("points", this._serializeToSvgPoints([arrowOriginPoint, arrowMidPoint1, arrowMidPoint2, arrowDestinationPoint]));
            }

            graphContainer.appendChild(arrow);
        }
    },

    _serializeToSvgPoints: function(points)
    {
        var pointsString = "";

        for(var i = 0; i < points.length; i++)
        {
            pointsString += points[i].x + "," + points[i].y + " ";
        }

        return pointsString;
    },

    _getNodeRightMidPoint: function(node)
    {
        var width = parseInt(window.getComputedStyle(node).width);
        var height = parseInt(window.getComputedStyle(node).height);

        return {
            x: parseInt(node.getAttribute("x")) + width,
            y: parseInt(node.getAttribute("y")) + height/2
        };
    },

    _getNodeUpperMidPoint: function(node)
    {
        var width = parseInt(window.getComputedStyle(node).width);
        var height = parseInt(window.getComputedStyle(node).height);

        return {
            x: parseInt(node.getAttribute("x")) + width/2,
            y: parseInt(node.getAttribute("y"))
        };
    },

    _getNodeLowerMidPoint: function(node)
    {
        var width = parseInt(window.getComputedStyle(node).width);
        var height = parseInt(window.getComputedStyle(node).height);

        return {
            x: parseInt(node.getAttribute("x")) + width/2,
            y: parseInt(node.getAttribute("y")) + height
        };
    },

    _createStatementNode: function(statement, labelMapping)
    {
        var statementCode = "[" + ASTHelper.getCode(statement) + "]";

        var group = document.createElementNS("http://www.w3.org/2000/svg", "g");

        group.setAttribute("label", statement.label);

        var statementTextNode = this._createCodeTextElement(statementCode);
        var superscriptTextNode = this._createSuperscriptTextElement(statement.label);

        labelMapping[statement.label].graphNode = statementTextNode;

        group.appendChild(statementTextNode);
        group.appendChild(superscriptTextNode);

        return group;
    },

    _createCodeTextElement: function(text)
    {
        var textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");

        textElement.textContent = text;

        textElement.setAttribute("class", "sourceCodeTextGraphNode");
        textElement.setAttribute("x", "10");
        textElement.setAttribute("y", "20");
        textElement.setAttribute("fill", "#000");

        return textElement;
    },

    _createSuperscriptTextElement: function(label)
    {
        var textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");

        textElement.textContent = label;

        textElement.setAttribute("class", "superscriptGraphNode");
        textElement.setAttribute("x", "60");
        textElement.setAttribute("y", "20");

        return textElement;
    },

    createArrowElement: function()
    {
        var polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");

        polyline.setAttribute("class", "controlFlowLine");
        polyline.setAttribute("stroke", "gray");
        polyline.setAttribute("stroke-width", "3");
        polyline.setAttribute("marker-end", "url(#arrowPointer)");
        polyline.setAttribute("points", "20,20 30,20");
        polyline.setAttribute("fill", "none");


        return polyline;
    }
};