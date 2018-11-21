[Node.js Master Class](https://pirple.thinkific.com/courses/the-nodejs-master-class)
---
##### Homework Assignment #2

#### A Pizza Delivery company API.

A RESTful JSON API that listens for both **HTTP** and  **HTTPS** requests.

1. New users can be created, their information can be edited, and they can be deleted.
The following data is stored for each user:

* User's Name
* Email address
* Street address
* **Hashed** password

2. Users can log in and log out by creating or destroying a token.
3. When users are logged in, they can `GET` all possible menu items with their current prices:

```
{
    "Margherita": 2.99,
    "Carbonara": 3.99,
    "Frutti di Mare": 3.99,
    "Crudo": 2.99,
    "Napoletana": 2.99,
    "Quattro Formaggi": 2.99,
    "Romana": 3.99,
    "Prosciutto": 3.99,
    "Tonno": 3.99,
    "Mediterranea": 3.99,
    "Vegetariana": 1.99,
    "Pepperoni": 1.99
}
```
4. A logged-in user is able to fill a shopping cart with menu items, specifying items with
integer quantities:
```
{
  "Pepperoni" : 1
}
```
5. A logged-in user can create an order and have the payment processed by
[Stripe](https://stripe.com).
6. Throughout the lifecycle of an order, a user receives emails with its statuses,
delivered by [Mailgun](mailgun.com) service.

With the `paid` status update, a user also recieves a recipt of the following kind:

```
Here is your recip:                                                  

Margherita          |    3pcs. |  $2.99 |      $8.97                 
Tonno               |    2pcs. |  $3.99 |      $7.98                 
Crudo               |    1pcs. |  $2.99 |      $2.99                 
====================================================                 
Total:                                        $19.94
```

*Which doesn't looks that pretty in a non-monospaced fonts users normaly set in their
email clients.*

Orders lifecycle is partly maintained by the 'worker' running on the server, which artificially
"ages" the order every 30 seconds until it reaches the 'delivered' status.

Order lifecycle has the following possible statuses:
* `accepted` - initiated by the user
* `rejected` - produced by [Stripe](stripe.com)
* `paid` - produced by Stripe
* `readyToShip` - maintained by dedicated 'worker' on the server
* `shipped` - maintained by dedicated 'worker' on the server
* `delivered` - maintained by dedicated 'worker' on the server
* `canceled` - initiated by the user

An order may be canceled (`DELETE` method on `/order` endpoint) before it becomes `delivered`,
and if it's not already `canceled` or `rejected`. If the order being canceled is paid, it is
also refunded with [Stripe](https://stripe.com/docs/api/refunds) functionality.

Full API documentation available via [Postman collections](https://documenter.getpostman.com/view/3662804/RzZFDwaX)
