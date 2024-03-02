import Joi from 'joi';
import { VALID_CATEGORIES } from './const.js';
const ticketSchema = Joi.object({
    name: Joi.string().required(),
    quantity: Joi.number().required().greater(0),
    price: Joi.number().required().greater(0),
})

const eventSchema = Joi.object({
    title: Joi.string().required(),
    category: Joi.string().required().valid(...VALID_CATEGORIES),
    description: Joi.string().required(),
    organizer: Joi.string().required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().required(),
    location: Joi.string().required(),
    tickets: Joi.array().items(ticketSchema),
    image: Joi.string().optional(),
})

const userSchema = Joi.object({
    username: Joi.string().required().not().empty(),
    password: Joi.string().required().not().empty(),
})

const permissionsSchema = Joi.object({
    username: Joi.string().required().not().empty(),
    auth_level: Joi.string().required().valid('W', 'M', 'A'),
})

export const validatePermissions = (permissions: any) => {
    return permissionsSchema.validate(permissions);
}

export const validateEvent = (event: any) => {
    return eventSchema.validate(event);
    // TODO: add validation for start_date < end_date
}

export const validateUser = (user: any) => {
    return userSchema.validate(user);
}
