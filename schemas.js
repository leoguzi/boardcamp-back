import joi from "joi";
import JoiDate from "@joi/date";
const extendedJoi = joi.extend(JoiDate);

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

const customerSchema = joi.object({
  name: joi.string().min(3).max(30).required(),
  phone: joi.string().min(10).max(11),
  cpf: joi.string().min(11).max(11).required(),
  birthday: extendedJoi.date().format("YYYY-MM-DD"),
});

const rentalSchema = joi.object({
  customerId: joi.number().integer().min(0),
  gameId: joi.number().integer().min(0),
  daysRented: joi.number().integer().min(1),
});
export { categorieSchema, gameSchema, customerSchema, rentalSchema };
