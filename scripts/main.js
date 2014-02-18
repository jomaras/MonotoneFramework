window.onload = function ()
{
    var parseId;

    var infoElement = document.getElementById("info");
    var graphContainer = document.getElementById("graphContainer");
    var flowContainer = document.getElementById("flowContainer");

    var examplesContainer = document.getElementById("examplesContainer");

    var analysisResultsTableBody = document.getElementById("analysisResultsTableBody");

    var monotoneFrameworkAnalysisResultsHeaderRow = document.getElementById("monotoneFrameworkAnalysisResultsHeaderRow");
    var monotoneFrameworkAnalysisResultsBody = document.getElementById("monotoneFrameworkAnalysisResultsBody");

    var workListAlgorithmContainer = document.getElementById("workListAlgorithmContainer");

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

    var analysisSelector = document.getElementById("analysisSelector");
    var workListAlgorithmContainer = document.getElementById("workListAlgorithmContainer");

    var selectedAnalysisType = analysisType.availableExpressions;

    analysisSelector.onchange = function()
    {
        selectedAnalysisType = this.value;

        startWorklistAlgorithm();

        workListAlgorithmContainer.style.display = "";
    };

    function parse(delay)
    {
        if (parseId) { window.clearTimeout(parseId); }

        parseId = window.setTimeout(function ()
        {
            infoElement.className = 'alert-box secondary';

            try
            {
                resetWorklistResults();

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

    function resetWorklistResults()
    {
        workListAlgorithmContainer.style.display = "none";
        analysisResultsTableBody.innerHTML = "";
        analysisSelector.selectedIndex = 0
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

        var labelMapping = programInfo.labelStatementMapping;

        var killDerivator = getKillDerivator();
        var generatorDerivator = getGenerateDerivator();

        for(var label in labelMapping)
        {
            labelMapping[label].killed = killDerivator.getKilled(labelMapping[label].statement, program);
            labelMapping[label].generated = generatorDerivator.getGenerated(labelMapping[label].statement, program);
        }
    }

    function getKillDerivator()
    {
        switch (selectedAnalysisType)
        {
            case analysisType.availableExpressions:
                return KillDerivator.instantiateAvailableExpressionsAnalysis();
            case analysisType.reachingDefinitions:
                return KillDerivator.instantiateReachingDefinitionsAnalysis();
            case analysisType.veryBusyExpressions:
                return KillDerivator.instantiateVeryBusyExpressionsAnalysis();
            case analysisType.liveVariables:
                return KillDerivator.instantiateLiveVariablesAnalysis();
            default:
        }
    }

    function getGenerateDerivator()
    {
        switch (selectedAnalysisType)
        {
            case analysisType.availableExpressions:
                return GenerateDerivator.instantiateAvailableExpressionsAnalysis();
            case analysisType.reachingDefinitions:
                return GenerateDerivator.instantiateReachingDefinitionsAnalysis();
            case analysisType.veryBusyExpressions:
                return GenerateDerivator.instantiateVeryBusyExpressionsAnalysis();
            case analysisType.liveVariables:
                return GenerateDerivator.instantiateLiveVariablesAnalysis();
            default:
        }
    }

    function notifyAnalysisResults(programInfo)
    {
        analysisResultsTableBody.innerHTML = "";

        var labelMapping = programInfo.labelStatementMapping;

        for(var label in labelMapping)
        {
            var row = document.createElement("tr");

            row.appendChild(createCell(label));
            row.appendChild(createCell("{" + labelMapping[label].killed.join(", ") + "}"));
            row.appendChild(createCell("{" + labelMapping[label].generated.join(", ") + "}"));
            row.appendChild(createCell(labelMapping[label].inCondition.toString().replace("Set:", "")));
            row.appendChild(createCell(labelMapping[label].outCondition.toString().replace("Set:", "")));

            analysisResultsTableBody.appendChild(row);
        }
    }

    function createCell(text)
    {
        var cell = document.createElement("td");

        cell.textContent = text;

        return cell;
    }

    function createHeaderCell(text)
    {
        var cell = document.createElement("th");

        cell.textContent = text;

        return cell;
    }

    function startWorklistAlgorithm()
    {
        if(currentProgram != null && currentProgramInfo != null)
        {
            computeKilledGenerated(currentProgram, currentProgramInfo);

            var monotoneFramework = getMonotoneFramework();

            var result = WorklistSolver.solveDataFlowEquations(monotoneFramework);

            var inConditions = monotoneFramework.isForwardAnalysis() ? result.inConditions : result.outConditions;
            var outConditions = monotoneFramework.isForwardAnalysis() ? result.outConditions : result.inConditions;

            for(var label in inConditions)
            {
                currentProgramInfo.labelStatementMapping[label].inCondition = inConditions[label];
            }

            for(var label in outConditions)
            {
                currentProgramInfo.labelStatementMapping[label].outCondition = outConditions[label];
            }

            notifyAnalysisResults(currentProgramInfo);

            monotoneFrameworkAnalysisResultsHeaderRow.innerHTML = "";

            monotoneFrameworkAnalysisResultsHeaderRow.appendChild(createHeaderCell("#"));
            monotoneFrameworkAnalysisResultsHeaderRow.appendChild(createHeaderCell("W"));

            var labels = currentProgramInfo.labels;

            for(var i = 0; i < labels.length; i++)
            {
                monotoneFrameworkAnalysisResultsHeaderRow.appendChild(createHeaderCell(labels[i]));
            }

            monotoneFrameworkAnalysisResultsBody.innerHTML = "";

            for(var i = 0; i < result.states.length; i++)
            {
                var state = result.states[i];
                var row = document.createElement("tr");
                row.appendChild(createCell(i + 1));

                row.appendChild(createCell(state.W));

                for(var j = 0; j < labels.length; j++)
                {
                    row.appendChild(createCell(state[labels[j]]));
                }

                monotoneFrameworkAnalysisResultsBody.appendChild(row);
            }
        }
    }

    function getMonotoneFramework()
    {
        switch(selectedAnalysisType)
        {
            case analysisType.availableExpressions:
                return MonotoneFramework.instantiateAvailableExpressionsAnalysis(currentProgram, currentProgramInfo);
            case analysisType.liveVariables:
                return MonotoneFramework.instantiateLiveVariablesAnalysis(currentProgram, currentProgramInfo);
            case analysisType.reachingDefinitions:
                return MonotoneFramework.instantiateReachingDefinitionsAnalysis(currentProgram, currentProgramInfo);
            case analysisType.veryBusyExpressions:
                return MonotoneFramework.instantiateVeryBusyExpressionsAnalysis(currentProgram, currentProgramInfo);
            default:
                return MonotoneFramework.instantiateAvailableExpressionsAnalysis(currentProgram, currentProgramInfo);
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
    }
    catch (e)
    {
        console.log("Error: " + e);
    }
};