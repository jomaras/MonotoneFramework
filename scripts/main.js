window.onload = function ()
{
    var parseId;

    var infoElement = document.getElementById("info");
    var graphContainer = document.getElementById("graphContainer");
    var flowContainer = document.getElementById("flowContainer");

    var availableExpressionsHeader = document.getElementById("availableExpressionsHeader");
    var reachingDefinitionsHeader = document.getElementById("reachingDefinitionsHeader");
    var veryBusyExpressionsHeader = document.getElementById("veryBusyExpressionsHeader");
    var liveVariablesHeader = document.getElementById("liveVariablesHeader");

    var availableExpressionsTab = document.getElementById("availableExpressionsTab");
    var reachingDefinitionsTab = document.getElementById("reachingDefinitionsTab");
    var veryBusyExpressionsTab = document.getElementById("veryBusyExpressionsTab");
    var liveVariablesTab = document.getElementById("liveVariablesTab");

    var monotoneFrameworkAnalysisResultsHeaderRow = document.getElementById("monotoneFrameworkAnalysisResultsHeaderRow");
    var monotoneFrameworkAnalysisResultsBody = document.getElementById("monotoneFrameworkAnalysisResultsBody");

    var startWorklistAlgorithmButton = document.getElementById("startWorklistAlgorithmButton");
    var workListAlgorithmContainer = document.getElementById("workListAlgorithmContainer");

    startWorklistAlgorithmButton.onclick = function()
    {
        startWorklistAlgorithm();
        workListAlgorithmContainer.style.display = "";
    };

    var examplesContainer = document.getElementById("examplesContainer");

    var currentProgram = null;
    var currentProgramInfo = null;

    var examples =
    [
        "x = a + b;\ny = a * b;\n\nwhile (y > a + b)\n{\n\ta = a + 1;\n\tx = a + b;\n}\n",
        "x = 5;\ny = 1;\nwhile (x > 1)\n{\n\ty = x * y;\n\tx = x - 1;\n}\n",
        "if(a > b)\n{\n\tx = b - a;\n\ty = a - b;\n}\nelse\n{\n\ty = b - a;\n\tx = a - b;\n}",
        "x = 2;\ny = 4;\nx = 1;\nif(y > x)\n\tz = y\nelse\n\tz = y * y;\nx = z;"
    ];

    for(var i = 0; i < examples.length; i++)
    {
        var link = document.createElement("a");
        link.href = "#";
        link.textContent = "#" +  (i + 1) + ": " + examples[i];

        link.onclick = function()
        {
            editor && editor.setText(examples[this.exampleIndex]);
            return false;
        };

        link.exampleIndex = i;

        examplesContainer.appendChild(link);
        examplesContainer.appendChild(document.createElement("br"));
        examplesContainer.appendChild(document.createElement("br"));
    }

    var availableExpressionTableBody = document.getElementById("availableExpressionTableBody");
    var reachingDefinitionsTableBody = document.getElementById("reachingDefinitionsTableBody");
    var veryBusyExpressionsTableBody = document.getElementById("veryBusyExpressionsTableBody");
    var liveVariablesTableBody = document.getElementById("liveVariablesTableBody");

    var analysisType =
    {
        availableExpressions: "AVAILABLE_EXPRESSIONS",
        reachingDefinitions: "REACHING_DEFINITIONS",
        veryBusyExpressions: "VERY_BUSY",
        liveVariables: "LIVE_VARIABLES"
    };

    var selectedAnalysisType = analysisType.availableExpressions;

    availableExpressionsHeader.onclick = function ()
    {
        reachingDefinitionsTab.className = reachingDefinitionsHeader.className = '';
        availableExpressionsTab.className = availableExpressionsHeader.className = 'active';
        veryBusyExpressionsTab.className = veryBusyExpressionsHeader.className = '';
        liveVariablesTab.className = liveVariablesHeader.className = '';

        reachingDefinitionsTab.style.display = 'none';
        availableExpressionsTab.style.display = '';
        veryBusyExpressionsTab.style.display = 'none';
        liveVariablesTab.style.display = 'none';

        selectedAnalysisType = analysisType.availableExpressions;

        computeKilledGenerated(currentProgram, currentProgramInfo);

        return false;
    };

    reachingDefinitionsHeader.onclick = function ()
    {
        reachingDefinitionsTab.className = reachingDefinitionsHeader.className = 'active';
        availableExpressionsTab.className = availableExpressionsHeader.className = '';
        veryBusyExpressionsTab.className = veryBusyExpressionsHeader.className = '';
        liveVariablesTab.className = liveVariablesHeader.className = '';

        reachingDefinitionsTab.style.display = '';
        availableExpressionsTab.style.display = 'none';
        veryBusyExpressionsTab.style.display = 'none';
        liveVariablesTab.style.display = 'none';

        selectedAnalysisType = analysisType.reachingDefinitions;

        computeKilledGenerated(currentProgram, currentProgramInfo);

        return false;
    };

    veryBusyExpressionsHeader.onclick = function ()
    {
        reachingDefinitionsTab.className  = reachingDefinitionsHeader.className = '';
        availableExpressionsTab.className = availableExpressionsHeader.className = '';
        veryBusyExpressionsTab.className  = veryBusyExpressionsHeader.className = 'active';
        liveVariablesTab.className = liveVariablesHeader.className = '';

        reachingDefinitionsTab.style.display = 'none';
        availableExpressionsTab.style.display = 'none';
        veryBusyExpressionsTab.style.display = '';
        liveVariablesTab.style.display = 'none';

        selectedAnalysisType = analysisType.veryBusyExpressions;

        computeKilledGenerated(currentProgram, currentProgramInfo);

        return false;
    };

    liveVariablesHeader.onclick = function()
    {
        reachingDefinitionsTab.className  = reachingDefinitionsHeader.className = '';
        availableExpressionsTab.className = availableExpressionsHeader.className = '';
        veryBusyExpressionsTab.className  = veryBusyExpressionsHeader.className = '';
        liveVariablesTab.className = liveVariablesHeader.className = 'active';

        reachingDefinitionsTab.style.display = 'none';
        availableExpressionsTab.style.display = 'none';
        veryBusyExpressionsTab.style.display = 'none';
        liveVariablesTab.style.display = '';

        selectedAnalysisType = analysisType.liveVariables;

        computeKilledGenerated(currentProgram, currentProgramInfo);

        return false;
    };

    function parse(delay)
    {
        if (parseId) { window.clearTimeout(parseId); }

        parseId = window.setTimeout(function ()
        {
            infoElement.className = 'alert-box secondary';

            try
            {
                var program = esprima.parse(window.editor.getText(), {loc: true});

                currentProgram = program;

                ASTHelper.checkForWhileConsistency(program);

                ASTHelper.createParentChildRelationship(program);

                ASTHelper.setNodesIdsAndLabels(program);

                var statements = ASTHelper.getAllStatements(program);

                var programInfo = deriveProgramInfo(program);
                currentProgramInfo = programInfo;

                notifyDerivedInformation(programInfo);

                buildFlowGraph(statements, programInfo.flow, programInfo.labelStatementMapping);

                computeKilledGenerated(program, programInfo);

                infoElement.innerHTML = 'No error';
            }
            catch (e)
            {
                infoElement.innerHTML  = e.name + ': ' + e.message;
                infoElement.className = 'alert-box alert';
                currentProgram = null;
                currentProgramInfo = null;
            }

            parseId = undefined;
        }, delay || 1000);
    }

    function deriveProgramInfo(program)
    {
        var labelStatementMapping = ASTHelper.getLabelStatementMapping(program);
        var programInfo =
        {
            labels: [],
            labelStatementMapping: labelStatementMapping,
            flow: ASTHelper.getFlow(program),
            variables: ASTHelper.getUniqueIdentifiersMap(program),
            arithmeticExpressions: ASTHelper.getArithmeticExpressions(program)
        };

        for(var label in labelStatementMapping)
        {
            if(labelStatementMapping.hasOwnProperty(label))
            {
                programInfo.labels.push(label);
            }
        }

        return programInfo;
    }

    function notifyDerivedInformation(programInfo)
    {
        notifyFlow(programInfo.flow);
        notifyLabels(programInfo.labels);
        notifyVariables(programInfo.variables);
        notifyArithmeticExpressions(programInfo.arithmeticExpressions);
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

        flowContainer.textContent = (flowMessage || "{}");
    }

    function notifyLabels(labels)
    {
        var labelsContainer = document.getElementById("labelsContainer");

        labelsContainer.textContent = (labels.join(", ") || "{}");
    }

    function notifyVariables(variablesMap)
    {
        var variablesContainer = document.getElementById("variablesContainer");

        var variablesString = "";

        for(var variable in variablesMap)
        {
            if(!variablesMap.hasOwnProperty(variable)) { continue; }

            if(variablesString != "") { variablesString += ", "; }

            variablesString += variable;
        }

        variablesContainer.textContent = "{" + variablesString +"}";
    }

    function notifyArithmeticExpressions(expressions)
    {
        var expressionsContainer = document.getElementById("expressionsContainer");

        var expressionsString = "";

        for(var i = 0; i < expressions.length; i++)
        {
            if(i != 0) { expressionsString += ", "; }

            expressionsString += ASTHelper.getCode(expressions[i]);
        }

        expressionsContainer.textContent = "{" + expressionsString + "}";
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

    function computeKilledGenerated(program, programInfo)
    {
        if(program == null || programInfo == null) { return; }

        switch (selectedAnalysisType)
        {
            case analysisType.availableExpressions:
                computeKilledGeneratedAvailableExpressionsAnalysis(program, programInfo);
                break;
            case analysisType.reachingDefinitions:
                computeKilledGeneratedReachingDefinitionsAnalysis(program, programInfo);
                break;
            case analysisType.veryBusyExpressions:
                computeKilledGeneratedVeryBusyExpressionsAnalysis(program, programInfo);
            case analysisType.liveVariables:
                computeKilledGeneratedLiveVariablesAnalysis(program, programInfo);
            default:
        }
    }

    function computeKilledGeneratedAvailableExpressionsAnalysis(program, programInfo)
    {
        var labelMapping = programInfo.labelStatementMapping;
        var killDerivator = KillDerivator.instantiateAvailableExpressionsAnalysis();
        var generateDerivator = GenerateDerivator.instantiateAvailableExpressionsAnalysis();

        for(var label in labelMapping)
        {
            labelMapping[label].killed = killDerivator.getKilled(labelMapping[label].statement, program);
            labelMapping[label].generated = generateDerivator.getGenerated(labelMapping[label].statement, program);
        }

        notifyKilledGeneratedAnalysisResultsExpression(availableExpressionTableBody, programInfo);
    }

    function computeKilledGeneratedReachingDefinitionsAnalysis(program, programInfo)
    {
        var labelMapping = programInfo.labelStatementMapping;
        var killDerivator = KillDerivator.instantiateReachingDefinitionsAnalysis();
        var generateDerivator = GenerateDerivator.instantiateReachingDefinitionsAnalysis();

        for(var label in labelMapping)
        {
            labelMapping[label].killed = killDerivator.getKilled(labelMapping[label].statement, program);
            labelMapping[label].generated = generateDerivator.getGenerated(labelMapping[label].statement, program);
        }

        notifyKilledGeneratedAnalysisResultsVariablesAndLabels(reachingDefinitionsTableBody, programInfo);
    }

    function computeKilledGeneratedVeryBusyExpressionsAnalysis(program, programInfo)
    {
        var labelMapping = programInfo.labelStatementMapping;
        var killDerivator = KillDerivator.instantiateVeryBusyExpressionsAnalysis();
        var generatorDerivator = GenerateDerivator.instantiateVeryBusyExpressionsAnalysis();

        for(var label in labelMapping)
        {
            labelMapping[label].killed = killDerivator.getKilled(labelMapping[label].statement, program);
            labelMapping[label].generated = generatorDerivator.getGenerated(labelMapping[label].statement, program);
        }

        notifyKilledGeneratedAnalysisResultsExpression(veryBusyExpressionsTableBody, programInfo);
    }

    function computeKilledGeneratedLiveVariablesAnalysis(program, programInfo)
    {
        var labelMapping = programInfo.labelStatementMapping;
        var killDerivator = KillDerivator.instantiateLiveVariablesAnalysis();
        var generatorDerivator = GenerateDerivator.instantiateLiveVariablesAnalysis();

        for(var label in labelMapping)
        {
            labelMapping[label].killed = killDerivator.getKilled(labelMapping[label].statement, program);
            labelMapping[label].generated = generatorDerivator.getGenerated(labelMapping[label].statement, program);
        }

        notifyKilledGeneratedAnalysisResultsVariables(liveVariablesTableBody, programInfo);
    }

    function notifyKilledGeneratedAnalysisResultsExpression(tableBody, programInfo)
    {
        tableBody.innerHTML = "";

        var labelMapping = programInfo.labelStatementMapping;

        for(var label in labelMapping)
        {
            var row = document.createElement("tr");

            row.appendChild(createCell(label));
            row.appendChild(createCell(ASTHelper.getExpressionsCodeAsSetString(labelMapping[label].killed)));
            row.appendChild(createCell(ASTHelper.getExpressionsCodeAsSetString(labelMapping[label].generated)));

            tableBody.appendChild(row);
        }
    }

    function notifyKilledGeneratedAnalysisResultsVariablesAndLabels(tableBody, programInfo)
    {
        tableBody.innerHTML = "";

        var labelMapping = programInfo.labelStatementMapping;

        for(var label in labelMapping)
        {
            var row = document.createElement("tr");

            row.appendChild(createCell(label));
            row.appendChild(createCell(getVariablesAndLabelsString(labelMapping[label].killed)));
            row.appendChild(createCell(getVariablesAndLabelsString(labelMapping[label].generated)));

            tableBody.appendChild(row);
        }
    }

    function notifyKilledGeneratedAnalysisResultsVariables(tableBody, programInfo)
    {
        tableBody.innerHTML = "";

        var labelMapping = programInfo.labelStatementMapping;

        for(var label in labelMapping)
        {
            var row = document.createElement("tr");

            row.appendChild(createCell(label));
            row.appendChild(createCell("{" + labelMapping[label].killed.join(", ") + "}"));
            row.appendChild(createCell("{" + labelMapping[label].generated.join(",") + "}"));

            tableBody.appendChild(row);
        }
    }

    function getVariablesAndLabelsString(variablesAndLabels)
    {
        var string = "{";

        for(var i = 0; i < variablesAndLabels.length; i++)
        {
            if(i != 0) { string += ", "; }

            string += "(" + variablesAndLabels[i].variable + "," + (variablesAndLabels[i].label || "?") + ")";
        }

        return string + "}";
    }

    function createCell(text)
    {
        var cell = document.createElement("td");

        cell.textContent = text;

        return cell;
    }

    function startWorklistAlgorithm()
    {
        if(currentProgram != null && currentProgramInfo != null)
        {
            WorklistSolver.solveDataFlowEquations(MonotoneFramework.instantiateAvailableExpressionsAnalysis(currentProgram, currentProgramInfo));
        }
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