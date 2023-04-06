//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const capitalize = require('lodash/capitalize');
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'public/views'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Database connection
mongoose.connect("mongodb+srv://senic:fGee1hUJXAYrHExk@cluster0.o4r29w6.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'todolistDB'
});

// Items
const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// List
const listeShema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listeShema);

app.get("/", function(req, res) {

  Item.find({})
    .then((foundItems) => {
      if(foundItems.length === 0) {
        
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Successfully saved default items to DB.");
          })
          .catch((err) => {
            console.log("Error with inserting items: ",err);
          });
      } else {
        //console.log("Found items: ", foundItems);
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    })
    .catch((err) => {
      console.log("Error with finding items: ",err);
    });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log("Error with saving item: ",err);
      });
    }
});

app.post("/delete", function(req, res){
  const itemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(itemId)
    .then(() => {
      console.log("Successfully deleted item.");
      res.redirect("/");
    })
    .catch((err) => {
      console.log("Error with deleting item: ",err);
    })
  }
  else {
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: itemId}}})
    .then(() => {
      res.redirect("/" + listName);
    })
    .catch((err) => {
      console.log("Error with deleting item: ",err);
    });
  }

});

//Dynamic route
app.get("/:costumListName", function(req, res) {
  const costumListName = capitalize(req.params.costumListName);

  List.findOne({name: costumListName})
  .then((foundList) => {
    if(!foundList) {
      console.log("Doesn't exist! ");
      const list = new List({
        name: costumListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + costumListName);
    }
    else {
      console.log("Exists! ", foundList);

      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch((err) => {
    console.log("Error with finding list: ",err);
  });

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});