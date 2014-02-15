function KillDerivator() {}

KillDerivator.prototype.getKilled = function(statement, program)
{
         if(ASTHelper.isAssignmentExpression(statement) || ASTHelper.isAssignmentExpressionStatement(statement)) { return this._getKilledFromAssignmentExpression(statement, program);}
    else if(ASTHelper.isEmptyStatement(statement)) { return this._getKilledFromEmptyStatement(statement, program); }
    else if(ASTHelper.isConditionalStatement(statement)) { return this._getKilledFromConditionalStatement(statement, program); }
};

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
            killedArithmeticExpressions.push(arithmeticExpression);
        }
    }

    return killedArithmeticExpressions;
};

KillDerivator.prototype._reachingDefinitionsGetKilledFromAssignmentExpression = function(statement, program)
{
    var identifierName = ASTHelper.getAssignedIdentifierName(statement);

    var killed = [];

    killed.push({variable: identifierName, label: null});

    var assignmentExpressionStatements = ASTHelper.getAssignmentExpressionStatements(program);

    for(var i = 0; i < assignmentExpressionStatements.length; i++)
    {
        var assignmentExpressionStatement = assignmentExpressionStatements[i];
        if(ASTHelper.containsIdentifierWithName(assignmentExpressionStatement, identifierName))
        {
            killed.push({variable: identifierName, label: assignmentExpressionStatement.label});
        }
    }

    return killed;
};

KillDerivator.prototype._availableExpressionsGetKilledFromEmptyStatement = function(statement, program)
{
    return [];
}

KillDerivator.prototype._availableExpressionsGetKilledFromConditionalStatement = function(statement, program)
{
    return [];
}

KillDerivator.prototype._reachingDefinitionsGetKilledFromEmptyStatement = function(statement, program)
{
    return [];
}

KillDerivator.prototype._reachingDefinitionsGetKilledFromConditionalStatement = function(statement, program)
{
    return [];
}

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

