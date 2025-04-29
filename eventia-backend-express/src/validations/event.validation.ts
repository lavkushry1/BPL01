import Joi from 'joi';

export const createEventSchema = Joi.object({
  title: Joi.string().required().max(255),
  description: Joi.string().allow('').max(2000),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')),
  venue_id: Joi.string().uuid().required(),
  category: Joi.string().max(50),
  has_seat_map: Joi.boolean().default(false),
  seat_map_id: Joi.string().uuid().allow(null),
  ticket_types: Joi.array().items(
    Joi.object({
      name: Joi.string().required().max(100),
      description: Joi.string().allow('').max(500),
      price: Joi.number().required().min(0),
      quantity: Joi.number().integer().required().min(1)
    })
  ),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().required().uri(),
      alt_text: Joi.string().allow('').max(255),
      is_featured: Joi.boolean()
    })
  )
});

export const updateEventSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().allow('').max(2000),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')),
  venue_id: Joi.string().uuid(),
  category: Joi.string().max(50),
  has_seat_map: Joi.boolean(),
  seat_map_id: Joi.string().uuid().allow(null),
  ticket_types: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid(),
      name: Joi.string().max(100),
      description: Joi.string().allow('').max(500),
      price: Joi.number().min(0),
      quantity: Joi.number().integer().min(1)
    })
  ),
  images: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid(),
      url: Joi.string().uri(),
      alt_text: Joi.string().allow('').max(255),
      is_featured: Joi.boolean()
    })
  )
}); 