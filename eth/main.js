

let Web3 = require('web3');
let web3 = new Web3(new Web3.providers.HttpProvider("https://eth.mykey.tech"));

// MYKEY账户数据存储合约地址
let AccountStorageAddr = '0xADc92d1fD878580579716d944eF3460E241604b7'
// MYKEY账户数据存储合约的abi, https://etherscan.io/address/0xADc92d1fD878580579716d944eF3460E241604b7#code
let AccountStorageABI = require('./AccountStorage.abi.json').abi
// MYKEY账户数据存储合约实例
let AccountStorageIns = new web3.eth.Contract(AccountStorageABI, AccountStorageAddr);

// MYKEY主网测试账户， 0x3bB9E1783D5F60927eD6c3d0c32BfAD055A1b72f， 第3把操作密钥 0x37ac6c8229788643d62eF447eD988Ee7F00f8875
let UserAccountAddress = '0x3bB9E1783D5F60927eD6c3d0c32BfAD055A1b72f'
// 应用对接登录与签名时用到的是第3个操作密钥
let SigningKeyIndex = 3


// 链上查询签名公钥及状态
async function getSigningKeyAndStatus() {
    // 1. 获取用户账户的第3个操作密钥
    signingKey = await AccountStorageIns.methods.getKeyData(UserAccountAddress, SigningKeyIndex).call();
    console.log(UserAccountAddress, "账户签名KEY:", signingKey)

    // 2. 获取用户账户的第3个操作密钥的状态， 正常是0， 冻结是1
    signingKeyStatus = await AccountStorageIns.methods.getKeyStatus(UserAccountAddress, SigningKeyIndex).call();
    console.log(UserAccountAddress, "账户签名KEY状态:", signingKeyStatus)

    return {
        "signingKey": signingKey,
        "signingKeyStatus": signingKeyStatus
    }

}

// 获取待签名数据
async function getUnsignedData() {
    // 1. H5接入方式， 待签名数据是应用方自定义。
    // unsignedData = '...'

    // 2. SDK接入方式， 待签名数据需要先组装，不同链的构造格式有差别。参考SDK的"如何验签"章节。 
    let timestamp = "1606900362"
    let account = "mykeydoctest"
    let uuID = "e9467118-9321-4916-8153-4a5a9087e51e"
    let ref = "mykey"
    let mykeyUID = "E87E3CC788C44BB8544003AF6CEB62E8"

    let str = timestamp + account + uuID + ref + mykeyUID

    console.log(str)
    let unsignedData = '0x' + Buffer.from(str).toString('hex')
    return unsignedData
}

// 验证签名
async function verifySignature(unsignedData, signature) {

    console.log(unsignedData)
    let unsignedDataHash = web3.utils.soliditySha3(unsignedData);
    console.log("unsignedDataHash ", unsignedDataHash)

    //let prefixedHash = web3.eth.accounts.hashMessage(unsignedDataHash)

    let recorvedKey = await web3.eth.accounts.recover(unsignedDataHash, signature)
    console.log("recorvedKey: ", recorvedKey)

}

// async function recoverOnly() {
//     // // recover
//     // let message = "ForTube-signature1593685092"
//     // let messageHash = web3.utils.soliditySha3(message);
//     // let sig = '0x1dc17f7413edaa2d696a40a2298cca98cfff59f489af7d7e82a7e5184b65036b6a6147734b17728796a5932aa0c1f1455cafc80e208d55adeb2a8400777c1fa01'
//     // let recovedKey = await web3.eth.accounts.recover(messageHash, sig)
//     // let expectedKey = "0x0b2144B2c8430ecde7d4ED79b525314772e66117"
//     // console.log( expectedKey.toLowerCase() == recovedKey.toLowerCase())


//     let message = "1606900362mykeydocteste9467118-9321-4916-8153-4a5a9087e51emykeyE87E3CC788C44BB8544003AF6CEB62E8"
//     let messageHash = web3.utils.soliditySha3(message);
//     console.log("messageHash" , messageHash)
//     let sig = '0x53d86f27d725d3660f242cf0efc1f62aed8c805a39bf9783e2e7c1f65a81d94f775dbcb2e7268672dccbb68518bf5b9ba5f0ad5b2bf20ff4f8c9043f7c43d6651c'
//     let recovedKey = await web3.eth.accounts.recover(messageHash, sig)
//     console.log("recovedKey ", recovedKey)
// }



async function main() {

    console.log("==============================链上查询签名公钥及状态==============================")
    let signingKeyObj = await getSigningKeyAndStatus()

    if (signingKeyObj.signingKeyStatus === "1") {
        console.log("操作密钥状态不可用")
        return
    }

    console.log("==============================获取待签名数据==============================")
    // unsignedData 和 signature 数据来源于MYKEY主网测试账户， 参考SDK的"如何验签"章节。
    let unsignedData = await getUnsignedData()
    let signature = "0x53d86f27d725d3660f242cf0efc1f62aed8c805a39bf9783e2e7c1f65a81d94f775dbcb2e7268672dccbb68518bf5b9ba5f0ad5b2bf20ff4f8c9043f7c43d6651c"



    console.log("==============================验证签名==============================")
    await verifySignature(unsignedData, signature)


    //await recoverOnly()

}


main()