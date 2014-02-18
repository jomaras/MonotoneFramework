var WorklistSolver =
{
    solveDataFlowEquations: function(monotoneFramework)
    {
        var worklist = monotoneFramework.flow.slice(); //create a copy of flow
        var analysis = {};

        var labelsFromFlow = this._getLabelsFromFlow(monotoneFramework.flow);
        var extermalLabels = monotoneFramework.extermalLabels;

        var allLabels = this._performUnion(labelsFromFlow, extermalLabels);

        for(var i = 0; i < allLabels.length; i++)
        {
            var label = allLabels[i];

            analysis[label] = extermalLabels.indexOf(label) != -1 ? monotoneFramework.extermalValue
                                                                  : monotoneFramework.leastElement;
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

            if(this._isSatisfied(fAnalysis, analysis[l2], this._getOppositePartialOrdering(monotoneFramework.partialOrdering)))
            {
                analysis[l2] = monotoneFramework.boundOperation == MonotoneFramework.CONST.BOUND_OPERATION.UNION
                             ? this._performUnion(analysis[l2], fAnalysis)
                             : this._performIntersection(analysis[l2], fAnalysis);

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
        var item = {
            W: worklist.map(function(item){
                return "(" + item.first.label + ", " + item.second.label + ")";
            }).join(", ") || "()"
        };

        for(var label in analysis)
        {
            item[label] = "{" + analysis[label].join(", ") + "}";
        }

        state.push(item);
    },

    _isSatisfied: function(firstSet, secondSet, operation)
    {
        switch(operation)
        {
            case MonotoneFramework.CONST.PARTIAL_ORDERING.SUBSET:
                return this._isSubset(firstSet, secondSet);
            case MonotoneFramework.CONST.PARTIAL_ORDERING.SUBSET_EQ:
                return this._isSubsetEq(firstSet, secondSet);
            case MonotoneFramework.CONST.PARTIAL_ORDERING.SUPERSET:
                return this._isSuperset(firstSet, secondSet);
            case MonotoneFramework.CONST.PARTIAL_ORDERING.SUPERSET_EQ:
                return this._isSupersetEq(firstSet, secondSet);
            default:
                return null;
        }
    },

    _isSubset: function(firstSet, secondSet)
    {
        var sameItemsCount = 0;

        if(firstSet.length == 0) { return true; }

        for(var i = 0; i < firstSet.length; i++)
        {
            if(secondSet.indexOf(firstSet[i]) != -1)
            {
                sameItemsCount++;
            }
        }

        return sameItemsCount == firstSet.length && sameItemsCount != secondSet.length;
    },

    _isSubsetEq: function(firstSet, secondSet)
    {
        var sameItemsCount = 0;

        for(var i = 0; i < firstSet.length; i++)
        {
            if(secondSet.indexOf(firstSet[i]))
            {
                sameItemsCount++;
            }
        }

        return sameItemsCount == firstSet.length;
    },

    _isSuperset: function(firstSet, secondSet)
    {
        return !this._isSubsetEq(secondSet, firstSet);
    },

    _isSupersetEq: function(firstSet, secondSet)
    {
        return !this._isSubset(secondSet, firstSet);
    },

    _getOppositePartialOrdering: function(partialOrdering)
    {
        switch(partialOrdering)
        {
            case MonotoneFramework.CONST.PARTIAL_ORDERING.SUBSET:
                return MonotoneFramework.CONST.PARTIAL_ORDERING.SUPERSET_EQ;
            case MonotoneFramework.CONST.PARTIAL_ORDERING.SUBSET_EQ:
                return MonotoneFramework.CONST.PARTIAL_ORDERING.SUPERSET;
            case MonotoneFramework.CONST.PARTIAL_ORDERING.SUPERSET:
                return MonotoneFramework.CONST.PARTIAL_ORDERING.SUBSET_EQ;
            case MonotoneFramework.CONST.PARTIAL_ORDERING.SUPERSET_EQ:
                return MonotoneFramework.CONST.PARTIAL_ORDERING.SUBSET;
            default:
                return null;
        }
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
        return this._performUnion(this._removeFromSet(currentAnalysisValue, labelStatementMapping[label].killed), labelStatementMapping[label].generated);
    },

    _removeFromSet: function(mainSet, setToRemove)
    {
        var newSet = [];

        for(var i = 0; i < mainSet.length; i++)
        {
            if(setToRemove.indexOf(mainSet[i]) == -1)
            {
                newSet.push(mainSet[i]);
            }
        }

        return newSet;
    },

    _performUnion: function(set1, set2)
    {
        var union = [];

        for(var i = 0; i < set1.length; i++)
        {
            union.push(set1[i]);
        }

        for(var i = 0; i < set2.length; i++)
        {
            if(union.indexOf(set2[i]) == -1)
            {
                union.push(set2[i]);
            }
        }

        return union;
    },

    _performIntersection: function(set1, set2)
    {
        var intersection = [];

        for(var i = 0; i < set1.length; i++)
        {
            if(set2.indexOf(set1[i]) != -1)
            {
                intersection.push(set1[i]);
            }
        }

        return intersection;
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
