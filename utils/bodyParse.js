
const bodyParser = (req) => {
    return new Promise((resolve, reject) => {
        try {
            req.on("data", (data) => {
                resolve(JSON.parse(data))
            })
        }
        catch (e) {
            reject(e)
        }
    })
}

module.exports = bodyParser 