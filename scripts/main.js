window.onload = function ()
{
    var parseId;

    var infoElement = document.getElementById("info");
    var graphContainer = document.getElementById("graphContainer");
    var flowContainer = document.getElementById("flowContainer");

    function parse(delay)
    {
        if (parseId) { window.clearTimeout(parseId); }

        parseId = window.setTimeout(function ()
        {
            infoElement.className = 'alert-box secondary';

            try
            {
                var program = esprima.parse(window.editor.getText(), {loc: true});

                ASTHelper.checkForWhileConsistency(program);

                ASTHelper.createParentChildRelationship(program);

                ASTHelper.setNodesIdsAndLabels(program);

                var statements = ASTHelper.getAllStatements(program);
                var flow = ASTHelper.getFlow(program);

                notifyFlow(flow);

                buildFlowGraph(statements, flow, ASTHelper.getLabelStatementMapping(program));

                infoElement.innerHTML = 'No error';
            }
            catch (e)
            {
                infoElement.innerHTML  = e.name + ': ' + e.message;
                infoElement.className = 'alert-box alert';
            }

            parseId = undefined;
        }, delay || 1000);
    }

    function notifyFlow(flow)
    {
        var flowMessage = "";

        for(var i = 0; i < flow.length; i++)
        {
            var item = flow[i];

            if(i != 0) { flowMessage += ", "; }

            flowMessage += "(" + item.first.label + "," + item.second.label + ")";
        }

        flowContainer.textContent = "Flow:" + (flowMessage || "()");
    }

    function buildFlowGraph(statements, flow, labelMapping)
    {
        var graphNodes = GraphHelper.createGraphNodes(statements, labelMapping);

        graphContainer.innerHTML = "";

        for(var i = 0; i < graphNodes.length; i++)
        {
            graphContainer.appendChild(graphNodes[i]);
        }

        GraphHelper.layoutGraph(graphNodes, graphContainer, labelMapping, flow);
    }

    try
    {
        require(['custom/editor'], function (editor)
        {
            window.editor = editor({ parent: 'editor', lang: 'js' });
            window.editor.getTextView().getModel().addEventListener("Changed", parse);
            parse(100);
        });
    } catch (e) {}
};

function isObject(potentialObject)
{
    return potentialObject != null && 'object' == typeof potentialObject;
}

function isArray(potentialArray)
{
    return potentialArray != null &&
          (typeof potentialArray) == "array" || potentialArray instanceof Array || (Array.isArray && Array.isArray(potentialArray));
}