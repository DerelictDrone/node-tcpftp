const fs = require('fs')
const net = require('net')
const { Transform } = require('stream')
const { createGzip, createGunzip } = require('zlib')

numberOfDecimals = 5
bytes = 0

function calculateSize(bytes) {
    sizeType = 0
    while(true) {
    if(bytes < 1000) {
    break
    }
    bytes /= 1000
    sizeType++
    }
    sizeType = Math.floor(sizeType)
    sizeString = " "
    switch(sizeType) {
    case 0: {sizeString += "bytes"; break;}
    case 1: {sizeString += "kilobytes"; break;}
    case 2: {sizeString += "megabytes"; break;}
    case 3: {sizeString += "gigabytes"; break;}
    case 4: {sizeString += "terabytes"; break;}
    case 5: {sizeString += "petabytes"; break;}
    case 6: {sizeString += "exabytes"; break;}
    case 7: {sizeString += "zettabytes"; break;}
    case 8: {sizeString += "yottabytes"; break;}
    default: {sizeString += "1000^"+sizeType; break;}
    }
    return bytes.toString().slice(0,numberOfDecimals) + sizeString
}

switch(process.argv[2]) {
    case "send": {
        const server = net.createServer((c)=>{
            let startByte = false
            c.on("data",(d)=>{startByte = parseInt(d.toString())})
            setTimeout(()=>{
            console.log(startByte)
            const x = startByte ? fs.createReadStream(process.argv[4],{start:startByte}) : fs.createReadStream(process.argv[4])
            const z = createGzip()
            x.pipe(z)
            z.pipe(c)
            console.log("Client has begun download")
            },2000)
        })
        server.listen(parseInt(process.argv[3]),()=>{
            console.log("Server Bound")
        })
        break
    }
    case "append": {
    // append startfile appendedfile finalfile
    const x = fs.createReadStream(process.argv[3])
    const z = fs.createWriteStream(process.argv[5])
    const AppendFile = new Transform({
        writableObjectMode: true,
        transform(chunk, encoding, callback) {
        fs.appendFileSync(process.argv[5],chunk)
        callback();
        }
    })
    x.pipe(z)
    console.log("Creating new file")
    x.on("end",()=>{
    console.log("Starting append")
    const y = fs.createReadStream(process.argv[4])
    y.pipe(AppendFile)
    y.on("end",()=>{console.log("Done!")})
    })
    break;
    }
    default: {
        const x = fs.createWriteStream(process.argv[2])
        z = createGunzip()
        const connection = net.createConnection({host: process.argv[3].split(":")[0], family: 4, port: parseInt(process.argv[3].split(":")[1])},(c)=>{
        if(process.argv[4]) {
            console.log("starting download at " + process.argv[4] + " bytes")
            connection.write(process.argv[4]) // presumably a number, we'll use this to determine how many bytes to skip serverside
        }
        console.log("Connected!")
        })
        connection.on('data',(d)=>{
        bytes += d.length
        process.stdout.write("\r"+calculateSize(bytes))
        z.write(d)
        })
        z.pipe(x)
    }
}