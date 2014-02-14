var ASTHelper =
{
    CONST:
    {
        Identifier: "Identifier",
        BinaryExpression: "BinaryExpression",
        Literal: "Literal",
        EmptyStatement: "EmptyStatement",
        WhileStatement: "WhileStatement",
        BlockStatement: "BlockStatement",
        Program: "Program",
        ExpressionStatement: "ExpressionStatement",
        AssignmentExpression: "AssignmentExpression",
        IfStatement: "IfStatement"
    },

    _ASSIGNMENT_OPERATOR: " := ",

    supportedTypes: [],

    init: function()
    {
        for(var propName in this.CONST)
        {
            if(!this.CONST.hasOwnProperty(propName)) { continue; }
            this.supportedTypes.push(this.CONST[propName]);
        }
    },

    getCode: function(element)
    {
             if (this.isVariableDeclaration(element)) { return this._generateCodeFromVariableDeclaration(element); }
        else if (this.isVariableDeclarator(element)) { return this._generateCodeFromVariableDeclarator(element); }
        else if (this.isIdentifier(element)) { return this._generateCodeFromIdentifier(element); }
        else if (this.isBinaryExpression(element)) { return this._generateCodeFromBinaryExpression(element); }
        else if (this.isLiteral(element)) { return this._generateCodeFromLiteral(element); }
        else if (this.isEmptyStatement(element)) { return this._generateCodeFromEmptyStatement(element); }
        else if (this.isExpressionStatement(element)) { return this._generateCodeFromExpressionStatement(element); }
        else if (this.isAssignmentExpression(element)) { return this._generateCodeFromAssignmentExpression(element); }
        else if (this.isIfStatement(element)) { return this._generateCodeFromIfStatement(element); }
        else if (this.isWhileStatement(element)) { return this._generateCodeFromWhileStatement(element); }
    },

    getFlow: function(program)
    {
        var flow = [];

        if(program == null || program.body == null) { return flow; }

        return this._getFlowFromBlockStatement(program);
    },

    getLabelStatementMapping: function(program)
    {
        var labelStatementMapping = {};

        ASTHelper.traverseModel(program, function(element)
        {
            if(typeof element.label != "undefined")
            {
                labelStatementMapping[element.label] = { statement: element};
            }
        });

        return labelStatementMapping;
    },

    getParentBlockStatements: function(element)
    {
        var parentBlockStatements = [];

        element = element.parent;

        while(element != null)
        {
            if(ASTHelper.isIfStatement(element) || ASTHelper.isWhileStatement(element))
            {
                parentBlockStatements.push(element);
            }

            element = element.parent;
        }

        return parentBlockStatements;
    },

    isInIfConsequent: function(statement, ifStatement)
    {
        if(!this.isIfStatement(ifStatement)) { return false; }

        return ifStatement.consequent == statement
            || this.isAncestorOf(ifStatement.consequent, statement);
    },

    isInIfAlternate: function(statement, ifStatement)
    {
        if(!this.isIfStatement(ifStatement)) { return false; }

        return ifStatement.alternate == statement
            || this.isAncestorOf(ifStatement.alternate, statement);
    },

    getPreviousStatements: function(statement)
    {
        var parent = statement.parent;

        var statements = parent.children;

        var indexOfCurrentStatement = statements.indexOf(statement);

        if(indexOfCurrentStatement <= 0) { return []; }

        var previousStatements = [];

        for(var i = 0; i < indexOfCurrentStatement; i++)
        {
            if(this.isStatement(statements[i]))
            {
                previousStatements.push(statements[i]);
            }
        }

        return previousStatements;
    },

    areConsequtiveStatements: function(firstStatement, secondStatement)
    {
        if(firstStatement == null || secondStatement == null) { return false; }

        return this.getPreviousStatement(secondStatement) == firstStatement;
    },

    getPreviousStatement: function(statement)
    {
        var previousStatements = this.getPreviousStatements(statement);

        return previousStatements[previousStatements.length - 1];
    },

    isAncestorOf: function(potentialAncestor, element)
    {
        element = element.parent;

        while(element != null)
        {
            if(potentialAncestor == element) { return true; }

            element = element.parent;
        }

        return false;
    },

    _getFlowFromBlockStatement: function(statement)
    {
        var body = statement.body;

        var flow = [];

        for(var i = 0; i < body.length; i++)
        {
            var currentItem = body[i];
            var nextItem = body[i+1];

            if(ASTHelper.isIfStatement(currentItem))
            {
                flow = flow.concat(this._getFlowFromIf(currentItem, nextItem));
                continue;
            }
            else if(ASTHelper.isBlockStatement(currentItem))
            {
                flow = flow.concat(this._getFlowFromBlockStatement(currentItem));
                continue;
            }
            else if(ASTHelper.isWhileStatement(currentItem))
            {
                flow = flow.concat(this._getFlowFromWhile(currentItem));
            }

            if(currentItem != null && nextItem != null)
            {
                flow.push({first: currentItem, second: nextItem});
            }
        }

        return flow;
    },

    _getFlowFromWhile: function(whileStatement)
    {
        var flow = [];

        flow.push({first: whileStatement, second: this._getFirstStatement(whileStatement.body)});
        if(ASTHelper.isBlockStatement(whileStatement.body))
        {
            flow = flow.concat(this._getFlowFromBlockStatement(whileStatement.body));
        }

        this._addLastStatementsToFlow(flow, this._getLastStatements(whileStatement.body), whileStatement)

        return flow;
    },

    _getFlowFromIf: function(ifStatement, nextStatement)
    {
        var flow = [];

        flow.push({first: ifStatement, second: this._getFirstStatement(ifStatement.consequent)});
        flow.push({first: ifStatement, second: this._getFirstStatement(ifStatement.alternate)});

        if(nextStatement != null)
        {
            this._addLastStatementsToFlow(flow, this._getLastStatements(ifStatement.consequent), nextStatement);
            this._addLastStatementsToFlow(flow, this._getLastStatements(ifStatement.alternate), nextStatement);
        }

        return flow;
    },

    _addLastStatementsToFlow: function(flow, lastStatements, secondStatement)
    {
        for(var i = 0; i < lastStatements.length; i++)
        {
            flow.push({first: lastStatements[i], second: secondStatement});
        }
    },

    _getFirstStatement: function(element)
    {
        if(ASTHelper.isBlockStatement(element)) { return element.body[0]; }

        return element;
    },

    _getLastStatements: function(element)
    {
        if(ASTHelper.isBlockStatement(element)) { element = element.body[element.body.length - 1]; }

        if(ASTHelper.isIfStatement(element))
        {
            return this._getLastStatements(element.consequent).concat(this._getLastStatements(element.alternate));
        }

        return [element];
    },


    createParentChildRelationship: function (astElement)
    {
        ASTHelper.traverseModel(astElement, function(element, propertyName, parent)
        {
            if(element == null) { return; }

            element.parent = parent;

            if(parent.children == null) { parent.children = []; }

            parent.children.push(element);
        });
    },

    setNodesIdsAndLabels: function(astElement)
    {
        var id = 0;
        var label = 1;

        ASTHelper.traverseModel(astElement, function(element, propertyName, parent)
        {
            if(element == null) { return; }

            element.nodeId = id++;

            if(ASTHelper.isStatement(element))
            {
                element.label = label++;
            }
        });
    },

    checkForWhileConsistency: function(program)
    {
        var forbiddenElements = [];
        var invalidElements = [];

        ASTHelper.traverseModel(program, function(element, propertyName, parent)
        {
            if(typeof element.type != "undefined")
            {
                if(ASTHelper.supportedTypes.indexOf(element.type) == -1)
                {
                    forbiddenElements.push(element);
                }

                if(ASTHelper.isIfStatement(element))
                {
                    if(element.consequent == null || element.alternate == null)
                    {
                        invalidElements.push(element);
                        return;
                    }
                }
                else if(ASTHelper.isBlockStatement(element) && element.body.length == 0)
                {
                    invalidElements.push(element);
                }
            }
        });

        if(forbiddenElements.length != 0)
        {
            throw new TypeError("JsWhile does not support the following constructs:" + ASTHelper._getGroupElementsString(ASTHelper._groupElementsByType(forbiddenElements)));
        }

        if(invalidElements.length != 0)
        {
            var message = "";

            for(var i = 0; i < invalidElements.length; i++)
            {
                var invalidElement = invalidElements[i];
                if(ASTHelper.isIfStatement(invalidElement))
                {
                    message += " If statement has to have an else clause@" + invalidElement.loc.start.line;
                }
                else if(ASTHelper.isBlockStatement(invalidElement))
                {
                    message += "Block statement can not be empty @" + invalidElement.loc.start.line;
                }
            }

            throw new TypeError("JsWhile: " + message);
        }
    },

    getAllStatements: function (program)
    {
        var allStatements = [];

        ASTHelper.traverseModel(program, function(astElement)
        {
            if(astElement == null) { return; }

            if(ASTHelper.isStatement(astElement))
            {
                allStatements.push(astElement);
            }
        });

        return allStatements;
    },

    traverseModel: function (astModel, traversalFunction)
    {
        for(var propName in astModel)
        {
            if(!astModel.hasOwnProperty(propName)) { continue; }
            if(propName == "children" || propName == "parent" || propName == "loc") { continue; }

            var propValue = astModel[propName];

            if(isArray(propValue))
            {
                for(var i = 0; i < propValue.length; i++)
                {
                    var item = propValue[i];
                    if(isObject(item))
                    {
                        traversalFunction && traversalFunction(item, propName, astModel);
                        ASTHelper.traverseModel(item, traversalFunction);
                    }
                }
            }
            else if(isObject(propValue))
            {
                traversalFunction && traversalFunction(propValue, propName, astModel);
                ASTHelper.traverseModel(propValue, traversalFunction);
            }
        }
    },

    isStatement: function(element)
    {
        return this.isVariableDeclarator(element) || this.isEmptyStatement(element)
            || this.isWhileStatement(element) || this.isExpressionStatement(element)
            || this.isIfStatement(element)
    },

    isVariableDeclaration: function(element)
    {
        return this._isStatementOfType(element, this.CONST.VariableDeclaration);
    },
    isVariableDeclarator: function(element)
    {
        return this._isStatementOfType(element, this.CONST.VariableDeclarator);
    },
    isIdentifier: function(element)
    {
        return this._isStatementOfType(element, this.CONST.Identifier);
    },
    isBinaryExpression: function(element)
    {
        return this._isStatementOfType(element, this.CONST.BinaryExpression);
    },
    isLiteral: function(element)
    {
        return this._isStatementOfType(element, this.CONST.Literal);
    },
    isEmptyStatement: function(element)
    {
        return this._isStatementOfType(element, this.CONST.EmptyStatement);
    },
    isWhileStatement: function(element)
    {
        return this._isStatementOfType(element, this.CONST.WhileStatement);
    },
    isBlockStatement: function(element)
    {
        return this._isStatementOfType(element, this.CONST.BlockStatement);
    },
    isProgram: function(element)
    {
        return this._isStatementOfType(element, this.CONST.Program);
    },
    isExpressionStatement: function(element)
    {
        return this._isStatementOfType(element, this.CONST.ExpressionStatement);
    },
    isAssignmentExpression: function(element)
    {
        return this._isStatementOfType(element, this.CONST.AssignmentExpression);
    },
    isIfStatement: function(element)
    {
        return this._isStatementOfType(element, this.CONST.IfStatement);
    },

    _isStatementOfType: function(element, type)
    {
        return element != null && element.type == type;
    },

    _getGroupElementsString: function(groups)
    {
        var str = "";

        for(var groupType in groups)
        {
            if(str != "") { str += "; "; }
            var groupString = groupType + " @ ";

            var lines = groups[groupType];

            for(var i = 0; i < lines.length; i++)
            {
                if(i > 0) { groupString += ", "; }

                groupString += lines[i];
            }

            str += groupString;
        }

        return str;
    },

    _groupElementsByType: function (elements)
    {
        var groups = {};

        for(var i = 0; i < elements.length; i++)
        {
            var element = elements[i];

            if(groups[element.type] == null) { groups[element.type] = []; }

            groups[element.type].push(element.loc.start.line);
        }

        return groups;
    },

    _generateCodeFromVariableDeclaration: function(element)
    {
        return "Unknown code construct";
    },

    _generateCodeFromVariableDeclarator: function(element)
    {
        return this.getCode(element.id) + this._ASSIGNMENT_OPERATOR + this.getCode(element.init);
    },

    _generateCodeFromIdentifier: function(element)
    {
        return element.name;
    },

    _generateCodeFromBinaryExpression: function(element)
    {
        return this.getCode(element.left) + " " + element.operator + " " + this.getCode(element.right);
    },

    _generateCodeFromLiteral: function(element)
    {
        return element.raw;
    },

    _generateCodeFromEmptyStatement: function(element)
    {
        return "skip";
    },

    _generateCodeFromExpressionStatement: function(element)
    {
        return this.getCode(element.expression);
    },

    _generateCodeFromAssignmentExpression: function(element)
    {
        return this.getCode(element.left) + this._ASSIGNMENT_OPERATOR + this.getCode(element.right);
    },

    _generateCodeFromIfStatement: function(element)
    {
        return "if (" + this.getCode(element.test) + ")";
    },

    _generateCodeFromWhileStatement: function(element)
    {
        return "while (" + this.getCode(element.test) + ")";
    }
};

ASTHelper.init();

