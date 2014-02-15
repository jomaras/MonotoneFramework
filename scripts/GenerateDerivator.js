function GenerateDerivator(){}

GenerateDerivator.prototype.getGenerated = function(statement, program)
{
         if(ASTHelper.isAssignmentExpression(statement) || ASTHelper.isAssignmentExpressionStatement(statement)) { return this._getGeneratedFromAssignmentExpression(statement, program);}
    else if(ASTHelper.isEmptyStatement(statement)) { return this._getGeneratedFromEmptyStatement(statement, program); }
    else if(ASTHelper.isConditionalStatement(statement)) { return this._getGeneratedFromConditionalStatement(statement, program); }
};

GenerateDerivator.prototype._availableExpressionsGetGeneratedFromAssignmentExpression = function(statement, program)
{
    var allArithmeticExpressions = ASTHelper.getArithmeticExpressions(statement);

    var generatedArithmeticExpressions = [];
    var identifierName = ASTHelper.getAssignedIdentifierName(statement);

    for(var i = 0; i < allArithmeticExpressions.length; i++)
    {
        var arithmeticExpression = allArithmeticExpressions[i];

        if(!ASTHelper.containsIdentifierWithName(arithmeticExpression, identifierName))
        {
            generatedArithmeticExpressions.push(arithmeticExpression);
        }
    }

    return generatedArithmeticExpressions;
};

GenerateDerivator.prototype._availableExpressionsGetGeneratedFromEmptyStatement = function(statement, program)
{
    return [];
}

GenerateDerivator.prototype._availableExpressionsGetGeneratedFromConditionalStatement = function(statement, program)
{
    return ASTHelper.getArithmeticExpressions(statement.test);
}

GenerateDerivator.prototype._reachingDefinitionsGetGeneratedFromAssignmentExpression = function(statement, program)
{
    if(!ASTHelper.isAssignmentExpressionStatement(statement)) { return []; }

    return [{variable: ASTHelper.getAssignedIdentifierName(statement), label: statement.label}];
};

GenerateDerivator.prototype._reachingDefinitionsGetGeneratedFromEmptyStatement = function(statement, program)
{
    return [];
}

GenerateDerivator.prototype._reachingDefinitionsGetGeneratedFromConditionalStatement = function(statement, program)
{
    return [];
}

GenerateDerivator.instantiateAvailableExpressionsAnalysis = function()
{
    var generateDerivator = new GenerateDerivator();

    generateDerivator._getGeneratedFromAssignmentExpression = generateDerivator._availableExpressionsGetGeneratedFromAssignmentExpression;
    generateDerivator._getGeneratedFromEmptyStatement = generateDerivator._availableExpressionsGetGeneratedFromEmptyStatement;
    generateDerivator._getGeneratedFromConditionalStatement = generateDerivator._availableExpressionsGetGeneratedFromConditionalStatement;

    return generateDerivator;
};

GenerateDerivator.instantiateReachingDefinitionsAnalysis = function()
{
    var generateDerivator = new GenerateDerivator();

    generateDerivator._getGeneratedFromAssignmentExpression = generateDerivator._reachingDefinitionsGetGeneratedFromAssignmentExpression;
    generateDerivator._getGeneratedFromEmptyStatement = generateDerivator._reachingDefinitionsGetGeneratedFromEmptyStatement;
    generateDerivator._getGeneratedFromConditionalStatement = generateDerivator._reachingDefinitionsGetGeneratedFromConditionalStatement;

    return generateDerivator;
};