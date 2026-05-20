require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();
    const db = client.db("studynook-auth");
    const roomsCollection = db.collection("roomsCollection");

    // Rooms Data Post
    app.post("/rooms", async (req, res) => {
      const newData = req.body;
      const result = await roomsCollection.insertOne(newData);
      res.send(result);
    });

    // For - All Rooms
    app.get("/rooms", async (req, res) => {
      try {
        const { search, amenities, minPrice, maxPrice } = req.query;
        let query = {};
        if (search) {
          query.name = {
            $regex: search,
            $options: "i",
          };
        }
        if (amenities) {
          const amenitiesArray = amenities.split(",");

          query.amenities = {
            $all: amenitiesArray,
          };
        }

        if (minPrice || maxPrice) {
          query.hourlyRate = {};

          if (minPrice) {
            query.hourlyRate.$gte = Number(minPrice);
          }

          if (maxPrice) {
            query.hourlyRate.$lte = Number(maxPrice);
          }
        }

        console.log("User searched for =>", search);
        const result = await roomsCollection
          .find(query)
          .sort({ _id: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        console.log("Search API Error =>", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // Details by id API///
    app.get("/rooms/:id", async (req, res) => {
      const { id } = req.params;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await roomsCollection.findOne(query);
      res.send(result);
    });

    //For - Available Study Rooms
    app.get("/available-study-rooms", async (req, res) => {
      const cursor = roomsCollection
        .find()
        .sort({ _id: -1 })
        .limit(6)
        .toArray();
      const result = await cursor;
      res.send(result);
    });

    // Get my-listing Rooms API
    app.get("/rooms/owner/:ownerId", async (req, res) => {
      const { ownerId } = req.params;
      const result = await roomsCollection.find({ ownerId: ownerId }).toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
