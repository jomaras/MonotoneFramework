function MonotoneFramework(completeLattice, extermalValue, partialOrdering, analysisDirection, program, programInfo)
{
    this.completeLattice = completeLattice;     //L
    this.extermalValue = extermalValue;         //i (without the dot) i \in L
    this.partialOrdering = partialOrdering;     //<= of >=
    this.analysisDirection = analysisDirection; //Forward, backward
    this.program = program;
    this.programInfo = programInfo; // contains .labelMapping with .killed and .generated

    switch(this.partialOrdering)
    {
        case MonotoneFramework.CONST.PARTIAL_ORDERING.SUBSET:
        case MonotoneFramework.CONST.PARTIAL_ORDERING.SUBSET_EQ:
            this.leastElement = [];
            this.boundOperation = MonotoneFramework.CONST.BOUND_OPERATION.UNION;
            break;
        case MonotoneFramework.CONST.PARTIAL_ORDERING.SUPERSET:
        case MonotoneFramework.CONST.PARTIAL_ORDERING.SUPERSET_EQ:
            this.leastElement = ASTHelper.getArithmeticExpressionsAsCode(this.program);
            this.boundOperation = MonotoneFramework.CONST.BOUND_OPERATION.INTERSECTION;
            break;
        default:
            throw new Error("Unknown partial ordering when creating a monotone framework, was given: " + this.partialOrdering);
    }

    switch(this.analysisDirection)
    {
        case MonotoneFramework.CONST.ANALYSIS_DIRECTION.FORWARD:
            this.extermalLabels = ASTHelper.getInitialLabels(this.program);
            this.flow = ASTHelper.getFlow(this.program);
            break;
        case MonotoneFramework.CONST.ANALYSIS_DIRECTION.BACKWARD:
            this.extermalLabels = ASTHelper.getFinalLabels(this.program);
            this.flow = ASTHelper.getReverseFlow(this.program);
            break;
        default:
            throw new Error("Unknown analysis direction, was given:" + this.analysisDirection);
    }
}

MonotoneFramework.prototype.isForwardAnalysis = function()
{
    return this.analysisDirection === MonotoneFramework.CONST.ANALYSIS_DIRECTION.FORWARD;
};

MonotoneFramework.CONST =
{
    COMPLETE_LATTICE:
    {
        ARITHMETIC_EXPRESSIONS: "ARITHMETIC_EXPRESSIONS",
        VARIABLES_LABELS: "VARIABLES_LABELS",
        VARIABLES: "VARIABLES"
    },

    PARTIAL_ORDERING:
    {
        SUBSET: "SUBSET",
        SUBSET_EQ: "SUBSET_EQ",
        SUPERSET : "SUPERSET",
        SUPERSET_EQ: "SUPERSET_EQ"
    },

    EXTERMAL_LABELS:
    {
        INITIAL_LABELS: "INITIAL_LABELS",
        FINAL_LABELS: "FINAL_LABELS"
    },

    EXTERMAL_VALUE:
    {
        EMPTY: "EMPTY",
        FREE_VARIABLES_WITH_UNKNOWN_LABEL: "FREE_VARIABLES_WITH_UNKNOWN_LABEL"
    },

    ANALYSIS_DIRECTION:
    {
        FORWARD: "FORWARD",
        BACKWARD: "BACKWARD"
    },

    LEAST_ELEMENT:
    {
        EMPTY: "EMPTY",
        ARITHMETIC_EXPRESSIONS: "ARITHMETIC_EXPRESSIONS"
    },

    BOUND_OPERATION:
    {
        UNION: "UNION",
        INTERSECTION: "INTERSECTION"
    }
};

MonotoneFramework.instantiateAvailableExpressionsAnalysis = function(program, programInfo)
{
    return new MonotoneFramework
    (
        MonotoneFramework.CONST.COMPLETE_LATTICE.ARITHMETIC_EXPRESSIONS,
        [],
        MonotoneFramework.CONST.PARTIAL_ORDERING.SUPERSET_EQ,
        MonotoneFramework.CONST.ANALYSIS_DIRECTION.FORWARD,
        program,
        programInfo
    );
};

MonotoneFramework.instantiateReachingDefinitionsAnalysis = function(program, programInfo)
{
    return new MonotoneFramework
    (
        MonotoneFramework.CONST.COMPLETE_LATTICE.VARIABLES_LABELS,
        MonotoneFramework._getVariablesUnknownLabels(program),
        MonotoneFramework.CONST.PARTIAL_ORDERING.SUBSET_EQ,
        MonotoneFramework.CONST.ANALYSIS_DIRECTION.FORWARD,
        program,
        programInfo
    );
};

MonotoneFramework.instantiateVeryBusyExpressionsAnalysis = function(program, programInfo)
{
    return new MonotoneFramework
    (
        MonotoneFramework.CONST.COMPLETE_LATTICE.ARITHMETIC_EXPRESSIONS,
        [],
        MonotoneFramework.CONST.PARTIAL_ORDERING.SUPERSET_EQ,
        MonotoneFramework.CONST.ANALYSIS_DIRECTION.BACKWARD,
        program,
        programInfo
    );
};

MonotoneFramework.instantiateLiveVariablesAnalysis = function(program, programInfo)
{
    return new MonotoneFramework
    (
        MonotoneFramework.CONST.COMPLETE_LATTICE.VARIABLES,
        [],
        MonotoneFramework.CONST.PARTIAL_ORDERING.SUBSET_EQ,
        MonotoneFramework.CONST.ANALYSIS_DIRECTION.BACKWARD,
        program,
        programInfo
    );
};


MonotoneFramework._getVariablesUnknownLabels = function(program)
{
    var identifiersMap = ASTHelper.getUniqueIdentifiersMap(program);
    var variablesUnknownLabels = [];

    for(var identifier in identifiersMap)
    {
        variablesUnknownLabels.push("(" + identifier + ",?)");
    }

    return variablesUnknownLabels;
};

MonotoneFramework.VariableLabel = function(variable, label)
{
    this.variable = variable;
    this.label = label;
};

MonotoneFramework.VariableLabel.prototype.toString = function()
{
    return "(" + this.variable + "," + (this.label || "?") + ")";
}