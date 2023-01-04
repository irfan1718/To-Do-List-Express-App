//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

//MongoDB Connection
mongoose.set('strictQuery', false);
mongoose.connect(
  'mongodb+srv://admin:test123@cluster0.zgtpwx6.mongodb.net/todolistDB',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

//Schema
const itemSchema = {
  name: String,
};

//mongoose Model
const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({
  name: 'Welcome',
});

const item2 = new Item({
  name: 'Hit + button to Add ',
});

const item3 = new Item({
  name: '<-- check box to delete',
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model('List', listSchema);

//Root Route
app.get('/', function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('successfully added to db');
        }
      });
      res.redirect('/');
    } else {
      res.render('index', { listTitle: 'Today', newListItems: foundItems });
    }
  });
});

//Add Item Route
app.post('/', function (req, res) {
  const itemName = req.body.newItem;

  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect(`/${listName}`);
    });
  }
});

app.post('/delete', function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndDelete(checkedItemId, function (err) {
      if (!err) {
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect('/' + listName);
        }
      }
    );
  }
});

//Custom Route
app.get('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a New List
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect(`/${customListName}`);
      } else {
        //Show the existing List
        res.render('index', {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.get('/about', function (req, res) {
  res.render('about');
});

app.listen(3000, function () {
  console.log('sever is ruuning on port 3000');
});
