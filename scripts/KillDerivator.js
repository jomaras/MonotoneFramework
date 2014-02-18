function KillDerivator() {}

KillDerivator.prototype.getKilled = function(statement, program)
{
         if(ASTHelper.isAssignmentExpression(statement) || ASTHelper.isAssignmentExpressionStatement(statement)) { return this._getKilledFromAssignmentExpression(statement, program);}
    else if(ASTHelper.isEmptyStatement(statement)) { return this._getKilledFromEmptyStatement(statement, program); }
    else if(ASTHelper.isConditionalStatement(statement)) { return this._getKilledFromConditionalStatement(statement, program); }
};

/*AVAILABLE EXPRESSIONS*/
KillDerivator.prototype._availableExpressionsGetKilledFromAssignmentExpression = function(statement, program)
{
    var allArithmeticExpressions = ASTHelper.getArithmeticExpressions(program);

    var killedArithmeticExpressions = [];
    var identifierName = ASTHelper.getAssignedIdentifierName(statement);

    for(var i = 0; i < allArithmeticExpressions.length; i++)
    {
        var arithmeticExpression = allArithmeticExpressions[i];

        if(ASTHelper.containsIdentifierWithName(arithmeticExpression, identifierName))
        {
            killedArithmeticExpressions.push(ASTHelper.getCode(arithmeticExpression));
        }
    }

    return killedArithmeticExpressions;
};
KillDerivator.prototype._availableExpressionsGetKilledFromEmptyStatement = function(statement, program) { return []; }
KillDerivator.prototype._availableExpressionsGetKilledFromConditionalStatement = function(statement, program) { return []; }

/*REACHING DEFINITIONS*/
KillDerivator.prototype._reachingDefinitionsGetKilledFromAssignmentExpression = function(statement, program)
{
    var identifierName = ASTHelper.getAssignedIdentifierName(statement);

    var killed = [];

    killed.push("(" + identifierName + ",?)");

    var assignmentExpressionStatements = ASTHelper.getAssignmentExpressionStatements(program);

    for(var i = 0; i < assignmentExpressionStatements.length; i++)
    {
        var assignmentExpressionStatement = assignmentExpressionStatements[i];

        if(ASTHelper.getAssignedIdentifierName(assignmentExpressionStatement) == identifierName)
        {
            killed.push("(" + identifierName + "," + assignmentExpressionStatement.label + ")");
        }
    }

    return killed;
};
KillDerivator.prototype._reachingDefinitionsGetKilledFromEmptyStatement = function(statement, program) { return []; }
KillDerivator.prototype._reachingDefinitionsGetKilledFromConditionalStatement = function(statement, program) { return []; }

/*VERY BUSY EXPRESSIONS*/
KillDerivator.prototype._veryBusyExpressionsGetKilledFromAssignmentExpression = function(statement, program)
{
    var allArithmeticExpressions = ASTHelper.getArithmeticExpressions(program);

    var killedArithmeticExpressions = [];
    var identifierName = ASTHelper.getAssignedIdentifierName(statement);

    for(var i = 0; i < allArithmeticExpressions.length; i++)
    {
        var arithmeticExpression = allArithmeticExpressions[i];

        if(ASTHelper.containsIdentifierWithName(arithmeticExpression, identifierName))
        {
            killedArithmeticExpressions.push(ASTHelper.getCode(arithmeticExpression));
        }
    }

    return killedArithmeticExpressions;
};
KillDerivator.prototype._veryBusyExpressionsGetKilledFromEmptyStatement = function(statement, program) { return []; }
KillDerivator.prototype._veryBusyExpressionsGetKilledFromConditionalStatement = function(statement, program) { return []; }

/*LIVE VARIABLES ANALYSIS*/
KillDerivator.prototype._liveVariablesGetKilledFromAssignmentExpression = function(statement, program)
{
    return [ASTHelper.getAssignedIdentifierName(statement)];
};
KillDerivator.prototype._liveVariablesGetKilledFromEmptyStatement = function(statement, program) { return []; }
KillDerivator.prototype._liveVariablesGetKilledFromConditionalStatement = function(statement, program) { return []; }

/*STRONGLY LIVE VARIABLES ANALYSIS*/
KillDerivator.prototype._stronglyLiveVariablesGetKilledFromAssignmentExpression = function(statement, program)
{
    return [ASTHelper.getAssignedIdentifierName(statement)];
};
KillDerivator.prototype._stronglyLiveVariablesGetKilledFromEmptyStatement = function(statement, program) { return []; }
KillDerivator.prototype._stronglyLiveVariablesGetKilledFromConditionalStatement = function(statement, program) { return []; }

/*"STATIC" METHODS*/
KillDerivator.instantiateAvailableExpressionsAnalysis = function()
{
    var killDerivator = new KillDerivator();

    killDerivator._getKilledFromAssignmentExpression = killDerivator._availableExpressionsGetKilledFromAssignmentExpression;
    killDerivator._getKilledFromEmptyStatement = killDerivator._availableExpressionsGetKilledFromEmptyStatement;
    killDerivator._getKilledFromConditionalStatement = killDerivator._availableExpressionsGetKilledFromConditionalStatement;

    return killDerivator;
};
KillDerivator.instantiateReachingDefinitionsAnalysis = function()
{
    var killDerivator = new KillDerivator();

    killDerivator._getKilledFromAssignmentExpression = killDerivator._reachingDefinitionsGetKilledFromAssignmentExpression;
    killDerivator._getKilledFromEmptyStatement = killDerivator._reachingDefinitionsGetKilledFromEmptyStatement;
    killDerivator._getKilledFromConditionalStatement = killDerivator._reachingDefinitionsGetKilledFromConditionalStatement;

    return killDerivator;
};
KillDerivator.instantiateVeryBusyExpressionsAnalysis = function()
{
    var killDerivator = new KillDerivator();

    killDerivator._getKilledFromAssignmentExpression = killDerivator._veryBusyExpressionsGetKilledFromAssignmentExpression;
    killDerivator._getKilledFromEmptyStatement = killDerivator._veryBusyExpressionsGetKilledFromEmptyStatement;
    killDerivator._getKilledFromConditionalStatement = killDerivator._veryBusyExpressionsGetKilledFromConditionalStatement;

    return killDerivator;
};
KillDerivator.instantiateLiveVariablesAnalysis = function()
{
    var killDerivator = new KillDerivator();

    killDerivator._getKilledFromAssignmentExpression = killDerivator._liveVariablesGetKilledFromAssignmentExpression;
    killDerivator._getKilledFromEmptyStatement = killDerivator._liveVariablesGetKilledFromEmptyStatement;
    killDerivator._getKilledFromConditionalStatement = killDerivator._liveVariablesGetKilledFromConditionalStatement;

    return killDerivator;
};
KillDerivator.instantiateStronglyLiveVariablesAnalysis = function()
{
    var killDerivator = new KillDerivator();

    killDerivator._getKilledFromAssignmentExpression = killDerivator._stronglyLiveVariablesGetKilledFromAssignmentExpression;
    killDerivator._getKilledFromEmptyStatement = killDerivator._stronglyLiveVariablesGetKilledFromEmptyStatement;
    killDerivator._getKilledFromConditionalStatement = killDerivator._stronglyLiveVariablesGetKilledFromConditionalStatement;

    return killDerivator;
};

