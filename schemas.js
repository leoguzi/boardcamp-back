import joi from "joi";

const categorieSchema = joi.object({
  name: joi.string().alphanum().min(3).max(20).required(),
});

const gameSchema = joi.object({
  name: joi.string().min(2).max(30).required(),
  image: joi.string().uri(),
  stockTotal: joi.number().integer().greater(0),
  categoryId: joi.number().integer(),
  pricePerDay: joi.number().greater(0),
});

export { categorieSchema, gameSchema };
