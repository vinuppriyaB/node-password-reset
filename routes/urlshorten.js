import express from "express";

import {client} from "../index.js";




const router= express.Router();



router.route("/").get( async(request, response) => {

    const filter= request.query;
    const result = await client
    .db("B27rwd")
    .collection("urlshorten")
    .find(filter)
    .toArray();
    
    
      response.send(result)
    
    
       
      
      });

router
.route("/create")
.post( async(request, response) => {
    let dt=new Date();
   
    let fulldate=[];
    let date=dt.getDate();
    let month=dt.getMonth()+1;
    let year=dt.getFullYear();
   
    fulldate.push(date);
    fulldate.push(month);
    fulldate.push(year);

    function generateUrl()
    {
       let genresult="";
       let char="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" ;
       let charlength=char.length
       for(let i=0;i<5;i++)
       {
        genresult+= char.charAt(Math.floor(Math.random() * charlength));
       }
      
       return genresult;
    }
    
    
   const {long}=request.body;
   let short=await check();
  
  
async function check()
{
    let shorturl=generateUrl()
    const isshortexist=await client
    .db("B27rwd")
    .collection("urlshorten")
    .findOne({short:shorturl});
    
    if(isshortexist)
   {
       
       check(); 
   }
   else{
       return shorturl;
   }
}
   

   const isurlexist= await client
   .db("B27rwd")
   .collection("urlshorten")
   .findOne({long:long});

 if(isurlexist==null)
 {
    const result = await client
    .db("B27rwd")
    .collection("urlshorten")
    .insertMany([{long:long,short:short,visit:0,createdAt:[{date:date,month:month,year:year}]}]);
 
     response.send(result);

 }
 else{
    response.status(400).send("url already exist");

 }
 
   

   
  })
  
  router.route("/monthlycount").get( async(request, response) => {
    let dt=new Date();
   
    let fulldate=[];
    let date=dt.getDate();
    let month=dt.getMonth()+1;
    // let filter={createdAt.month:month}
        const result = await client
    .db("B27rwd")
    .collection("urlshorten")
    .find({},{arrayFilters:[{"createdAt[0].month":month}]});

    // const result = await client
    // .db("B27rwd")
    // .collection("urlshorten")
    // .find({}).toArray((err,data)=>{response.json(data)});
    
    
      response.send(result);
    // response.send("h");
    
   
    




   
  
  });
  



  router.route("/:shortenurl").get( async(request, response) => {

const {shortenurl}=request.params;
const result = await client
.db("B27rwd")
.collection("urlshorten")
.findOne({short:shortenurl});

if(result){

    const result1 = await client
.db("B27rwd")
.collection("urlshorten")
.findOneAndUpdate({short:shortenurl},{$inc:{visit:.5}});

  response.redirect(result.long);

}
})



  
  

 
   
  
  

export const urlshortenRouter = router;
  
  