require('dotenv').config();
const { Client, Environment } = require('square');
console.log(Environment);

const client = new Client({
    environment: Environment.Sandbox, // Use Environment.Production for production
    accessToken: process.env.ACCESS_TOKEN // Ensure you have set this in your .env file
})

async function createCustomer(name, lastname, email){
    try{
        const {result} = await client.customersApi.createCustomer({
            givenName: name,
            familyName: lastname,
            emailAddress: email
        });
        return result;
    }catch(error){
        console.error('Error creating customer:', error);
    }   
}

async function createOrderTemplate(quantity, name, price, currency){
    try{
        const {result} = await client.ordersApi.createOrder({
            order: {
                locationId: process.env.LOCATION_ID,
                referenceId: '123456',
                state: 'DRAFT',
                lineItems:[{
                    quantity,
                    name, 
                    basePriceMoney:{
                        amount: BigInt(price),
                        currency
                    }
                }]
            },
            idempotencyKey: '123456789'
        });
        return result;
    }catch(error){
        console.error('Error creating order template:', error);
    }
}

//Test the functions
(async ()=> {
    const customer = await createCustomer('Bay', 'test', 'bayleighandersen28@gmail.com');
    console.log('Customer created:', customer);
    const order = await createOrderTemplate('1', 'Driving Lesson', 1000, 'USD');
    console.log('Order template created:', order);
})