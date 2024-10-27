const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PROT || 5000;


// middleWare

app.use(cors());
app.use(express.json());







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3y9ux.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
     serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
     }
});

async function run() {
     try {
          // Connect the client to the server	(optional starting in v4.7)
          await client.connect();


          const careDoctorDataBase = client.db("CarsDoctor");

          const servicesCollection = careDoctorDataBase.collection("services");

          const bookingServices = client.db('CarsDoctor').collection('booking');



          app.get('/services', async (req, res) => {
               const curser = servicesCollection.find();
               const result = await curser.toArray();
               res.send(result);
          });

          app.get('/services/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: new ObjectId(id) };

               const options = {


                    projection: { title: 1, img: 1, price: 1, service_id: 1 },
               };
               const result = await servicesCollection.findOne(query, options);
               res.send(result)
          });

          app.post('/bookings', async (req, res) => {
               const booking = req.body;
               const result = await bookingServices.insertOne(booking);
               res.send(result);

          })


          // Send a ping to confirm a successful connection
          await client.db("admin").command({ ping: 1 });
          console.log("Pinged your deployment. You successfully connected to MongoDB!");
     } finally {
          // Ensures that the client will close when you finish/error
          // await client.close();
     }
}
run().catch(console.dir);




app.get('/', (req, res) => {
     res.send('Car Doctor Server Running');
});

app.listen(port, () => {
     console.log(`car doctor server is Running Port ${port}`)
})