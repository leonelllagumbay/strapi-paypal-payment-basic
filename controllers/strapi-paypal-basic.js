'use strict';

const paypal = require("paypal-rest-sdk");

paypal.configure({
  'mode': process.env.mode, // 'sandbox', // or live
  'client_id': process.env.client_id,
  'client_secret': process.env.client_secret,
});

/**
 * strapi-paypal-basic.js controller
 *
 * @description: A set of functions called "actions" of the `strapi-paypal-basic` plugin.
 */

const createPayment = async (create_payment_json) => {
  return new Promise((resolve, reject) => {
    paypal.payment.create(create_payment_json, function (error, payment) {
      console.log('creating payment');
      if (error) {
        throw error;
      } else {
        for(let i = 0;i < payment.links.length;i++) {
          if(payment.links[i].rel === 'approval_url') {
            resolve(payment.links[i].href);
          }
        }
      }
    });
  });
}

const executePayment = async (paymentId, execute_payment_json) => {
  return new Promise((resolve, reject) => {
    // Obtains the transaction details from paypal
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      //When error occurs when due to non-existent transaction, throw an error else log the transaction details in the console then send a Success string reposponse to the user.
      if (error) {
        reject(error);
      } else {
        console.log(JSON.stringify(payment));
        resolve('Success');
      }
    });
  });
}

module.exports = {

  /**
   * Default action.
   *
   * @return {Object}
   */

  index: async (ctx) => {
    // Add your own logic here.

    // Send 200 `ok`
    ctx.send({
      message: 'ok'
    });
  },

  success: async (ctx) => {
    const res = ctx.res;
    const req = ctx.req;
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
      "amount": {
        "currency": "USD",
        "total": "25.00"
        }
      }]
    }

    await executePayment(paymentId, execute_payment_json);
    res.send('Success');
  },

  cancel: async (ctx) => {
    ctx.send("Cancelled");
  },

  pay: async (ctx) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
        "payment_method": "paypal"
      },
      "redirect_urls": {
        "return_url": process.env.PAYPAL_SUCCESS_REDIRECT_URL,
        "cancel_url": process.env.PAYPAL_CANCEL_REDIRECT_URL,
      },
      "transactions": [{
        "item_list": {
          "items": [{
            "name": "Redhock Bar Soap",
            "sku": "001",
            "price": "25.00",
            "currency": "USD",
            "quantity": 1
          }]
        },
        "amount": {
        "currency": "USD",
        "total": "25.00"
        },
        "description": "Washing Bar soap"
      }]
    }; 
  
    const redirectUrl = await createPayment(create_payment_json);
    ctx.status = 308;
    ctx.redirect(redirectUrl);
  }
};
