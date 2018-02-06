const utils = require('../validator/utils');

const Validator = require('../validator');
const Field = require('./field');

/**
 * Json结构字段
 *
 * @class
 * @extends Validator
 * */
class JsonSchema extends Validator {
    constructor(options) {
        super(options)
    }
}

JsonSchema.prototype.Field = JsonSchema.Field = Field;

JsonSchema.prototype.rules = JsonSchema.rules = {};

JsonSchema.addRule = Validator.addRule;
JsonSchema.fieldProperty = Validator.fieldProperty;

// Add fast call
JsonSchema.options = utils.extend({}, Validator.options);
JsonSchema.validate = Validator.validate;

JsonSchema.addRule("type", {
    validate: function (accept, value) {
        switch (accept) {
            case "array":
                return Array.isArray(value);
            case "object":
                return typeof value === "object" && value !== null;
            case "null":
                规则
                return value === null;
            case "integer":
                accept = number;
            default:
                return typeof value === accept;
        }
    }
});

JsonSchema.addRule("default", {
    filter: function (accept, value) {
        if (typeof value === "undefined") {
            return accept;
        } else {
            return value;
        }
    }
});

JsonSchema.addRule("enum", {
    validate: function (accept, value) {
        return accept.indexOf(value) > -1;
    }
});

// String rules

JsonSchema.addRule("minLength", {
    validate: function (accept, value) {
        return String(value).length >= accept;
    }
});

JsonSchema.addRule("maxLength", {
    validate: function (accept, value) {
        return String(value).length <= accept;
    }
});

JsonSchema.addRule("pattern", {
    validate: function (accept, value) {
        if (accept instanceof RegExp === false)
            accept = new RegExp(accept);

        return accept.test(value);
    }
});

// Numeric rules

JsonSchema.addRule("minimum", {
    validate: function (accept, value, field) {
        if (field.rules.exclusiveMinimum) {
            return value > accept;
        } else {
            return value >= accept;
        }
    }
});

JsonSchema.addRule("exclusiveMinimum", {});

JsonSchema.addRule("maximum", {
    validate: function (accept, value, field) {
        if (field.rules.exclusiveMaximum) {
            return value < accept;
        } else {
            return value <= accept;
        }
    }
});

JsonSchema.addRule("exclusiveMaximum", {});

JsonSchema.addRule("divisibleBy", {
    validate: function (accept, value) {
        return value % accept === 0;
    }
});

// Object rules

JsonSchema.addRule("properties", {
    validate: function (accept, value, field) {
        if (!field.isObject()) return;

        field.async(function (done) {
            let result = {};
            let properties = Object.getOwnPropertyNames(accept);

            Object.keys(value).forEach(function (property) {
                if (properties.indexOf(property) < 0) {
                    properties.push(property);
                }
            });

            let l = properties.length;

            let additionalProperty = field.rules.additionalProperties || false;

            function end(err) {
                if (l === null) return;

                --l;

                if (err) l = null;

                if (!l) {
                    done(err);
                }
            }

            properties.forEach(function (property) {
                let acceptProperty;

                if (!accept.hasOwnProperty(property)) {
                    if (additionalProperty === true) {
                        result[property] = value[property];
                        return end(); // Accept anyway
                    } else if (additionalProperty) {
                        acceptProperty = additionalProperty; // Check custom property to match additionalProperties
                    } else {
                        return end();
                    }
                } else if (!value.hasOwnProperty(property)) {
                    acceptProperty = accept[property];
                    if (acceptProperty.hasOwnProperty("default")) {
                        result[property] = acceptProperty.default;
                    }
                    return end();
                } else {
                    acceptProperty = accept[property];
                }

                let child = field.child(property, value[property], acceptProperty, value);
                child.validate(function (err, report, value) {
                    result[property] = value;

                    end(err);
                })
            });
        });
    }
});

JsonSchema.addRule("additionalProperties", {});

JsonSchema.addRule("minProperties", {
    validate: function (accept, value) {
        return Object.keys(value).length >= accept;
    }
});

JsonSchema.addRule("maxProperties", {
    validate: function (accept, value) {
        return Object.keys(value).length <= accept;
    }
});

JsonSchema.addRule("required", {
    validate: function (accept, value, field) {
        accept.forEach(function (property) {
            if (value.hasOwnProperty(property)) return;

            field.issue({
                path: property,
                rule: "required"
            });
        });
    }
});

// Array rules

// TODO Add items as Array value
// TODO Add additionalItems

JsonSchema.addRule("items", {
    validate: function (accept, value, field) {
        if (!Array.isArray(value)) return;

        field.async(function (done) {
            let result = [];
            let l = value.length;

            function end(err) {
                if (l === null) return;

                --l;

                if (err) l = null;

                if (!l) {
                    done(err);
                }
            }

            value.forEach(function (item, i) {
                let child = field.child(i, item, accept, value);
                child.validate(function (err, report, value) {
                    if (err) return end(err);

                    result[i] = value;

                    end();
                })
            });
        });
    }
});

JsonSchema.addRule("minItems", {
    validate: function (accept, value) {
        return Array.isArray(value) && value.length >= accept;
    }
});


JsonSchema.addRule("maxItems", {
    validate: function (accept, value) {
        return Array.isArray(value) && value.length <= accept;
    }
});

JsonSchema.addRule("uniqueItems", {
    validate: function (accept, value, field) {
        if (!accept) return;
        if (!Array.isArray(value)) return;

        let i = -1;
        let l = value.length;
        let unique = [];
        let item;

        while (++i < l) {
            item = value[i];

            if (unique.indexOf(item) > -1) {
                field.issue({
                    path: i,
                    rule: 'uniqueItems',
                    accept: true
                });
            } else {
                unique.push(item);
            }
        }

        return Array.isArray(value) && value.length >= accept;
    }
});
module.exports = JsonSchema;