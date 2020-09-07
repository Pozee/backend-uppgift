const express = require("express");
const app = express();
const port = 3005;
const MongoClient = require("mongodb",).MongoClient;
const mongoUrl = "mongodb+srv://Poze:test1234@cluster0.rhqtq.gcp.mongodb.net/Uppgift-backend?retryWrites=true&w=majority"
const fs = require("fs");
const { json } = require("express");
const { ObjectID } = require("mongodb");
// MIDDLEWARE
app.use(express.static(__dirname + '/../client/frontend/'))
app.use(express.static(__dirname + "/assets"))
app.use(express.json());


// ROUTES
app.get("/boats", (req, res) => {
    MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, async function (err, client) {
        const db = client.db("Uppgift-backend");
        const collection = db.collection("Boats");

        try {
            await collection.find({}).toArray(function (err, boats) {
                res.send(boats)
            })
        }
        catch (error) {
            console.log(error)
        }
        finally {
            client.close()
            console.log("Connection CLOSED")
        }
    })
});
app.get("/boats/id/:boatId", (req, res) => {
    var ObjectId = require('mongodb').ObjectID;
    MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, async function (err, client) {
        const id = req.params.boatId;
        const db = client.db("Uppgift-backend");
        const collection = db.collection("Boats");

        try {
            await collection.findOne(ObjectId(id), function (err, boatById) {
                res.send(boatById)
            })
        }
        catch (error) {
            console.log(error)
        }
        finally {
            client.close()
            console.log("Connection CLOSED")
        }

    })
});
app.get("/boats/search", (req, res) => {
    MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, async function (err, client) {
        const db = client.db("Uppgift-backend");
        const collection = db.collection("Boats")

        //FILTER
        let filter = {};

        if (req.query.maxPrice) {
            filter.price = { $lte: Number(req.query.maxPrice) };
        }
        if (req.query.is_sail) {
            filter.is_sail = req.query.is_sail
        }
        if (req.query.motor) {
            filter.motor = req.query.motor
        }
        if (req.query.modellnamn) {
            filter.model = { $regex: req.query.modellnamn, $options: 'i' };
        }
        if (req.query.madebefore) {
            filter.year_of_manufacture = { $lte: req.query.madebefore }
        }
        if (req.query.madeafter) {
            filter.year_of_manufacture = { $gte: req.query.madeafter }
        }

        //SORTKEY
        let sortKey = {};
        switch (req.query.order) {
            case "lowprice":
                sortKey.price = 1;
                console.log(sortKey);
                break;
            case "highprice":
                sortKey.price = -1;
                break;
            case "name_asc":
                sortKey.model = 1;
                break;
            case "name_desc ":
                sortKey.model = -1;
                break;
            case "oldest":
                sortKey.year_of_manufacture = 1;
                break;
            case "newest":
                sortKey.year_of_manufacture = -1
                break;
        }

        try {
            await collection.find(filter).limit(5).sort(sortKey).toArray((err, boat) => {
                res.send(boat)
            })
        }
        catch (error) {
            console.log(error)
        }
        finally {
            client.close()
            console.log("Connection CLOSED")
        }

    });
})

// POST 
app.post("/boat/add", (req, res) => {
    MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, async function (err, client) {
        const db = client.db("Uppgift-backend");
        const collection = db.collection("Boats")
        try {
            await collection.insertOne(req.body);
            res.send("success added " + JSON.stringify(req.body))
        } catch (error) {
            console.log(error);
        } finally {
            client.close();
        }
    });
})
// DELETE
app.delete("/boat/remove/:boatId", (req, res) => {

    MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, async function (err, client) {
        const db = client.db("Uppgift-backend");
        const collection = db.collection("Boats")
        const id = req.params.boatId;
        try {
            await collection.deleteOne({ "_id": ObjectID(id) });
            res.send("success deleted boat with id:" + id)
        } catch (error) {
            res.send("Error could not perform action, check your ID")
        } finally {
            client.close();
        }
    });
})

app.use((error, req, res, next) => {
    console.log('Error handling', error);
    res.status(500).send('Internal server error');
})


// SERVER START
app.listen(port, () => {
    console.log("Running on port " + port)
})