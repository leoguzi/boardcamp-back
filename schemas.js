import joi from "joi";

const categorieSchema = joi.object({
  name: joi.string().alphanum().min(3).max(20).required(),
});

export { categorieSchema };
