const express = require('express')
const jwt = require('jsonwebtoken')
const router = express.Router()
const User = require('../models/user')

const createToken = id => {
    return jwt.sign(
      {
        id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );
  };

router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;
  
      // 1) check if email and password exist
      if (!email || !password) {
        return next(
          new AppError(404, "fail", "Please provide email or password"),
          req,
          res,
          next,
        );
      }
  
      // 2) check if user exists and if password is correct
      const user = await User.findOne({
        email,
      }).select("+password");
  
      if (!user || !(await user.correctPassword(password, user.password))) {
        return next(
          new AppError(401, "fail", "Email or Password is wrong"),
          req,
          res,
          next,
        );
      }
  
      // 3) if everything is correct, send jwt to client
      const token = createToken(user.id);
  
      // Remove the password from the output
      user.password = undefined;
  
      res.status(200).json({
        status: "success",
        token,
        data: {
          user,
        },
      });
    } catch (err) {
      next(err);
    }
})


router.post('/signup', async (req, res, next) => {
    try {
      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
      });
  
      const token = createToken(user.id);
  
      user.password = undefined;
  
      res.status(201).json({
        status: "success",
        token,
        data: {
          user,
        },
      });
    } catch (err) {
      next(err);
    }
})

router.use(async (req, res, next) => {
    try {
      // 1) check if the token is there
      let token;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1];
      }
      if (!token) {
        return next(
          new AppError(
            401,
            "fail",
            "You are not logged in! Please login in to continue",
          ),
          req,
          res,
          next,
        );
      }
  
      // 2) Verify token
      const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  
      // 3) check if the user exists (not deleted)
      const user = await User.findById(decode.id);
      if (!user) {
        return next(
          new AppError(401, "fail", "This user no longer exists"),
          req,
          res,
          next,
        );
      }
  
      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
})

//delete your own account
router.delete('/deleteMe', async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            active: false
        });
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
})

//check if user is admin
router.use((...roles) => {
    return (req, res, next) => {
      if (!roles.includes('admin')) {
        return next(
          new AppError(403, "fail", "You are not allowed to do this action"),
          req,
          res,
          next,
        );
      }
      next();
    };
})

//ALL ADMIN COMMANDS BEGIN HERE
// get all users
router.get('/', async(req, res) => {
    try{
        const users = await User.find()
        res.json(users)
    }catch(err){
        res.send('Error '+ err)
    }
})

//get single user by id
router.get('/:id', async(req, res) => {
    try{
        const user = await User.findById(req.params.id)
        res.json(user)
    }catch(err){
        res.send('Error '+ err)
    }
})

//add a user
router.post('/', async(req,res) => {
    const user = new User({
        name: req.body.name,
    })

    try{
        const u1 = await user.save()
        res.json(u1)
    }catch(err){
        res.send('Error ')
    }
})

//update name of user by id
router.patch('/:id', async(req,res) => {
    try{
        const user = await User.findById(req.params.id)
        user.name = req.body.name
        const u1 = await user.save()
        res.json(u1)
    }catch(err){
        res.send('Error')
    }
})

//delete user by id
router.delete('/:id', async (req, res, next) => {
    try {
        const doc = await User.findByIdAndDelete(req.params.id);
        if (!doc) {
            return next(new AppError(404, 'fail', 'No document found with that id'), req, res, next);
        }
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
})

module.exports = router