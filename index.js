const request = require('requestretry')
const unusedFilename = require('unused-filename')
const https = require('https')
const fs = require('fs')
const linkCheck = require('link-check')

const APP_SLUG = process.env.BITRISE_APP_SLUG
const BUILD_SLUGS = process.env.buildslugs.split('\n')
const API_KEY = process.env.access_token
const SAVE_PATH = process.env.save_path
const MAX_ATTEMPTS = process.env.max_attempts
const RETRY_DELAY = process.env.retry_delay
const REQUEST_TIMEOUT = process.env.request_timeout

console.log('APP_SLUG:', APP_SLUG)
console.log('BUILD_SLUGS:', BUILD_SLUGS)
const BASE_URL = 'https://api.bitrise.io/v0.1/apps/'
const BUILD_URL = BASE_URL + APP_SLUG + '/builds/'

for (let i = 0; i < BUILD_SLUGS.length; i++) {
  const url = BUILD_URL + BUILD_SLUGS[i]
  let options = {
    method: 'GET',
    url: url,
    timeout: parseInt(REQUEST_TIMEOUT, 10) || 120000,
    maxAttempts: parseInt(MAX_ATTEMPTS, 10) || 3,
    retryDelay: parseInt(RETRY_DELAY, 10) || 3500,
    retryStrategy: request.RetryStrategies.HTTPOrNetworkError,
    'headers': {
      'accept': 'application/json',
      'Authorization': API_KEY
    }
  }

  request(options, function (error, response) {
    if (error) throw new Error(error)
    const buildStatus = JSON.parse(response.body).data
    console.info('buildStatus', buildStatus)
    if (buildStatus && buildStatus.status != 0) {
      options.url = url + '/artifacts'

      // Get Build Artifacts
      request(options, function (error, response) {
        if (error) throw new Error(error)
        const artifactsObj = JSON.parse(response.body).data
        if (artifactsObj) {
          artifactsObj.forEach((artifact) => {
            options.url = url + '/artifacts/' + artifact.slug

            // Get Build Artifact
            request(options, (error, response) => {
              if (error) throw new Error(error)
              const artifactObj = JSON.parse(response.body).data
              if (artifactObj) {
                const url = artifactObj.public_install_page_url || artifactObj.expiring_download_url
                console.log('artifactObj', artifactObj)
                console.log('Artifact URL:', url)


                linkCheck(url, (err, result) => {
                  console.log('link checking', url)
                  if (err) {
                    console.error(err)
                    return
                  }
                  console.log(`${result.link} is ${result.status}`)
                })
                const file = fs.createWriteStream(unusedFilename.sync(SAVE_PATH + artifactObj.title))
                https.get(url, (res) => {
                  res.pipe(file)
                })
              }
            })
          })
        } else {
          console.warn('No artifactsObj')
        }
      })
    } else {
      console.error('Error Bitrise API:', response.body)
    }
  })
}
