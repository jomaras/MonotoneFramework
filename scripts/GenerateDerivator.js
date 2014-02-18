function GenerateDerivator(){}

GenerateDerivator.prototype.getGenerated = function(statement, program)
{
         if(ASTHelper.isAssignmentExpression(statement) || ASTHelper.isAssignmentExpressionStatement(statement)) { return this._getGeneratedFromAssignmentExpression(statement, program);}
    else if(ASTHelper.isEmptyStatement(statement)) { return this._getGeneratedFromEmptyStatement(statement, program); }
    else if(ASTHelper.isConditionalStatement(statement)) { return this._getGeneratedFromConditionalStatement(statement, program); }
};

/*AVAILABLE EXPRESSIONS*/
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
            generatedArithmeticExpressions.push(ASTHelper.getCode(arithmeticExpression));
        }
    }

    return generatedArithmeticExpressions;
};
GenerateDerivator.prototype._availableExpressionsGetGeneratedFromEmptyStatement = function(statement, program) { return []; }
GenerateDerivator.prototype._availableExpressionsGetGeneratedFromConditionalStatement = function(statement, program)
{
    return ASTHelper.getArithmeticExpressionsAsCode(statement.test);
}


/*REACHING DEFINITIONS*/
GenerateDerivator.prototype._reachingDefinitionsGetGeneratedFromAssignmentExpression = function(statement, program)
{
    if(!ASTHelper.isAssignmentExpressionStatement(statement)) { return []; }

    return ["(" + ASTHelper.getAssignedIdentifierName(statement) + "," + statement.label + ")"];
};
GenerateDerivator.prototype._reachingDefinitionsGetGeneratedFromEmptyStatement = function(statement, program) { return []; }
GenerateDerivator.prototype._reachingDefinitionsGetGeneratedFromConditionalStatement = function(statement, program) { return []; }


/*VERY BUSY EXPRESSIONS*/
GenerateDerivator.prototype._veryBusyExpressionsGetGeneratedFromAssignmentExpression = function(statement, program)
{
    return ASTHelper.getArithmeticExpressionsAsCode(statement);
};
GenerateDerivator.prototype._veryBusyExpressionsGetGeneratedFromEmptyStatement = function(statement, program) { return []; }
GenerateDerivator.prototype._veryBusyExpressionsGetGeneratedFromConditionalStatement = function(statement, program)
{
    return ASTHelper.getArithmeticExpressionsAsCode(statement.test);
}


/*LIVE VARIABLES*/
GenerateDerivator.prototype._liveVariablesGetGeneratedFromAssignmentExpression = function(statement, program)
{
    if(ASTHelper.isExpressionStatement(statement)) { statement = statement.expression; }

    var identifiersMap = ASTHelper.getUniqueIdentifiersMap(statement.right);

    var identifiers = [];

    for(var identifier in identifiersMap)
    {
        if(identifiersMap.hasOwnProperty(identifier))
        {
            identifiers.push(identifier);
        }
    }

    return identifiers;
};
GenerateDerivator.prototype._liveVariablesGetGeneratedFromEmptyStatement = function(statement, program) { return []; }
GenerateDerivator.prototype._liveVariablesGetGeneratedFromConditionalStatement = function(statement, program)
{
    var identifiersMap = ASTHelper.getUniqueIdentifiersMap(statement.test);

    var identifiers = [];

    for(var identifier in identifiersMap)
    {
        if(identifiersMap.hasOwnProperty(identifier))
        {
            identifiers.push(identifier);
        }
    }

    return identifiers;
}

/*"STATIC" METHODS*/
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

GenerateDerivator.instantiateVeryBusyExpressionsAnalysis = function()
{
    var generateDerivator = new GenerateDerivator();

    generateDerivator._getGeneratedFromAssignmentExpression = generateDerivator._veryBusyExpressionsGetGeneratedFromAssignmentExpression;
    generateDerivator._getGeneratedFromEmptyStatement = generateDerivator._veryBusyExpressionsGetGeneratedFromEmptyStatement;
    generateDerivator._getGeneratedFromConditionalStatement = generateDerivator._veryBusyExpressionsGetGeneratedFromConditionalStatement;

    return generateDerivator;
};

GenerateDerivator.instantiateLiveVariablesAnalysis = function()
{
    var generateDerivator = new GenerateDerivator();

    generateDerivator._getGeneratedFromAssignmentExpression = generateDerivator._liveVariablesGetGeneratedFromAssignmentExpression;
    generateDerivator._getGeneratedFromEmptyStatement = generateDerivator._liveVariablesGetGeneratedFromEmptyStatement;
    generateDerivator._getGeneratedFromConditionalStatement = generateDerivator._liveVariablesGetGeneratedFromConditionalStatement;

    return generateDerivator;
};