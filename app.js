//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");

const app = express();
const mongoose = require("mongoose");

const _ = require('lodash')

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// mongoDB connection
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://localhost:27017/TodoListDB", {
  useNewUrlParser: true,
});

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your TodoList",
});

const item2 = new Item({
  name: "Hist the + item to add new item",
});

const item3 = new Item({
  name: "Hit this to delete item",
});

const defaultItems = [item1, item2, item3];

const ListSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", ListSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Success");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

// Route Parameters
app.get("/:customListName", (req, res) => {
  // console.log(req.params.customListName)
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();
        res.redirect("/"+ customListName)

      } else {
        // show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items} )   
           console.log(foundList.items)  
      }
    } else {
      console.log(err);
    }

  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list
  console.log(listName)

  const item = new Item({
    name: itemName,
  });

  if(listName === "Today"){
    item.save()
    res.redirect("/")
  } else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save()
      res.redirect("/" + listName)
    })
  }


});

// delete post
app.post("/delete", (req, res) => {
  // console.log(req.body.checkbox)
  const id = req.body.checkbox;
  const listName = req.body.listName


  if(listName === "Today"){
    Item.findOneAndRemove(id, function (err) {
      if (err) {
        res.send(err);
      } else {
        res.redirect("/");
      }
    });
  } else{
    List.findOneAndUpdate({
      name: listName
    }, {$pull: {items: {_id: id}}},  function(err, foundList){
      if(!err){
        res.redirect("/" + listName)
      }
    })
  }



});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
