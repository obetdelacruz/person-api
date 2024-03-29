import Person from "../models/Person.js";
import User from "../models/User.js";
import isString from "../utils/isString.js";
import getTokenFrom from "../utils/getTokenFrom.js";
import jwt from "jsonwebtoken";
import config from "../utils/config.js";

async function getPersons(_, res) {
  const persons = await Person.find({});

  return res.json(persons);
}

async function getPerson(req, res, next) {
  try {
    const { id } = req.params;
    const person = await Person.findById(id);

    if (person) return res.json(person);

    return res.status(404).json({ error: "Person not found" });
  } catch (error) {
    next(error);
  }
}

// HTTP CreatePerson
async function createPerson(req, res, next) {
  try {
    const { name, number, userId } = req.body;
    const decodedToken = jwt.verify(getTokenFrom(req), config.SECRET);

    if (!decodedToken.id) {
      return res.status(401).json({ error: "Token missing or invalid" });
    }

    const user = await User.findById(userId);

    if (name === undefined || number === undefined)
      return res.status(400).json({ error: "Content is missing" });

    const personExists = await Person.findOne({ name });

    if (personExists)
      return res.status(400).json({ error: "Person already exists" });

    if (name === "" || number === "")
      return res.status(400).json({ error: "Name and number are required" });

    if (!isString(name) || !isString(number))
      return res.status(400).json({ error: "Name and number must be strings" });

    const person = new Person({
      name,
      number,
      user: user.id,
    });

    const savedPerson = await person.save();

    user.persons = user.persons.concat(savedPerson._id);
    await user.save();

    return res.status(201).json(savedPerson);
  } catch (error) {
    next(error);
  }
}

//HTTP Update Person
async function updatePerson(req, res, next) {
  const id = req.params.id;
  const { name, number } = req.body;

  if (name === undefined || number === undefined)
    return res.status(400).json({ error: "Content is missing" });

  if (name === "" || number === "")
    return res.status(400).json({ error: "Name and number are required" });

  if (!isString(name) || !isString(number))
    return res.status(400).json({ error: "Name and number must be strings" });

  const person = {
    name,
    number,
  };

  try {
    const updatedPerson = await Person.findByIdAndUpdate(id, person, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (updatedPerson) return res.json(updatedPerson);

    return res.status(404).json({ error: "Person not found" });
  } catch (error) {
    next(error);
  }
}

async function deletePerson(req, res, next) {
  try {
    const id = req.params.id;
    await Person.findByIdAndDelete(id);

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export default {
  getPersons,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
};
