import express from "express";
// import {client} from "../index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { genPassword,
  createUser,
  checkAvailUser
 } 
 from "../helper.js";
// import { JsonWebTokenError } from "jsonwebtoken";

const router= express.Router();

router
.route("/signup")
.post( async(request, response) => {
    const {username,password,email}=request.body;
    
    const isUserExist= await checkAvailUser(email);
    
    if(isUserExist)
    {
      response.status(400).send({message:"username already exist"});
      return;
    }
    if(password.length<8)
    {
      response.status(400).send({message:"password is must be longer"});
      return;
    }
    if(!/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@!#%&]).{8,}$/g.test(password))
    {
      response.status(400).send({message:"password pattern doesn't match"});
      return;
    }
   
    const hashPassword = await genPassword(password);
    
    const userCreate = await createUser(username,email,hashPassword)
    
    response.send(userCreate);
   
  })



  router.route("/login").post( async(request, response) => {

    const {email,password}=request.body;
    
    const userFromDB= await checkAvailUser(email);
    
    if(!userFromDB)
    {
      response.status(401).send({message:"invalide credential"});
      return;
    }
    const storedDbPassword=userFromDB.password
    const isPasswordMatch= await bcrypt.compare(password,storedDbPassword)
    if(isPasswordMatch){
      // const token=jwt.sign({id:userFromDB._id},process.env.SECRET_KEY)
      response.send({message:"successful login"});
    }
    else{
      response.status(401).send({message:"invalide credential"});
    }
    
  
  });



  
  

 
   
  
  

export const userRouter = router;
  
  //  sample code
    // router.delete("/movies/:id", async (request, response) => {
    //   const { id } = request.params;
    //   const movie = await deleteMovieByID(id);
    //   response.send(movie);
    //   });  
     