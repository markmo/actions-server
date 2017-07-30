'use strict';

const bodyParser = require('body-parser')
const exec = require('child_process').exec
const env = require('node-env-file')
const express = require('express')
const fetch = require('node-fetch')
const fs = require('fs')
const swaggerJSDoc = require('swagger-jsdoc')
const sys = require('sys')

const options = {
  swaggerDefinition: {
    info: {
      title: 'actions-server',
      version: '1.0.0'
    },
    basePath: '/actions-server'
  },
  apis: ['./server.js']
}

const swaggerSpec = swaggerJSDoc(options)

env(__dirname + '/.env')
const PORT = 8080

const app = express()
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }))
app.use(bodyParser.json({ limit: '50mb' }))
app.disable('etag')
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})
app.get('/', function (req, res) {
  res.send('Google Actions Proxy Server v1.0')
})
app.get('/api-docs.json', function (req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

/**
 * @swagger
 * definitions:
 *   Config:
 *     type: object
 *     properties:
 *       appName:
 *         type: string
 *       projectId:
 *         type: string
 *       webhook:
 *         type: string
 *
 * /config:
 *   post:
 *     description: Update the configuration of this proxy.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: configObject
 *         description: configuration object
 *         in: body
 *         required: true
 *         type: object
 *         schema:
 *           $ref: '#/definitions/Config'
 *     responses:
 *       200:
 *         description: Successful request
 *       500:
 *         description: Error updating config
 */
app.post('/config', function (req, res) {
  console.log('received config:\n', req.body)
  const body = req.body
  const appName = body.appName
  const projectId = body.projectId
  const queryPattern = body.queryPattern
  const webhook = body.webhook
  const config = {
    "actions": [
      {
        "name": "MAIN",
        "intent": {
          "name": "actions.intent.MAIN",
          "trigger": {
            "queryPatterns": [queryPattern]
          }
        },
        "fulfillment": {
          "conversationName": appName
        }
      }
    ],
    "conversations": {
      [appName]: {
        "name": appName,
        "url": webhook,
        "fulfillmentApiVersion": 2
      }
    }
  }
  fs.writeFile('/tmp/action.json', JSON.stringify(config), (err) => {
    if (err) {
      console.error(err)
      return res.status(500).json({
        status: 500,
        message: err
      })
    }
    console.log('/tmp/action.json saved')
  })
  function puts(err, stdout, stderr) {
    if (err) {
      console.error(err)
      return res.status(500).json({
        status: 500,
        message: err
      })
    }
    sys.puts(stdout)
  }
  exec(`gactions update --action_package /tmp/action.json --project ${projectId}`, puts)
  res.send({ status: 'OK' })
})

app.listen(PORT)
console.log('Google Actions Proxy Server running on port:' + PORT)
