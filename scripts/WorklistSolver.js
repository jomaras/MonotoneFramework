var JsSet = null;
JS.require('JS.Set', function(Set)
{
    JsSet = Set;
});


var WorklistSolver =
{
    solveDataFlowEquations: function(monotoneFramework)
    {
        var worklist = monotoneFramework.flow.slice(); //create a copy of flow
        var analysis = {};

        var labelsFromFlow = new JsSet(this._getLabelsFromFlow(monotoneFramework.flow));
        var extermalLabels = new JsSet(monotoneFramework.extermalLabels);

        var allLabels = labelsFromFlow.union(extermalLabels).toArray();

        for(var i = 0; i < allLabels.length; i++)
        {
            var label = allLabels[i];

            if(label != null)
            {
                analysis[label] = extermalLabels.contains(label) ? new JsSet(monotoneFramework.extermalValue)
                                                                 : new JsSet(monotoneFramework.leastElement);
            }
        }

        var states = [];

        this._logState(states, worklist, analysis);

        var numberOfIterations = 0;
        while(worklist.length != 0)
        {
            var firstElement = worklist.shift();

            var l1 = firstElement.first.label;
            var l2 = firstElement.second.label;

            var fAnalysis = this._executeTransferFunction(analysis[l1], l1, monotoneFramework.programInfo.labelStatementMapping);

            if(!this._isSatisfied(fAnalysis, analysis[l2], monotoneFramework.partialOrdering))
            {
                analysis[l2] = monotoneFramework.boundOperation == MonotoneFramework.CONST.BOUND_OPERATION.UNION
                                                                    ? analysis[l2].union(fAnalysis)
                                                                    : analysis[l2].intersection(fAnalysis);

                var subsequentFlow = this._getFlowItemsWithFirstLabel(monotoneFramework.flow, l2);

                for(var i = 0; i < subsequentFlow.length; i++)
                {
                    worklist.unshift(subsequentFlow[i]);
                }
            }

            this._logState(states, worklist, analysis);

            numberOfIterations++;

            if(numberOfIterations > 0 && numberOfIterations % 100 == 0
            && prompt("Do you want to cancel the worklist algorithm?"))
            {
                break;
            }
        }

        return {
            states: states,
            inConditions: analysis,
            outConditions: this._applyTransferFunction(analysis, monotoneFramework.programInfo.labelStatementMapping)
        }
    },

    _applyTransferFunction: function(analysis, labelStatementMapping)
    {
        var fAnalysis = {};

        for(var label in analysis)
        {
            if(!analysis.hasOwnProperty(label)) { continue; }

            fAnalysis[label] = this._executeTransferFunction(analysis[label], label, labelStatementMapping);
        }

        return fAnalysis;
    },

    _logState: function(state, worklist, analysis)
    {
        var item =
        {
            W: worklist.map(function(item){
                return "(" + item.first.label + ", " + item.second.label + ")";
            }).join(", ") || "()"
        };

        for(var label in analysis)
        {
            item[label] = analysis[label].toString().replace("Set:", "");
        }

        state.push(item);
    },

    _isSatisfied: function(firstSet, secondSet, operation)
    {
        switch(operation)
        {
            case MonotoneFramework.CONST.PARTIAL_ORDERING.SUBSET:
                return firstSet.isProperSubset(secondSet);
            case MonotoneFramework.CONST.PARTIAL_ORDERING.SUBSET_EQ:
                return firstSet.isSubset(secondSet);
            case MonotoneFramework.CONST.PARTIAL_ORDERING.SUPERSET:
                return firstSet.isProperSuperset(secondSet);
            case MonotoneFramework.CONST.PARTIAL_ORDERING.SUPERSET_EQ:
                return firstSet.isSuperset(secondSet);
            default:
                return null;
        }

        /*console.log(firstSet.toString(), secondSet.toString(), operation, res);*/
    },

    _getFlowItemsWithFirstLabel: function(flow, label)
    {
        var flowItems = [];

        for(var i = 0; i < flow.length; i++)
        {
            if(flow[i].first.label == label)
            {
                flowItems.push(flow[i]);
            }
        }

        return flowItems;
    },

    _executeTransferFunction: function(currentAnalysisValue, label, labelStatementMapping)
    {
        /*console.log("Current: " + currentAnalysisValue, "Killed: " + labelStatementMapping[label].killed, "Generated: " + labelStatementMapping[label].generated,
                    "Result: " + currentAnalysisValue.difference(labelStatementMapping[label].killed).union(labelStatementMapping[label].generated));*/
        return currentAnalysisValue.difference(labelStatementMapping[label].killed).union(labelStatementMapping[label].generated);
    },

    _getLabelsFromFlow: function(flow)
    {
        var map = {};

        for(var i = 0; i < flow.length; i++)
        {
            map[flow[i].first.label] = true;
            map[flow[i].second.label] = true;
        }

        var labels = [];

        for(var label in map)
        {
            if(map.hasOwnProperty(label))
            {
                labels.push(parseInt(label));
            }
        }

        return labels;
    }
}
