const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/users');

const router = express.Router();

const getValidationError = function(req){
  const { fullname, username, password } = req.body;  
  if (!username) {
    return {
      message: 'Username required',
    };
  }
  if (!password) {
    return {
      message: 'Password required',
    };
  }
  if(password.length<8 || password.length >72){
    return {
      message: 'Password must be between 8-72 characters',
    };
  }
  if (username.length<1){
    return {
      message: 'Username must be longer than 1 character',
    };
  }
  if (typeof username !== String || typeof password !== String || typeof fullname !== String){
    return {
      message: 'Inputs must be a string',
    };
  }
  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );
  if (nonTrimmedField) {
    return {
      message: 'Cannot start or end with whitespace',
    };
  }
  return null;
};

router.post('/', (req, res, next) => {
  const { fullname, username, password } = req.body;

  const validationError= getValidationError(req);
  if(validationError){
    return res.status(422).json({
      reason: 'ValidationError',
      message: validationError.message
    });
  }
  return User.hashPassword(password)
    .then(result => {
      const newUser = {
        username,
        password: result,
        fullname
      };
      return User.create(newUser);
    })
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Username already exists');
        err.status = 400;
      }
      next(err);
    });
});

module.exports = router;