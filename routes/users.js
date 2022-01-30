const express = require('express')
const router = express.Router()
const User = require('../models/user')


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

module.exports = router