const express = require("express")
const { randomUUID, verify } = require('crypto')


const app = express()

app.use(express.json())

const   customers = []

function verifyIfExistsAccountCpf(request, response, next) {
    const { cpf } = request.headers

    const customer = customers.find((customer) => customer.cpf === cpf)
    if( !customer ) {
        return response.status(400).json({ error: "Customer not found"})
    }

    request.customer = customer

    return next()
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === "credit") {
            return acc + operation.amount
        }
        return acc - operation.amount    
    }, 0)

    return balance
}

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



    return response.sendStatus(201)
})

app.get("/statement", verifyIfExistsAccountCpf , (request, response) => {
    const { customer } = request

    if(!customer.statement.length) {
        return response.sendStatus(204)
    }

    return response.json(customer.statement)
})

app.post("/deposit", verifyIfExistsAccountCpf, (request, response ) => {
    const { description, amount } = request.body

    const { customer } = request

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }
    customer.statement.push(statementOperation)

    return response.status(201).send()
})

app.post("/withdraw", verifyIfExistsAccountCpf, (request, response ) => {
    const { amount } = request.body

    const { customer } = request

    const balance = getBalance(customer.statement)

    if( balance < amount ) {
        return response.status(400).json({ error: "Unsiffient funds!"})
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation)

    return response.status(201).send()
})

app.get("/statement/date", verifyIfExistsAccountCpf, (request, response) => {
    const {customer} = request
    const { date } = request.query

    const dateFormat = new Date(date + " 00:00")

    const statement = 
        customer.statement.filter((statement) => 
            statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    if(!statement.length) return response.sendStatus(204)

    return response.json(customer.statement)
})

app.patch("/account/name", verifyIfExistsAccountCpf, (request, response) => {
    const { name } = request.body
    const { customer } = request

    if(!name) {
        return response.status(400).json({
            error:"Erro ao passar o nome."
        })
    }

    customer.name = name

    return response.sendStatus(200)
})

app.get("/account", verifyIfExistsAccountCpf, (request, response) => {
    const { customer } = request

    return response.json(customer)
})

app.delete("/account", verifyIfExistsAccountCpf, (request, response ) => {
    const { customer} = request

    customers.splice(customer, 1)

    return response.status(200).json(customers)
})

app.get("/balance", verifyIfExistsAccountCpf, (request, response) => {
    const { customer } = request

    const balance = getBalance(customer.statement)

    response.json({balance})
})

app.listen(3333)