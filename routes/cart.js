var express = require('express');
var router = express.Router();
const paypal = require('paypal-rest-sdk');

// Get Product model
var Product = require('../models/product');

/*
 * GET add product to cart
 */
router.get('/add/:product', function (req, res) {

    var slug = req.params.product;

    Product.findOne({slug: slug}, function (err, p) {
        if (err)
            console.log(err);

        if (typeof req.session.cart == "undefined") {
            req.session.cart = [];
            req.session.cart.push({
                title: slug,
                qty: 1,
                price: parseFloat(p.price).toFixed(2),
                image: '/product_images/' + p._id + '/' + p.image
            });
        } else {
            var cart = req.session.cart;
            var newItem = true;

            for (var i = 0; i < cart.length; i++) {
                if (cart[i].title == slug) {
                    cart[i].qty++;
                    newItem = false;
                    break;
                }
            }

            if (newItem) {
                cart.push({
                    title: slug,
                    qty: 1,
                    price: parseFloat(p.price).toFixed(2),
                    image: '/product_images/' + p._id + '/' + p.image
                });
            }
        }

//        console.log(req.session.cart);
        req.flash('success', 'Product added!');
        res.redirect('back');
    });

});

/*
 * GET checkout page
 */
router.get('/checkout', function (req, res) {

    if (req.session.cart && req.session.cart.length == 0) {
        delete req.session.cart;
        res.redirect('/cart/checkout');
    } else {
        res.render('checkout', {
            title: 'Checkout',
            cart: req.session.cart
        });
    }

});

/*
 * GET update product
 */
router.get('/update/:product', function (req, res) {

    var slug = req.params.product;
    var cart = req.session.cart;
    var action = req.query.action;

    for (var i = 0; i < cart.length; i++) {
        if (cart[i].title == slug) {
            switch (action) {
                case "add":
                    cart[i].qty++;
                    break;
                case "remove":
                    cart[i].qty--;
                    if (cart[i].qty < 1)
                        cart.splice(i, 1);
                    break;
                case "clear":
                    cart.splice(i, 1);
                    if (cart.length == 0)
                        delete req.session.cart;
                    break;
                default:
                    console.log('update problem');
                    break;
            }
            break;
        }
    }

    req.flash('success', 'Cart updated!');
    res.redirect('/cart/checkout');

});

/*
 * GET clear cart
 */
router.get('/clear', function (req, res) {

    delete req.session.cart;
    
    req.flash('success', 'Cart cleared!');
    res.redirect('/cart/checkout');

});

/*
 * GET buy now
 */
router.get('/buynow', function (req, res) {

    //delete req.session.cart;
    console.log(req.body);
    res.sendStatus(200);

});

router.post('/pay', (req, res) => {

    console.log(req.body);
    var cart = req.session.cart;
    var total_order=0;
    if(cart==undefined)
        console.log("cart unden");
    if(req.session.cart==undefined)
        console.log("cart unden");
    var text= '{ \"items\": [';
    for (var i = 0; i < cart.length; i++) {
        total_order+=(cart[i].price*cart[i].qty);
        text=text.concat("{ \"name\": \"",cart[i].title,"\"");
        text=text.concat(",\"sku\": \"",i, "\"");
        text=text.concat(", \"price\": \"",cart[i].price,"\"");
        text=text.concat(", \"currency\":","\"USD\"");
        text=text.concat(", \"quantity\": ",cart[i].qty);        
        text=text.concat("}");
        if(i+1<cart.length)
        {
            text=text.concat(", ");
        }
    }
    text=text.concat("]}");
    console.log(text);
    console.log("total amt: "+total_order);
    obj = JSON.parse(text);
    const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "http://localhost:3000/cart/success/"+total_order,
          "cancel_url": "http://localhost:3000/cart/cancel/"+total_order
      },
      "transactions": [{
          "item_list": obj,
          "amount": {
              "currency": "USD",
              "total": total_order
          },
          "description": "Order from BuyMe.com"
      }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for(let i = 0;i < payment.links.length;i++){
              if(payment.links[i].rel === 'approval_url'){
                res.redirect(payment.links[i].href);
              }
            }
        }
      });
      
 });

 router.get('/success/:amt', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    var amount=req.params.amt;
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": "USD",
              "total": amount
          }
      }]
    };
  
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          console.log(JSON.stringify(payment));
          res.send('Successfully ordered for amount: '+amount);
      }
  });
  });
  
router.get('/cancel/:amt', (req, res) => {
    var amount=req.params.amt;
      res.send('Cancelled ordered for amount: '+amount); 
});
  



// Exports
module.exports = router;