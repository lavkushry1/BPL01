import Joi from 'joi';

// Event image validation schema
const eventImageSchema = Joi.object({
  url: Joi.string().required(),
  alt_text: Joi.string().allow(null, ''),
  is_featured: Joi.boolean().default(false)
});

// Ticket type validation schema
const ticketTypeSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(null, ''),
  price: Joi.number().min(0).required(),
  quantity: Joi.number().integer().min(0).required(),
  available: Joi.number().integer().min(0)
});

// Team validation schema
const teamSchema = Joi.object({
  name: Joi.string().required(),
  shortName: Joi.string().max(5),
  logo: Joi.string().uri().allow(null, '')
});

// Event input validation schema
const eventSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null),
  location: Joi.string().required(),
  status: Joi.string().valid('draft', 'published', 'cancelled').default('draft'),
  category: Joi.string().required(),
  featured: Joi.boolean().default(false),
  
  // Optional IPL match specific fields
  posterImage: Joi.string().uri().allow(null, ''),
  venue: Joi.string(),
  time: Joi.string(),
  duration: Joi.string(),
  
  // Nested objects
  images: Joi.array().items(eventImageSchema),
  ticket_types: Joi.array().items(ticketTypeSchema),
  teams: Joi.object({
    team1: teamSchema,
    team2: teamSchema
  }).allow(null)
});

/**
 * Validates event input data
 * @param data The event data to validate
 * @param isUpdate Whether this is an update (making fields optional)
 * @returns Validation result with error and value
 */
export const validateEventInput = (data: any, isUpdate = false) => {
  const schema = isUpdate 
    ? eventSchema.fork(
        ['title', 'description', 'start_date', 'location', 'category'],
        (schema) => schema.optional()
      )
    : eventSchema;
    
  return schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: true 
  });
};

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