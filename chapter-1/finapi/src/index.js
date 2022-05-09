const express = require("express")
const { randomUUID } = require('crypto')


const app = express()

app.use(express.json())

const customers = []

app.post("/account", (request, response) => {
    const { cpf, name } = request.body

    const customerAlreadyExist = customers.some(
        (customer) => customer.cpf === cpf
    )

    if(customerAlreadyExist) {
        return response.status(400).json({
            error: "Customer already exists!"
        })
    }

    
    customers.push({
        cpf,
        name,
        id: randomUUID(),
        statement: []
    })


    console.log(customers)

    return response.send()
})

app.listen(3333)