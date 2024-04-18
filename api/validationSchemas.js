const Joi = require('joi');

exports.email = Joi.string().email().required().messages({
    'string.base': 'Email must be a string',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
});
exports.keyword = Joi.string().alphanum()

exports.name = Joi.string().min(2).max(30).required().messages({
    'string.base': 'Name must be a string',
    'string.aplhanum': "Name must only contain alpha-numeric characters",
    'string.min': "Name length must be at least 2 characters long",
    'string.max': "Name length must be less than or equal to 30 characters long",
    'any.required': "Name is required"
});
exports.details = Joi.string().trim().allow('').messages({
    'string.base': 'Details must be a string',
    'string.aplhanum': "Details must only contain alpha-numeric characters",
    'any.required': "Details is required"
});
exports.quantity = Joi.number().integer().min(0).max(1000).required().messages({
    'string.integer': "Quantity must be integer",
    'string.min': "Quantity must be greater than or equal to 0",
    'string.max': "Quantity must be less than or equal to 1000",
    'any.required': "Quantity is required"
});
exports.price = Joi.number().precision(2).min(0).required().messages({
    'string.integer': "Price must be number",
    'string.min': "Price must be greater than or equal to 0",
    'any.required': "Quantity is required"
});

exports.password = Joi.string().required().messages({
    'string.base': "Password must be a string",
    'any.required' : "Password is required"
})

exports.userDetails = Joi.object({
    name: Joi.string().min(2).max(30).required().messages({
        'string.base': 'Name must be a string',
        'string.aplhanum': "Name must only contain alpha-numeric characters",
        'string.min': "Name length must be at least 2 characters long",
        'string.max': "Name length must be less than or equal to 30 characters long",
        'any.required': "Name is required"
    }),
    last_name: Joi.string().trim().min(2).max(50).required().messages({
        'string.base': 'Last name must be a string',
        'string.empty': 'Last name cannot be empty',
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters',
        'any.required': 'Last name is required'
    }),
    phone: Joi.string().trim().pattern(/^[0-9]{6,20}$/).required().messages({
        'string.base': 'Phone number must be a string',
        'string.empty': 'Phone number cannot be empty',
        'string.pattern.base': 'Phone number must contain only digits and be between 6 and 20 characters long',
        'any.required': 'Phone number is required'
    }),
    email:Joi.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    address: Joi.string().trim().min(5).max(100).required().messages({
        'string.base': 'Address must be a string',
        'string.empty': 'Address cannot be empty',
        'string.min': 'Address must be at least 5 characters long',
        'string.max': 'Address must not exceed 100 characters',
        'any.required': 'Address is required'
    }),
    firma: Joi.string().trim().allow('').optional()
});




